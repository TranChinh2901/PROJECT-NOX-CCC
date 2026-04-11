/**
 * Unit Tests: MarkAsReadUseCase
 */
import { MarkAsReadUseCase } from '../../../src/modules/notification/application/use-cases/MarkAsReadUseCase';
import { INotificationRepository } from '../../../src/modules/notification/domain/repositories/INotificationRepository';
import { IWebSocketService } from '../../../src/modules/notification/domain/services/IWebSocketService';
import { NotificationDomain } from '../../../src/modules/notification/domain/entities/NotificationDomain';
import { NotificationType } from '../../../src/modules/notification/enum/notification.enum';

// Mock repository
class MockNotificationRepository implements Partial<INotificationRepository> {
  private notifications: Map<number, NotificationDomain> = new Map();
  public markedAsRead: number[] = [];
  public allMarkedAsReadUsers: number[] = [];

  constructor(notifications: NotificationDomain[] = []) {
    notifications.forEach((n, i) => {
      // Simulate having an ID
      (n as any).id = i + 1;
      this.notifications.set(i + 1, n);
    });
  }

  async findById(id: number): Promise<NotificationDomain | null> {
    return this.notifications.get(id) || null;
  }

  async markAsRead(id: number): Promise<boolean> {
    if (this.notifications.has(id)) {
      this.markedAsRead.push(id);
      return true;
    }
    return false;
  }

  async markAllAsRead(userId: number): Promise<number> {
    this.allMarkedAsReadUsers.push(userId);
    let count = 0;
    for (const n of this.notifications.values()) {
      if (n.userId.getValue() === userId && !n.isRead) {
        count++;
      }
    }
    return count;
  }

  async markManyAsRead(ids: number[]): Promise<number> {
    ids.forEach(id => this.markedAsRead.push(id));
    return ids.length;
  }

  async countUnread(userId: number): Promise<number> {
    let count = 0;
    for (const n of this.notifications.values()) {
      if (n.userId.getValue() === userId && !n.isRead) {
        count++;
      }
    }
    return count;
  }
}

// Mock WebSocket service
class MockWebSocketService implements Partial<IWebSocketService> {
  public readConfirmations: Array<{ userId: number; ids: number[] }> = [];
  public unreadCountUpdates: Array<{ userId: number; count: number }> = [];

  isUserConnected(userId: number): boolean {
    return true;
  }

  async sendMarkAsReadConfirmation(userId: number, ids: number[]): Promise<boolean> {
    this.readConfirmations.push({ userId, ids });
    return true;
  }

  async sendUnreadCount(userId: number, count: number): Promise<boolean> {
    this.unreadCountUpdates.push({ userId, count });
    return true;
  }
}

describe('MarkAsReadUseCase', () => {
  let useCase: MarkAsReadUseCase;
  let mockRepo: MockNotificationRepository;
  let mockWs: MockWebSocketService;
  let testNotifications: NotificationDomain[];

  beforeEach(() => {
    testNotifications = [
      NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_PLACED,
        title: 'Order 1',
        message: 'Test',
      }),
      NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_SHIPPED,
        title: 'Order 2',
        message: 'Test',
      }),
      NotificationDomain.create({
        userId: 2,
        type: NotificationType.PROMOTION_AVAILABLE,
        title: 'Promo',
        message: 'Test',
      }),
    ];

    mockRepo = new MockNotificationRepository(testNotifications);
    mockWs = new MockWebSocketService();
    useCase = new MarkAsReadUseCase(
      mockRepo as unknown as INotificationRepository,
      mockWs as unknown as IWebSocketService,
    );
  });

  describe('execute', () => {
    it('should mark notification as read', async () => {
      const result = await useCase.execute({
        userId: 1,
        notificationId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe(1);
      expect(result.readAt).toBeDefined();
      expect(mockRepo.markedAsRead).toContain(1);
    });

    it('should throw error for non-existent notification', async () => {
      await expect(
        useCase.execute({
          userId: 1,
          notificationId: 999,
        }),
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error for notification not belonging to user', async () => {
      await expect(
        useCase.execute({
          userId: 1,
          notificationId: 3, // Belongs to user 2
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should send WebSocket confirmation', async () => {
      await useCase.execute({
        userId: 1,
        notificationId: 1,
      });

      expect(mockWs.readConfirmations).toHaveLength(1);
      expect(mockWs.readConfirmations[0].userId).toBe(1);
      expect(mockWs.readConfirmations[0].ids).toContain(1);
    });

    it('should send updated unread count', async () => {
      await useCase.execute({
        userId: 1,
        notificationId: 1,
      });

      expect(mockWs.unreadCountUpdates).toHaveLength(1);
      expect(mockWs.unreadCountUpdates[0].userId).toBe(1);
    });
  });

  describe('executeMany', () => {
    it('should mark multiple notifications as read', async () => {
      const result = await useCase.executeMany({
        userId: 1,
        notificationIds: [1, 2],
      });

      expect(result.success).toBe(true);
      expect(result.markedCount).toBe(2);
      expect(result.notificationIds).toEqual([1, 2]);
    });

    it('should only mark notifications belonging to user', async () => {
      const result = await useCase.executeMany({
        userId: 1,
        notificationIds: [1, 2, 3], // 3 belongs to user 2
      });

      expect(result.markedCount).toBe(2);
      expect(result.notificationIds).toContain(1);
      expect(result.notificationIds).toContain(2);
      expect(result.notificationIds).not.toContain(3);
    });

    it('should return empty result for no valid notifications', async () => {
      const result = await useCase.executeMany({
        userId: 1,
        notificationIds: [3], // Belongs to user 2
      });

      expect(result.success).toBe(false);
      expect(result.markedCount).toBe(0);
      expect(result.notificationIds).toHaveLength(0);
    });
  });

  describe('executeAll', () => {
    it('should mark all notifications as read', async () => {
      const result = await useCase.executeAll({
        userId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.markedCount).toBeGreaterThanOrEqual(0);
      expect(mockRepo.allMarkedAsReadUsers).toContain(1);
    });

    it('should send zero unread count via WebSocket', async () => {
      await useCase.executeAll({
        userId: 1,
      });

      expect(mockWs.unreadCountUpdates.some(u => u.userId === 1 && u.count === 0)).toBe(true);
    });
  });
});
