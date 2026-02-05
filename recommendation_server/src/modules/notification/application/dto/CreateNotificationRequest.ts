/**
 * DTO: CreateNotificationRequest
 * Request DTO for creating a new notification
 */
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export interface CreateNotificationRequestDTO {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: string; // ISO date string
  referenceId?: number;
  referenceType?: string;
}

export interface CreateBulkNotificationRequestDTO {
  userIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: string;
  referenceId?: number;
  referenceType?: string;
}
