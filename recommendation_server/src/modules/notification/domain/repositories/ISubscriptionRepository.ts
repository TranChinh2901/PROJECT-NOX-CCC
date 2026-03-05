/**
 * Repository Interface: ISubscriptionRepository
 * Defines the contract for notification subscription persistence.
 */
import { NotificationSubscription } from '../../entity/notification-subscription';

export interface SubscriptionFilter {
  userId?: number;
  topicType?: string;
  topicId?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaginatedSubscriptions {
  subscriptions: NotificationSubscription[];
  total: number;
  hasMore: boolean;
}

export interface ISubscriptionRepository {
  /**
   * Find subscription by ID
   */
  findById(id: number): Promise<NotificationSubscription | null>;

  /**
   * Find subscription by user and topic
   */
  findByUserAndTopic(userId: number, topicType: string, topicId: number): Promise<NotificationSubscription | null>;

  /**
   * Find subscriptions by user
   */
  findByUserId(userId: number, isActive?: boolean): Promise<NotificationSubscription[]>;

  /**
   * Find subscriptions by topic (for broadcasting)
   */
  findByTopic(topicType: string, topicId: number, isActive?: boolean): Promise<NotificationSubscription[]>;

  /**
   * Find all active subscriptions for a user
   */
  findActiveByUserId(userId: number): Promise<NotificationSubscription[]>;

  /**
   * Find subscriptions with filters
   */
  findWithFilter(filter: SubscriptionFilter): Promise<PaginatedSubscriptions>;

  /**
   * Create a subscription
   */
  create(subscription: Omit<NotificationSubscription, 'id' | 'createdAt'>): Promise<NotificationSubscription>;

  /**
   * Update a subscription
   */
  update(id: number, updates: Partial<NotificationSubscription>): Promise<boolean>;

  /**
   * Delete a subscription
   */
  delete(id: number): Promise<boolean>;

  /**
   * Delete subscription by user and topic
   */
  deleteByUserAndTopic(userId: number, topicType: string, topicId: number): Promise<boolean>;

  /**
   * Bulk activate subscriptions
   */
  bulkActivate(ids: number[]): Promise<number>;

  /**
   * Bulk deactivate subscriptions
   */
  bulkDeactivate(ids: number[]): Promise<number>;
}
