const request = require("supertest");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");
const { generateAccessToken } = require("../../utils/jwt.utils");

const TEST_CP_ID = randomUUID();
const TEST_ADMIN_ROLE_ID = randomUUID();
const TEST_ADMIN_USER_ID = randomUUID();
const TEST_ADMIN_EMAIL = "admin.inventory.test@compospet.com";

const ENDPOINT_POST = "/api/inventario/agregar-producto";
const ENDPOINT_GET = "/api/inventario/obtener-inventario";

const TEST_PRODUCT_NAME = "Producto Test Inventario";

const createAuthToken = () => {
    return generateAccessToken({
        id_usuario: TEST_ADMIN_USER_ID,
        correo: TEST_ADMIN_EMAIL,
        id_rol: TEST_ADMIN_ROLE_ID,
        role: "Administrador",
    });
};

const createBaseData = async () => {
    await prisma.compospet.upsert({
        where: { id_cp: TEST_CP_ID },
        update: {},
        create: { id_cp: TEST_CP_ID },
    });

    await prisma.roles.upsert({
        where: { id_rol: TEST_ADMIN_ROLE_ID },
        update: {},
        create: {
            id_rol: TEST_ADMIN_ROLE_ID,
            nombre: "Administrador",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_ADMIN_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ADMIN_ROLE_ID,
            nombre: "Admin",
            apellido: "Inventario",
            correo: TEST_ADMIN_EMAIL,
            contrasena: "hash",
            estatus: true,
            telefono: "4420000000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });
};

const cleanDb = async () => {
    await prisma.productos_extra.deleteMany({
        where: {
            nombre: {
                contains: "Producto Test",
            },
        },
    });

    await prisma.usuarios_cp.deleteMany({
        where: { id_usuario: TEST_ADMIN_USER_ID },
    });

    await prisma.roles.deleteMany({
        where: { id_rol: TEST_ADMIN_ROLE_ID },
    });

    await prisma.compospet.deleteMany({
        where: { id_cp: TEST_CP_ID },
    });
};

beforeEach(async () => {
    await cleanDb();
    await createBaseData();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("POST /inventario/agregar-producto", () => {
    it("registra un producto exitosamente sin imagen", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "150.50")
            .field("quantity", "10")
            .field("color", "#169B49")
            .field("description", "Producto Test de inventario");

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Producto registrado exitosamente.");
        expect(res.body.data.productId).toBeDefined();
        expect(res.body.data.name).toBe(TEST_PRODUCT_NAME);
        expect(res.body.data.price).toBe(150.50);
        expect(res.body.data.quantity).toBe(10);
        expect(res.body.data.imageUrl).toBe("uploads/products/default-product.png");
    });

    it("retorna 409 si el producto ya existe", async () => {
        const token = createAuthToken();

        await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "100")
            .field("quantity", "5")
            .field("color", "#169B49");

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "120")
            .field("quantity", "8")
            .field("color", "#169B49");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Ya existe un producto registrado con este nombre.");
    });

    it("retorna 400 si faltan datos requeridos", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "100");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Faltan datos requeridos para registrar el producto.");
    });

    it("retorna 400 si el precio tiene más de 2 decimales", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "100.999")
            .field("quantity", "10")
            .field("color", "#169B49");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("El precio solo puede tener hasta 2 decimales.");
    });

    it("retorna 400 si la cantidad es mayor a 999", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", TEST_PRODUCT_NAME)
            .field("price", "100")
            .field("quantity", "1000")
            .field("color", "#169B49");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("La cantidad no puede ser mayor a 999.");
    });

    it("retorna 400 si el nombre contiene caracteres inválidos", async () => {
        const token = createAuthToken();

        const res = await request(app)
            .post(ENDPOINT_POST)
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Producto@Test")
            .field("price", "100")
            .field("quantity", "10")
            .field("color", "#169B49");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("El nombre contiene caracteres inválidos.");
    });
});

describe("GET /inventario", () => {
    it("retorna el inventario correctamente", async () => {
        const token = createAuthToken();

        await prisma.productos_extra.create({
            data: {
                nombre: TEST_PRODUCT_NAME,
                precio: 100,
                descripcion: "Producto para consulta",
                cantidad: 10,
                imagen_url: "uploads/products/default-product.png",
                orden: 1,
                estatus: true,
                deleted: false,
                color: "#169B49",
            },
        });

        const res = await request(app)
            .get(ENDPOINT_GET)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        const product = res.body.data.find(item => item.name === TEST_PRODUCT_NAME);

        expect(product).toBeDefined();
        expect(product.price).toBe(100);
        expect(product.quantity).toBe(10);
        expect(product.imageUrl).toBe("uploads/products/default-product.png");
    });
});