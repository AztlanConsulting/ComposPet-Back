// Importamos el controller que vamos a probar
const userController = require('../../../controllers/user.controller');

// Importamos el modelo (lo vamos a mockear)
const User = require('../../../models/user.model');

// Mockeamos el modelo para NO usar datos reales
jest.mock('../../../models/user.model');

test('should return status 200 and users in json', () => {

    // Datos falsos que queremos que el modelo regrese
    const fakeUsers = [
        { id: 1, nombre: 'Leo', apellido: 'Alvarado' }
    ];

    // Definimos que cuando se llame getAllUsers, regrese fakeUsers
    User.getAllUsers.mockReturnValue(fakeUsers);

    // Simulamos request vacío (no lo usamos aquí)
    const req = {};

    // Simulamos response de Express
    const res = {
        // Mock de status que permite encadenar .json()
        status: jest.fn().mockReturnThis(),

        // Mock de json para verificar lo que se envía
        json: jest.fn()
    };

    // Ejecutamos el controller
    userController.getAllUsers(req, res);

    // Verificamos que el modelo fue llamado
    expect(User.getAllUsers).toHaveBeenCalled();

    // Verificamos que el controller respondió con status 200
    expect(res.status).toHaveBeenCalledWith(200);

    // Verificamos que el JSON enviado es el esperado
    expect(res.json).toHaveBeenCalledWith(fakeUsers);
});