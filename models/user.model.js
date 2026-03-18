module.exports = class User {
    constructor(id, nombre, apellido) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
    }

    // ===== DATOS ESTÁTICOS =====
    static users = [
        new User(1, 'Leo', 'Alvarado'),
        new User(2, 'Ale', 'Arredondo'),
        new User(3, 'Fátima', 'Figeroa'),
        new User(4, 'Kamila', 'Martinez'),
        new User(5, 'Fernanda', 'Valdez'),
        new User(6, 'Yessica', 'Lora'),
        new User(7, 'Juan Manuel', 'Murillo'),
    ];

    // ===== MÉTODOS =====

    static getAllUsers() {
        return this.users;
    }
};