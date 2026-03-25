/**
 * Use Case: CreateNotificationUseCase
 * Creates a new notification and triggers delivery
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IPreferenceRepository } from '../../domain/repositories/IPreferenceRepository';
import { INotificationDeliveryService } from '../../domain/services/INotificationDeliveryService';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import {
  CreateNotificationRequestDTO,
  CreateBulkNotificationRequestDTO,
} from '../dto/CreateNotificationRequest';
import {
  CreateNotificationResponseDTO,
  CreateBulkNotificationResponseDTO,
  NotificationResponseDTO,
  DeliveryStatusDTO,
} from '../dto/CreateNotificationResponse';
import { DeliveryChannel } from '../../enum/notification.enum';

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly preferenceRepository: IPreferenceRepository,
    private readonly deliveryService: INotificationDeliveryService,
  ) {}

  /**
   * Execute: Create a single notification
   */
  async execute(request: CreateNotificationRequestDTO): Promise<CreateNotificationResponseDTO> {
    // 1. Create domain entity
    const notification = NotificationDomain.create({
      userId: request.userId,
      type: request.type,
      title: request.title,
      message: request.message,
      priority: request.priority,
      data: request.data,
      actionUrl: request.actionUrl,
      imageUrl: request.imageUrl,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      referenceId: request.referenceId,
      referenceType: request.referenceType,
    });

    // 2. Save notification to database
    const savedNotification = await this.notificationRepository.save(notification);

    // 3. Get user preferences
    const preferences = await this.preferenceRepository.getOrCreate(request.userId);

    // 4. Deliver notification through appropriate channels
    const deliveryResults = await this.deliveryService.deliver(
      savedNotification,
      preferences,
      {
        priority: notification.requiresImmediateDelivery() ? 'high' : 'normal',
        retryOnFailure: true,
      },
    );

    // 5. Map to response DTO
    return {
      notification: this.mapToNotificationDTO(savedNotification),
      deliveryStatus: deliveryResults.map(r => ({
        channel: r.channel,
        status: r.status,
        deliveredAt: r.deliveredAt?.toISOString(),
        error: r.error,
      })),
    };
  }

  /**
   * Execute: Create notifications for multiple users (bulk)
   */
  async executeBulk(request: CreateBulkNotificationRequestDTO): Promise<CreateBulkNotificationResponseDTO> {
    const notifications: NotificationDomain[] = [];
    const errors: Array<{ userId: number; error: string }> = [];

    // 1. Create notifications for each user
    for (const userId of request.userIds) {
      try {
        const notification = NotificationDomain.create({
          userId,
          type: request.type,
          title: request.title,
          message: request.message,
          priority: request.priority,
          data: request.data,
          actionUrl: request.actionUrl,
          imageUrl: request.imageUrl,
          expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
          referenceId: request.referenceId,
          referenceType: request.referenceType,
        });
        notifications.push(notification);
      } catch (error) {
        errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 2. Batch save all notifications
    const savedNotifications = await this.notificationRepository.saveMany(notifications);

    // 3. Trigger delivery for each notification (async, don't wait)
    for (const notification of savedNotifications) {
      this.deliverAsync(notification);
    }

    // 4. Return response
    return {
      created: savedNotifications.length,
      failed: errors.length,
      notifications: savedNotifications.map(n => this.mapToNotificationDTO(n)),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Async delivery helper (fire and forget)
   */
  private async deliverAsync(notification: NotificationDomain): Promise<void> {
    try {
      const preferences = await this.preferenceRepository.getOrCreate(
        notification.userId.getValue(),
      );
      await this.deliveryService.deliver(notification, preferences, {
        priority: notification.requiresImmediateDelivery() ? 'high' : 'normal',
        retryOnFailure: true,
      });
    } catch (error) {
      console.error(`Failed to deliver notification ${notification.id}:`, error);
    }
  }

  /**
   * Map domain entity to DTO
   */
  private mapToNotificationDTO(notification: NotificationDomain): NotificationResponseDTO {
    const json = notification.toJSON();
    return {
      id: json.id,
      userId: json.userId,
      type: json.type,
      title: json.title,
      message: json.message,
      priority: json.priority,
      data: json.data,
      actionUrl: json.actionUrl,
      imageUrl: json.imageUrl,
      isRead: json.isRead,
      readAt: json.readAt,
      isArchived: json.isArchived,
      archivedAt: json.archivedAt,
      expiresAt: json.expiresAt,
      referenceId: json.referenceId,
      referenceType: json.referenceType,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
