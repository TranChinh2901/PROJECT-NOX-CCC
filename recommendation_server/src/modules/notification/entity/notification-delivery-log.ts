/**
 * Notification Delivery Log Entity
 * Tracks delivery status across different channels
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
} from 'typeorm';
import { Notification } from './notification';
import { DeliveryChannel, DeliveryStatus } from '../enum/notification.enum';

@Entity('notification_delivery_logs')
@Index(['notification_id', 'channel'])
@Index(['status', 'retry_count', 'created_at'])
@Index(['channel', 'status', 'created_at'])
@Index(['channel', 'status'])
@Index(['created_at'])
export class NotificationDeliveryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
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

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification?: Notification;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
