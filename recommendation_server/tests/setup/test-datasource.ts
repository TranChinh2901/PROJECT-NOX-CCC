/**
 * Shared test database configuration.
 * Uses migration-driven MySQL when TEST_DB_* env vars are provided and
 * falls back to in-memory SQLite for lightweight local test runs.
 */

import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { entities } from '@/config/load-entities';
import { ProjectNamingStrategy } from '@/database/typeorm-naming.strategy';

let testDataSource: DataSource;

const resolveTestDatabaseType = (): 'mysql' | 'mariadb' =>
  (process.env.TEST_DATABASE_TYPE ?? process.env.TEST_DB_TYPE ?? 'mariadb') as 'mysql' | 'mariadb';

export function createTestDataSource(): DataSource {
  const hasMysqlConfig = Boolean(
    process.env.TEST_DB_HOST &&
    process.env.TEST_DB_PORT &&
    process.env.TEST_DB_USERNAME &&
    process.env.TEST_DB_NAME
  );

  if (hasMysqlConfig) {
    return new DataSource({
      type: resolveTestDatabaseType(),
      host: process.env.TEST_DB_HOST,
      port: Number(process.env.TEST_DB_PORT),
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_NAME,
      entities,
      migrations: [path.join(process.cwd(), 'src/database/migrations/*{.ts,.js}')],
      migrationsRun: true,
      logging: false,
      namingStrategy: new ProjectNamingStrategy(),
    });
  }

  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities,
    synchronize: true,
    logging: false,
    dropSchema: false,
  });
}

export function getTestDataSource(): DataSource {
  if (!testDataSource) {
    testDataSource = createTestDataSource();
  }
  return testDataSource;
}

export async function closeTestDataSource(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}

export async function resetTestDatabase(): Promise<void> {
  const dataSource = getTestDataSource();
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  if (dataSource.options.type === 'mysql' || dataSource.options.type === 'mariadb') {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    return;
  }

  await dataSource.query('PRAGMA foreign_keys = OFF');

  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    try {
      await repository.query(`DELETE FROM ${entity.tableName}`);
    } catch (error) {
    }
  }

  await dataSource.query('PRAGMA foreign_keys = ON');
}
