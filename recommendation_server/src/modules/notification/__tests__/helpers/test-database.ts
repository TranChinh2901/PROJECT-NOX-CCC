/**
 * Test Database Helper
 * Reuses AppDataSource so notification routes and repositories point at the same database.
 */
import { DataSource } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import { User } from '@/modules/users/entity/user.entity';
import { RoleType } from '@/modules/auth/enum/auth.enum';

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

    this.dataSource = AppDataSource;
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
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

    if (this.dataSource.options.type === 'sqlite') {
      await this.dataSource.query('PRAGMA foreign_keys = OFF');

      const entityMetadatas = [...this.dataSource.entityMetadatas].sort(
        (left, right) => right.foreignKeys.length - left.foreignKeys.length,
      );

      for (const entity of entityMetadatas) {
        await this.dataSource.query(`DELETE FROM "${entity.tableName}"`);
      }

      await this.dataSource.query('PRAGMA foreign_keys = ON');
    } else {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
      const entityMetadatas = [...this.dataSource.entityMetadatas].sort(
        (left, right) => right.foreignKeys.length - left.foreignKeys.length,
      );
      for (const entity of entityMetadatas) {
        await this.dataSource.query(`DELETE FROM \`${entity.tableName}\``);
      }
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    const userRepository = this.dataSource.getRepository(User);
    await userRepository.save([
      userRepository.create({
        id: 1,
        fullname: 'Notification Test User',
        email: 'test@example.com',
        phone_number: '0900000001',
        password: 'hashed-password',
        role: RoleType.USER,
        is_verified: true,
      }),
      userRepository.create({
        id: 2,
        fullname: 'Notification Test User Two',
        email: 'test2@example.com',
        phone_number: '0900000002',
        password: 'hashed-password',
        role: RoleType.USER,
        is_verified: true,
      }),
      userRepository.create({
        id: 999,
        fullname: 'Notification Admin User',
        email: 'admin@example.com',
        phone_number: '0900000999',
        password: 'hashed-password',
        role: RoleType.ADMIN,
        is_verified: true,
      }),
    ]);
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
      const transactionalDataSource = Object.assign(
        Object.create(dataSource),
        {
          getRepository: queryRunner.manager.getRepository.bind(queryRunner.manager),
          query: queryRunner.query.bind(queryRunner),
        },
      ) as DataSource;

      const result = await work(transactionalDataSource);
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
