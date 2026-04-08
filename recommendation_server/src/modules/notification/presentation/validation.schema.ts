/**
 * Presentation Layer: Validation Schemas
 * Joi validation schemas for notification endpoints
 */
import Joi from 'joi';
import { NotificationType, NotificationPriority } from '../enum/notification.enum';
import { notificationTypeGroupValues } from '../application/notification-type-groups';

// Get notification types and priorities as arrays
const notificationTypes = Object.values(NotificationType);
const notificationPriorities = Object.values(NotificationPriority);

/**
 * Schema: Get notifications query parameters
 */
export const getNotificationsQuerySchema = Joi.object({
  type: Joi.string().valid(...notificationTypes, ...notificationTypeGroupValues).optional(),
  priority: Joi.string().valid(...notificationPriorities).optional(),
  isRead: Joi.string().valid('true', 'false').optional(),
  isArchived: Joi.string().valid('true', 'false').optional(),
  fromDate: Joi.string().isoDate().optional(),
  toDate: Joi.string().isoDate().optional(),
  search: Joi.string().trim().max(255).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
});

/**
 * Schema: Mark many as read body
 */
export const markManyAsReadSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .label('Notification IDs'),
});

/**
 * Schema: Update preferences body
 */
export const updatePreferencesSchema = Joi.object({
  channels: Joi.object({
    inApp: Joi.boolean().optional(),
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
  }).optional(),
  categories: Joi.object({
    orderUpdates: Joi.boolean().optional(),
    promotions: Joi.boolean().optional(),
    recommendations: Joi.boolean().optional(),
    reviews: Joi.boolean().optional(),
    priceAlerts: Joi.boolean().optional(),
    newsletter: Joi.boolean().optional(),
    systemUpdates: Joi.boolean().optional(),
  }).optional(),
  quietHours: Joi.object({
    enabled: Joi.boolean().required(),
    start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  }).optional(),
  emailDigest: Joi.object({
    enabled: Joi.boolean().required(),
    frequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
  }).optional(),
}).min(1); // At least one field must be provided

/**
 * Schema: Channel preferences body
 */
export const channelPreferencesSchema = Joi.object({
  inApp: Joi.boolean().optional(),
  email: Joi.boolean().optional(),
  push: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
}).min(1);

/**
 * Schema: Category preferences body
 */
export const categoryPreferencesSchema = Joi.object({
  orderUpdates: Joi.boolean().optional(),
  promotions: Joi.boolean().optional(),
  recommendations: Joi.boolean().optional(),
  reviews: Joi.boolean().optional(),
  priceAlerts: Joi.boolean().optional(),
  newsletter: Joi.boolean().optional(),
  systemUpdates: Joi.boolean().optional(),
}).min(1);

/**
 * Schema: Quiet hours body
 */
export const quietHoursSchema = Joi.object({
  enabled: Joi.boolean().required(),
  start: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when('enabled', { is: true, then: Joi.required() }),
  end: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .when('enabled', { is: true, then: Joi.required() }),
});

/**
 * Schema: Email digest body
 */
export const emailDigestSchema = Joi.object({
  enabled: Joi.boolean().required(),
  frequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
});

/**
 * Schema: Admin send notification body
 */
export const adminSendNotificationSchema = Joi.object({
  userId: Joi.number().integer().positive().required().label('User ID'),
  type: Joi.string().valid(...notificationTypes).required().label('Notification Type'),
  title: Joi.string().max(255).required().label('Title'),
  message: Joi.string().required().label('Message'),
  priority: Joi.string().valid(...notificationPriorities).default('normal').optional(),
  data: Joi.object().optional(),
  actionUrl: Joi.string().uri().max(500).optional(),
  imageUrl: Joi.string().uri().max(255).optional(),
  expiresAt: Joi.string().isoDate().optional(),
  referenceId: Joi.number().integer().positive().optional(),
  referenceType: Joi.string().max(50).optional(),
});

/**
 * Schema: Admin send bulk notification body
 */
export const adminSendBulkNotificationSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .label('User IDs'),
  type: Joi.string().valid(...notificationTypes).required().label('Notification Type'),
  title: Joi.string().max(255).required().label('Title'),
  message: Joi.string().required().label('Message'),
  priority: Joi.string().valid(...notificationPriorities).default('normal').optional(),
  data: Joi.object().optional(),
  actionUrl: Joi.string().uri().max(500).optional(),
  imageUrl: Joi.string().uri().max(255).optional(),
  expiresAt: Joi.string().isoDate().optional(),
  referenceId: Joi.number().integer().positive().optional(),
  referenceType: Joi.string().max(50).optional(),
});

export const adminBroadcastNotificationSchema = Joi.object({
  type: Joi.string().valid(...notificationTypes).required().label('Notification Type'),
  title: Joi.string().max(255).required().label('Title'),
  message: Joi.string().required().label('Message'),
  priority: Joi.string().valid(...notificationPriorities).default('normal').optional(),
  data: Joi.object().optional(),
  actionUrl: Joi.string().uri().max(500).optional(),
  imageUrl: Joi.string().uri().max(255).optional(),
  expiresAt: Joi.string().isoDate().optional(),
  referenceId: Joi.number().integer().positive().optional(),
  referenceType: Joi.string().max(50).optional(),
});

/**
 * Schema: Admin create template body
 */
export const createTemplateSchema = Joi.object({
  type: Joi.string().valid(...notificationTypes).required().label('Notification Type'),
  name: Joi.string().max(100).required().label('Template Name'),
  titleTemplate: Joi.string().max(255).required().label('Title Template'),
  messageTemplate: Joi.string().required().label('Message Template'),
  emailSubjectTemplate: Joi.string().optional(),
  emailBodyTemplate: Joi.string().optional(),
  defaultData: Joi.object().optional(),
});

/**
 * Schema: Admin update template body
 */
export const updateTemplateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  titleTemplate: Joi.string().max(255).optional(),
  messageTemplate: Joi.string().optional(),
  emailSubjectTemplate: Joi.string().optional(),
  emailBodyTemplate: Joi.string().optional(),
  defaultData: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

/**
 * Schema: ID parameter
 */
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().label('ID'),
});
