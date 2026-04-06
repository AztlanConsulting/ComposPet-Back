# Compospet

## Índice

- [Necesidad de la empresa](#necesidad-de-la-empresa)
- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Configuración de la BD (PostgreSQL)](#configuración-de-la-bd-postgresql)
- [Configuración de Prisma](#configuración-de-prisma)
- [Ejecución del proyecto](#ejecución-del-proyecto)

---

### Necesidad de la empresa
ComposPet no puede iniciar nuevos proyectos, ya que se encuentra en un cuello de botella administrativo, pues una sola persona gestiona los procesos largos y manuales. 

### Objetivo del proyecto
Que Compospet inicie nuevos proyectos al reducir en un 80% las cinco horas de gestión administrativa de sus clientes actuales antes del final del semestre.

---

## Tecnologías

- Node.js
- Prisma ORM
- PostgreSQL

---

## Requisitos previos

Asegúrate de tener instalado:

- Node.js (>= 18 recomendado)
- npm
- Base de datos (PostgreSQL)
- Git

---

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/AztlanConsulting/ComposPet-Back.git
cd ComposPet-Back
```

2. Instala las dependencias:

```bash
npm install
```

## Variables de entorno
Crea un archivo .env en la raíz del proyecto con la siguiente estructura:
```env
GOOGLE_CLIENT_ID = TU_GOOGLE_ID
PORT = 8080
DATABASE_URL = postgres://usuario:contraseña@localhost:puerto/compospet?schema=public
JWT_SECRET= TU_SECRETO
```
Ajusta los valores según tu entorno.

## Configuración de la BD (PostgreSQL)

1. Crear la BD:
```bash
psql -U postgres
```
```bash
CREATE DATABASE compospet;
```

2. Crear tu usuario para la BD:
```bash
CREATE USER tu_usuario WITH PASSWORD 'tu_password';
ALTER ROLE tu_usuario SET client_encoding TO 'utf8';
ALTER ROLE tu_usuario SET default_transaction_isolation TO 'read committed';
ALTER ROLE tu_usuario SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE compospet TO tu_usuario;
```

3. Crear las tablas:
```bash
psql -U postgres -d compospet -f script.sql
```

4. Verificar la creación de las tablas:
```bash
psql -U postgres -d nombre_db
\dt
```

5. Poblar la BD:
```bash
psql -U postgres -d compospet -f seed.sql
```

## Configuración de Prisma

1. Generar el cliente de Prisma:
```bash
npx prisma generate
npx prisma db push
```

2. Para actualizar los cambios de la BD:
```bash
npx prisma db migrate
npx prisma db push
```

3. Si hubo un problema, regresar a la versión anterior:
```bash
npx prisma migrate reset
```


## Ejecución del proyecto

**Desarrollo**
```bash
npm run dev
```

**Producción**
```bash
npm run start
```
