/**
 * Notification Batch Job Entity
 * Tracks batch notification jobs for tracking and monitoring
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { notificationJsonColumnType } from './column-types';

export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type BatchJobType = 'broadcast' | 'scheduled' | 'triggered' | 'campaign';

@Entity('notification_batch_jobs')
export class NotificationBatchJob {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  job_name!: string;

  @Column({ length: 50 })
  job_type!: BatchJobType;

  @Column({ type: 'int', default: 0 })
  total_notifications!: number;

  @Column({ type: 'int', default: 0 })
  sent_count!: number;

  @Column({ type: 'int', default: 0 })
  failed_count!: number;

  @Column({ length: 20, default: 'pending' })
  status!: BatchJobStatus;

  @Column({ type: 'datetime', nullable: true })
  started_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at?: Date;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: notificationJsonColumnType, nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
