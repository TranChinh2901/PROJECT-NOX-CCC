/**
 * Presentation Layer: Notification Controller
 * Handles HTTP requests for notification operations
 */
import { Request, Response } from 'express';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * Get notifications for the authenticated user
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const useCase = container.getGetUserNotificationsUseCase();

      const result = await useCase.execute({
        userId,
        type: req.query.type as any,
        priority: req.query.priority as any,
        isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
        isArchived: req.query.isArchived !== undefined ? req.query.isArchived === 'true' : undefined,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Notifications retrieved successfully',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting notifications:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get notifications',
      });
    }
  }

  /**
   * GET /api/v1/notifications/:id
   * Get a specific notification
   */
  async getNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw new AppError(
          'Invalid notification ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const notificationRepository = container.getNotificationRepository();
      const notification = await notificationRepository.findById(notificationId);

      if (!notification) {
        throw new AppError(
          'Notification not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND, // Reusing existing error code
        );
      }

      if (notification.userId.getValue() !== userId) {
        throw new AppError(
          'Access denied',
          HttpStatusCode.FORBIDDEN,
          ErrorCode.FORBIDDEN,
        );
      }

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Notification retrieved successfully',
        data: { notification: notification.toJSON() },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get notification',
      });
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const useCase = container.getGetUserNotificationsUseCase();
      const count = await useCase.getUnreadCount(userId);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: count },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting unread count:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get unread count',
      });
    }
  }

  /**
   * POST /api/v1/notifications/:id/read
   * Mark a notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw new AppError(
          'Invalid notification ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const useCase = container.getMarkAsReadUseCase();
      const result = await useCase.execute({
        userId,
        notificationId,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Notification marked as read',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error marking notification as read:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to mark notification as read',
      });
    }
  }

  /**
   * POST /api/v1/notifications/read
   * Mark multiple notifications as read
   */
  async markManyAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new AppError(
          'notificationIds must be a non-empty array',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const useCase = container.getMarkAsReadUseCase();
      const result = await useCase.executeMany({
        userId,
        notificationIds,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Notifications marked as read',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error marking notifications as read:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to mark notifications as read',
      });
    }
  }

  /**
   * POST /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const useCase = container.getMarkAsReadUseCase();
      const result = await useCase.executeAll({ userId });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'All notifications marked as read',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error marking all notifications as read:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * POST /api/v1/notifications/:id/archive
   * Archive a notification
   */
  async archiveNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw new AppError(
          'Invalid notification ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const notificationRepository = container.getNotificationRepository();

      // Verify ownership
      const notification = await notificationRepository.findById(notificationId);
      if (!notification) {
        throw new AppError(
          'Notification not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
        );
      }

      if (notification.userId.getValue() !== userId) {
        throw new AppError(
          'Access denied',
          HttpStatusCode.FORBIDDEN,
          ErrorCode.FORBIDDEN,
        );
      }

      const success = await notificationRepository.archive(notificationId);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: success ? 'Notification archived' : 'Failed to archive notification',
        data: { success, notificationId },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error archiving notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to archive notification',
      });
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a notification
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        throw new AppError(
          'Invalid notification ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const notificationRepository = container.getNotificationRepository();

      // Verify ownership
      const notification = await notificationRepository.findById(notificationId);
      if (!notification) {
        throw new AppError(
          'Notification not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
        );
      }

      if (notification.userId.getValue() !== userId) {
        throw new AppError(
          'Access denied',
          HttpStatusCode.FORBIDDEN,
          ErrorCode.FORBIDDEN,
        );
      }

      const success = await notificationRepository.delete(notificationId);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: success ? 'Notification deleted' : 'Failed to delete notification',
        data: { success, notificationId },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete notification',
      });
    }
  }
}

export default new NotificationController();
