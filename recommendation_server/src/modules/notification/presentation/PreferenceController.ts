/**
 * Presentation Layer: Preference Controller
 * Handles HTTP requests for notification preferences
 */
import { Request, Response } from 'express';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class PreferenceController {
  /**
   * GET /api/v1/notifications/preferences
   * Get notification preferences for the authenticated user
   */
  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const useCase = container.getUpdatePreferencesUseCase();
      const preferences = await useCase.getPreferences(userId);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Preferences retrieved successfully',
        data: { preferences },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error getting preferences:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get preferences',
      });
    }
  }

  /**
   * PUT /api/v1/notifications/preferences
   * Update notification preferences
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const { channels, categories, quietHours, emailDigest } = req.body;

      const useCase = container.getUpdatePreferencesUseCase();
      const result = await useCase.execute({
        userId,
        channels,
        categories,
        quietHours,
        emailDigest,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: result.updated ? 'Preferences updated successfully' : 'No changes made',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating preferences:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update preferences',
      });
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/channels
   * Update channel preferences only
   */
  async updateChannelPreferences(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const { inApp, email, push, sms } = req.body;

      const useCase = container.getUpdatePreferencesUseCase();
      const result = await useCase.execute({
        userId,
        channels: { inApp, email, push, sms },
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Channel preferences updated',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating channel preferences:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update channel preferences',
      });
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/categories
   * Update category preferences only
   */
  async updateCategoryPreferences(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const categories = req.body;

      const useCase = container.getUpdatePreferencesUseCase();
      const result = await useCase.execute({
        userId,
        categories,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Category preferences updated',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating category preferences:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update category preferences',
      });
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/quiet-hours
   * Update quiet hours settings
   */
  async updateQuietHours(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const { enabled, start, end } = req.body;

      // Validate time format if provided
      if (enabled && start && end) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(start) || !timeRegex.test(end)) {
          throw new AppError(
            'Invalid time format. Use HH:mm format.',
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
          );
        }
      }

      const useCase = container.getUpdatePreferencesUseCase();
      const result = await useCase.execute({
        userId,
        quietHours: { enabled, start, end },
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Quiet hours updated',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating quiet hours:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update quiet hours',
      });
    }
  }

  /**
   * PUT /api/v1/notifications/preferences/email-digest
   * Update email digest settings
   */
  async updateEmailDigest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const { enabled, frequency } = req.body;

      // Validate frequency
      if (frequency && !['immediate', 'daily', 'weekly'].includes(frequency)) {
        throw new AppError(
          'Invalid frequency. Must be immediate, daily, or weekly.',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const useCase = container.getUpdatePreferencesUseCase();
      const result = await useCase.execute({
        userId,
        emailDigest: { enabled, frequency },
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Email digest settings updated',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error updating email digest:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update email digest',
      });
    }
  }

  /**
   * POST /api/v1/notifications/preferences/reset
   * Reset preferences to defaults
   */
  async resetToDefaults(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        );
      }

      const useCase = container.getUpdatePreferencesUseCase();
      const preferences = await useCase.resetToDefaults(userId);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Preferences reset to defaults',
        data: { preferences },
      }).sendResponse(res);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Error resetting preferences:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to reset preferences',
      });
    }
  }
}

export default new PreferenceController();
