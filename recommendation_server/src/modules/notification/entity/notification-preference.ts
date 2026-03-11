/**
 * Notification Preferences Entity
 * User preferences for notification channels and types
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '@/modules/users/entity/user.entity';
import {
  notificationEnumColumnType,
  notificationTimeColumnType,
} from './column-types';

@Entity('notification_preferences')
@Unique(['user_id'])
@Index(['user_id', 'email_enabled'])
@Index(['user_id', 'in_app_enabled'])
@Index(['user_id', 'quiet_hours_enabled'])
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  user_id!: number;

  // Channel preferences
  @Column({ type: 'boolean', default: true })
  in_app_enabled!: boolean;

  @Column({ type: 'boolean', default: true })
  email_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  push_enabled!: boolean;

  @Column({ type: 'boolean', default: false })
  sms_enabled!: boolean;

  // Category preferences
  @Column({ type: 'boolean', default: true })
  order_updates!: boolean;

  @Column({ type: 'boolean', default: true })
  promotions!: boolean;

  @Column({ type: 'boolean', default: true })
  recommendations!: boolean;

  @Column({ type: 'boolean', default: true })
  reviews!: boolean;

  @Column({ type: 'boolean', default: true })
  price_alerts!: boolean;

  @Column({ type: 'boolean', default: false })
  newsletter!: boolean;

  @Column({ type: 'boolean', default: true })
  system_updates!: boolean;

  // Quiet hours
  @Column({ type: 'boolean', default: false })
  quiet_hours_enabled!: boolean;

  @Column({ type: notificationTimeColumnType, nullable: true })
  quiet_hours_start?: string;

  @Column({ type: notificationTimeColumnType, nullable: true })
  quiet_hours_end?: string;

  // Email digest settings
  @Column({ type: 'boolean', default: false })
  email_digest_enabled!: boolean;

  @Column({
    type: notificationEnumColumnType,
    enum: ['immediate', 'daily', 'weekly'],
    default: 'immediate',
  })
  email_frequency!: 'immediate' | 'daily' | 'weekly';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
