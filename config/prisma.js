require("dotenv").config();

const { PrismaClient } = require("../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Pool de conexiones a PostgreSQL usando la URL de conexión definida 
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

//Adaptador que permite a Prisma conectarse a PostgreSQL
const adapter = new PrismaPg(pool);

//Instancia principal de Prisma del proyecto.
const prisma = new PrismaClient({ adapter });

module.exports = prisma;