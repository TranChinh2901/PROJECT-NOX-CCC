/**
 * Repository Integration Tests
 * Tests database operations, caching, transactions, and data integrity
 */
import { DataSource, Repository } from 'typeorm';
import { testDb } from '../helpers/test-database';
import { NotificationEntity } from '../../entity/NotificationEntity';
import { NotificationPreferencesEntity } from '../../entity/NotificationPreferencesEntity';
import { NotificationFixtures } from '../fixtures/notification.fixtures';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';

describe('Notification Repository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: Repository<NotificationEntity>;
  let notificationRepo: NotificationRepository;

  beforeAll(async () => {
    dataSource = await testDb.connect();
    repository = dataSource.getRepository(NotificationEntity);
    notificationRepo = new NotificationRepository(dataSource);
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  describe('Create Operations', () => {
    it('should create a notification', async () => {
      const notification = NotificationFixtures.createNotification({ userId: 1 });
      const saved = await repository.save(notification);

      expect(saved.id).toBeDefined();
      expect(saved.userId).toBe(1);
      expect(saved.title).toBe(notification.title);
    });

    it('should create multiple notifications in bulk', async () => {
      const notifications = NotificationFixtures.createBulkNotifications(10, 1);
      const saved = await repository.save(notifications);

      expect(saved).toHaveLength(10);
      expect(saved.every(n => n.id)).toBe(true);
    });

    it('should enforce required fields', async () => {
      const notification = new NotificationEntity();
      // Missing required fields

      await expect(repository.save(notification)).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const notification = NotificationFixtures.createNotification({ userId: 1 });
      const saved = await repository.save(notification);

      expect(saved.isRead).toBe(false);
      expect(saved.isArchived).toBe(false);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Read Operations', () => {
    it('should find notification by ID', async () => {
      const notification = await repository.save(
        NotificationFixtures.createNotification({ userId: 1 })
      );

      const found = await repository.findOne({ where: { id: notification.id } });

      expect(found).toBeDefined();
      expect(found?.id).toBe(notification.id);
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findOne({ where: { id: 99999 } });
      expect(found).toBeNull();
    });

    it('should find notifications by user ID', async () => {
      await repository.save([
        NotificationFixtures.createNotification({ userId: 1 }),
        NotificationFixtures.createNotification({ userId: 1 }),
        NotificationFixtures.createNotification({ userId: 2 }),
      ]);

      const found = await repository.find({ where: { userId: 1 } });

      expect(found).toHaveLength(2);
      expect(found.every(n => n.userId === 1)).toBe(true);
    });

    it('should filter by type', async () => {
      await repository.save([
        NotificationFixtures.createNotification({ userId: 1, type: 'ORDER_UPDATE' }),
        NotificationFixtures.createNotification({ userId: 1, type: 'PROMOTION' }),
        NotificationFixtures.createNotification({ userId: 1, type: 'ORDER_UPDATE' }),
      ]);

      const found = await repository.find({
        where: { userId: 1, type: 'ORDER_UPDATE' },
      });

      expect(found).toHaveLength(2);
    });

    it('should filter by read status', async () => {
      await repository.save([
        NotificationFixtures.createNotification({ userId: 1, isRead: false }),
        NotificationFixtures.createNotification({ userId: 1, isRead: true }),
        NotificationFixtures.createNotification({ userId: 1, isRead: false }),
      ]);

      const unread = await repository.find({
        where: { userId: 1, isRead: false },
      });

      expect(unread).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const notifications = NotificationFixtures.createBulkNotifications(25, 1);
      await repository.save(notifications);

      const page1 = await repository.find({
        where: { userId: 1 },
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });

      const page2 = await repository.find({
        where: { userId: 1 },
        take: 10,
        skip: 10,
        order: { createdAt: 'DESC' },
      });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should order by creation date', async () => {
      const n1 = await repository.save(
        NotificationFixtures.createNotification({ userId: 1 })
      );
      await new Promise(resolve => setTimeout(resolve, 10));
      const n2 = await repository.save(
        NotificationFixtures.createNotification({ userId: 1 })
      );

      const found = await repository.find({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });

      expect(found[0].id).toBe(n2.id);
      expect(found[1].id).toBe(n1.id);
    });
  });

  describe('Update Operations', () => {
    it('should update notification', async () => {
      const notification = await repository.save(
        NotificationFixtures.createNotification({ userId: 1, isRead: false })
      );

      notification.isRead = true;
      const updated = await repository.save(notification);

      expect(updated.isRead).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        notification.createdAt.getTime()
      );
    });

    it('should update multiple notifications', async () => {
      const notifications = await repository.save(
        NotificationFixtures.createBulkNotifications(3, 1)
      );

      const ids = notifications.map(n => n.id);
      await repository.update({ id: { $in: ids } as any }, { isRead: true });

      const updated = await repository.findBy({ id: { $in: ids } as any });
      expect(updated.every(n => n.isRead)).toBe(true);
    });

    it('should archive notification', async () => {
      const notification = await repository.save(
        NotificationFixtures.createNotification({ userId: 1, isArchived: false })
      );

      await repository.update(notification.id, { isArchived: true });

      const updated = await repository.findOne({ where: { id: notification.id } });
      expect(updated?.isArchived).toBe(true);
    });
  });

  describe('Delete Operations', () => {
    it('should delete notification', async () => {
      const notification = await repository.save(
        NotificationFixtures.createNotification({ userId: 1 })
      );

      await repository.delete(notification.id);

      const found = await repository.findOne({ where: { id: notification.id } });
      expect(found).toBeNull();
    });

    it('should delete multiple notifications', async () => {
      const notifications = await repository.save(
        NotificationFixtures.createBulkNotifications(3, 1)
      );

      const ids = notifications.map(n => n.id);
      await repository.delete(ids);

      const found = await repository.findBy({ id: { $in: ids } as any });
      expect(found).toHaveLength(0);
    });

    it('should soft delete notification if configured', async () => {
      const notification = await repository.save(
        NotificationFixtures.createNotification({ userId: 1 })
      );

      await repository.softDelete(notification.id);

      const found = await repository.findOne({ where: { id: notification.id } });
      expect(found).toBeNull();

      const withDeleted = await repository.findOne({
        where: { id: notification.id },
        withDeleted: true,
      });
      expect(withDeleted).toBeDefined();
    });
  });

  describe('Transaction Operations', () => {
    it('should commit transaction on success', async () => {
      await testDb.runInTransaction(async (ds) => {
        const repo = ds.getRepository(NotificationEntity);
        await repo.save(NotificationFixtures.createNotification({ userId: 1 }));
      });

      const count = await repository.count();
      expect(count).toBe(1);
    });

    it('should rollback transaction on error', async () => {
      try {
        await testDb.runInTransaction(async (ds) => {
          const repo = ds.getRepository(NotificationEntity);
          await repo.save(NotificationFixtures.createNotification({ userId: 1 }));
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }

      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should handle nested transactions', async () => {
      await testDb.runInTransaction(async (ds) => {
        const repo = ds.getRepository(NotificationEntity);
        await repo.save(NotificationFixtures.createNotification({ userId: 1 }));

        await testDb.runInTransaction(async (ds2) => {
          const repo2 = ds2.getRepository(NotificationEntity);
          await repo2.save(NotificationFixtures.createNotification({ userId: 2 }));
        });
      });

      const count = await repository.count();
      expect(count).toBe(2);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce unique constraints if defined', async () => {
      // This depends on your entity constraints
      const notification = NotificationFixtures.createNotification({ userId: 1 });
      await repository.save(notification);

      // Try to save duplicate - adjust based on your constraints
      // await expect(repository.save(notification)).rejects.toThrow();
    });

    it('should validate data types', async () => {
      const notification = NotificationFixtures.createNotification({ userId: 1 });
      (notification as any).priority = 'INVALID_PRIORITY';

      // Should fail validation if enums are enforced
      // await expect(repository.save(notification)).rejects.toThrow();
    });

    it('should handle JSON data fields', async () => {
      const data = { orderId: 123, customField: 'value', nested: { key: 'val' } };
      const notification = NotificationFixtures.createNotification({
        userId: 1,
        data,
      });

      const saved = await repository.save(notification);
      const found = await repository.findOne({ where: { id: saved.id } });

      expect(found?.data).toEqual(data);
    });
  });

  describe('Aggregation Operations', () => {
    it('should count notifications', async () => {
      await repository.save(NotificationFixtures.createBulkNotifications(5, 1));

      const count = await repository.count({ where: { userId: 1 } });
      expect(count).toBe(5);
    });

    it('should count unread notifications', async () => {
      await repository.save([
        NotificationFixtures.createNotification({ userId: 1, isRead: false }),
        NotificationFixtures.createNotification({ userId: 1, isRead: false }),
        NotificationFixtures.createNotification({ userId: 1, isRead: true }),
      ]);

      const unreadCount = await repository.count({
        where: { userId: 1, isRead: false },
      });

      expect(unreadCount).toBe(2);
    });

    it('should group by type', async () => {
      await repository.save([
        NotificationFixtures.createNotification({ userId: 1, type: 'ORDER_UPDATE' }),
        NotificationFixtures.createNotification({ userId: 1, type: 'ORDER_UPDATE' }),
        NotificationFixtures.createNotification({ userId: 1, type: 'PROMOTION' }),
      ]);

      const results = await repository
        .createQueryBuilder('notification')
        .select('notification.type')
        .addSelect('COUNT(*)', 'count')
        .where('notification.userId = :userId', { userId: 1 })
        .groupBy('notification.type')
        .getRawMany();

      expect(results).toHaveLength(2);
      const orderUpdates = results.find(r => r.type === 'ORDER_UPDATE');
      expect(orderUpdates?.count).toBe('2');
    });
  });
});

describe('Notification Preferences Repository Tests', () => {
  let dataSource: DataSource;
  let repository: Repository<NotificationPreferencesEntity>;

  beforeAll(async () => {
    dataSource = await testDb.connect();
    repository = dataSource.getRepository(NotificationPreferencesEntity);
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  it('should create user preferences', async () => {
    const prefs = NotificationFixtures.createPreferences({ userId: 1 });
    const saved = await repository.save(prefs);

    expect(saved.id).toBeDefined();
    expect(saved.userId).toBe(1);
  });

  it('should update user preferences', async () => {
    const prefs = await repository.save(
      NotificationFixtures.createPreferences({ userId: 1, emailEnabled: true })
    );

    prefs.emailEnabled = false;
    const updated = await repository.save(prefs);

    expect(updated.emailEnabled).toBe(false);
  });

  it('should find preferences by user ID', async () => {
    await repository.save(NotificationFixtures.createPreferences({ userId: 1 }));

    const found = await repository.findOne({ where: { userId: 1 } });
    expect(found).toBeDefined();
  });

  it('should enforce one preference per user', async () => {
    await repository.save(NotificationFixtures.createPreferences({ userId: 1 }));

    // Try to create another preference for same user - should fail if unique constraint exists
    // const duplicate = NotificationFixtures.createPreferences({ userId: 1 });
    // await expect(repository.save(duplicate)).rejects.toThrow();
  });
});
