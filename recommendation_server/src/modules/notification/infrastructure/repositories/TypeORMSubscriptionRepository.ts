/**
 * Infrastructure: TypeORM Subscription Repository
 * Implements ISubscriptionRepository using TypeORM
 */
import { Repository, In } from 'typeorm';
import { ISubscriptionRepository, SubscriptionFilter, PaginatedSubscriptions } from '../../domain/repositories/ISubscriptionRepository';
import { NotificationSubscription } from '../../entity/notification-subscription';
import { AppDataSource } from '@/config/database.config';

export class TypeORMSubscriptionRepository implements ISubscriptionRepository {
  private repository: Repository<NotificationSubscription>;

  constructor() {
    this.repository = AppDataSource.getRepository(NotificationSubscription);
  }

  async findById(id: number): Promise<NotificationSubscription | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserAndTopic(userId: number, topicType: string, topicId: number): Promise<NotificationSubscription | null> {
    return this.repository.findOne({
      where: { user_id: userId, topic_type: topicType, topic_id: topicId },
    });
  }

  async findByUserId(userId: number, isActive?: boolean): Promise<NotificationSubscription[]> {
    const where: any = { user_id: userId };
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    return this.repository.find({ where });
  }

  async findByTopic(topicType: string, topicId: number, isActive?: boolean): Promise<NotificationSubscription[]> {
    const where: any = { topic_type: topicType, topic_id: topicId };
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    return this.repository.find({ where });
  }

  async findActiveByUserId(userId: number): Promise<NotificationSubscription[]> {
    return this.repository.find({
      where: { user_id: userId, is_active: true },
    });
  }

  async findWithFilter(filter: SubscriptionFilter): Promise<PaginatedSubscriptions> {
    const where: any = {};

    if (filter.userId !== undefined) {
      where.user_id = filter.userId;
    }
    if (filter.topicType !== undefined) {
      where.topic_type = filter.topicType;
    }
    if (filter.topicId !== undefined) {
      where.topic_id = filter.topicId;
    }
    if (filter.isActive !== undefined) {
      where.is_active = filter.isActive;
    }

    const [subscriptions, total] = await this.repository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: filter.offset || 0,
      take: filter.limit || 20,
    });

    const hasMore = (filter.offset || 0) + subscriptions.length < total;

    return {
      subscriptions,
      total,
      hasMore,
    };
  }

  async create(
    subscription: Omit<NotificationSubscription, 'id' | 'createdAt'>,
  ): Promise<NotificationSubscription> {
    const entity = this.repository.create(subscription);
    return this.repository.save(entity);
  }

  async update(id: number, updates: Partial<NotificationSubscription>): Promise<boolean> {
    const result = await this.repository.update({ id }, updates);
    return (result.affected || 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected || 0) > 0;
  }

  async deleteByUserAndTopic(userId: number, topicType: string, topicId: number): Promise<boolean> {
    const result = await this.repository.delete({ user_id: userId, topic_type: topicType, topic_id: topicId });
    return (result.affected || 0) > 0;
  }

  async bulkActivate(ids: number[]): Promise<number> {
    const result = await this.repository.update(
      { id: In(ids) },
      { is_active: true },
    );
    return result.affected || 0;
  }

  async bulkDeactivate(ids: number[]): Promise<number> {
    const result = await this.repository.update(
      { id: In(ids) },
      { is_active: false },
    );
    return result.affected || 0;
  }
}
