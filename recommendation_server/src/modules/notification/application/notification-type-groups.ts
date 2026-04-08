import { NotificationType } from '../enum/notification.enum';

export const NOTIFICATION_TYPE_GROUPS = {
  order: [
    NotificationType.ORDER_PLACED,
    NotificationType.ORDER_CONFIRMED,
    NotificationType.ORDER_SHIPPED,
    NotificationType.ORDER_DELIVERED,
    NotificationType.ORDER_CANCELLED,
    NotificationType.ORDER_REFUNDED,
  ],
  inventory: [
    NotificationType.CART_ABANDONED,
    NotificationType.PRICE_DROP,
    NotificationType.BACK_IN_STOCK,
    NotificationType.LOW_STOCK_ALERT,
    NotificationType.PERSONALIZED_RECOMMENDATION,
    NotificationType.SIMILAR_PRODUCTS,
    NotificationType.TRENDING_PRODUCTS,
  ],
  review: [
    NotificationType.REVIEW_PUBLISHED,
    NotificationType.REVIEW_RESPONSE,
  ],
  user: [
    NotificationType.WELCOME,
    NotificationType.PASSWORD_CHANGED,
    NotificationType.ACCOUNT_VERIFIED,
  ],
  system: [
    NotificationType.ADMIN_ALERT,
    NotificationType.SYSTEM_MAINTENANCE,
    NotificationType.GENERAL,
  ],
  promotion: [
    NotificationType.PROMOTION_AVAILABLE,
    NotificationType.PROMOTION_EXPIRING,
    NotificationType.FLASH_SALE,
  ],
  payment: [NotificationType.ORDER_REFUNDED],
  shipping: [
    NotificationType.ORDER_SHIPPED,
    NotificationType.ORDER_DELIVERED,
  ],
} as const;

export type NotificationTypeGroup = keyof typeof NOTIFICATION_TYPE_GROUPS;

const notificationTypeValues = new Set<string>(Object.values(NotificationType));

export const notificationTypeGroupValues = Object.keys(
  NOTIFICATION_TYPE_GROUPS,
) as NotificationTypeGroup[];

export const resolveNotificationTypesFilter = (
  type?: string,
): NotificationType[] | undefined => {
  if (!type) return undefined;

  if (type in NOTIFICATION_TYPE_GROUPS) {
    return [...NOTIFICATION_TYPE_GROUPS[type as NotificationTypeGroup]];
  }

  if (notificationTypeValues.has(type)) {
    return [type as NotificationType];
  }

  return undefined;
};
