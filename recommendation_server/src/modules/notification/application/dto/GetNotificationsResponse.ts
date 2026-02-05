/**
 * DTO: GetNotificationsResponse
 * Response DTO for fetching user notifications
 */
import { NotificationResponseDTO } from './CreateNotificationResponse';

export interface GetNotificationsResponseDTO {
  notifications: NotificationResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
}
