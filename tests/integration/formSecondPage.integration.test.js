jest.mock("../../middlewares/auth", () => ({
  authMiddleware: (req, res, next) => {
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
const TEST_EMAIL = "a01711434@tec.mx";

const PRODUCT_ID_1 = 5;
const PRODUCT_ID_2 = 6;

const BASE_ROUTE = "/api/solicitudes-rec";

// const generateSessionToken = () => {
//   const jwt = require("jsonwebtoken");
//   return jwt.sign(
//     {
//       id: TEST_USER_ID,
//       email: TEST_EMAIL,
//       name: "Cliente Test",
//       role: "cliente",
//       privileges: [],
//       tokenType: "SESSION",
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" },
//   );
// };

let initialStockProduct1;
let initialStockProduct2;

describe("CollectionRequest - flujo completo segunda página (integration)", () => {
//   let token;

  beforeEach(async () => {
    // token = generateSessionToken();

    // Asegura productos de prueba
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

    // Limpieza
    await prisma.productos_solicitud.deleteMany({
      where: { id_solicitud: TEST_REQUEST_ID },
    });

    await prisma.solicitudes_recoleccion.deleteMany({
      where: { id_solicitud: TEST_REQUEST_ID },
    });

    // Stock inicial
    const product1 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_1 },
    });

    const product2 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_2 },
    });

    initialStockProduct1 = product1.cantidad;
    initialStockProduct2 = product2.cantidad;

    // Solicitud de prueba
    await prisma.solicitudes_recoleccion.create({
      data: {
        id_solicitud: TEST_REQUEST_ID,
        id_cliente: TEST_CLIENT_ID,
        fecha: new Date(),
        quiere_productos_extra: false,
        quiere_recoleccion: false,
      },
    });

    // Producto previamente seleccionado
    await prisma.productos_solicitud.create({
      data: {
        id_solicitud: TEST_REQUEST_ID,
        id_producto: PRODUCT_ID_1,
        cantidad: 1,
        fecha: new Date(),
      },
    });

    // Simula inventario ya descontado por esa selección previa
    await prisma.productos_extra.update({
      where: { id_producto: PRODUCT_ID_1 },
      data: {
        cantidad: {
          decrement: 1,
        },
      },
    });
  });

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
    // 1. Obtener última solicitud
    const lastRequest = await request(app)
      .post(`${BASE_ROUTE}/ultimaSolicitud`)
      .send({ idClient: TEST_CLIENT_ID });

    expect(lastRequest.status).toBe(200);
    expect(lastRequest.body.data.id_solicitud).toBe(TEST_REQUEST_ID);

    // 2. Obtener productos extra
    const extraProducts = await request(app)
      .get(`${BASE_ROUTE}/form04/obtener`)

    expect(extraProducts.status).toBe(200);
    expect(extraProducts.body.success).toBe(true);

    const ids = extraProducts.body.data.map((p) => p.id_producto);
    expect(ids).toContain(PRODUCT_ID_1);
    expect(ids).toContain(PRODUCT_ID_2);

    // 3. Obtener selección previa
    const previous = await request(app)
      .post(`${BASE_ROUTE}/form03/obtenerInfo`)
      .send({ requestID: TEST_REQUEST_ID });

    expect(previous.status).toBe(200);
    expect(previous.body.data).toEqual([
      { id_producto: PRODUCT_ID_1, cantidad: 1 },
    ]);

    // 4. Guardar nueva selección
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

    // 5. Verificar selección actualizada
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

    // 6. Verificar flag en solicitud
    const reqDB = await prisma.solicitudes_recoleccion.findUnique({
      where: { id_solicitud: TEST_REQUEST_ID },
    });

    expect(reqDB.quiere_productos_extra).toBe(true);

    // 7. Verificar inventario final
    const finalProduct1 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_1 },
    });

    const finalProduct2 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_2 },
    });

    expect(finalProduct1.cantidad).toBe(initialStockProduct1 - 2);
    expect(finalProduct2.cantidad).toBe(initialStockProduct2 - 1);
  });
});