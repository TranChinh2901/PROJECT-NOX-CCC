/**
 * Notification Test Fixtures
 * Provides sample data for testing
 */
import { NotificationEntity } from '../../entity/NotificationEntity';
import { NotificationPreferencesEntity } from '../../entity/NotificationPreferencesEntity';
import { NotificationTemplateEntity } from '../../entity/NotificationTemplateEntity';
import { NotificationType } from '../../enum/NotificationType';
import { NotificationPriority } from '../../enum/NotificationPriority';
import { DeliveryStatus } from '../../enum/DeliveryStatus';

export class NotificationFixtures {
  static createNotification(overrides?: Partial<NotificationEntity>): NotificationEntity {
    const notification = new NotificationEntity();
    notification.userId = 1;
    notification.type = NotificationType.ORDER_UPDATE;
    notification.priority = NotificationPriority.MEDIUM;
    notification.title = 'Test Notification';
    notification.message = 'This is a test notification';
    notification.data = { orderId: 123 };
    notification.isRead = false;
    notification.isArchived = false;
    notification.deliveryStatus = DeliveryStatus.PENDING;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();

    return Object.assign(notification, overrides);
  }

  static createBulkNotifications(count: number, userId: number): NotificationEntity[] {
    return Array.from({ length: count }, (_, i) =>
      this.createNotification({
        userId,
        title: `Notification ${i + 1}`,
        message: `Test message ${i + 1}`,
        isRead: i % 2 === 0,
      })
    );
  }

  static createPreferences(overrides?: Partial<NotificationPreferencesEntity>): NotificationPreferencesEntity {
    const prefs = new NotificationPreferencesEntity();
    prefs.userId = 1;
    prefs.emailEnabled = true;
    prefs.pushEnabled = true;
    prefs.inAppEnabled = true;
    prefs.orderUpdates = true;
    prefs.promotions = true;
    prefs.newsletters = false;
    prefs.systemAlerts = true;
    prefs.createdAt = new Date();
    prefs.updatedAt = new Date();

    return Object.assign(prefs, overrides);
  }

  static createTemplate(overrides?: Partial<NotificationTemplateEntity>): NotificationTemplateEntity {
    const template = new NotificationTemplateEntity();
    template.name = 'order_confirmed';
    template.type = NotificationType.ORDER_UPDATE;
    template.subject = 'Order Confirmed';
    template.bodyTemplate = 'Your order {{orderId}} has been confirmed';
    template.variables = ['orderId'];
    template.isActive = true;
    template.createdAt = new Date();
    template.updatedAt = new Date();

    return Object.assign(template, overrides);
  }

  static getNotificationTypes(): NotificationType[] {
    return [
      NotificationType.ORDER_UPDATE,
      NotificationType.PROMOTION,
      NotificationType.SYSTEM_ALERT,
      NotificationType.NEWSLETTER,
    ];
  }

  static getPriorityLevels(): NotificationPriority[] {
    return [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM,
      NotificationPriority.HIGH,
      NotificationPriority.URGENT,
    ];
  }
}
