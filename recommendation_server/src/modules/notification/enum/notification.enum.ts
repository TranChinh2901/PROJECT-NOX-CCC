/**
 * Notification Module Enums
 */

/**
 * Types of notifications
 */
export enum NotificationType {
  // Order-related
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_REFUNDED = 'order_refunded',

  // Recommendation-related
  PERSONALIZED_RECOMMENDATION = 'personalized_recommendation',
  SIMILAR_PRODUCTS = 'similar_products',
  TRENDING_PRODUCTS = 'trending_products',

  // Promotion-related
  PROMOTION_AVAILABLE = 'promotion_available',
  PROMOTION_EXPIRING = 'promotion_expiring',
  FLASH_SALE = 'flash_sale',

  // Review-related
  REVIEW_PUBLISHED = 'review_published',
  REVIEW_RESPONSE = 'review_response',

  // Cart-related
  CART_ABANDONED = 'cart_abandoned',
  PRICE_DROP = 'price_drop',
  BACK_IN_STOCK = 'back_in_stock',
  LOW_STOCK_ALERT = 'low_stock_alert',

  // Account-related
  WELCOME = 'welcome',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_VERIFIED = 'account_verified',

  // Admin-related
  ADMIN_ALERT = 'admin_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',

  // Generic
  GENERAL = 'general',
}

/**
 * Priority levels for notifications
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Delivery channels for notifications
 */
export enum DeliveryChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
}

/**
 * Delivery status for notification delivery logs
 */
export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRY = 'retry',
}

/**
 * Subscription type for notification preferences
 */
export enum SubscriptionType {
  ORDER_UPDATES = 'order_updates',
  PROMOTIONS = 'promotions',
  RECOMMENDATIONS = 'recommendations',
  REVIEWS = 'reviews',
  PRICE_ALERTS = 'price_alerts',
  NEWSLETTER = 'newsletter',
  SYSTEM_UPDATES = 'system_updates',
}
