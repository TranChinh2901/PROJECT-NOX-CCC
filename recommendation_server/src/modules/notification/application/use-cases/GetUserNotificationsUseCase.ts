/**
 * Use Case: GetUserNotificationsUseCase
 * Retrieves notifications for a user with filtering and pagination
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { GetNotificationsRequestDTO } from '../dto/GetNotificationsRequest';
import { GetNotificationsResponseDTO } from '../dto/GetNotificationsResponse';
import { NotificationResponseDTO } from '../dto/CreateNotificationResponse';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import { resolveNotificationTypesFilter } from '../notification-type-groups';

export class GetUserNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  /**
   * Execute: Get paginated notifications for a user
   */
  async execute(request: GetNotificationsRequestDTO): Promise<GetNotificationsResponseDTO> {
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build filter from request
    const filter = {
      userId: request.userId,
      type: request.type && resolveNotificationTypesFilter(request.type)?.length === 1
        ? resolveNotificationTypesFilter(request.type)?.[0]
        : undefined,
      types: request.types ?? resolveNotificationTypesFilter(request.type),
      priority: request.priority,
      isRead: request.isRead,
      isArchived: request.isArchived ?? false, // Default to non-archived
      fromDate: request.fromDate ? new Date(request.fromDate) : undefined,
      toDate: request.toDate ? new Date(request.toDate) : undefined,
      search: request.search?.trim(),
      limit,
      offset,
    };

    // Fetch notifications with pagination
    const result = await this.notificationRepository.findByUserId(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(result.total / limit);

    return {
      notifications: result.notifications.map(n => this.mapToDTO(n)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasMore: result.hasMore,
      },
      unreadCount: result.unreadCount,
    };
  }

  /**
   * Get unread notifications only
   */
  async getUnread(userId: number, limit: number = 10): Promise<NotificationResponseDTO[]> {
    const notifications = await this.notificationRepository.findUnreadByUserId(userId, limit);
    return notifications.map(n => this.mapToDTO(n));
  }

  /**
   * Get unread count only
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.countUnread(userId);
  }

  /**
   * Map domain entity to DTO
   */
  private mapToDTO(notification: NotificationDomain): NotificationResponseDTO {
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
