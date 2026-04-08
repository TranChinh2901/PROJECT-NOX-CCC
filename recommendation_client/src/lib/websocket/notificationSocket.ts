/**
 * WebSocket Client for Real-Time Notifications
 *
 * Manages WebSocket connection with authentication, auto-reconnection,
 * heartbeat mechanism, and event handling.
 */

import { mapNotificationFromBackend } from '@/lib/api/notification.api';
import { Notification, SocketMessage } from '@/types/notification.types';

type NotificationReadPayload =
  | string
  | number
  | {
      notificationId?: string | number;
      notificationIds?: Array<string | number>;
    };

type UnreadCountPayload = number | { count?: number; unreadCount?: number };

type BackendSocketNotificationPayload = {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
};

export interface NotificationSocketOptions {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onError?: (error: Error) => void;
  onNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationIds: string[]) => void;
  onUnreadCount?: (count: number) => void;
}

export class NotificationSocket {
  private socket: WebSocket | null = null;
  private options: NotificationSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1s
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  constructor(options: NotificationSocketOptions) {
    this.options = options;
  }

  /**
   * Establish WebSocket connection
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualDisconnect = false;

    try {
      // Append token as query parameter for auth
      const wsUrl = new URL(this.options.url);
      wsUrl.searchParams.set('token', this.options.token);
      wsUrl.pathname = '/ws/notifications';

      this.socket = new WebSocket(wsUrl.toString());

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }

  /**
   * Gracefully disconnect from WebSocket
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.cleanup();
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.options.token = token;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.reconnect();
    }
  }

  /**
   * Get current connection state
   */
  getReadyState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.startHeartbeat();
    this.options.onConnect?.();

    // Subscribe to user notifications
    this.send({
      type: 'subscribe',
      payload: { channel: 'notifications' },
      timestamp: Date.now(),
    });
  }

  private handleClose(event: CloseEvent): void {
    this.cleanup();
    this.options.onDisconnect?.();

    // Don't reconnect if manual disconnect or normal closure
    if (this.isManualDisconnect || event.code === 1000) {
      return;
    }

    this.attemptReconnect();
  }

  private handleError(): void {
    const error = new Error('WebSocket error');
    this.options.onError?.(error);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: SocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'notification':
          this.options.onNotification?.(
            mapNotificationFromBackend(message.payload as BackendSocketNotificationPayload),
          );
          break;

        case 'notification_read':
        case 'notifications_read': {
          const notificationIds = this.normalizeReadPayload(
            message.payload as NotificationReadPayload,
          );
          if (notificationIds.length > 0) {
            this.options.onNotificationRead?.(notificationIds);
          }
          break;
        }

        case 'unread_count':
          this.options.onUnreadCount?.(
            this.normalizeUnreadCount(message.payload as UnreadCountPayload),
          );
          break;

        case 'pong':
          this.handlePong();
          break;

        case 'error':
          this.options.onError?.(new Error(message.payload as string));
          break;

        default:
          // Unknown message type, ignore silently
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.options.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.options.onReconnecting?.();
    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    const jitter = delay * 0.2 * Math.random();

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay + jitter);
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', payload: null, timestamp: Date.now() });

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout, reconnecting...');
          this.socket?.close(4000, 'Heartbeat timeout');
        }, 10000); // 10 second timeout
      }
    }, 30000);
  }

  private handlePong(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private send(message: SocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private normalizeReadPayload(payload: NotificationReadPayload): string[] {
    if (Array.isArray((payload as { notificationIds?: Array<string | number> }).notificationIds)) {
      return ((payload as { notificationIds: Array<string | number> }).notificationIds).map(String);
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'notificationId' in payload &&
      payload.notificationId !== undefined
    ) {
      return [String(payload.notificationId)];
    }

    if (typeof payload === 'string' || typeof payload === 'number') {
      return [String(payload)];
    }

    return [];
  }

  private normalizeUnreadCount(payload: UnreadCountPayload): number {
    if (typeof payload === 'number') {
      return payload;
    }

    if (typeof payload?.count === 'number') {
      return payload.count;
    }

    if (typeof payload?.unreadCount === 'number') {
      return payload.unreadCount;
    }

    return 0;
  }
}
