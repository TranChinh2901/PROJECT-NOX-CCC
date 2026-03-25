/**
 * DTO: MarkAsReadResponse
 * Response DTOs for marking notifications as read
 */

export interface MarkAsReadResponseDTO {
  success: boolean;
  notificationId: number;
  readAt: string;
}

export interface MarkManyAsReadResponseDTO {
  success: boolean;
  markedCount: number;
  notificationIds: number[];
  readAt: string;
}

export interface MarkAllAsReadResponseDTO {
  success: boolean;
  markedCount: number;
  readAt: string;
}
