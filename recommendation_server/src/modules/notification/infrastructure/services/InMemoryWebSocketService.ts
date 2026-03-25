/**
 * Infrastructure: In-Memory WebSocket Service
 * Implements IWebSocketService for real-time notifications
 * Note: For production, use Socket.IO with Redis adapter for horizontal scaling
 */
import { IWebSocketService, WebSocketConnectionInfo } from '../../domain/services/IWebSocketService';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';

export interface WebSocketEmitter {
  emit(event: string, data: any): void;
  disconnect(): void;
}

/**
 * In-memory WebSocket connection manager
 */
export class InMemoryWebSocketService implements IWebSocketService {
  // Map of userId -> Map of socketId -> socket info
  private connections: Map<number, Map<string, { socket: WebSocketEmitter; info: WebSocketConnectionInfo }>> =
    new Map();

  /**
   * Register a new connection
   */
  registerConnection(userId: number, socketId: string, socket: WebSocketEmitter): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Map());
    }

    this.connections.get(userId)!.set(socketId, {
      socket,
      info: {
        userId,
        socketId,
        connectedAt: new Date(),
      },
    });

    console.log(`WebSocket: User ${userId} connected with socket ${socketId}`);
  }

  /**
   * Remove a connection
   */
  removeConnection(userId: number, socketId: string): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(socketId);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    console.log(`WebSocket: User ${userId} disconnected socket ${socketId}`);
  }

  /**
   * Update last ping time
   */
  updatePing(userId: number, socketId: string): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const conn = userConnections.get(socketId);
      if (conn) {
        conn.info.lastPing = new Date();
      }
    }
  }

  isUserConnected(userId: number): boolean {
    return this.connections.has(userId) && this.connections.get(userId)!.size > 0;
  }

  getUserSockets(userId: number): string[] {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return [];
    return Array.from(userConnections.keys());
  }

  getConnectionInfo(userId: number): WebSocketConnectionInfo[] {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return [];
    return Array.from(userConnections.values()).map(c => c.info);
  }

  async sendToUser(userId: number, notification: NotificationDomain): Promise<boolean> {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return false;
    }

    const notificationData = notification.toJSON();

    for (const [, connection] of userConnections) {
      try {
        connection.socket.emit('notification', notificationData);
      } catch (error) {
        console.error(`Failed to send notification to socket:`, error);
      }
    }

    return true;
  }

  async sendToUsers(
    userIds: number[],
    notification: NotificationDomain,
  ): Promise<Map<number, boolean>> {
    const results = new Map<number, boolean>();

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, notification);
      results.set(userId, success);
    }

    return results;
  }

  async broadcast(notification: NotificationDomain): Promise<void> {
    const notificationData = notification.toJSON();

    for (const [userId, userConnections] of this.connections) {
      for (const [, connection] of userConnections) {
        try {
          connection.socket.emit('notification', notificationData);
        } catch (error) {
          console.error(`Failed to broadcast to user ${userId}:`, error);
        }
      }
    }
  }

  async sendUnreadCount(userId: number, count: number): Promise<boolean> {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return false;
    }

    for (const [, connection] of userConnections) {
      try {
        connection.socket.emit('unread_count', { count });
      } catch (error) {
        console.error(`Failed to send unread count:`, error);
      }
    }

    return true;
  }

  async sendMarkAsReadConfirmation(userId: number, notificationIds: number[]): Promise<boolean> {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return false;
    }

    for (const [, connection] of userConnections) {
      try {
        connection.socket.emit('notifications_read', { notificationIds });
      } catch (error) {
        console.error(`Failed to send read confirmation:`, error);
      }
    }

    return true;
  }

  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  async disconnectUser(userId: number): Promise<void> {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      for (const [socketId, connection] of userConnections) {
        try {
          connection.socket.disconnect();
        } catch (error) {
          console.error(`Failed to disconnect socket ${socketId}:`, error);
        }
      }
      this.connections.delete(userId);
    }
  }

  /**
   * Get all connection statistics
   */
  getStats(): { totalUsers: number; totalConnections: number } {
    let totalConnections = 0;
    for (const userConnections of this.connections.values()) {
      totalConnections += userConnections.size;
    }

    return {
      totalUsers: this.connections.size,
      totalConnections,
    };
  }
}
