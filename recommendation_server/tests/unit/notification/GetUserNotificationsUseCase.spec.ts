/**
 * Unit Tests: GetUserNotificationsUseCase
 */
import { GetUserNotificationsUseCase } from '../../../src/modules/notification/application/use-cases/GetUserNotificationsUseCase';
import { INotificationRepository, PaginatedNotifications } from '../../../src/modules/notification/domain/repositories/INotificationRepository';
import { NotificationDomain } from '../../../src/modules/notification/domain/entities/NotificationDomain';
import { NotificationType, NotificationPriority } from '../../../src/modules/notification/enum/notification.enum';

// Mock repository
class MockNotificationRepository implements Partial<INotificationRepository> {
  private notifications: NotificationDomain[] = [];

  constructor(notifications: NotificationDomain[] = []) {
    this.notifications = notifications;
  }

  async findByUserId(): Promise<PaginatedNotifications> {
    return {
      notifications: this.notifications,
      total: this.notifications.length,
      unreadCount: this.notifications.filter(n => !n.isRead).length,
      hasMore: false,
    };
  }

  async findUnreadByUserId(userId: number, limit: number = 10): Promise<NotificationDomain[]> {
    return this.notifications.filter(n => !n.isRead).slice(0, limit);
  }

  async countUnread(userId: number): Promise<number> {
    return this.notifications.filter(n => !n.isRead).length;
  }

  async findById(): Promise<NotificationDomain | null> {
    return null;
  }

  async save(notification: NotificationDomain): Promise<NotificationDomain> {
    return notification;
  }

  async saveMany(notifications: NotificationDomain[]): Promise<NotificationDomain[]> {
    return notifications;
  }

  async markAsRead(): Promise<boolean> {
    return true;
  }

  async markAllAsRead(): Promise<number> {
    return 0;
  }

  async markManyAsRead(): Promise<number> {
    return 0;
  }

  async archive(): Promise<boolean> {
    return true;
  }

  async archiveMany(): Promise<number> {
    return 0;
  }

  async delete(): Promise<boolean> {
    return true;
  }

  async deleteExpired(): Promise<number> {
    return 0;
  }

  async findByReference(): Promise<NotificationDomain[]> {
    return [];
  }
}

describe('GetUserNotificationsUseCase', () => {
  let useCase: GetUserNotificationsUseCase;
  let mockRepo: MockNotificationRepository;
  let testNotifications: NotificationDomain[];

  beforeEach(() => {
    testNotifications = [
      NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_PLACED,
        title: 'Order 1',
        message: 'Your order has been placed',
      }),
      NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_SHIPPED,
        title: 'Order 2',
        message: 'Your order has shipped',
      }),
      NotificationDomain.create({
        userId: 1,
        type: NotificationType.PROMOTION_AVAILABLE,
        title: 'Promo',
        message: 'New promotion available',
      }),
    ];

    mockRepo = new MockNotificationRepository(testNotifications);
    useCase = new GetUserNotificationsUseCase(mockRepo as INotificationRepository);
  });

  describe('execute', () => {
    it('should return paginated notifications', async () => {
      const result = await useCase.execute({
        userId: 1,
        page: 1,
        limit: 20,
      });

      expect(result.notifications).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(3);
      expect(result.unreadCount).toBe(3);
    });

    it('should use default pagination values', async () => {
      const result = await useCase.execute({
        userId: 1,
      });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should limit page size to 100', async () => {
      const result = await useCase.execute({
        userId: 1,
        limit: 200,
      });

      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('getUnread', () => {
    it('should return unread notifications', async () => {
      const result = await useCase.getUnread(1);

      expect(result).toHaveLength(3);
      result.forEach(n => {
        expect(n.isRead).toBe(false);
      });
    });

    it('should respect limit parameter', async () => {
      const result = await useCase.getUnread(1, 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      const count = await useCase.getUnreadCount(1);
      expect(count).toBe(3);
    });
  });
});
