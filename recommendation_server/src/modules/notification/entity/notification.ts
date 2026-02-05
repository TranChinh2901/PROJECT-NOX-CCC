/**
 * Notification Entity
 * Core notification record for tracking all user notifications
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
import { User } from '@/modules/users/entity/user.entity';
import {
  NotificationType,
  NotificationPriority,
} from '../enum/notification.enum';

@Entity('notifications')
@Index(['user_id', 'is_read', 'created_at'])
@Index(['user_id', 'type', 'created_at'])
@Index(['type', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  user_id!: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type!: NotificationType;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority!: NotificationPriority;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Column({ length: 500, nullable: true })
  action_url?: string;

  @Column({ length: 255, nullable: true })
  image_url?: string;

  @Column({ type: 'boolean', default: false })
  @Index()
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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
