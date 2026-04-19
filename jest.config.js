module.exports = {
testEnvironment: 'node',

verbose: true,

collectCoverage: true,
coverageDirectory: 'coverage',

testMatch: [
'<rootDir>/tests/unit/**/*.test.js',
'<rootDir>/tests/integration/**/*.test.js',
],

setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

testTimeout: 100000,
};
