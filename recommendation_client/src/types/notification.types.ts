/**
 * Notification System Type Definitions
 *
 * Defines all TypeScript interfaces and types for the real-time notification system.
 */

export type NotificationType =
  | 'order'           // Order status updates
  | 'inventory'       // Stock alerts
  | 'review'          // New reviews
  | 'user'            // User activity
  | 'system'          // System announcements
  | 'promotion'       // Promotional content
  | 'payment'         // Payment status
  | 'shipping';       // Shipping updates

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  summary?: string;          // Short version for toasts
  icon?: string;             // Custom icon URL
  imageUrl?: string;         // Rich media
  href?: string;             // Click destination
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
  groupId?: string;          // For grouping related notifications
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  title: string;
  notifications: Notification[];
  latestAt: Date;
  unreadCount: number;
}

export interface NotificationFilters {
  status?: NotificationStatus | 'all';
  type?: NotificationType | 'all';
  priority?: NotificationPriority | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: Record<NotificationType, {
    enabled: boolean;
    channels: ('inApp' | 'email' | 'push' | 'sms')[];
    priority: NotificationPriority;
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  frequency: 'realtime' | 'digest_daily' | 'digest_weekly';
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type WebSocketConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  connectionStatus: WebSocketConnectionStatus;
  preferences: NotificationPreferences | null;

  // Pagination
  hasMore: boolean;
  currentPage: number;
  totalCount: number;

  // Actions
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markMultipleAsRead: (ids: string[]) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;

  // Data Fetching
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;

  // WebSocket
  reconnect: () => void;
  disconnect: () => void;
}

// WebSocket Event Types
export enum SocketEventType {
  // Client -> Server
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PING = 'ping',
  MARK_READ = 'mark_read',

  // Server -> Client
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  UNREAD_COUNT = 'unread_count',
  PONG = 'pong',
  ERROR = 'error',
  CONNECTED = 'connected',
}

export interface SubscribePayload {
  channel: 'notifications' | 'all';
  filters?: {
    types?: NotificationType[];
    priority?: NotificationPriority[];
  };
}

export interface SocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

// API Request/Response Types
export interface GetNotificationsParams extends NotificationFilters {
  page?: number;
  limit?: number;
}

export interface MarkMultipleAsReadRequest {
  ids: string[];
}

export interface DeleteMultipleRequest {
  ids: string[];
}

export interface UnreadCountResponse {
  count: number;
}
