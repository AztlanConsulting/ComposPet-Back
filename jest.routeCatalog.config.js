// Configuración aislada: no carga globalSetup, .env ni conexiones a BD.
module.exports = {
    testEnvironment: 'node',
    clearMocks: true,
    testMatch: ['<rootDir>/tests/unit/routeCatalog/**/*.test.js'],
};
