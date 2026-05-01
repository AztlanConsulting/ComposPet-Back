const { getRegisterClient, postRegisterClient } = require('../../../controllers/admin/createNewClient.controller');

const Route = require('../../../models/route.model');
const User = require('../../../models/user.model');
const Role = require('../../../models/role.model');
const Compospet = require('../../../models/compospet.model');
const Client = require('../../../models/client.model');
const Credit = require('../../../models/credit.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

jest.mock('../../../models/route.model');
jest.mock('../../../models/user.model')
jest.mock('../../../models/role.model');
jest.mock('../../../models/compospet.model');
jest.mock('../../../models/client.model');
jest.mock('../../../models/credit.model');
jest.mock('bcrypt');

describe('Controlador Register Client', () => {
    let req, res;

    beforeEach(()=> {
        req = { body: {} };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            
        };

        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(crypto, 'randomUUID').mockReturnValue('fake-uuid-1234');
    });

    afterAll(() => {
        console.error.mockRestore();
        crypto.randomUUID.mockRestore();
    });

    describe('Catalogo para obtener los datos del formuario de registrar cliente', () => {
        test('Debe devolver 404 si no se encuntran días de ruta.', async () => {

            // Arrange
            Route.findAllDaysOfRoute.mockResolvedValue([]);

            // Act
            await getRegisterClient(req, res);

            // Assert
            expect(Route.findAllDaysOfRoute).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No se encontraron días de ruta.',
            });
        });

        test('Debe retornar 200 y los días de ruta si la base de datos tiene registros', async () => {
            // Arrange
            const mockDaysOfRoutes = [{ id: 1, day: 'Lunes' }, { id: 2, day: 'Martes' }];
            Route.findAllDaysOfRoute.mockResolvedValue(mockDaysOfRoutes);

            // Act
            await getRegisterClient(req, res);

            // Assert
            expect(Route.findAllDaysOfRoute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { daysOfRoutes: mockDaysOfRoutes },
            });
        });

        test('Debe retornar 500 y registrar el error si el modelo falla', async () => {
            // Arrange: Simulamos un error catastrófico (ej. BD caída)
            const dbError = new Error('Conexión rechazada');
            Route.findAllDaysOfRoute.mockRejectedValue(dbError);

            // Act
            await getRegisterClient(req, res);

            // Assert
            expect(Route.findAllDaysOfRoute).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('Error en getRegisterClient:', dbError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error del servidor al obtener datos para registrar un nuevo cliente',
            });
        });
    })

    describe('Fromulario para registrar un cliente', () => {
        
        const validBody = {
            name: 'Juan',
            lastName: 'Perez',
            phone: '1234567890',
            email: 'juan@test.com',
            pets: 'Fido',
            family: 'Perez',
            address: 'Calle Falsa 123',
            notes: 'Sin notas',
            id_ruta: '1'
        };

        test('Debe retornar 400 si faltan campos obligatorios', async () => {
            req.body = {};

            await postRegisterClient(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Faltan datos requeridos para registrar al cliente.',
            });
        });

        test('Debe sanear los inputs y rechazar si los campos requeridos quedan vacíos tras el saneamiento', async () => {
            req.body = { ...validBody, name: '<>"' };

            await postRegisterClient(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Debe retornar 409 si el correo ya está registrado', async () => {
            req.body = validBody;
            User.findByEmail.mockResolvedValue({ 
                id: 1, 
                email: validBody.email 
            });

            await postRegisterClient(req, res);

            expect(User.findByEmail).toHaveBeenCalledWith(validBody.email);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Ya existe un usuario registrado con este correo.',
            });
        });

        test('Debe retornar 404 si no encuentra el rol de Cliente', async () => {
            req.body = validBody;
            User.findByEmail.mockResolvedValue(null);
            Role.findRoleByName.mockResolvedValue(null);

            await postRegisterClient(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No se encontro rol de cliente.',
            });
        });

        test('debe retornar 404 si no encuentra la configuración de Compospet', async () => {
            req.body = validBody;
            User.findByEmail.mockResolvedValue(null);
            Role.findRoleByName.mockResolvedValue({ 
                id_rol: 2 
            });
            Compospet.getId.mockResolvedValue(null);

            await postRegisterClient(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No se encontró la configuración de la empresa.',
            });
        });

        it('debe registrar el cliente exitosamente y retornar 200 (Camino Feliz)', async () => {
            // Arrange
            req.body = { ...validBody, name: 'Juan <script>' };
            
            const mockRole = { 
                id_rol: 2 
            };
            const mockCpId = 10;
            const mockHashedPass = 'hashed-pass';
            const mockUser = { 
                id_usuario: 100, 
                correo: validBody.email 
            };
            const mockClient = { 
                id_cliente: 200 
            };
            const mockCredit = { 
                saldo: 0 
            };

            User.findByEmail.mockResolvedValue(null);
            Role.findRoleByName.mockResolvedValue(mockRole);
            Compospet.getId.mockResolvedValue(mockCpId);
            bcrypt.hash.mockResolvedValue(mockHashedPass);
            User.createNewUser.mockResolvedValue(mockUser);
            Client.createNewClient.mockResolvedValue(mockClient);
            Credit.createInitialCredit.mockResolvedValue(mockCredit);

            // Act
            await postRegisterClient(req, res);

            // Assert
            expect(bcrypt.hash).toHaveBeenCalledWith('fake-uuid-1234', 10);
            
            expect(User.createNewUser).toHaveBeenCalledWith(
                'Juan script', 
                validBody.lastName, 
                validBody.phone, 
                validBody.email, 
                mockHashedPass, 
                mockRole.id_rol, 
                mockCpId
            );

            expect(Client.createNewClient).toHaveBeenCalledWith(
                mockUser.id_usuario, 
                parseInt(validBody.id_ruta), 
                validBody.pets, 
                validBody.family, 
                validBody.address, 
                validBody.notes
            );

            expect(Credit.createInitialCredit).toHaveBeenCalledWith(mockClient.id_cliente);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Cliente registrado exitosamente.',
                data: {
                    userId: mockUser.id_usuario,
                    clientId: mockClient.id_cliente,
                    email: mockUser.correo,
                    credit: mockCredit.saldo,
                },
            });
        });

        it('debe retornar 500 si algún modelo arroja un error inesperado', async () => {
            req.body = validBody;
            const dbError = new Error('Caída de la base de datos');
            User.findByEmail.mockRejectedValue(dbError);

            await postRegisterClient(req, res);

            expect(console.error).toHaveBeenCalledWith('Error en getRegisterClient:', dbError);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});


