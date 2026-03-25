/**
 * Use Case: SendNotificationUseCase
 * High-level use case for sending notifications with full workflow
 * (template resolution, preference checking, delivery)
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IPreferenceRepository } from '../../domain/repositories/IPreferenceRepository';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { INotificationDeliveryService } from '../../domain/services/INotificationDeliveryService';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import { NotificationType, NotificationPriority } from '../../enum/notification.enum';

export interface SendNotificationRequest {
  userId: number;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  actionUrl?: string;
  imageUrl?: string;
  referenceId?: number;
  referenceType?: string;
  skipPreferenceCheck?: boolean;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId?: number;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly preferenceRepository: IPreferenceRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly deliveryService: INotificationDeliveryService,
  ) {}

  /**
   * Send a notification using template
   */
  async execute(request: SendNotificationRequest): Promise<SendNotificationResult> {
    try {
      // 1. Check user preferences (unless skipped)
      if (!request.skipPreferenceCheck) {
        const preferences = await this.preferenceRepository.getOrCreate(request.userId);

        // Check if notification type is enabled
        if (!preferences.isNotificationTypeEnabled(request.type)) {
          return {
            success: true,
            skipped: true,
            skipReason: 'Notification type disabled by user preferences',
          };
        }

        // Check if in quiet hours (for non-urgent notifications)
        if (
          preferences.isInQuietHours() &&
          request.priority !== NotificationPriority.URGENT
        ) {
          // Schedule for later instead of sending now
          // For now, we'll still send but this could be enhanced
          console.log(`User ${request.userId} is in quiet hours, notification may be delayed`);
        }
      }

      // 2. Get template and render content
      const rendered = await this.templateRepository.render(request.type, request.data || {});

      if (!rendered) {
        // Use default content if no template found
        console.warn(`No template found for type ${request.type}, using defaults`);
      }

      const title = rendered?.title || this.getDefaultTitle(request.type);
      const message = rendered?.message || this.getDefaultMessage(request.type);

      // 3. Create notification
      const notification = NotificationDomain.create({
        userId: request.userId,
        type: request.type,
        title,
        message,
        priority: request.priority,
        data: request.data,
        actionUrl: request.actionUrl,
        imageUrl: request.imageUrl,
        referenceId: request.referenceId,
        referenceType: request.referenceType,
      });

      // 4. Save notification
      const saved = await this.notificationRepository.save(notification);

      // 5. Trigger delivery
      const preferences = await this.preferenceRepository.getOrCreate(request.userId);
      await this.deliveryService.deliver(saved, preferences, {
        priority: notification.requiresImmediateDelivery() ? 'high' : 'normal',
        retryOnFailure: true,
      });

      return {
        success: true,
        notificationId: saved.id,
      };
    } catch (error) {
      console.error(`Failed to send notification to user ${request.userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMany(
    userIds: number[],
    request: Omit<SendNotificationRequest, 'userId'>,
  ): Promise<Map<number, SendNotificationResult>> {
    const results = new Map<number, SendNotificationResult>();

    // Process in parallel with concurrency limit
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(userId => this.execute({ ...request, userId })),
      );

      batch.forEach((userId, index) => {
        results.set(userId, batchResults[index]);
      });
    }

    return results;
  }

  /**
   * Get default title for notification type
   */
  private getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.ORDER_PLACED]: 'Order Placed',
      [NotificationType.ORDER_CONFIRMED]: 'Order Confirmed',
      [NotificationType.ORDER_SHIPPED]: 'Order Shipped',
      [NotificationType.ORDER_DELIVERED]: 'Order Delivered',
      [NotificationType.ORDER_CANCELLED]: 'Order Cancelled',
      [NotificationType.ORDER_REFUNDED]: 'Order Refunded',
      [NotificationType.PERSONALIZED_RECOMMENDATION]: 'Recommended For You',
      [NotificationType.SIMILAR_PRODUCTS]: 'Similar Products',
      [NotificationType.TRENDING_PRODUCTS]: 'Trending Now',
      [NotificationType.PROMOTION_AVAILABLE]: 'New Promotion',
      [NotificationType.PROMOTION_EXPIRING]: 'Promotion Expiring',
      [NotificationType.FLASH_SALE]: 'Flash Sale',
      [NotificationType.REVIEW_PUBLISHED]: 'Review Published',
      [NotificationType.REVIEW_RESPONSE]: 'Response to Your Review',
      [NotificationType.CART_ABANDONED]: 'Items in Your Cart',
      [NotificationType.PRICE_DROP]: 'Price Drop Alert',
      [NotificationType.BACK_IN_STOCK]: 'Back in Stock',
      [NotificationType.LOW_STOCK_ALERT]: 'Low Stock Alert',
      [NotificationType.WELCOME]: 'Welcome!',
      [NotificationType.PASSWORD_CHANGED]: 'Password Changed',
      [NotificationType.ACCOUNT_VERIFIED]: 'Account Verified',
      [NotificationType.ADMIN_ALERT]: 'Admin Alert',
      [NotificationType.SYSTEM_MAINTENANCE]: 'System Maintenance',
      [NotificationType.GENERAL]: 'Notification',
    };
    return titles[type] || 'Notification';
  }

  /**
   * Get default message for notification type
   */
  private getDefaultMessage(type: NotificationType): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.ORDER_PLACED]: 'Your order has been placed successfully.',
      [NotificationType.ORDER_CONFIRMED]: 'Your order has been confirmed.',
      [NotificationType.ORDER_SHIPPED]: 'Your order is on its way!',
      [NotificationType.ORDER_DELIVERED]: 'Your order has been delivered.',
      [NotificationType.ORDER_CANCELLED]: 'Your order has been cancelled.',
      [NotificationType.ORDER_REFUNDED]: 'Your refund has been processed.',
      [NotificationType.PERSONALIZED_RECOMMENDATION]: 'Check out these products we think you will love.',
      [NotificationType.SIMILAR_PRODUCTS]: 'You might also like these products.',
      [NotificationType.TRENDING_PRODUCTS]: 'See what is trending right now.',
      [NotificationType.PROMOTION_AVAILABLE]: 'A new promotion is available for you.',
      [NotificationType.PROMOTION_EXPIRING]: 'This promotion is expiring soon!',
      [NotificationType.FLASH_SALE]: 'Limited time offer! Do not miss out.',
      [NotificationType.REVIEW_PUBLISHED]: 'Your review has been published.',
      [NotificationType.REVIEW_RESPONSE]: 'Someone responded to your review.',
      [NotificationType.CART_ABANDONED]: 'You have items waiting in your cart.',
      [NotificationType.PRICE_DROP]: 'A product you viewed just dropped in price!',
      [NotificationType.BACK_IN_STOCK]: 'A product you wanted is back in stock.',
      [NotificationType.LOW_STOCK_ALERT]: 'Hurry! This product is almost sold out.',
      [NotificationType.WELCOME]: 'Welcome to our platform!',
      [NotificationType.PASSWORD_CHANGED]: 'Your password has been changed successfully.',
      [NotificationType.ACCOUNT_VERIFIED]: 'Your account has been verified.',
      [NotificationType.ADMIN_ALERT]: 'Important admin notification.',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Scheduled system maintenance.',
      [NotificationType.GENERAL]: 'You have a new notification.',
    };
    return messages[type] || 'You have a new notification.';
  }
}
