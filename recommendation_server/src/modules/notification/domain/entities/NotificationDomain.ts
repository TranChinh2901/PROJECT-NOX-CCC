/**
 * Domain Entity: NotificationDomain
 * Pure domain model without infrastructure dependencies.
 * Represents a notification sent to a user.
 */
import { NotificationPriorityVO, NotificationTypeVO, UserId } from '../value-objects';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export interface NotificationProps {
  id?: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  isRead?: boolean;
  readAt?: Date;
  isArchived?: boolean;
  archivedAt?: Date;
  expiresAt?: Date;
  referenceId?: number;
  referenceType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationDomain {
  readonly id?: number;
  readonly userId: UserId;
  readonly type: NotificationTypeVO;
  readonly title: string;
  readonly message: string;
  readonly priority: NotificationPriorityVO;
  readonly data?: Record<string, any>;
  readonly actionUrl?: string;
  readonly imageUrl?: string;
  private _isRead: boolean;
  private _readAt?: Date;
  private _isArchived: boolean;
  private _archivedAt?: Date;
  readonly expiresAt?: Date;
  readonly referenceId?: number;
  readonly referenceType?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = UserId.create(props.userId);
    this.type = NotificationTypeVO.create(props.type);
    this.title = props.title;
    this.message = props.message;
    this.priority = props.priority
      ? NotificationPriorityVO.create(props.priority)
      : NotificationPriorityVO.normal();
    this.data = props.data;
    this.actionUrl = props.actionUrl;
    this.imageUrl = props.imageUrl;
    this._isRead = props.isRead ?? false;
    this._readAt = props.readAt;
    this._isArchived = props.isArchived ?? false;
    this._archivedAt = props.archivedAt;
    this.expiresAt = props.expiresAt;
    this.referenceId = props.referenceId;
    this.referenceType = props.referenceType;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Create a new notification
   */
  static create(props: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt'>): NotificationDomain {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Notification title is required');
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('Notification message is required');
    }
    if (props.title.length > 255) {
      throw new Error('Notification title must be 255 characters or less');
    }

    return new NotificationDomain({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: NotificationProps): NotificationDomain {
    return new NotificationDomain(props);
  }

  // Getters
  get isRead(): boolean {
    return this._isRead;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  get isArchived(): boolean {
    return this._isArchived;
  }

  get archivedAt(): Date | undefined {
    return this._archivedAt;
  }

  /**
   * Mark notification as read
   */
  markAsRead(): void {
    if (this._isRead) {
      return; // Already read
    }
    this._isRead = true;
    this._readAt = new Date();
  }

  /**
   * Mark notification as unread
   */
  markAsUnread(): void {
    this._isRead = false;
    this._readAt = undefined;
  }

  /**
   * Archive the notification
   */
  archive(): void {
    if (this._isArchived) {
      return; // Already archived
    }
    this._isArchived = true;
    this._archivedAt = new Date();
  }

  /**
   * Unarchive the notification
   */
  unarchive(): void {
    this._isArchived = false;
    this._archivedAt = undefined;
  }

  /**
   * Check if notification is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Check if notification requires immediate attention
   */
  isUrgent(): boolean {
    return this.priority.isUrgent();
  }

  /**
   * Check if notification requires high priority delivery
   */
  requiresImmediateDelivery(): boolean {
    return this.priority.requiresImmediateDelivery();
  }

  /**
   * Check if notification should send email
   */
  shouldSendEmail(): boolean {
    return this.type.shouldSendEmail();
  }

  /**
   * Get age of notification in minutes
   */
  getAgeInMinutes(): number {
    const ageMs = Date.now() - this.createdAt.getTime();
    return Math.floor(ageMs / (1000 * 60));
  }

  /**
   * Check if notification is fresh (less than specified minutes old)
   */
  isFresh(maxAgeMinutes: number = 60): boolean {
    return this.getAgeInMinutes() <= maxAgeMinutes;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId.getValue(),
      type: this.type.getValue(),
      title: this.title,
      message: this.message,
      priority: this.priority.getValue(),
      data: this.data,
      actionUrl: this.actionUrl,
      imageUrl: this.imageUrl,
      isRead: this._isRead,
      readAt: this._readAt?.toISOString(),
      isArchived: this._isArchived,
      archivedAt: this._archivedAt?.toISOString(),
      expiresAt: this.expiresAt?.toISOString(),
      referenceId: this.referenceId,
      referenceType: this.referenceType,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.userId.getValue(),
      type: this.type.getValue(),
      title: this.title,
      message: this.message,
      priority: this.priority.getValue(),
      data: this.data,
      action_url: this.actionUrl,
      image_url: this.imageUrl,
      is_read: this._isRead,
      read_at: this._readAt,
      is_archived: this._isArchived,
      archived_at: this._archivedAt,
      expires_at: this.expiresAt,
      reference_id: this.referenceId,
      reference_type: this.referenceType,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
