/**
 * Presentation Layer: Admin Notification Controller
 * Handles admin-only notification operations (sending, templates, etc.)
 */
import { Request, Response } from 'express';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class AdminNotificationController {
  /**
   * POST /api/v1/admin/notifications/send
   * Send a notification to a user (admin only)
   */
  async sendNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const {
        userId,
        type,
        title,
        message,
        priority,
        data,
        actionUrl,
        imageUrl,
        expiresAt,
        referenceId,
        referenceType,
      } = req.body;

      if (!userId || !type || !title || !message) {
        throw new AppError(
          'userId, type, title, and message are required',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const useCase = container.getCreateNotificationUseCase();
      const result = await useCase.execute({
        userId,
        type,
        title,
        message,
        priority,
        data,
        actionUrl,
        imageUrl,
        expiresAt,
        referenceId,
        referenceType,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.CREATED,
        message: 'Notification sent successfully',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error sending notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to send notification',
      });
    }
  }

  /**
   * POST /api/v1/admin/notifications/send-bulk
   * Send notifications to multiple users (admin only)
   */
  async sendBulkNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const {
        userIds,
        type,
        title,
        message,
        priority,
        data,
        actionUrl,
        imageUrl,
        expiresAt,
        referenceId,
        referenceType,
      } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError(
          'userIds must be a non-empty array',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      if (!type || !title || !message) {
        throw new AppError(
          'type, title, and message are required',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const useCase = container.getCreateNotificationUseCase();
      const result = await useCase.executeBulk({
        userIds,
        type,
        title,
        message,
        priority,
        data,
        actionUrl,
        imageUrl,
        expiresAt,
        referenceId,
        referenceType,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.CREATED,
        message: 'Bulk notifications sent',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error sending bulk notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to send bulk notification',
      });
    }
  }

  /**
   * POST /api/v1/admin/notifications/broadcast
   * Broadcast notification to all users (admin only)
   */
  async broadcastNotification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { type, title, message, priority, data, actionUrl, imageUrl } = req.body;

      if (!type || !title || !message) {
        throw new AppError(
          'type, title, and message are required',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      // In production, this would fetch all user IDs and queue notifications
      // For now, we'll just return a placeholder response
      console.log('Broadcast notification requested:', { type, title, message });

      return new AppResponse({
        statusCode: HttpStatusCode.ACCEPTED,
        message: 'Broadcast notification queued',
        data: {
          queued: true,
          type,
          title,
          estimatedDeliveryTime: 'Processing...',
        },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error broadcasting notification:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to broadcast notification',
      });
    }
  }

  /**
   * GET /api/v1/admin/notifications/templates
   * Get all notification templates
   */
  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const templateRepository = container.getTemplateRepository();
      const templates = await templateRepository.findAll(activeOnly);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Templates retrieved successfully',
        data: { templates },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting templates:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get templates',
      });
    }
  }

  /**
   * POST /api/v1/admin/notifications/templates
   * Create a new notification template
   */
  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const {
        type,
        name,
        titleTemplate,
        messageTemplate,
        emailSubjectTemplate,
        emailBodyTemplate,
        defaultData,
      } = req.body;

      if (!type || !name || !titleTemplate || !messageTemplate) {
        throw new AppError(
          'type, name, titleTemplate, and messageTemplate are required',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const templateRepository = container.getTemplateRepository();
      const template = await templateRepository.save({
        type,
        name,
        titleTemplate,
        messageTemplate,
        emailSubjectTemplate,
        emailBodyTemplate,
        defaultData,
        isActive: true,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.CREATED,
        message: 'Template created successfully',
        data: { template },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error creating template:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create template',
      });
    }
  }

  /**
   * PUT /api/v1/admin/notifications/templates/:id
   * Update a notification template
   */
  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        throw new AppError(
          'Invalid template ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const templateRepository = container.getTemplateRepository();
      const template = await templateRepository.update(templateId, req.body);

      if (!template) {
        throw new AppError(
          'Template not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
        );
      }

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Template updated successfully',
        data: { template },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating template:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update template',
      });
    }
  }

  /**
   * DELETE /api/v1/admin/notifications/templates/:id
   * Delete a notification template
   */
  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        throw new AppError(
          'Invalid template ID',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.INVALID_PARAMS,
        );
      }

      const templateRepository = container.getTemplateRepository();
      const success = await templateRepository.delete(templateId);

      if (!success) {
        throw new AppError(
          'Template not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
        );
      }

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Template deleted successfully',
        data: { success, templateId },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting template:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete template',
      });
    }
  }

  /**
   * GET /api/v1/admin/notifications/stats
   * Get notification statistics
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const webSocketService = container.getWebSocketService();
      const queueService = container.getQueueService();

      const wsStats = (webSocketService as any).getStats?.() || { totalUsers: 0, totalConnections: 0 };
      const queueStats = await queueService.getQueueStats();

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Statistics retrieved successfully',
        data: {
          websocket: wsStats,
          queue: queueStats,
        },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting stats:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get stats',
      });
    }
  }
}

export default new AdminNotificationController();
