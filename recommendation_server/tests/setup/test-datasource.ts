/**
 * SQLite in-memory test database configuration
 * Provides DataSource for testing with automatic schema synchronization
 */

import 'reflect-metadata';
import { DataSource, EntitySchema } from 'typeorm';
import { entities } from '@/config/load-entities';

let testDataSource: DataSource;

export function createTestDataSource(): DataSource {
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
