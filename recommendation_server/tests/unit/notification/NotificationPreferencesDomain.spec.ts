/**
 * Unit Tests: NotificationPreferencesDomain Entity
 */
import { NotificationPreferencesDomain } from '../../../src/modules/notification/domain/entities/NotificationPreferencesDomain';
import { NotificationType, DeliveryChannel } from '../../../src/modules/notification/enum/notification.enum';

describe('NotificationPreferencesDomain', () => {
  describe('createDefault', () => {
    it('should create default preferences', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      expect(prefs.userId.getValue()).toBe(1);
      expect(prefs.inAppEnabled).toBe(true);
      expect(prefs.emailEnabled).toBe(true);
      expect(prefs.pushEnabled).toBe(false);
      expect(prefs.smsEnabled).toBe(false);
      expect(prefs.orderUpdates).toBe(true);
      expect(prefs.promotions).toBe(true);
      expect(prefs.recommendations).toBe(true);
      expect(prefs.reviews).toBe(true);
      expect(prefs.priceAlerts).toBe(true);
      expect(prefs.newsletter).toBe(false);
      expect(prefs.systemUpdates).toBe(true);
      expect(prefs.quietHoursEnabled).toBe(false);
      expect(prefs.emailDigestEnabled).toBe(false);
      expect(prefs.emailFrequency).toBe('immediate');
    });
  });

  describe('updateChannelPreferences', () => {
    it('should update channel preferences', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      prefs.updateChannelPreferences({
        pushEnabled: true,
        smsEnabled: true,
        emailEnabled: false,
      });

      expect(prefs.pushEnabled).toBe(true);
      expect(prefs.smsEnabled).toBe(true);
      expect(prefs.emailEnabled).toBe(false);
      expect(prefs.inAppEnabled).toBe(true); // Unchanged
    });
  });

  describe('updateCategoryPreferences', () => {
    it('should update category preferences', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      prefs.updateCategoryPreferences({
        promotions: false,
        newsletter: true,
      });

      expect(prefs.promotions).toBe(false);
      expect(prefs.newsletter).toBe(true);
      expect(prefs.orderUpdates).toBe(true); // Unchanged
    });
  });

  describe('updateQuietHours', () => {
    it('should enable quiet hours', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      prefs.updateQuietHours(true, '22:00', '07:00');

      expect(prefs.quietHoursEnabled).toBe(true);
      expect(prefs.quietHoursStart).toBe('22:00');
      expect(prefs.quietHoursEnd).toBe('07:00');
    });

    it('should disable quiet hours and clear times', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      prefs.updateQuietHours(true, '22:00', '07:00');
      prefs.updateQuietHours(false);

      expect(prefs.quietHoursEnabled).toBe(false);
      expect(prefs.quietHoursStart).toBeUndefined();
      expect(prefs.quietHoursEnd).toBeUndefined();
    });
  });

  describe('updateEmailDigest', () => {
    it('should update email digest settings', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      prefs.updateEmailDigest(true, 'daily');

      expect(prefs.emailDigestEnabled).toBe(true);
      expect(prefs.emailFrequency).toBe('daily');
    });
  });

  describe('isChannelEnabled', () => {
    it('should check if channel is enabled', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      expect(prefs.isChannelEnabled(DeliveryChannel.IN_APP)).toBe(true);
      expect(prefs.isChannelEnabled(DeliveryChannel.EMAIL)).toBe(true);
      expect(prefs.isChannelEnabled(DeliveryChannel.PUSH)).toBe(false);
      expect(prefs.isChannelEnabled(DeliveryChannel.SMS)).toBe(false);
    });
  });

  describe('isNotificationTypeEnabled', () => {
    it('should return true for order types when orderUpdates is enabled', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      expect(prefs.isNotificationTypeEnabled(NotificationType.ORDER_PLACED)).toBe(true);
      expect(prefs.isNotificationTypeEnabled(NotificationType.ORDER_SHIPPED)).toBe(true);
    });

    it('should return false for order types when orderUpdates is disabled', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      prefs.updateCategoryPreferences({ orderUpdates: false });

      expect(prefs.isNotificationTypeEnabled(NotificationType.ORDER_PLACED)).toBe(false);
      expect(prefs.isNotificationTypeEnabled(NotificationType.ORDER_SHIPPED)).toBe(false);
    });

    it('should return correct value for promotion types', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      expect(prefs.isNotificationTypeEnabled(NotificationType.PROMOTION_AVAILABLE)).toBe(true);

      prefs.updateCategoryPreferences({ promotions: false });
      expect(prefs.isNotificationTypeEnabled(NotificationType.PROMOTION_AVAILABLE)).toBe(false);
    });

    it('should return correct value for recommendation types', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);

      expect(prefs.isNotificationTypeEnabled(NotificationType.PERSONALIZED_RECOMMENDATION)).toBe(
        true,
      );

      prefs.updateCategoryPreferences({ recommendations: false });
      expect(prefs.isNotificationTypeEnabled(NotificationType.PERSONALIZED_RECOMMENDATION)).toBe(
        false,
      );
    });
  });

  describe('getEnabledChannelsForType', () => {
    it('should return enabled channels for enabled type', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      const channels = prefs.getEnabledChannelsForType(NotificationType.ORDER_PLACED);

      expect(channels).toContain(DeliveryChannel.IN_APP);
      expect(channels).toContain(DeliveryChannel.EMAIL);
      expect(channels).not.toContain(DeliveryChannel.PUSH);
      expect(channels).not.toContain(DeliveryChannel.SMS);
    });

    it('should return empty array for disabled type', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      prefs.updateCategoryPreferences({ orderUpdates: false });

      const channels = prefs.getEnabledChannelsForType(NotificationType.ORDER_PLACED);
      expect(channels).toHaveLength(0);
    });
  });

  describe('isInQuietHours', () => {
    it('should return false when quiet hours disabled', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      expect(prefs.isInQuietHours()).toBe(false);
    });

    it('should return false when quiet hours enabled but times not set', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      prefs.updateQuietHours(true);
      expect(prefs.isInQuietHours()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const prefs = NotificationPreferencesDomain.createDefault(1);
      const json = prefs.toJSON();

      expect(json.userId).toBe(1);
      expect(json.channels).toBeDefined();
      expect(json.channels.inApp).toBe(true);
      expect(json.categories).toBeDefined();
      expect(json.categories.orderUpdates).toBe(true);
      expect(json.quietHours).toBeDefined();
      expect(json.emailDigest).toBeDefined();
    });
  });
});
