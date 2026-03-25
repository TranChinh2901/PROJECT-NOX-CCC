import 'reflect-metadata';
import { getTestDataSource, closeTestDataSource } from './test-datasource';

beforeAll(async () => {
  try {
    const dataSource = getTestDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  } catch (error) {
  }
});

afterAll(async () => {
  try {
    await closeTestDataSource();
  } catch (error) {
  }
});

beforeEach(async () => {
});

afterEach(async () => {
});

process.env.ACCESS_TOKEN_SECRET = 'test_access_secret_key_12345678';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_key_87654321';
process.env.ACCESS_TOKEN_EXPIRES_IN = '30m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';

jest.setTimeout(30000);
