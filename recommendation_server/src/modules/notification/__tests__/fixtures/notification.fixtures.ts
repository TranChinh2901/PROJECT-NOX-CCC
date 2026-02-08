/**
 * Notification Test Fixtures
 * Provides sample data for testing
 */
import { Notification as NotificationEntity } from '../../entity/notification';
import { NotificationPreference as NotificationPreferenceEntity } from '../../entity/notification-preference';
import { NotificationTemplate as NotificationTemplateEntity } from '../../entity/notification-template';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export class NotificationFixtures {
  static createNotification(overrides?: Partial<NotificationEntity>): NotificationEntity {
    const notification = new NotificationEntity();
    notification.user_id = 1;
    notification.type = NotificationType.ORDER_PLACED;
    notification.priority = NotificationPriority.NORMAL;
    notification.title = 'Test Notification';
    notification.message = 'This is a test notification';
    notification.data = { orderId: 123 };
    notification.is_read = false;
    notification.is_archived = false;
    notification.created_at = new Date();
    notification.updated_at = new Date();

    return Object.assign(notification, overrides);
  }

  static createBulkNotifications(count: number, userId: number): NotificationEntity[] {
    return Array.from({ length: count }, (_, i) =>
      this.createNotification({
        user_id: userId,
        title: `Notification ${i + 1}`,
        message: `Test message ${i + 1}`,
        is_read: i % 2 === 0,
      })
    );
  }

  static createPreferences(overrides?: Partial<NotificationPreferenceEntity>): NotificationPreferenceEntity {
    const prefs = new NotificationPreferenceEntity();
    prefs.user_id = 1;
    prefs.email_enabled = true;
    prefs.push_enabled = true;
    prefs.in_app_enabled = true;
    prefs.order_updates = true;
    prefs.promotions = true;
    prefs.newsletter = false;
    prefs.system_updates = true;
    prefs.created_at = new Date();
    prefs.updated_at = new Date();

    return Object.assign(prefs, overrides);
  }

  static createTemplate(overrides?: Partial<NotificationTemplateEntity>): NotificationTemplateEntity {
    const template = new NotificationTemplateEntity();
    template.name = 'order_confirmed';
    template.type = NotificationType.ORDER_CONFIRMED;
    template.title_template = 'Order Confirmed';
    template.message_template = 'Your order {{orderId}} has been confirmed';
    template.default_data = { orderId: '' };
    template.is_active = true;
    template.created_at = new Date();
    template.updated_at = new Date();

    return Object.assign(template, overrides);
  }

  static getNotificationTypes(): NotificationType[] {
    return [
      NotificationType.ORDER_PLACED,
      NotificationType.PROMOTION_AVAILABLE,
      NotificationType.ADMIN_ALERT,
      NotificationType.WELCOME,
    ];
  }

  static getPriorityLevels(): NotificationPriority[] {
    return [
      NotificationPriority.LOW,
      NotificationPriority.NORMAL,
      NotificationPriority.HIGH,
      NotificationPriority.URGENT,
    ];
  }
}
