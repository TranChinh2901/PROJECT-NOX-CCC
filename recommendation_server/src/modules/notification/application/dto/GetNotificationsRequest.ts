/**
 * DTO: GetNotificationsRequest
 * Request DTO for fetching user notifications
 */
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export interface GetNotificationsRequestDTO {
  userId: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  fromDate?: string; // ISO date string
  toDate?: string; // ISO date string
  page?: number;
  limit?: number;
}
