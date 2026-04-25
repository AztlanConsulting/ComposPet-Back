const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {
    console.log('Corriendo migraciones en base de datos de pruebas...');

    execSync('npx dotenv -e .env.test -- npx prisma db push --force-reset --accept-data-loss', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL,
        },
    });

    console.log('Base de datos lista');
};