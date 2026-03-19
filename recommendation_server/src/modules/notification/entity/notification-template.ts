/**
 * Notification Template Entity
 * Reusable notification templates for different notification types
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '../enum/notification.enum';
import { notificationJsonColumnType } from './column-types';

@Entity('notification_templates')
@Index('IDX_notification_templates_type_active', ['type', 'is_active'])
@Index('IDX_notification_templates_is_active', ['is_active'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({ type: 'simple-enum', enum: ['email', 'sms', 'push', 'in_app'], default: 'in_app' })
  channel!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255 })
  title_template!: string;

  @Column({ type: 'text' })
  message_template!: string;

  @Column({ type: 'text', nullable: true })
  email_subject_template?: string;

  @Column({ type: 'text', nullable: true })
  email_body_template?: string;

  @Column({ type: notificationJsonColumnType, nullable: true })
  default_data?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
