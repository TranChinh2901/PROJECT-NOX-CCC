/**
 * Notification Event Publisher
 * Provides a simple interface for other services to send notifications
 */
import { container } from '../di/container';
import { NotificationType, NotificationPriority } from '../enum/notification.enum';

export interface NotificationEvent {
  userId: number;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  actionUrl?: string;
  imageUrl?: string;
  referenceId?: number;
  referenceType?: string;
}

/**
 * Publish a notification event
 * This is the main entry point for other services to send notifications
 */
export async function publishNotification(event: NotificationEvent): Promise<void> {
  try {
    const useCase = container.getSendNotificationUseCase();
    await useCase.execute({
      userId: event.userId,
      type: event.type,
      data: event.data,
      priority: event.priority,
      actionUrl: event.actionUrl,
      imageUrl: event.imageUrl,
      referenceId: event.referenceId,
      referenceType: event.referenceType,
    });
  } catch (error) {
    console.error('Failed to publish notification:', error);
    // Don't throw - notifications should not break the main flow
  }
}

/**
 * Publish notifications to multiple users
 */
export async function publishNotificationToMany(
  userIds: number[],
  event: Omit<NotificationEvent, 'userId'>,
): Promise<void> {
  try {
    const useCase = container.getSendNotificationUseCase();
    await useCase.sendToMany(userIds, {
      type: event.type,
      data: event.data,
      priority: event.priority,
      actionUrl: event.actionUrl,
      imageUrl: event.imageUrl,
      referenceId: event.referenceId,
      referenceType: event.referenceType,
    });
  } catch (error) {
    console.error('Failed to publish bulk notification:', error);
  }
}

// =========================================
// Pre-built Notification Helpers
// =========================================

/**
 * Order Notifications
 */
export const OrderNotifications = {
  async orderPlaced(userId: number, orderId: number, orderTotal: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ORDER_PLACED,
      data: { orderId, orderTotal },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/account/orders/${orderId}`,
      referenceId: orderId,
      referenceType: 'order',
    });
  },

  async orderConfirmed(userId: number, orderId: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ORDER_CONFIRMED,
      data: { orderId },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/account/orders/${orderId}`,
      referenceId: orderId,
      referenceType: 'order',
    });
  },

  async orderShipped(userId: number, orderId: number, trackingNumber?: string): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ORDER_SHIPPED,
      data: { orderId, trackingNumber },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/account/orders/${orderId}`,
      referenceId: orderId,
      referenceType: 'order',
    });
  },

  async orderDelivered(userId: number, orderId: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ORDER_DELIVERED,
      data: { orderId },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/account/orders/${orderId}`,
      referenceId: orderId,
      referenceType: 'order',
    });
  },

  async orderCancelled(userId: number, orderId: number, reason?: string): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ORDER_CANCELLED,
      data: { orderId, reason },
      priority: NotificationPriority.HIGH,
      actionUrl: `/account/orders/${orderId}`,
      referenceId: orderId,
      referenceType: 'order',
    });
  },
};

/**
 * Promotion Notifications
 */
export const PromotionNotifications = {
  async promotionAvailable(
    userId: number,
    promotionId: number,
    promotionName: string,
    discount: string,
  ): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.PROMOTION_AVAILABLE,
      data: { promotionId, promotionName, discount },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/promotions/${promotionId}`,
      referenceId: promotionId,
      referenceType: 'promotion',
    });
  },

  async flashSale(userIds: number[], saleName: string, endTime: string): Promise<void> {
    await publishNotificationToMany(userIds, {
      type: NotificationType.FLASH_SALE,
      data: { saleName, endTime },
      priority: NotificationPriority.HIGH,
      actionUrl: '/flash-sale',
    });
  },
};

/**
 * Cart/Stock Notifications
 */
export const CartNotifications = {
  async cartAbandoned(userId: number, itemCount: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.CART_ABANDONED,
      data: { itemCount },
      priority: NotificationPriority.LOW,
      actionUrl: '/cart',
    });
  },

  async priceDropped(
    userId: number,
    productId: number,
    productName: string,
    oldPrice: number,
    newPrice: number,
  ): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.PRICE_DROP,
      data: { productId, productName, oldPrice, newPrice },
      priority: NotificationPriority.NORMAL,
      actionUrl: `/products/${productId}`,
      referenceId: productId,
      referenceType: 'product',
    });
  },

  async backInStock(userId: number, productId: number, productName: string): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.BACK_IN_STOCK,
      data: { productId, productName },
      priority: NotificationPriority.HIGH,
      actionUrl: `/products/${productId}`,
      referenceId: productId,
      referenceType: 'product',
    });
  },
};

/**
 * Review Notifications
 */
export const ReviewNotifications = {
  async reviewPublished(userId: number, reviewId: number, productId: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.REVIEW_PUBLISHED,
      data: { reviewId, productId },
      priority: NotificationPriority.LOW,
      actionUrl: `/products/${productId}#reviews`,
      referenceId: reviewId,
      referenceType: 'review',
    });
  },

  async reviewResponse(
    userId: number,
    reviewId: number,
    responseFrom: string,
  ): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.REVIEW_RESPONSE,
      data: { reviewId, responseFrom },
      priority: NotificationPriority.NORMAL,
      referenceId: reviewId,
      referenceType: 'review',
    });
  },
};

/**
 * Account Notifications
 */
export const AccountNotifications = {
  async welcome(userId: number, userName: string): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.WELCOME,
      data: { userName },
      priority: NotificationPriority.NORMAL,
      actionUrl: '/profile',
    });
  },

  async passwordChanged(userId: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.PASSWORD_CHANGED,
      data: {},
      priority: NotificationPriority.HIGH,
      actionUrl: '/account/security',
    });
  },

  async accountVerified(userId: number): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      data: {},
      priority: NotificationPriority.NORMAL,
      actionUrl: '/profile',
    });
  },
};

/**
 * Recommendation Notifications
 */
export const RecommendationNotifications = {
  async personalizedRecommendations(
    userId: number,
    productIds: number[],
  ): Promise<void> {
    await publishNotification({
      userId,
      type: NotificationType.PERSONALIZED_RECOMMENDATION,
      data: { productIds },
      priority: NotificationPriority.LOW,
      actionUrl: '/recommendations',
    });
  },
};
