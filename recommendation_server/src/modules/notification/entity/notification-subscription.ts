/**
 * Notification Subscription Entity
 * Topic-based subscriptions for users (e.g., subscribe to specific product/category updates)
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '@/modules/users/entity/user.entity';

@Entity('notification_subscriptions')
@Unique(['user_id', 'topic_type', 'topic_id'])
@Index(['topic_type', 'topic_id'])
export class NotificationSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  user_id!: number;

  @Column({ length: 50 })
  topic_type!: string; // e.g., 'product', 'category', 'brand'

  @Column()
  topic_id!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}
