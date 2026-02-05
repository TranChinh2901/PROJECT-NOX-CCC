/**
 * Repository Interface: INotificationRepository
 * Defines the contract for notification persistence.
 */
import { NotificationDomain } from '../entities/NotificationDomain';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export interface NotificationFilter {
  userId: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedNotifications {
  notifications: NotificationDomain[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface INotificationRepository {
  /**
   * Find a notification by ID
   */
  findById(id: number): Promise<NotificationDomain | null>;

  /**
   * Find notifications by user ID with filters
   */
  findByUserId(filter: NotificationFilter): Promise<PaginatedNotifications>;

  /**
   * Find unread notifications for a user
   */
  findUnreadByUserId(userId: number, limit?: number): Promise<NotificationDomain[]>;

  /**
   * Count unread notifications for a user
   */
  countUnread(userId: number): Promise<number>;

  /**
   * Save a notification (create or update)
   */
  save(notification: NotificationDomain): Promise<NotificationDomain>;

  /**
   * Save multiple notifications (batch insert)
   */
  saveMany(notifications: NotificationDomain[]): Promise<NotificationDomain[]>;

  /**
   * Mark a notification as read
   */
  markAsRead(id: number): Promise<boolean>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: number): Promise<number>;

  /**
   * Mark specific notifications as read
   */
  markManyAsRead(ids: number[]): Promise<number>;

  /**
   * Archive a notification
   */
  archive(id: number): Promise<boolean>;

  /**
   * Archive multiple notifications
   */
  archiveMany(ids: number[]): Promise<number>;

  /**
   * Delete a notification
   */
  delete(id: number): Promise<boolean>;

  /**
   * Delete old/expired notifications
   */
  deleteExpired(beforeDate: Date): Promise<number>;

  /**
   * Find notifications by reference (e.g., order_id)
   */
  findByReference(referenceType: string, referenceId: number): Promise<NotificationDomain[]>;
}
