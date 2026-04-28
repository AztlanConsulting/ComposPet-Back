const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

const {generateAccessToken} = require("../../utils/jwt.utils");

// ======================
// CONSTANTES
// ======================

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_EMAIL = "summary.test@compospet.com";

const TEST_REQUEST_ID = randomUUID();

const ENDPOINT_SUMMARY = "/api/solicitudes-rec/resumen-recoleccion";
const ENDPOINT_PAYMENT = "/api/solicitudes-rec/resumen-recoleccion/pago";

// Crear un token válido para el test
const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "cliente",
    });
};

// ======================
// HELPERS
// ======================

const createBaseData = async () => {
    await prisma.compospet.upsert({
        where: { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID },
    });

    await prisma.roles.upsert({
        where: { id_rol: TEST_ROLE_ID },
        update: {},
        create: {
            id_rol: TEST_ROLE_ID,
            nombre: "cliente",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Juan",
            apellido: "Test",
            correo: TEST_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4420000000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.zona.create({
        data: {
            id_zona: 1,
            municipio: "Queretaro",
            descripcion: "Centro",
            estado: "Queretaro",
        },
    });

    await prisma.ruta.create({
        data: {
            id_ruta: 1,
            id_zona: 1,
            dia_ruta: "Lunes",
            turno_ruta: "Matutino",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: 1,
            mascotas: "1 perro",
            cantidad_familia: 3,
            direccion: "Calle test",
            orden_horario: 1,
            notas: "cliente test",
            fecha_entrada: new Date(),
        },
    });

    await prisma.formas_pago.createMany({
        data: [
            {
                id_pago: 1,
                tipo: "Transferencia",
                texto: "Paga por transferencia",
                notas: "BBVA",
            },
            {
                id_pago: 2,
                tipo: "Efectivo",
                texto: "Pago en efectivo",
                notas: "",
            },
        ],
        skipDuplicates: true,
    });
};

const createCollectionRequest = async () => {
    await prisma.solicitudes_recoleccion.create({
        data: {
            id_solicitud: TEST_REQUEST_ID,
            id_cliente: TEST_CLIENT_ID,
            cubetas_recolectadas: 1,
            cubetas_entregadas: 2,
            total_a_pagar: 0,
            total_pagado: 0,
            fecha: new Date("2026-04-25"),
            notas: null,
            quiere_recoleccion: true,
            quiere_productos_extra: true,
            id_pago: null,
        },
    });
};

const createExtraProducts = async () => {
    await prisma.productos_extra.createMany({
        data: [
            {
                id_producto: 1,
                nombre: "Composta",
                precio: 120,
                descripcion: "Bolsa de composta orgánica",
                cantidad: 50,
                imagen_url: "url",
                estatus: true,
                orden: 1,
            },
            {
                id_producto: 2,
                nombre: "Tierra preparada",
                precio: 90,
                descripcion: "Tierra lista para plantas",
                cantidad: 30,
                imagen_url: "url",
                estatus: true,
                orden: 2,
            }
        ]
    });
};

const cleanDb = async () => {
    await prisma.productos_solicitud.deleteMany({
        where: { id_solicitud: TEST_REQUEST_ID },
    });

    await prisma.solicitudes_recoleccion.deleteMany({
        where: { id_solicitud: TEST_REQUEST_ID },
    });

    await prisma.saldo.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.cliente.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_USER_ID },
    });

    await prisma.ruta.deleteMany({
        where: { id_ruta: 1 },
    });

    await prisma.zona.deleteMany({
        where: { id_zona: 1 },
    });

    await prisma.formas_pago.deleteMany({
        where: {
            id_pago: { in: [1, 2] },
        },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });

    await prisma.productos_extra.deleteMany({
        where: {
            id_producto: {in: [1,2]}
        }
    })
};

// ======================
// CICLO DE VIDA
// ======================

beforeAll(async () => {
    await cleanDb();
});

beforeEach(async () => {
    await cleanDb();
    await createBaseData();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// ======================
// TESTS
// ======================

describe("Collection Summary Integration", () => {
    it("retorna resumen correctamente", async () => {

        const token = createAuthToken();

        await createCollectionRequest();

        await prisma.saldo.create({
            data: {
                id_cliente: TEST_CLIENT_ID,
                saldo: 250,
            },
        });

        const res = await request(app)
            .post(ENDPOINT_SUMMARY)
            .set("Authorization", `Bearer ${token}`)
            .send({
                idClient: TEST_CLIENT_ID,
                weekStartDate: "2026-04-20",
                weekEndDate: "2026-04-27",
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        expect(res.body.data.collection.id_solicitud)
            .toBe(TEST_REQUEST_ID);

        expect(Number(res.body.data.balance))
            .toBe(250);

        expect(Array.isArray(res.body.data.payMethods))
            .toBe(true);
    });

    it("actualiza total de solicitud correctamente", async () => {

        const token = createAuthToken();

        await createCollectionRequest();

        const res = await request(app)
            .put(ENDPOINT_PAYMENT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                idRequest: TEST_REQUEST_ID,
                collectionTotal: 390,
                idPayment: 1,
                notes: "Pago por transferencia",
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updated =
            await prisma.solicitudes_recoleccion.findUnique({
                where: { id_solicitud: TEST_REQUEST_ID },
            });

        expect(Number(updated.total_a_pagar))
            .toBe(390);

        expect(updated.id_pago).toBe(1);
        expect(updated.notas)
            .toBe("Pago por transferencia");
    });

    it("retorna 500 si request no existe al actualizar total", async () => {

        const token = createAuthToken();

        const res = await request(app)
            .put(ENDPOINT_PAYMENT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                idRequest: randomUUID(),
                collectionTotal: 100,
                idPayment: 1,
                notes: "x",
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message)
            .toBe("Error al actualizar el total");
    });
});

describe("Delete Product Integration", () => {

    it("elimina producto y regresa inventario correctamente", async () => {
        const token = createAuthToken();

        await createCollectionRequest();
        await createExtraProducts();

        // Crear producto ligado a solicitud
        await prisma.productos_solicitud.create({
            data: {
                id_solicitud: TEST_REQUEST_ID,
                id_producto: 1,
                cantidad: 2,
                fecha: new Date(),
            },
        });

        // Simular inventario reducido previamente
        await prisma.productos_extra.update({
            where: { id_producto: 1 },
            data: {
                cantidad: 48,
            },
        });

        const res = await request(app)
            .delete(
                `/api/solicitudes-rec/resumen-recoleccion/producto/1/solicitud/${TEST_REQUEST_ID}/2`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Producto eliminado");

        // Validar que se borró relación
        const relation =
            await prisma.productos_solicitud.findMany({
                where: {
                    id_solicitud: TEST_REQUEST_ID,
                    id_producto: 1,
                },
            });

        expect(relation.length).toBe(0);

        // Validar inventario regresado
        const product =
            await prisma.productos_extra.findUnique({
                where: { id_producto: 1 },
            });

        expect(product.cantidad).toBe(50);
    });

    it("retorna 500 si producto no existe", async () => {
        const token = createAuthToken();

        await createCollectionRequest();

        const res = await request(app)
            .delete(
                `/api/solicitudes-rec/resumen-recoleccion/producto/999/solicitud/${TEST_REQUEST_ID}/1`
            )
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message)
            .toBe("Error al eliminar producto");
    });

});