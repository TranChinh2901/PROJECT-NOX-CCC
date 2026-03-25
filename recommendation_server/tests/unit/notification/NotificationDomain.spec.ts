/**
 * Unit Tests: NotificationDomain Entity
 */
import { NotificationDomain } from '../../../src/modules/notification/domain/entities/NotificationDomain';
import { NotificationType, NotificationPriority } from '../../../src/modules/notification/enum/notification.enum';

describe('NotificationDomain', () => {
  describe('create', () => {
    it('should create a notification with valid data', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_PLACED,
        title: 'Order Placed',
        message: 'Your order has been placed successfully',
      });

      expect(notification.userId.getValue()).toBe(1);
      expect(notification.type.getValue()).toBe(NotificationType.ORDER_PLACED);
      expect(notification.title).toBe('Order Placed');
      expect(notification.message).toBe('Your order has been placed successfully');
      expect(notification.isRead).toBe(false);
      expect(notification.isArchived).toBe(false);
    });

    it('should throw error for empty title', () => {
      expect(() => {
        NotificationDomain.create({
          userId: 1,
          type: NotificationType.GENERAL,
          title: '',
          message: 'Test message',
        });
      }).toThrow('Notification title is required');
    });

    it('should throw error for empty message', () => {
      expect(() => {
        NotificationDomain.create({
          userId: 1,
          type: NotificationType.GENERAL,
          title: 'Test Title',
          message: '',
        });
      }).toThrow('Notification message is required');
    });

    it('should throw error for title exceeding 255 characters', () => {
      expect(() => {
        NotificationDomain.create({
          userId: 1,
          type: NotificationType.GENERAL,
          title: 'a'.repeat(256),
          message: 'Test message',
        });
      }).toThrow('Notification title must be 255 characters or less');
    });

    it('should throw error for invalid user ID', () => {
      expect(() => {
        NotificationDomain.create({
          userId: 0,
          type: NotificationType.GENERAL,
          title: 'Test',
          message: 'Test',
        });
      }).toThrow('Invalid user ID');
    });

    it('should create notification with priority', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled',
        priority: NotificationPriority.HIGH,
      });

      expect(notification.priority.getValue()).toBe(NotificationPriority.HIGH);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      });

      expect(notification.isRead).toBe(false);
      notification.markAsRead();
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
    });

    it('should not update readAt if already read', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      });

      notification.markAsRead();
      const firstReadAt = notification.readAt;

      // Wait a bit and mark again
      notification.markAsRead();
      expect(notification.readAt).toBe(firstReadAt);
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      });

      notification.markAsRead();
      expect(notification.isRead).toBe(true);

      notification.markAsUnread();
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeUndefined();
    });
  });

  describe('archive', () => {
    it('should archive notification', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      });

      expect(notification.isArchived).toBe(false);
      notification.archive();
      expect(notification.isArchived).toBe(true);
      expect(notification.archivedAt).toBeDefined();
    });
  });

  describe('isExpired', () => {
    it('should return false if no expiry date', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      });

      expect(notification.isExpired()).toBe(false);
    });

    it('should return true if past expiry date', () => {
      const notification = NotificationDomain.fromPersistence({
        id: 1,
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(notification.isExpired()).toBe(true);
    });

    it('should return false if before expiry date', () => {
      const notification = NotificationDomain.fromPersistence({
        id: 1,
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(notification.isExpired()).toBe(false);
    });
  });

  describe('requiresImmediateDelivery', () => {
    it('should return true for high priority', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
        priority: NotificationPriority.HIGH,
      });

      expect(notification.requiresImmediateDelivery()).toBe(true);
    });

    it('should return true for urgent priority', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
        priority: NotificationPriority.URGENT,
      });

      expect(notification.requiresImmediateDelivery()).toBe(true);
    });

    it('should return false for normal priority', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
        priority: NotificationPriority.NORMAL,
      });

      expect(notification.requiresImmediateDelivery()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_PLACED,
        title: 'Order Placed',
        message: 'Your order has been placed',
        priority: NotificationPriority.NORMAL,
        data: { orderId: 123 },
        actionUrl: '/orders/123',
      });

      const json = notification.toJSON();

      expect(json.userId).toBe(1);
      expect(json.type).toBe(NotificationType.ORDER_PLACED);
      expect(json.title).toBe('Order Placed');
      expect(json.message).toBe('Your order has been placed');
      expect(json.priority).toBe(NotificationPriority.NORMAL);
      expect(json.data).toEqual({ orderId: 123 });
      expect(json.actionUrl).toBe('/orders/123');
      expect(json.isRead).toBe(false);
      expect(json.isArchived).toBe(false);
      expect(json.createdAt).toBeDefined();
    });
  });
});
