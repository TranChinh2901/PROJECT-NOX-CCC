/**
 * Use Case: MarkAsReadUseCase
 * Marks notifications as read
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IWebSocketService } from '../../domain/services/IWebSocketService';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';
import {
  MarkAsReadRequestDTO,
  MarkManyAsReadRequestDTO,
  MarkAllAsReadRequestDTO,
} from '../dto/MarkAsReadRequest';
import {
  MarkAsReadResponseDTO,
  MarkManyAsReadResponseDTO,
  MarkAllAsReadResponseDTO,
} from '../dto/MarkAsReadResponse';

export class MarkAsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly webSocketService: IWebSocketService,
  ) {}

  /**
   * Mark a single notification as read
   */
  async execute(request: MarkAsReadRequestDTO): Promise<MarkAsReadResponseDTO> {
    // 1. Verify notification belongs to user
    const notification = await this.notificationRepository.findById(request.notificationId);

    if (!notification) {
      throw new AppError(
        'Notification not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.NOTIFICATION_NOT_FOUND,
      );
    }

    if (notification.userId.getValue() !== request.userId) {
      throw new AppError(
        'Unauthorized: notification does not belong to user',
        HttpStatusCode.FORBIDDEN,
        ErrorCode.FORBIDDEN,
      );
    }

    // 2. Mark as read
    const success = await this.notificationRepository.markAsRead(request.notificationId);
    const readAt = new Date();

    // 3. Notify via WebSocket
    if (success && this.webSocketService.isUserConnected(request.userId)) {
      await this.webSocketService.sendMarkAsReadConfirmation(
        request.userId,
        [request.notificationId],
      );

      // Also send updated unread count
      const unreadCount = await this.notificationRepository.countUnread(request.userId);
      await this.webSocketService.sendUnreadCount(request.userId, unreadCount);
    }

    return {
      success,
      notificationId: request.notificationId,
      readAt: readAt.toISOString(),
    };
  }

  /**
   * Mark multiple notifications as read
   */
  async executeMany(request: MarkManyAsReadRequestDTO): Promise<MarkManyAsReadResponseDTO> {
    // 1. Verify notifications belong to user
    const validIds: number[] = [];

    for (const id of request.notificationIds) {
      const notification = await this.notificationRepository.findById(id);
      if (notification && notification.userId.getValue() === request.userId) {
        validIds.push(id);
      }
    }

    if (validIds.length === 0) {
      return {
        success: false,
        markedCount: 0,
        notificationIds: [],
        readAt: new Date().toISOString(),
      };
    }

    // 2. Mark as read
    const markedCount = await this.notificationRepository.markManyAsRead(validIds);
    const readAt = new Date();

    // 3. Notify via WebSocket
    if (markedCount > 0 && this.webSocketService.isUserConnected(request.userId)) {
      await this.webSocketService.sendMarkAsReadConfirmation(request.userId, validIds);

      const unreadCount = await this.notificationRepository.countUnread(request.userId);
      await this.webSocketService.sendUnreadCount(request.userId, unreadCount);
    }

    return {
      success: markedCount > 0,
      markedCount,
      notificationIds: validIds,
      readAt: readAt.toISOString(),
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async executeAll(request: MarkAllAsReadRequestDTO): Promise<MarkAllAsReadResponseDTO> {
    // Mark all as read
    const markedCount = await this.notificationRepository.markAllAsRead(request.userId);
    const readAt = new Date();

    // Notify via WebSocket
    if (markedCount > 0 && this.webSocketService.isUserConnected(request.userId)) {
      await this.webSocketService.sendUnreadCount(request.userId, 0);
    }

    return {
      success: true,
      markedCount,
      readAt: readAt.toISOString(),
    };
  }
}
