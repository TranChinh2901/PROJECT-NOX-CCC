/**
 * Test Database Helper
 * Manages test database lifecycle and provides utilities for testing
 */
import { DataSource } from 'typeorm';
import { NotificationEntity } from '../../entity/NotificationEntity';
import { NotificationPreferencesEntity } from '../../entity/NotificationPreferencesEntity';
import { NotificationTemplateEntity } from '../../entity/NotificationTemplateEntity';

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

    this.dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        NotificationEntity,
        NotificationPreferencesEntity,
        NotificationTemplateEntity,
      ],
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
