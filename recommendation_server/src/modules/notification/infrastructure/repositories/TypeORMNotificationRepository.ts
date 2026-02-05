/**
 * Infrastructure: TypeORM Notification Repository
 * Implements INotificationRepository using TypeORM
 */
import { Repository, LessThan, MoreThanOrEqual, In, And, Between } from 'typeorm';
import { INotificationRepository, NotificationFilter, PaginatedNotifications } from '../../domain/repositories/INotificationRepository';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import { Notification as NotificationEntity } from '../../entity/notification';
import { AppDataSource } from '@/config/database.config';

export class TypeORMNotificationRepository implements INotificationRepository {
  private repository: Repository<NotificationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(NotificationEntity);
  }

  async findById(id: number): Promise<NotificationDomain | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByUserId(filter: NotificationFilter): Promise<PaginatedNotifications> {
    const where: any = { user_id: filter.userId };

    if (filter.type !== undefined) {
      where.type = filter.type;
    }
    if (filter.priority !== undefined) {
      where.priority = filter.priority;
    }
    if (filter.isRead !== undefined) {
      where.is_read = filter.isRead;
    }
    if (filter.isArchived !== undefined) {
      where.is_archived = filter.isArchived;
    }
    if (filter.fromDate && filter.toDate) {
      where.created_at = Between(filter.fromDate, filter.toDate);
    } else if (filter.fromDate) {
      where.created_at = MoreThanOrEqual(filter.fromDate);
    } else if (filter.toDate) {
      where.created_at = LessThan(filter.toDate);
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: filter.offset || 0,
      take: filter.limit || 20,
    });

    const unreadCount = await this.repository.count({
      where: { user_id: filter.userId, is_read: false, is_archived: false },
    });

    const hasMore = (filter.offset || 0) + entities.length < total;

    return {
      notifications: entities.map(e => this.toDomain(e)),
      total,
      unreadCount,
      hasMore,
    };
  }

  async findUnreadByUserId(userId: number, limit: number = 10): Promise<NotificationDomain[]> {
    const entities = await this.repository.find({
      where: { user_id: userId, is_read: false, is_archived: false },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return entities.map(e => this.toDomain(e));
  }

  async countUnread(userId: number): Promise<number> {
    return this.repository.count({
      where: { user_id: userId, is_read: false, is_archived: false },
    });
  }

  async save(notification: NotificationDomain): Promise<NotificationDomain> {
    const persistence = notification.toPersistence();

    const entity = this.repository.create({
      id: persistence.id,
      user_id: persistence.user_id,
      type: persistence.type,
      title: persistence.title,
      message: persistence.message,
      priority: persistence.priority,
      data: persistence.data,
      action_url: persistence.action_url,
      image_url: persistence.image_url,
      is_read: persistence.is_read,
      read_at: persistence.read_at,
      is_archived: persistence.is_archived,
      archived_at: persistence.archived_at,
      expires_at: persistence.expires_at,
      reference_id: persistence.reference_id,
      reference_type: persistence.reference_type,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async saveMany(notifications: NotificationDomain[]): Promise<NotificationDomain[]> {
    const entities = notifications.map(notification => {
      const persistence = notification.toPersistence();
      return this.repository.create({
        user_id: persistence.user_id,
        type: persistence.type,
        title: persistence.title,
        message: persistence.message,
        priority: persistence.priority,
        data: persistence.data,
        action_url: persistence.action_url,
        image_url: persistence.image_url,
        is_read: persistence.is_read,
        is_archived: persistence.is_archived,
        expires_at: persistence.expires_at,
        reference_id: persistence.reference_id,
        reference_type: persistence.reference_type,
      });
    });

    const saved = await this.repository.save(entities);
    return saved.map(e => this.toDomain(e));
  }

  async markAsRead(id: number): Promise<boolean> {
    const result = await this.repository.update(
      { id },
      { is_read: true, read_at: new Date() },
    );
    return (result.affected || 0) > 0;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.repository.update(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() },
    );
    return result.affected || 0;
  }

  async markManyAsRead(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.repository.update(
      { id: In(ids) },
      { is_read: true, read_at: new Date() },
    );
    return result.affected || 0;
  }

  async archive(id: number): Promise<boolean> {
    const result = await this.repository.update(
      { id },
      { is_archived: true, archived_at: new Date() },
    );
    return (result.affected || 0) > 0;
  }

  async archiveMany(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.repository.update(
      { id: In(ids) },
      { is_archived: true, archived_at: new Date() },
    );
    return result.affected || 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected || 0) > 0;
  }

  async deleteExpired(beforeDate: Date): Promise<number> {
    const result = await this.repository.delete({
      expires_at: LessThan(beforeDate),
    });
    return result.affected || 0;
  }

  async findByReference(referenceType: string, referenceId: number): Promise<NotificationDomain[]> {
    const entities = await this.repository.find({
      where: { reference_type: referenceType, reference_id: referenceId },
      order: { created_at: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  /**
   * Convert TypeORM entity to domain entity
   */
  private toDomain(entity: NotificationEntity): NotificationDomain {
    return NotificationDomain.fromPersistence({
      id: entity.id,
      userId: entity.user_id,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      priority: entity.priority,
      data: entity.data,
      actionUrl: entity.action_url,
      imageUrl: entity.image_url,
      isRead: entity.is_read,
      readAt: entity.read_at,
      isArchived: entity.is_archived,
      archivedAt: entity.archived_at,
      expiresAt: entity.expires_at,
      referenceId: entity.reference_id,
      referenceType: entity.reference_type,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }
}
