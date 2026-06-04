require('dotenv').config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en .env.test');
}

beforeEach(() => {
  jest.clearAllMocks();
});