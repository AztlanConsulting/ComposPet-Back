const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../../app");
const prisma = require("../../config/prisma");

// Para generar Token
const { generateAccessToken } = require("../../utils/jwt.utils");

//Constantes 

const TEST_CP_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_USER_ID = randomUUID();
const TEST_CLIENT_ID = randomUUID();
const TEST_EMAIL = "saldo.test@compospet.com";
const ENDPOINT = "/api/saldo/consultar-saldo";
const TEST_ZONA_ID = 3;
const TEST_RUTA_ID = 3;


//Helpers

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
            nombre: "test-role-saldo",
        },
    });

    await prisma.usuarios_cp.create({
        data: {
            id_usuario: TEST_USER_ID,
            id_cp: TEST_CP_ID,
            id_rol: TEST_ROLE_ID,
            nombre: "Cliente",
            apellido: "Saldo Test",
            correo: TEST_EMAIL,
            contrasena: "hash-test",
            estatus: true,
            telefono: "77100000",
            primer_inicio_sesion: false,
            intentos_fallidos: 0,
        },
    });

    await prisma.zona.create({
        data: {
            id_zona: TEST_ZONA_ID,
            municipio: "Queretaro",
            descripcion: "El jardin",
            estado: "Queretaro",

            // Ajusta estos campos según tu schema.prisma
            // nombre: "Zona Test",
        },
    });

    await prisma.ruta.create({
        data: {
            id_ruta: TEST_RUTA_ID,
            id_zona: TEST_ZONA_ID,
            dia_ruta: "Lunes",
            turno_ruta: "Matutino",
        },
    });


    await prisma.cliente.create({
        data: {
            id_cliente: TEST_CLIENT_ID,
            id_usuario: TEST_USER_ID,
            id_ruta: TEST_RUTA_ID,
            mascotas: "1 perro 1 gato",
            cantidad_familia: 3,
            direccion: "Dirección de prueba",
            orden_horario: 1,
            notas: "Cliente de prueba",
            fecha_entrada: new Date(),
        },
    });
};

const cleanDb = async () => {
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
        where: { id_ruta: TEST_RUTA_ID },
    });

    await prisma.zona.deleteMany({
        where: { id_zona: TEST_ZONA_ID },
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

//Casos de prueba

describe("Credit Balance Integration", () => {
    it("retorna 400 si no se envía clientId", async () => {
        
        //Arrange 
        const token = createAuthToken();


        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        // Afirmar
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "Falta id del cliente para obtener el balance de tarjeta",
        });
    });

    it("retorna 200 con el saldo existente del cliente", async () => {
        
        // Arrange 
        const token = createAuthToken();

        await prisma.saldo.create({
            data: {
                id_cliente: TEST_CLIENT_ID,
                saldo: 500,
            },
        });

        // Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientId: TEST_CLIENT_ID,
            });

        //Afirmar
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Saldo de tarjeta obtenido exitosamente");
        expect(res.body.data.id_cliente).toBe(TEST_CLIENT_ID);
        expect(Number(res.body.data.saldo)).toBe(500);
    });

    it("retorna 200 y crea saldo inicial si el cliente no tiene saldo previo", async () => {
        
        //Arrange
        const token = createAuthToken();

        //Actuar
        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientId: TEST_CLIENT_ID,
            });

        //Afirmar
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Saldo de tarjeta obtenido exitosamente");
        expect(res.body.data.id_cliente).toBe(TEST_CLIENT_ID);
        expect(Number(res.body.data.saldo)).toBe(0);

        const saldoCreado = await prisma.saldo.findFirst({
            where: {
                id_cliente: TEST_CLIENT_ID,
            },
        });

        expect(saldoCreado).not.toBeNull();
        expect(Number(saldoCreado.saldo)).toBe(0);
    });

    it("retorna 500 si ocurre un error al crear saldo para un cliente inexistente", async () => {
        const token = createAuthToken();

        const  NON_CLIENT= randomUUID();

        const res = await request(app)
            .post(ENDPOINT)
            .set("Authorization", `Bearer ${token}`)
            .send({
                clientId: NON_CLIENT,
            });

        //Afirmar
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error servidor al obtener el saldo del cliente.");
    });

});