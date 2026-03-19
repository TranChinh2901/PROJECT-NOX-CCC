/**
 * Notification Entity
 * Core notification record for tracking all user notifications
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@/modules/users/entity/user.entity';
import {
  NotificationType,
  NotificationPriority,
} from '../enum/notification.enum';
import {
  notificationEnumColumnType,
  notificationJsonColumnType,
} from './column-types';

@Entity('notifications')
@Index('IDX_notifications_user_id', ['user_id'])
@Index('IDX_notifications_user_read_archived_created', ['user_id', 'is_read', 'is_archived', 'created_at'])
@Index('IDX_notifications_user_read_created', ['user_id', 'is_read', 'created_at'])
@Index('IDX_notifications_user_priority_read_created', ['user_id', 'priority', 'is_read', 'created_at'])
@Index('IDX_notifications_user_expires_at', ['user_id', 'expires_at'])
@Index('IDX_notifications_reference', ['reference_type', 'reference_id'])
@Index('IDX_notifications_created_at', ['created_at'])
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({
    type: notificationEnumColumnType,
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type!: NotificationType;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: notificationEnumColumnType,
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority!: NotificationPriority;

  @Column({ type: notificationJsonColumnType, nullable: true })
  data?: Record<string, any>;

  @Column({ length: 500, nullable: true })
  action_url?: string;

  @Column({ length: 255, nullable: true })
  image_url?: string;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'datetime', nullable: true })
  read_at?: Date;

  @Column({ type: 'boolean', default: false })
  is_archived!: boolean;

  @Column({ type: 'datetime', nullable: true })
  archived_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date;

  @Column({ nullable: true })
  reference_id?: number;

  @Column({ length: 50, nullable: true })
  reference_type?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_notifications_user' })
  user?: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
