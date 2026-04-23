// Reemplaza el middleware de autenticación real por uno falso durante el test.
jest.mock("../../middlewares/auth", () => ({
    // En lugar del middleware real que verifica el JWT...
    authMiddleware: (req, res, next) => {
        // inyecta un usuario falso directamente
        req.user = {
        id: "55555555-5555-5555-5555-555555555555",
        email: "a01711434@tec.mx",
        role: "cliente",
        };
        next();
    },

}));

const request = require("supertest");
const prisma = require("../../config/prisma");
const app = require("../../app");

// --- Constantes de prueba ---
const TEST_USER_ID = "55555555-5555-5555-5555-555555555555";
const TEST_CLIENT_ID = "11111111-1111-1111-1111-111111111111";
const TEST_REQUEST_ID = "afaf0bc0-3acc-43eb-93e5-7cbea88f2af8";

// IDs de productos extra usados en el flujo del formulario
const PRODUCT_ID_1 = 5;
const PRODUCT_ID_2 = 6;

// Prefijo base de las rutas bajo prueba
const BASE_ROUTE = "/api/solicitudes-rec";

// Variables para guardar el stock inicial de cada producto antes del test,
// y poder verificar que el inventario se decrementó correctamente al final.
let initialStockProduct1;
let initialStockProduct2;

describe("CollectionRequest - flujo completo segunda página (integration)", () => {
    
    // Se ejecuta antes de cada test para garantizar un estado limpio y reproducible en la BD
    beforeEach(async () => {

        // Crea los productos extra de prueba si no existen (skipDuplicates evita errores en re-ejecuciones)
        await prisma.productos_extra.createMany({
        data: [
            {
            id_producto: PRODUCT_ID_1,
            nombre: "Fibra de Coco 15lt",
            precio: 110.0,
            descripcion: "Fibra de coco Cocopet 15lt",
            cantidad: 36,
            imagen_url: "/img/products/fibra_coco_15lt.jpg",
            estatus: true,
            orden: 5,
            },
            {
            id_producto: PRODUCT_ID_2,
            nombre: "Fibra de Coco 50lt",
            precio: 300.0,
            descripcion: "Fibra de coco Cocopet 50lt",
            cantidad: 26,
            imagen_url: "/img/products/fibra_coco_50lt.jpg",
            estatus: true,
            orden: 6,
            },
        ],
        skipDuplicates: true,
        });

        // Limpia registros previos del test para evitar conflictos de llaves primarias.
        // Se eliminan primero los productos_solicitud por la restricción de FK hacia solicitudes_recoleccion.
        await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        await prisma.solicitudes_recoleccion.deleteMany({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        // Captura el stock actual de los productos ANTES de modificarlo,
        // para usarlo como referencia en las aserciones de inventario al final del test
        const product1 = await prisma.productos_extra.findUnique({
            where: { id_producto: PRODUCT_ID_1 },
        });

        const product2 = await prisma.productos_extra.findUnique({
            where: { id_producto: PRODUCT_ID_2 },
        });

        initialStockProduct1 = product1.cantidad;
        initialStockProduct2 = product2.cantidad;

        // Crea la solicitud de recolección inicial con el estado base para el test
        await prisma.solicitudes_recoleccion.create({
            data: {
                id_solicitud: TEST_REQUEST_ID,
                id_cliente: TEST_CLIENT_ID,
                fecha: new Date(),
                quiere_productos_extra: false,
            },
        });

        // Simula que el cliente ya tenía 1 unidad del PRODUCT_ID_1 en su solicitud previa
        await prisma.productos_solicitud.create({
            data: {
                id_solicitud: TEST_REQUEST_ID,
                id_producto: PRODUCT_ID_1,
                cantidad: 1,
                fecha: new Date(),
            },
        });

        // Descuenta del inventario la cantidad ya reservada en la solicitud anterior
        await prisma.productos_extra.update({
            where: { id_producto: PRODUCT_ID_1 },
            data: {
                cantidad: {
                decrement: 1,
                },
            },
        });
    });

    // Limpieza final después de todos los tests del describe:
    // elimina los datos de prueba y cierra la conexión con la BD
    afterAll(async () => {
        await prisma.productos_solicitud.deleteMany({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        await prisma.solicitudes_recoleccion.deleteMany({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        await prisma.$disconnect();
    });

    
    it("debe ejecutar correctamente todo el flujo con token", async () => {

        // PASO 1: Obtiene la última solicitud del cliente.
        // Verifica que el endpoint retorne la solicitud creada en el beforeEach.
        const lastRequest = await request(app)
            .post(`${BASE_ROUTE}/ultimaSolicitud`)
            .send({ idClient: TEST_CLIENT_ID });

        expect(lastRequest.status).toBe(200);
        expect(lastRequest.body.data.id_solicitud).toBe(TEST_REQUEST_ID);

        // PASO 2: Obtiene el catálogo de productos extra disponibles.
        // Verifica que ambos productos de prueba estén presentes en la respuesta.
        const extraProducts = await request(app)
            .get(`${BASE_ROUTE}/form04/obtener`);

        expect(extraProducts.status).toBe(200);
        expect(extraProducts.body.success).toBe(true);

        const ids = extraProducts.body.data.map((p) => p.id_producto);
        expect(ids).toContain(PRODUCT_ID_1);
        expect(ids).toContain(PRODUCT_ID_2);
        
        // PASO 3: Consulta los productos previamente seleccionados en la solicitud.
        // Debe reflejar el estado inicial creado en el beforeEach (1 unidad de PRODUCT_ID_1).
        const previous = await request(app)
            .post(`${BASE_ROUTE}/form03/obtenerInfo`)
            .send({ requestID: TEST_REQUEST_ID });

        expect(previous.status).toBe(200);
        expect(previous.body.data).toEqual([
        { id_producto: PRODUCT_ID_1, cantidad: 1 },
        ]);

        // PASO 4: Guarda la nueva selección de productos del cliente.
        // Cambia de 1 unidad de PRODUCT_ID_1 a 2 unidades, y agrega 1 de PRODUCT_ID_2.
        // El controlador debe regresar el inventario anterior y descontar el nuevo.
        const save = await request(app)
            .post(`${BASE_ROUTE}/form04/guardar`)
            .send({
                requestIDReceived: TEST_REQUEST_ID,
                products: [
                { id_producto: PRODUCT_ID_1, cantidad: 2 },
                { id_producto: PRODUCT_ID_2, cantidad: 1 },
                ],
        });

        expect(save.status).toBe(200);
        expect(save.body.success).toBe(true);
        expect(save.body.data).toEqual({
            message: "Productos guardados correctamente",
        });

        // PASO 5: Verifica que la selección guardada en el paso anterior sea correcta.
        // El endpoint debe retornar los productos actualizados.
        const updated = await request(app)
            .post(`${BASE_ROUTE}/form03/obtenerInfo`)
            .send({ requestID: TEST_REQUEST_ID });

        expect(updated.status).toBe(200);
        expect(updated.body.data).toEqual(
            expect.arrayContaining([
                { id_producto: PRODUCT_ID_1, cantidad: 2 },
                { id_producto: PRODUCT_ID_2, cantidad: 1 },
            ])
        );

        // PASO 6: Verifica en BD que el flag quiere_productos_extra fue actualizado a true,
        // lo que indica que la solicitud quedó correctamente marcada con productos extra.
        const reqDB = await prisma.solicitudes_recoleccion.findUnique({
            where: { id_solicitud: TEST_REQUEST_ID },
        });

        expect(reqDB.quiere_productos_extra).toBe(true);

         // PASO 7: Verifica que el inventario se decrementó correctamente.
        // PRODUCT_ID_1: tenía initialStockProduct1 - 1 (del beforeEach), se pidió 2 → queda initialStockProduct1 - 2
        // PRODUCT_ID_2: no tenía reserva previa, se pidió 1 → queda initialStockProduct2 - 1
        const product1 = await prisma.productos_extra.findUnique({
            where: { id_producto: PRODUCT_ID_1 },
        });

        const product2 = await prisma.productos_extra.findUnique({
            where: { id_producto: PRODUCT_ID_2 },
        });

        expect(product1.cantidad).toBe(initialStockProduct1 - 2);
        expect(product2.cantidad).toBe(initialStockProduct2 - 1);
    });
});