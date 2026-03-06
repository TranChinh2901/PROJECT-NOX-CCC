/**
 * Test Database Helper
 * Manages test database lifecycle and provides utilities for testing
 */
import path from 'path';
import { DataSource } from 'typeorm';
import { entities } from '@/config/load-entities';

export class TestDatabase {
  private static instance: TestDatabase;
  private dataSource: DataSource | null = null;

  private constructor() {}

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async connect(): Promise<DataSource> {
    if (this.dataSource && this.dataSource.isInitialized) {
      return this.dataSource;
    }

    const hasMysqlConfig = Boolean(
      process.env.TEST_DB_HOST &&
      process.env.TEST_DB_PORT &&
      process.env.TEST_DB_USERNAME &&
      process.env.TEST_DB_NAME
    );

    this.dataSource = hasMysqlConfig
      ? new DataSource({
          type: 'mysql',
          host: process.env.TEST_DB_HOST,
          port: Number(process.env.TEST_DB_PORT),
          username: process.env.TEST_DB_USERNAME,
          password: process.env.TEST_DB_PASSWORD,
          database: process.env.TEST_DB_NAME,
          entities,
          migrations: [path.join(process.cwd(), 'src/database/migrations/*{.ts,.js}')],
          migrationsRun: true,
          logging: false,
        })
      : new DataSource({
          type: 'sqlite',
          database: ':memory:',
          entities,
          synchronize: true,
          logging: false,
          dropSchema: true,
        });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  async disconnect(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }

  async clear(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database not connected');
    }

    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  async seed(): Promise<void> {
    // Override in tests if needed
  }

  getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database not connected');
    }
    return this.dataSource;
  }

  async runInTransaction<T>(
    work: (dataSource: DataSource) => Promise<T>
  ): Promise<T> {
    const dataSource = this.getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(dataSource);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export const testDb = TestDatabase.getInstance();
