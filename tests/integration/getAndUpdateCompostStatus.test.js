const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

const { generateAccessToken } = require("../../utils/jwt.utils");

// --- Constantes ---

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();

const TEST_EMAIL = "composttest@compospet.com";

const COMPOST_BUCKET_ID = 2;
const COMPOST_BAG_ID = 3;

const GET_COMPOST_STATUS_ROUTE = "/api/cliente/estatus-composta";
const UPDATE_COMPOST_STATUS_ROUTE = "/api/cliente/modificar-estatus-composta";

// --- Helpers ---

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_USER_ID,
        correo: TEST_EMAIL,
        id_rol: TEST_ROLE_ID,
        role: "Administrador",
    });
};

const createTestUserAndClient = async () => {
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
            nombre: "Cliente",
            apellido: "Test",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "1234567890",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.ruta.upsert({
        where: { id_ruta: 9999 },
        update: {},
        create: {
            id_ruta: 9999,
            dia_ruta: "dia test",
            turno_ruta: "turno test",
        },
    });

    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: 9999,
            mascotas: "1 perro",
            familia: "4",
            direccion: "Dirección de prueba",
            orden_horario: 1,
            notas: "Cliente de prueba",
            fecha_entrada: new Date(),
        },
    });
};

const createCompostProducts = async (status = true) => {
    await prisma.productos_extra.createMany({
        data: [
            {
                id_producto: COMPOST_BUCKET_ID,
                nombre: "Composta (cubeta)",
                precio: 50,
                descripcion: "Composta en cubeta",
                cantidad: 10,
                imagen_url: "/img/products/composta_cubeta.jpg",
                estatus: status,
                orden: 2,
                color: "#169B49",
            },
            {
                id_producto: COMPOST_BAG_ID,
                nombre: "Composta (costal)",
                precio: 100,
                descripcion: "Composta en costal",
                cantidad: 10,
                imagen_url: "/img/products/composta_costal.jpg",
                estatus: status,
                orden: 3,
                color: "#169B49",
            },
        ],
        skipDuplicates: true,
    });
};

const cleanDb = async () => {
    await prisma.productos_extra.deleteMany({
        where: {
            id_producto: {
                in: [COMPOST_BUCKET_ID, COMPOST_BAG_ID],
            },
        },
    });

    await prisma.cliente.deleteMany({
        where: { id_cliente: TEST_CLIENT_ID },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_USER_ID },
    });

    await prisma.ruta.deleteMany({
        where: { id_ruta: 9999 },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });
};

// --- Hooks ---

beforeAll(async () => {
    await cleanDb();
});

beforeEach(async () => {
    await cleanDb();
    await createTestUserAndClient();
    await createCompostProducts(true);
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// --- Tests ---

describe("Compost Status - Integration", () => {

    it("debe obtener true si ambos productos de composta están activos", async () => {
        const token = createAuthToken();

        const response = await request(app)
            .get(GET_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            data: true,
        });
    });

    it("debe obtener false si uno de los productos está inactivo", async () => {
        const token = createAuthToken();

        await prisma.productos_extra.update({
            where: { id_producto: COMPOST_BAG_ID },
            data: {
                estatus: false,
            },
        });

        const response = await request(app)
            .get(GET_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            data: false,
        });
    });

    it("debe obtener false si falta uno de los productos de composta", async () => {
        const token = createAuthToken();

        await prisma.productos_extra.delete({
            where: {
                id_producto: COMPOST_BAG_ID,
            },
        });

        const response = await request(app)
            .get(GET_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            data: false,
        });
    });

    it("debe actualizar el estatus de composta a false", async () => {
        const token = createAuthToken();

        const response = await request(app)
            .post(UPDATE_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: false,
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Estatus de composta actualizado exitosamente.",
        });

        const products = await prisma.productos_extra.findMany({
            where: {
                id_producto: {
                    in: [COMPOST_BUCKET_ID, COMPOST_BAG_ID],
                },
            },
        });

        expect(products).toHaveLength(2);

        expect(
            products.every(product => product.estatus === false)
        ).toBe(true);
    });

    it("debe actualizar el estatus de composta a true", async () => {
        const token = createAuthToken();

        await prisma.productos_extra.updateMany({
            where: {
                id_producto: {
                    in: [COMPOST_BUCKET_ID, COMPOST_BAG_ID],
                },
            },
            data: {
                estatus: false,
            },
        });

        const response = await request(app)
            .post(UPDATE_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: true,
            });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "Estatus de composta actualizado exitosamente.",
        });

        const products = await prisma.productos_extra.findMany({
            where: {
                id_producto: {
                    in: [COMPOST_BUCKET_ID, COMPOST_BAG_ID],
                },
            },
        });

        expect(products).toHaveLength(2);

        expect(
            products.every(product => product.estatus === true)
        ).toBe(true);
    });

    it("debe responder 500 si el status no es booleano", async () => {
        const token = createAuthToken();

        const response = await request(app)
            .post(UPDATE_COMPOST_STATUS_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "false",
            });

        expect(response.status).toBe(500);

        expect(response.body).toEqual({
            success: false,
            message: "Error al actualizar el estatus de la composta.",
        });
    });

});