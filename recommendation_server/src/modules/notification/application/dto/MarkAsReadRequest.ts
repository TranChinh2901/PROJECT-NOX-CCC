/**
 * DTO: MarkAsReadRequest
 * Request DTOs for marking notifications as read
 */

export interface MarkAsReadRequestDTO {
  userId: number;
  notificationId: number;
}

export interface MarkManyAsReadRequestDTO {
  userId: number;
  notificationIds: number[];
}

export interface MarkAllAsReadRequestDTO {
  userId: number;
}
