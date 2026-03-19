/**
 * Notification Subscription Entity
 * Topic-based subscriptions for users (e.g., subscribe to specific product/category updates)
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '@/modules/users/entity/user.entity';

@Entity('notification_subscriptions')
@Unique('UQ_notification_subscriptions_user_topic', ['user_id', 'topic_type', 'topic_id'])
@Index('IDX_notification_subscriptions_topic_active', ['topic_type', 'topic_id', 'is_active'])
@Index('IDX_notification_subscriptions_user_active', ['user_id', 'is_active'])
@Index('IDX_notification_subscriptions_user_topic_type', ['user_id', 'topic_type'])
@Index('IDX_notification_subscriptions_user_id', ['user_id'])
export class NotificationSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ length: 50 })
  topic_type!: string; // e.g., 'product', 'category', 'brand'

  @Column()
  topic_id!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_notification_subscriptions_user' })
  user?: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
