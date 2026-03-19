/**
 * Notification Delivery Log Entity
 * Tracks delivery status across different channels
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Notification } from './notification';
import { DeliveryChannel, DeliveryStatus } from '../enum/notification.enum';
import { notificationJsonColumnType } from './column-types';

@Entity('notification_delivery_logs')
@Index('IDX_notification_delivery_logs_notification_id', ['notification_id'])
@Index('IDX_notification_delivery_logs_notification_channel', ['notification_id', 'channel'])
@Index('IDX_notification_delivery_logs_status_retry_created', ['status', 'retry_count', 'created_at'])
@Index('IDX_notification_delivery_logs_channel_status_created', ['channel', 'status', 'created_at'])
@Index('IDX_notification_delivery_logs_channel_status', ['channel', 'status'])
@Index('IDX_notification_delivery_logs_created_at', ['created_at'])
export class NotificationDeliveryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  notification_id!: number;

  @Column({
    type: 'simple-enum',
    enum: DeliveryChannel,
  })
  channel!: DeliveryChannel;

  @Column({
    type: 'simple-enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status!: DeliveryStatus;

  @Column({ type: 'int', default: 1 })
  attempt_number!: number;

  @Column({ type: 'int', default: 0 })
  retry_count!: number;

  @Column({ type: 'datetime', nullable: true })
  next_retry_at!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  sent_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: notificationJsonColumnType, nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Notification, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'notification_id', foreignKeyConstraintName: 'FK_notification_delivery_logs_notification' })
  notification?: Notification;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
