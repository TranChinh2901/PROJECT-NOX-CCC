/**
 * Unit Tests: Value Objects
 */
import { NotificationPriorityVO } from '../../../src/modules/notification/domain/value-objects/NotificationPriorityVO';
import { NotificationTypeVO } from '../../../src/modules/notification/domain/value-objects/NotificationTypeVO';
import { DeliveryStatusVO } from '../../../src/modules/notification/domain/value-objects/DeliveryStatusVO';
import { UserId } from '../../../src/modules/notification/domain/value-objects/UserId';
import {
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
  SubscriptionType,
} from '../../../src/modules/notification/enum/notification.enum';

describe('NotificationPriorityVO', () => {
  it('should create valid priority', () => {
    const priority = NotificationPriorityVO.create(NotificationPriority.HIGH);
    expect(priority.getValue()).toBe(NotificationPriority.HIGH);
  });

  it('should identify urgent priority', () => {
    const urgent = NotificationPriorityVO.urgent();
    expect(urgent.isUrgent()).toBe(true);

    const normal = NotificationPriorityVO.normal();
    expect(normal.isUrgent()).toBe(false);
  });

  it('should identify high or above priority', () => {
    expect(NotificationPriorityVO.urgent().isHighOrAbove()).toBe(true);
    expect(NotificationPriorityVO.high().isHighOrAbove()).toBe(true);
    expect(NotificationPriorityVO.normal().isHighOrAbove()).toBe(false);
    expect(NotificationPriorityVO.low().isHighOrAbove()).toBe(false);
  });

  it('should determine immediate delivery requirement', () => {
    expect(NotificationPriorityVO.urgent().requiresImmediateDelivery()).toBe(true);
    expect(NotificationPriorityVO.high().requiresImmediateDelivery()).toBe(true);
    expect(NotificationPriorityVO.normal().requiresImmediateDelivery()).toBe(false);
  });

  it('should compare equality', () => {
    const p1 = NotificationPriorityVO.high();
    const p2 = NotificationPriorityVO.high();
    const p3 = NotificationPriorityVO.normal();

    expect(p1.equals(p2)).toBe(true);
    expect(p1.equals(p3)).toBe(false);
  });
});

describe('NotificationTypeVO', () => {
  it('should create valid type', () => {
    const type = NotificationTypeVO.create(NotificationType.ORDER_PLACED);
    expect(type.getValue()).toBe(NotificationType.ORDER_PLACED);
  });

  it('should identify order-related types', () => {
    const orderType = NotificationTypeVO.create(NotificationType.ORDER_PLACED);
    expect(orderType.isOrderRelated()).toBe(true);

    const promoType = NotificationTypeVO.create(NotificationType.PROMOTION_AVAILABLE);
    expect(promoType.isOrderRelated()).toBe(false);
  });

  it('should identify promotion-related types', () => {
    const promoType = NotificationTypeVO.create(NotificationType.FLASH_SALE);
    expect(promoType.isPromotionRelated()).toBe(true);
  });

  it('should identify recommendation-related types', () => {
    const recType = NotificationTypeVO.create(NotificationType.PERSONALIZED_RECOMMENDATION);
    expect(recType.isRecommendationRelated()).toBe(true);
  });

  it('should get subscription category', () => {
    const orderType = NotificationTypeVO.create(NotificationType.ORDER_SHIPPED);
    expect(orderType.getSubscriptionCategory()).toBe(SubscriptionType.ORDER_UPDATES);

    const promoType = NotificationTypeVO.create(NotificationType.PROMOTION_AVAILABLE);
    expect(promoType.getSubscriptionCategory()).toBe(SubscriptionType.PROMOTIONS);
  });

  it('should determine email delivery', () => {
    const orderType = NotificationTypeVO.create(NotificationType.ORDER_PLACED);
    expect(orderType.shouldSendEmail()).toBe(true);

    const trendingType = NotificationTypeVO.create(NotificationType.TRENDING_PRODUCTS);
    expect(trendingType.shouldSendEmail()).toBe(false);
  });
});

describe('DeliveryStatusVO', () => {
  it('should create valid status', () => {
    const status = DeliveryStatusVO.create(DeliveryStatus.PENDING);
    expect(status.getValue()).toBe(DeliveryStatus.PENDING);
  });

  it('should identify status types', () => {
    expect(DeliveryStatusVO.pending().isPending()).toBe(true);
    expect(DeliveryStatusVO.sent().isSent()).toBe(true);
    expect(DeliveryStatusVO.delivered().isDelivered()).toBe(true);
    expect(DeliveryStatusVO.failed().isFailed()).toBe(true);
    expect(DeliveryStatusVO.retry().isRetry()).toBe(true);
  });

  it('should identify success status', () => {
    expect(DeliveryStatusVO.sent().isSuccess()).toBe(true);
    expect(DeliveryStatusVO.delivered().isSuccess()).toBe(true);
    expect(DeliveryStatusVO.pending().isSuccess()).toBe(false);
    expect(DeliveryStatusVO.failed().isSuccess()).toBe(false);
  });

  it('should identify needs processing', () => {
    expect(DeliveryStatusVO.pending().needsProcessing()).toBe(true);
    expect(DeliveryStatusVO.retry().needsProcessing()).toBe(true);
    expect(DeliveryStatusVO.sent().needsProcessing()).toBe(false);
  });

  it('should identify terminal status', () => {
    expect(DeliveryStatusVO.delivered().isTerminal()).toBe(true);
    expect(DeliveryStatusVO.failed().isTerminal()).toBe(true);
    expect(DeliveryStatusVO.sent().isTerminal()).toBe(false);
  });

  it('should transition to sent', () => {
    const pending = DeliveryStatusVO.pending();
    const sent = pending.transitionToSent();
    expect(sent.isSent()).toBe(true);
  });

  it('should throw on invalid transition to sent', () => {
    const delivered = DeliveryStatusVO.delivered();
    expect(() => delivered.transitionToSent()).toThrow();
  });

  it('should transition to delivered', () => {
    const sent = DeliveryStatusVO.sent();
    const delivered = sent.transitionToDelivered();
    expect(delivered.isDelivered()).toBe(true);
  });

  it('should transition to retry', () => {
    const pending = DeliveryStatusVO.pending();
    const retry = pending.transitionToRetry();
    expect(retry.isRetry()).toBe(true);
  });
});

describe('UserId', () => {
  it('should create valid user ID', () => {
    const userId = UserId.create(123);
    expect(userId.getValue()).toBe(123);
  });

  it('should throw for zero ID', () => {
    expect(() => UserId.create(0)).toThrow('Invalid user ID');
  });

  it('should throw for negative ID', () => {
    expect(() => UserId.create(-1)).toThrow('Invalid user ID');
  });

  it('should throw for non-integer ID', () => {
    expect(() => UserId.create(1.5)).toThrow('Invalid user ID');
  });

  it('should compare equality', () => {
    const id1 = UserId.create(1);
    const id2 = UserId.create(1);
    const id3 = UserId.create(2);

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('should convert to string', () => {
    const userId = UserId.create(123);
    expect(userId.toString()).toBe('123');
  });
});
