/**
 * Notification Template Entity
 * Reusable notification templates for different notification types
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '../enum/notification.enum';

@Entity('notification_templates')
@Index(['type', 'is_active'])
@Index(['is_active'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Index()
  type!: NotificationType;

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

  @Column({ type: 'json', nullable: true })
  default_data?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
