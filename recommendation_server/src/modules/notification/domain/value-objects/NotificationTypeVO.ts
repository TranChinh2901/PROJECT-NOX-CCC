/**
 * Value Object: NotificationTypeVO
 * Represents the type/category of a notification
 */
import { NotificationType, SubscriptionType } from '../../enum/notification.enum';

export class NotificationTypeVO {
  private constructor(private readonly value: NotificationType) {}

  static create(type: NotificationType): NotificationTypeVO {
    if (!Object.values(NotificationType).includes(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }
    return new NotificationTypeVO(type);
  }

  getValue(): NotificationType {
    return this.value;
  }

  /**
   * Check if this notification type is order-related
   */
  isOrderRelated(): boolean {
    return [
      NotificationType.ORDER_PLACED,
      NotificationType.ORDER_CONFIRMED,
      NotificationType.ORDER_SHIPPED,
      NotificationType.ORDER_DELIVERED,
      NotificationType.ORDER_CANCELLED,
      NotificationType.ORDER_REFUNDED,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is recommendation-related
   */
  isRecommendationRelated(): boolean {
    return [
      NotificationType.PERSONALIZED_RECOMMENDATION,
      NotificationType.SIMILAR_PRODUCTS,
      NotificationType.TRENDING_PRODUCTS,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is promotion-related
   */
  isPromotionRelated(): boolean {
    return [
      NotificationType.PROMOTION_AVAILABLE,
      NotificationType.PROMOTION_EXPIRING,
      NotificationType.FLASH_SALE,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is review-related
   */
  isReviewRelated(): boolean {
    return [
      NotificationType.REVIEW_PUBLISHED,
      NotificationType.REVIEW_RESPONSE,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is cart-related
   */
  isCartRelated(): boolean {
    return [
      NotificationType.CART_ABANDONED,
      NotificationType.PRICE_DROP,
      NotificationType.BACK_IN_STOCK,
      NotificationType.LOW_STOCK_ALERT,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is account-related
   */
  isAccountRelated(): boolean {
    return [
      NotificationType.WELCOME,
      NotificationType.PASSWORD_CHANGED,
      NotificationType.ACCOUNT_VERIFIED,
    ].includes(this.value);
  }

  /**
   * Check if this notification type is system-related
   */
  isSystemRelated(): boolean {
    return [
      NotificationType.ADMIN_ALERT,
      NotificationType.SYSTEM_MAINTENANCE,
    ].includes(this.value);
  }

  /**
   * Get the subscription type category for this notification type
   */
  getSubscriptionCategory(): SubscriptionType | null {
    if (this.isOrderRelated()) return SubscriptionType.ORDER_UPDATES;
    if (this.isPromotionRelated()) return SubscriptionType.PROMOTIONS;
    if (this.isRecommendationRelated()) return SubscriptionType.RECOMMENDATIONS;
    if (this.isReviewRelated()) return SubscriptionType.REVIEWS;
    if (this.isCartRelated()) return SubscriptionType.PRICE_ALERTS;
    if (this.isSystemRelated()) return SubscriptionType.SYSTEM_UPDATES;
    return null;
  }

  /**
   * Check if email delivery is recommended for this type
   */
  shouldSendEmail(): boolean {
    return (
      this.isOrderRelated() ||
      this.isAccountRelated() ||
      [
        NotificationType.PROMOTION_EXPIRING,
        NotificationType.CART_ABANDONED,
        NotificationType.PRICE_DROP,
        NotificationType.BACK_IN_STOCK,
      ].includes(this.value)
    );
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationTypeVO): boolean {
    return this.value === other.value;
  }
}
