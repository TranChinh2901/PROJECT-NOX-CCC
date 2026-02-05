/**
 * Unit Tests: InMemoryWebSocketService
 */
import { InMemoryWebSocketService, WebSocketEmitter } from '../../../src/modules/notification/infrastructure/services/InMemoryWebSocketService';
import { NotificationDomain } from '../../../src/modules/notification/domain/entities/NotificationDomain';
import { NotificationType } from '../../../src/modules/notification/enum/notification.enum';

// Mock socket
class MockSocket implements WebSocketEmitter {
  public emittedEvents: Array<{ event: string; data: any }> = [];
  public disconnected = false;

  emit(event: string, data: any): void {
    this.emittedEvents.push({ event, data });
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

describe('InMemoryWebSocketService', () => {
  let service: InMemoryWebSocketService;
  let mockSocket1: MockSocket;
  let mockSocket2: MockSocket;

  beforeEach(() => {
    service = new InMemoryWebSocketService();
    mockSocket1 = new MockSocket();
    mockSocket2 = new MockSocket();
  });

  describe('registerConnection', () => {
    it('should register a connection', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);

      expect(service.isUserConnected(1)).toBe(true);
      expect(service.getUserSockets(1)).toContain('socket-1');
    });

    it('should allow multiple connections per user', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(1, 'socket-2', mockSocket2);

      expect(service.getUserSockets(1)).toHaveLength(2);
      expect(service.getUserSockets(1)).toContain('socket-1');
      expect(service.getUserSockets(1)).toContain('socket-2');
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.removeConnection(1, 'socket-1');

      expect(service.isUserConnected(1)).toBe(false);
    });

    it('should keep other connections when one is removed', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(1, 'socket-2', mockSocket2);
      service.removeConnection(1, 'socket-1');

      expect(service.isUserConnected(1)).toBe(true);
      expect(service.getUserSockets(1)).toContain('socket-2');
      expect(service.getUserSockets(1)).not.toContain('socket-1');
    });
  });

  describe('isUserConnected', () => {
    it('should return false for non-connected user', () => {
      expect(service.isUserConnected(999)).toBe(false);
    });

    it('should return true for connected user', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      expect(service.isUserConnected(1)).toBe(true);
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);

      const info = service.getConnectionInfo(1);
      expect(info).toHaveLength(1);
      expect(info[0].userId).toBe(1);
      expect(info[0].socketId).toBe('socket-1');
      expect(info[0].connectedAt).toBeDefined();
    });

    it('should return empty array for non-connected user', () => {
      const info = service.getConnectionInfo(999);
      expect(info).toHaveLength(0);
    });
  });

  describe('sendToUser', () => {
    it('should send notification to user', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);

      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.ORDER_PLACED,
        title: 'Test',
        message: 'Test message',
      });

      const result = await service.sendToUser(1, notification);

      expect(result).toBe(true);
      expect(mockSocket1.emittedEvents).toHaveLength(1);
      expect(mockSocket1.emittedEvents[0].event).toBe('notification');
    });

    it('should return false for non-connected user', async () => {
      const notification = NotificationDomain.create({
        userId: 999,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test',
      });

      const result = await service.sendToUser(999, notification);
      expect(result).toBe(false);
    });

    it('should send to all user sockets', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(1, 'socket-2', mockSocket2);

      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test',
      });

      await service.sendToUser(1, notification);

      expect(mockSocket1.emittedEvents).toHaveLength(1);
      expect(mockSocket2.emittedEvents).toHaveLength(1);
    });
  });

  describe('sendToUsers', () => {
    it('should send to multiple users', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(2, 'socket-2', mockSocket2);

      const notification = NotificationDomain.create({
        userId: 1,
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test',
      });

      const results = await service.sendToUsers([1, 2], notification);

      expect(results.get(1)).toBe(true);
      expect(results.get(2)).toBe(true);
    });
  });

  describe('sendUnreadCount', () => {
    it('should send unread count to user', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);

      const result = await service.sendUnreadCount(1, 5);

      expect(result).toBe(true);
      expect(mockSocket1.emittedEvents).toHaveLength(1);
      expect(mockSocket1.emittedEvents[0].event).toBe('unread_count');
      expect(mockSocket1.emittedEvents[0].data).toEqual({ count: 5 });
    });
  });

  describe('sendMarkAsReadConfirmation', () => {
    it('should send read confirmation', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);

      const result = await service.sendMarkAsReadConfirmation(1, [1, 2, 3]);

      expect(result).toBe(true);
      expect(mockSocket1.emittedEvents).toHaveLength(1);
      expect(mockSocket1.emittedEvents[0].event).toBe('notifications_read');
      expect(mockSocket1.emittedEvents[0].data).toEqual({ notificationIds: [1, 2, 3] });
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return correct count', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(2, 'socket-2', mockSocket2);

      expect(service.getConnectedUsersCount()).toBe(2);
    });
  });

  describe('disconnectUser', () => {
    it('should disconnect all user sockets', async () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(1, 'socket-2', mockSocket2);

      await service.disconnectUser(1);

      expect(mockSocket1.disconnected).toBe(true);
      expect(mockSocket2.disconnected).toBe(true);
      expect(service.isUserConnected(1)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      service.registerConnection(1, 'socket-1', mockSocket1);
      service.registerConnection(1, 'socket-2', mockSocket2);
      service.registerConnection(2, 'socket-3', new MockSocket());

      const stats = service.getStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.totalConnections).toBe(3);
    });
  });
});
