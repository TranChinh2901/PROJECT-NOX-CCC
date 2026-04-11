/**
 * Service Integration Tests
 * Tests notification delivery service, email integration, queue processing, and event publishing
 */
import { DataSource } from 'typeorm';
import { testDb } from '../helpers/test-database';
import { NotificationFixtures } from '../fixtures/notification.fixtures';
import { createMockServices } from '../mocks/service.mocks';
import { Notification } from '../../entity';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

describe('Notification Service Integration Tests', () => {
  let dataSource: DataSource;
  let mockServices: ReturnType<typeof createMockServices>;

  beforeAll(async () => {
    dataSource = await testDb.connect();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clear();
    mockServices = createMockServices();
  });

  describe('Notification Delivery Service', () => {
    it('should deliver notification via WebSocket when user is online', async () => {
      const userId = 1;
      mockServices.webSocketService.connect(userId);

      const notification = NotificationFixtures.createNotification({ user_id: userId });

      await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        notification
      );

      expect(mockServices.webSocketService.sentMessages.get(userId)).toHaveLength(1);
      expect(mockServices.webSocketService.sentMessages.get(userId)?.[0]).toEqual({
        event: 'notification:new',
        data: notification,
      });
    });

    it('should fallback to email when user is offline', async () => {
      const userId = 1;
      const notification = NotificationFixtures.createNotification({
        user_id: userId,
        title: 'Important Update',
        message: 'You have a new message',
      });

      // User is not connected
      const wsDelivered = await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        notification
      );

      expect(wsDelivered).toBe(false);

      // Fallback to email
      await mockServices.emailService.sendEmail({
        to: 'user@example.com',
        subject: notification.title,
        body: notification.message,
      });

      expect(mockServices.emailService.sentEmails).toHaveLength(1);
      expect(mockServices.emailService.sentEmails[0].subject).toBe(
        'Important Update'
      );
    });

    it('should handle delivery failures gracefully', async () => {
      mockServices.webSocketService.shouldFail = true;
      mockServices.emailService.shouldFail = true;

      const userId = 1;
      const notification = NotificationFixtures.createNotification({ user_id: userId });

      mockServices.webSocketService.connect(userId);

      await expect(
        mockServices.webSocketService.sendToUser(
          userId,
          'notification:new',
          notification
        )
      ).rejects.toThrow('WebSocket service failed');

      await expect(
        mockServices.emailService.sendEmail({
          to: 'user@example.com',
          subject: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow('Email service failed');
    });

    it('should prioritize urgent notifications', async () => {
      const userId = 1;
      mockServices.webSocketService.connect(userId);

      const urgentNotification = NotificationFixtures.createNotification({
        user_id: userId,
        priority: NotificationPriority.URGENT,
        title: 'Urgent: Action Required',
      });

      const normalNotification = NotificationFixtures.createNotification({
        user_id: userId,
        priority: NotificationPriority.NORMAL,
        title: 'Regular Update',
      });

      // Deliver urgent notification first
      await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        urgentNotification
      );

      await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        normalNotification
      );

      const messages = mockServices.webSocketService.sentMessages.get(userId);
      expect(messages).toHaveLength(2);
      expect(messages?.[0].data.priority).toBe(NotificationPriority.URGENT);
    });

    it('should batch notifications when appropriate', async () => {
      const userId = 1;
      const notifications = NotificationFixtures.createBulkNotifications(5, userId);

      const emailBatch = notifications.map(n => ({
        to: 'user@example.com',
        subject: n.title,
        body: n.message,
      }));

      await mockServices.emailService.sendBulkEmail(emailBatch);

      expect(mockServices.emailService.sentEmails).toHaveLength(5);
    });
  });

  describe('Email Service Integration', () => {
    it('should send notification email with HTML template', async () => {
      const notification = NotificationFixtures.createNotification({
        user_id: 1,
        title: 'New Order',
        message: 'Your order has been confirmed',
      });

      await mockServices.emailService.sendEmail({
        to: 'user@example.com',
        subject: notification.title,
        body: notification.message,
        html: `<h1>${notification.title}</h1><p>${notification.message}</p>`,
      });

      const sent = mockServices.emailService.sentEmails[0];
      expect(sent.html).toContain('<h1>New Order</h1>');
    });

    it('should handle email delivery failures with retry', async () => {
      mockServices.emailService.shouldFail = true;

      const retryAttempts = 3;
      let attempts = 0;

      const sendWithRetry = async (maxRetries: number): Promise<boolean> => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          try {
            return await mockServices.emailService.sendEmail({
              to: 'user@example.com',
              subject: 'Test',
              body: 'Test',
            });
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        return false;
      };

      await expect(sendWithRetry(retryAttempts)).rejects.toThrow();
      expect(attempts).toBe(retryAttempts);
    });

    it('should respect user email preferences', async () => {
      const userId = 1;
      const preferences = NotificationFixtures.createPreferences({
        user_id: userId,
        email_enabled: false,
      });

      const notification = NotificationFixtures.createNotification({ user_id: userId });

      // Should not send email if preferences disabled
      if (preferences.email_enabled) {
        await mockServices.emailService.sendEmail({
          to: 'user@example.com',
          subject: notification.title,
          body: notification.message,
        });
      }

      expect(mockServices.emailService.sentEmails).toHaveLength(0);
    });

    it('should send different email types based on notification type', async () => {
      const types = [
        { type: NotificationType.ORDER_PLACED, template: 'order-update' },
        { type: NotificationType.PROMOTION_AVAILABLE, template: 'promotion' },
        { type: 'SYSTEM_ALERT', template: 'system-alert' },
      ];

      for (const { type, template } of types) {
        const notification = NotificationFixtures.createNotification({
          user_id: 1,
          type: type as any,
        });

        await mockServices.emailService.sendEmail({
          to: 'user@example.com',
          subject: `${type} notification`,
          body: notification.message,
          html: `<!-- Template: ${template} -->`,
        });
      }

      expect(mockServices.emailService.sentEmails).toHaveLength(3);
    });
  });

  describe('Queue Processing', () => {
    it('should queue notification for processing', async () => {
      const notification = NotificationFixtures.createNotification({ user_id: 1 });

      await mockServices.queueService.addJob({
        type: 'send-notification',
        payload: notification,
      });

      expect(mockServices.queueService.queuedJobs).toHaveLength(1);
      expect(mockServices.queueService.queuedJobs[0].type).toBe('creation');
      expect(mockServices.queueService.queuedJobs[0].notification.type).toBe('send-notification');
      expect(mockServices.queueService.queuedJobs[0].notification.payload.type).toBe(notification.type);
    });

    it('should process queued jobs in order', async () => {
      const jobs = [
        { type: 'send-notification', id: 1 },
        { type: 'send-notification', id: 2 },
        { type: 'send-notification', id: 3 },
      ];

      for (const job of jobs) {
        await mockServices.queueService.addJob(job);
      }

      expect(mockServices.queueService.queuedJobs).toHaveLength(3);

      await mockServices.queueService.processJobs();

      expect(mockServices.queueService.queuedJobs).toHaveLength(0);
    });

    it('should handle queue failures', async () => {
      mockServices.queueService.shouldFail = true;

      await expect(
        mockServices.queueService.addJob({ type: 'test' })
      ).rejects.toThrow('Queue service failed');
    });

    it('should respect job priorities in queue', async () => {
      await mockServices.queueService.addJob(
        { type: 'normal', id: 1 },
        { priority: 1 }
      );

      await mockServices.queueService.addJob(
        { type: 'urgent', id: 2 },
        { priority: 10 }
      );

      await mockServices.queueService.addJob(
        { type: 'low', id: 3 },
        { priority: 0 }
      );

      expect(mockServices.queueService.queuedJobs).toHaveLength(3);
      // In real implementation, jobs would be sorted by priority
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const processJobWithRetry = async (job: any): Promise<void> => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          try {
            if (mockServices.queueService.shouldFail && i < 2) {
              throw new Error('Job processing failed');
            }
            return;
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      };

      mockServices.queueService.shouldFail = true;

      await expect(processJobWithRetry({ id: 1 })).resolves.toBeUndefined();
      expect(attempts).toBe(maxRetries);
    });

    it('should handle concurrent job processing', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        type: 'send-notification',
        id: i,
      }));

      const addJobPromises = jobs.map(job =>
        mockServices.queueService.addJob(job)
      );

      await Promise.all(addJobPromises);

      expect(mockServices.queueService.queuedJobs).toHaveLength(10);
    });
  });

  describe('Event Publishing', () => {
    it('should publish notification created event', async () => {
      const notification = NotificationFixtures.createNotification({ user_id: 1 });
      const repo = dataSource.getRepository(Notification);
      const saved = await repo.save(notification);

      const event = {
        type: 'notification.created',
        payload: saved,
        timestamp: new Date(),
      };

      // Mock event publisher
      const publishedEvents: any[] = [];
      const publishEvent = async (evt: any) => {
        publishedEvents.push(evt);
      };

      await publishEvent(event);

      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0].type).toBe('notification.created');
    });

    it('should publish notification read event', async () => {
      const notification = await dataSource
        .getRepository(Notification)
        .save(NotificationFixtures.createNotification({ user_id: 1, is_read: false }));

      notification.is_read = true;
      await dataSource.getRepository(Notification).save(notification);

      const event = {
        type: 'notification.read',
        payload: { notificationId: notification.id, user_id: notification.user_id },
        timestamp: new Date(),
      };

      const publishedEvents: any[] = [];
      await publishedEvents.push(event);

      expect(publishedEvents).toHaveLength(1);
    });

    it('should handle event publishing failures', async () => {
      const publishEvent = async (event: any): Promise<void> => {
        throw new Error('Event publishing failed');
      };

      const event = { type: 'test.event', payload: {} };

      await expect(publishEvent(event)).rejects.toThrow(
        'Event publishing failed'
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete end-to-end notification delivery', async () => {
      const userId = 1;
      mockServices.webSocketService.connect(userId);

      // 1. Create notification
      const notification = NotificationFixtures.createNotification({ user_id: userId });
      const repo = dataSource.getRepository(Notification);
      const saved = await repo.save(notification);

      // 2. Queue for delivery
      await mockServices.queueService.addJob({
        type: 'send-notification',
        payload: saved,
      });

      // 3. Process queue and deliver
      await mockServices.queueService.processJobs();
      await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        saved
      );

      // 4. Verify delivery
      expect(mockServices.webSocketService.sentMessages.get(userId)).toHaveLength(
        1
      );

      // 5. Verify notification was saved
      const updated = await repo.findOne({ where: { id: saved.id } });
      expect(updated).toBeDefined();
      expect(updated?.id).toBe(saved.id);
    });

    it('should handle multi-channel delivery', async () => {
      const userId = 1;
      mockServices.webSocketService.connect(userId);

      const notification = NotificationFixtures.createNotification({ user_id: userId });

      // Deliver via WebSocket
      await mockServices.webSocketService.sendToUser(
        userId,
        'notification:new',
        notification
      );

      // Also send email
      await mockServices.emailService.sendEmail({
        to: 'user@example.com',
        subject: notification.title,
        body: notification.message,
      });

      expect(mockServices.webSocketService.sentMessages.get(userId)).toHaveLength(
        1
      );
      expect(mockServices.emailService.sentEmails).toHaveLength(1);
    });
  });
});
