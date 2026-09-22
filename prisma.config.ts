import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuración de Prisma.
 * Define el esquema, las migraciones y la URL de conexión.
 */

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
