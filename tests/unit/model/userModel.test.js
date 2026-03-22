// Importamos el modelo real
const User = require('../../../models/user.model');

test('debe regresar id, nombre y apellido', () => {

    // Llamamos al método del modelo
    const users = User.getAllUsers();

    // Verificamos que haya al menos un usuario
    expect(users.length).toBeGreaterThan(0);

    // Tomamos el primer usuario
    const user = users[0];

    // Validamos que tenga las propiedades necesarias
    expect(user.id).toBeDefined();
    expect(user.nombre).toBeDefined();
    expect(user.apellido).toBeDefined();
});