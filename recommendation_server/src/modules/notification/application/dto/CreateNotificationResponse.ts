/**
 * DTO: CreateNotificationResponse
 * Response DTO for notification creation
 */
import { DeliveryChannel, DeliveryStatus } from '../../enum/notification.enum';

export interface NotificationResponseDTO {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  expiresAt?: string;
  referenceId?: number;
  referenceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStatusDTO {
  channel: DeliveryChannel;
  status: DeliveryStatus;
  deliveredAt?: string;
  error?: string;
}

export interface CreateNotificationResponseDTO {
  notification: NotificationResponseDTO;
  deliveryStatus: DeliveryStatusDTO[];
}

export interface CreateBulkNotificationResponseDTO {
  created: number;
  failed: number;
  notifications: NotificationResponseDTO[];
  errors?: Array<{ userId: number; error: string }>;
}
