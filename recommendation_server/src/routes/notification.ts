/**
 * Notification Routes
 * Configures all notification-related API endpoints
 */
import { Router } from 'express';
import NotificationController from '../modules/notification/presentation/NotificationController';
import PreferenceController from '../modules/notification/presentation/PreferenceController';
import AdminNotificationController from '../modules/notification/presentation/AdminNotificationController';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validate.middleware';
import {
  getNotificationsQuerySchema,
  markManyAsReadSchema,
  updatePreferencesSchema,
  channelPreferencesSchema,
  categoryPreferencesSchema,
  quietHoursSchema,
  emailDigestSchema,
  adminSendNotificationSchema,
  adminSendBulkNotificationSchema,
  createTemplateSchema,
  updateTemplateSchema,
  idParamSchema,
} from '../modules/notification/presentation/validation.schema';

const router = Router();

// ========================================
// User Notification Routes (Authenticated)
// ========================================

/**
 * GET /api/v1/notifications
 * Get notifications for the authenticated user
 */
router.get(
  '/',
  requireAuth(),
  validateQuery(getNotificationsQuerySchema),
  NotificationController.getNotifications.bind(NotificationController),
);

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get(
  '/unread-count',
  requireAuth(),
  NotificationController.getUnreadCount.bind(NotificationController),
);

/**
 * GET /api/v1/notifications/:id
 * Get a specific notification
 */
router.get(
  '/:id',
  requireAuth(),
  validateParams(idParamSchema),
  NotificationController.getNotification.bind(NotificationController),
);

/**
 * POST /api/v1/notifications/:id/read
 * Mark a notification as read
 */
router.post(
  '/:id/read',
  requireAuth(),
  validateParams(idParamSchema),
  NotificationController.markAsRead.bind(NotificationController),
);

/**
 * POST /api/v1/notifications/read
 * Mark multiple notifications as read
 */
router.post(
  '/read',
  requireAuth(),
  validateBody(markManyAsReadSchema),
  NotificationController.markManyAsRead.bind(NotificationController),
);

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.post(
  '/read-all',
  requireAuth(),
  NotificationController.markAllAsRead.bind(NotificationController),
);

/**
 * POST /api/v1/notifications/:id/archive
 * Archive a notification
 */
router.post(
  '/:id/archive',
  requireAuth(),
  validateParams(idParamSchema),
  NotificationController.archiveNotification.bind(NotificationController),
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  requireAuth(),
  validateParams(idParamSchema),
  NotificationController.deleteNotification.bind(NotificationController),
);

// ========================================
// Preference Routes (Authenticated)
// ========================================

/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 */
router.get(
  '/preferences',
  requireAuth(),
  PreferenceController.getPreferences.bind(PreferenceController),
);

/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 */
router.put(
  '/preferences',
  requireAuth(),
  validateBody(updatePreferencesSchema),
  PreferenceController.updatePreferences.bind(PreferenceController),
);

/**
 * PUT /api/v1/notifications/preferences/channels
 * Update channel preferences only
 */
router.put(
  '/preferences/channels',
  requireAuth(),
  validateBody(channelPreferencesSchema),
  PreferenceController.updateChannelPreferences.bind(PreferenceController),
);

/**
 * PUT /api/v1/notifications/preferences/categories
 * Update category preferences only
 */
router.put(
  '/preferences/categories',
  requireAuth(),
  validateBody(categoryPreferencesSchema),
  PreferenceController.updateCategoryPreferences.bind(PreferenceController),
);

/**
 * PUT /api/v1/notifications/preferences/quiet-hours
 * Update quiet hours settings
 */
router.put(
  '/preferences/quiet-hours',
  requireAuth(),
  validateBody(quietHoursSchema),
  PreferenceController.updateQuietHours.bind(PreferenceController),
);

/**
 * PUT /api/v1/notifications/preferences/email-digest
 * Update email digest settings
 */
router.put(
  '/preferences/email-digest',
  requireAuth(),
  validateBody(emailDigestSchema),
  PreferenceController.updateEmailDigest.bind(PreferenceController),
);

/**
 * POST /api/v1/notifications/preferences/reset
 * Reset preferences to defaults
 */
router.post(
  '/preferences/reset',
  requireAuth(),
  PreferenceController.resetToDefaults.bind(PreferenceController),
);

export default router;
