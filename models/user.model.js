const prisma = require("../config/prisma");

// Exportamos una clase llamada User
module.exports = class User {

    // Constructor que define la estructura de un usuario
    constructor(id, nombre, apellido) {
        this.id = id;           // Identificador único del usuario
        this.nombre = nombre;   // Nombre del usuario
        this.apellido = apellido; // Apellido del usuario
    }

    // ===== DATOS ESTÁTICOS =====

    // Lista estática de usuarios (simula una base de datos en memoria)
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

    // Método estático para obtener todos los usuarios
    // No necesita crear una instancia de la clase (se llama con User.getAllUsers())
    static getAllUsers() {
        return this.users; // Retorna la lista completa de usuarios
    }

    // Ejemplo: Obtiene todos los registros de niveles desde la base de datos usando Prisma
    static async getAllUsers2() {
        const x = prisma.niveles.findMany();
        console.log(x);
        return await prisma.niveles.findMany(); // Retorna la lista completa de usuarios desde la base de datos usando Prisma
    }

};