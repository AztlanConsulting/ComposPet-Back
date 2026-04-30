const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

// Para generar Token
const { generateAccessToken } = require("../../utils/jwt.utils");

// --- Constantes ---

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_REQUEST_ID = randomUUID();
const TEST_EMAIL = "formtest@compospet.com";

const PRODUCT_ID_1 = 5;
const PRODUCT_ID_2 = 6;

const BASE_ROUTE = "/api/solicitudes-rec";

// --- Helpers ---

// Crear un token válido para el test
const createAuthToken = () => {
  return generateAccessToken({
    id_usuario: TEST_USER_ID,
    correo: TEST_EMAIL,
    id_rol: TEST_ROLE_ID,
    role: "cliente",
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
      apellido: "Form Test",
      correo: TEST_EMAIL,
      contrasena: "hash-test",
      estatus: true,
      telefono: "1234567890",
      primer_inicio_sesion: false,
      intentos_fallidos: 0,
    },
  });

  await prisma.ruta.upsert({
    where: { id_ruta: 1 },
    update: {},
    create: {
        id_ruta: 1,
        dia_ruta: "dia test",
        turno_ruta: "turno test"
    },
  });

  await prisma.cliente.create({
    data: {
      id_cliente: TEST_CLIENT_ID,
      id_usuario: TEST_USER_ID,
      id_ruta: 1,
      mascotas: "1 perro",
      familia: "4",
      direccion: "Dirección de prueba",
      orden_horario: 1,
      notas: "Cliente de prueba",
      fecha_entrada: new Date(),
    },
  });

  // Crear productos de prueba
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
};

const cleanDb = async () => {
  await prisma.productos_solicitud.deleteMany({
    where: { id_solicitud: TEST_REQUEST_ID },
  });

  await prisma.solicitudes_recoleccion.deleteMany({
    where: { id_solicitud: TEST_REQUEST_ID },
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

  await prisma.roles.deleteMany({
    where: { id_rol: TEST_ROLE_ID },
  });

  await prisma.compospet.deleteMany({
    where: { id_cp: TEST_CP_ID },
  });
};

beforeAll(async () => {
  await cleanDb();
});

beforeEach(async () => {
  await cleanDb();
  await createTestUserAndClient();
});

afterEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// --- Casos de prueba ---

describe("CollectionRequest - flujo completo segunda página (integration)", () => {
  let initialStockProduct1;
  let initialStockProduct2;

  beforeEach(async () => {
    // Obtener stock inicial
    const product1 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_1 },
    });

    const product2 = await prisma.productos_extra.findUnique({
      where: { id_producto: PRODUCT_ID_2 },
    });

    initialStockProduct1 = product1.cantidad;
    initialStockProduct2 = product2.cantidad;

    // Crear solicitud de prueba
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

  it("debe ejecutar correctamente todo el flujo con token", async () => {
    // Arrange
    const token = createAuthToken();

    // Actuar & Afirmar

    // 1. Obtener última solicitud
    const lastRequest = await request(app)
      .post(`${BASE_ROUTE}/ultimaSolicitud`)
      .set("Authorization", `Bearer ${token}`)
      .send({ idClient: TEST_CLIENT_ID });

    expect(lastRequest.status).toBe(200);
    expect(lastRequest.body.data.id_solicitud).toBe(TEST_REQUEST_ID);

    // 2. Obtener productos extra
    const extraProducts = await request(app)
      .get(`${BASE_ROUTE}/form04/obtener`)
      .set("Authorization", `Bearer ${token}`);

    expect(extraProducts.status).toBe(200);
    expect(extraProducts.body.success).toBe(true);

    const ids = extraProducts.body.data.map((p) => p.id_producto);
    expect(ids).toContain(PRODUCT_ID_1);
    expect(ids).toContain(PRODUCT_ID_2);

    // 3. Obtener selección previa
    const previous = await request(app)
      .post(`${BASE_ROUTE}/form03/obtenerInfo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ requestID: TEST_REQUEST_ID });

    expect(previous.status).toBe(200);
    expect(previous.body.data).toEqual([
      { id_producto: PRODUCT_ID_1, cantidad: 1 },
    ]);

    // 4. Guardar nueva selección
    const save = await request(app)
      .post(`${BASE_ROUTE}/form04/guardar`)
      .set("Authorization", `Bearer ${token}`)
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
      .set("Authorization", `Bearer ${token}`)
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