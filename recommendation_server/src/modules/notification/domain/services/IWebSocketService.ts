/**
 * Service Interface: IWebSocketService
 * Defines the contract for WebSocket operations
 */
import { NotificationDomain } from '../entities/NotificationDomain';

export interface WebSocketConnectionInfo {
  userId: number;
  socketId: string;
  connectedAt: Date;
  lastPing?: Date;
}

export interface IWebSocketService {
  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: number): boolean;

  /**
   * Get all socket IDs for a user (may have multiple devices)
   */
  getUserSockets(userId: number): string[];

  /**
   * Get connection info for a user
   */
  getConnectionInfo(userId: number): WebSocketConnectionInfo[];

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: number, notification: NotificationDomain): Promise<boolean>;

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: number[], notification: NotificationDomain): Promise<Map<number, boolean>>;

  /**
   * Broadcast notification to all connected users
   */
  broadcast(notification: NotificationDomain): Promise<void>;

  /**
   * Send unread count update to user
   */
  sendUnreadCount(userId: number, count: number): Promise<boolean>;

  /**
   * Send mark as read confirmation
   */
  sendMarkAsReadConfirmation(userId: number, notificationIds: number[]): Promise<boolean>;

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number;

  /**
   * Disconnect all sockets for a user
   */
  disconnectUser(userId: number): Promise<void>;
}
