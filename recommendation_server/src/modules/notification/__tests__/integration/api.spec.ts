/**
 * API Integration Tests: Notification Endpoints
 * Tests all REST endpoints with authentication, pagination, filtering, and error cases
 */
import request from 'supertest';
import { Application } from 'express';
import { testDb } from '../helpers/test-database';
import { createTestServer } from '../helpers/test-server';
import { AuthHelper } from '../helpers/auth-helper';
import { NotificationFixtures } from '../fixtures/notification.fixtures';
import { Notification } from '../../entity';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';
import { DataSource } from 'typeorm';

describe('Notification API Integration Tests', () => {
  let app: Application;
  let dataSource: DataSource;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    dataSource = await testDb.connect();
    app = createTestServer();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clear();

    // Create test user and token
    const user = AuthHelper.createTestUser();
    userId = user.id;
    authToken = AuthHelper.generateToken(user);
  });

  describe('GET /api/v1/notifications', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${AuthHelper.generateInvalidToken()}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with expired token', async () => {
      const user = AuthHelper.createTestUser();
      const expiredToken = AuthHelper.generateExpiredToken(user);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return empty list for user with no notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should return paginated notifications', async () => {
      // Create 25 notifications
      const notifications = NotificationFixtures.createBulkNotifications(25, userId);
      const repo = dataSource.getRepository(Notification);
      await repo.save(notifications);

      const response = await request(app)
        .get('/api/v1/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(10);
      expect(response.body.data.total).toBe(25);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.totalPages).toBe(3);
    });

    it('should filter notifications by type', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, type: NotificationType.ORDER_PLACED }),
        NotificationFixtures.createNotification({ user_id: userId, type: NotificationType.ORDER_PLACED }),
        NotificationFixtures.createNotification({ user_id: userId, type: NotificationType.PROMOTION_AVAILABLE }),
      ]);

      const response = await request(app)
        .get('/api/v1/notifications?type=ORDER_UPDATE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.notifications.every((n: any) => n.type === 'ORDER_UPDATE')).toBe(true);
    });

    it('should filter notifications by priority', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, priority: NotificationPriority.HIGH }),
        NotificationFixtures.createNotification({ user_id: userId, priority: NotificationPriority.LOW }),
        NotificationFixtures.createNotification({ user_id: userId, priority: NotificationPriority.HIGH }),
      ]);

      const response = await request(app)
        .get('/api/v1/notifications?priority=HIGH')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.notifications.every((n: any) => n.priority === 'HIGH')).toBe(true);
    });

    it('should filter notifications by read status', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: true }),
      ]);

      const response = await request(app)
        .get('/api/v1/notifications?is_read=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.notifications.every((n: any) => n.is_read === false)).toBe(true);
    });

    it('should filter notifications by date range', async () => {
      const repo = dataSource.getRepository(Notification);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, created_at: today }),
        NotificationFixtures.createNotification({ user_id: userId, created_at: yesterday }),
        NotificationFixtures.createNotification({ user_id: userId, created_at: lastWeek }),
      ]);

      const fromDate = yesterday.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/v1/notifications?fromDate=${fromDate}&toDate=${toDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should only return notifications for authenticated user', async () => {
      const otherUserId = 999;
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId }),
        NotificationFixtures.createNotification({ user_id: otherUserId }),
      ]);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].userId).toBe(userId);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?page=-1&limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when accessing other user\'s notification', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: 999 })
      );

      const response = await request(app)
        .get(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return notification details', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: userId })
      );

      const response = await request(app)
        .get(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.id).toBe(notification.id);
      expect(response.body.data.notification.title).toBe(notification.title);
    });

    it('should return 400 for invalid notification ID', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: true }),
      ]);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(2);
    });

    it('should return 0 for user with no notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.unreadCount).toBe(0);
    });
  });

  describe('POST /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: userId, is_read: false })
      );

      const response = await request(app)
        .post(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updated = await repo.findOne({ where: { id: notification.id } });
      expect(updated?.is_read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/99999/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when marking other user\'s notification', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: 999 })
      );

      const response = await request(app)
        .post(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/read', () => {
    it('should mark multiple notifications as read', async () => {
      const repo = dataSource.getRepository(Notification);
      const notifications = await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
      ]);

      const notificationIds = notifications.map(n => n.id);

      const response = await request(app)
        .post('/api/v1/notifications/read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updated = await repo.findBy({ id: { $in: notificationIds } as any });
      expect(updated.every(n => n.is_read)).toBe(true);
    });

    it('should return 400 for empty notification IDs', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
      ]);

      const response = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updated = await repo.findBy({ user_id: userId });
      expect(updated.every(n => n.is_read)).toBe(true);
    });

    it('should only mark authenticated user\'s notifications', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save([
        NotificationFixtures.createNotification({ user_id: userId, is_read: false }),
        NotificationFixtures.createNotification({ user_id: 999, is_read: false }),
      ]);

      await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const otherUserNotification = await repo.findOne({ where: { user_id: 999 } });
      expect(otherUserNotification?.is_read).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/:id/archive', () => {
    it('should archive notification', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: userId, is_archived: false })
      );

      const response = await request(app)
        .post(`/api/v1/notifications/${notification.id}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updated = await repo.findOne({ where: { id: notification.id } });
      expect(updated?.is_archived).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: userId })
      );

      const response = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await repo.findOne({ where: { id: notification.id } });
      expect(deleted).toBeNull();
    });

    it('should return 403 when deleting other user\'s notification', async () => {
      const repo = dataSource.getRepository(Notification);
      const notification = await repo.save(
        NotificationFixtures.createNotification({ user_id: 999 })
      );

      const response = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent read operations', async () => {
      const repo = dataSource.getRepository(Notification);
      await repo.save(NotificationFixtures.createBulkNotifications(10, userId));

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/v1/notifications')
            .set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle concurrent mark as read operations', async () => {
      const repo = dataSource.getRepository(Notification);
      const notifications = await repo.save(
        NotificationFixtures.createBulkNotifications(5, userId)
      );

      const requests = notifications.map(n =>
        request(app)
          .post(`/api/v1/notifications/${n.id}/read`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
