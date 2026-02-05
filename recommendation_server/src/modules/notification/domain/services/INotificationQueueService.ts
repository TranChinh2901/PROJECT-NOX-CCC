/**
 * Service Interface: INotificationQueueService
 * Defines the contract for queue operations
 */
import { NotificationDomain } from '../entities/NotificationDomain';
import { DeliveryChannel } from '../../enum/notification.enum';

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, any>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedReason?: string;
}

export interface INotificationQueueService {
  /**
   * Add notification to creation queue
   */
  addCreationJob(
    notification: Omit<NotificationDomain, 'id'>,
    priority?: 'normal' | 'high',
  ): Promise<string>;

  /**
   * Add notification to delivery queue
   */
  addDeliveryJob(
    notificationId: number,
    userId: number,
    channels: DeliveryChannel[],
    priority?: 'normal' | 'high',
  ): Promise<string>;

  /**
   * Add email to retry queue
   */
  addEmailRetryJob(
    notificationId: number,
    email: string,
    attempt: number,
    delayMs?: number,
  ): Promise<string>;

  /**
   * Add bulk notifications to queue
   */
  addBulkCreationJob(
    notifications: Array<Omit<NotificationDomain, 'id'>>,
  ): Promise<string[]>;

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<QueueJob | null>;

  /**
   * Remove a job from queue
   */
  removeJob(jobId: string): Promise<boolean>;

  /**
   * Get queue statistics
   */
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;

  /**
   * Pause queue processing
   */
  pause(): Promise<void>;

  /**
   * Resume queue processing
   */
  resume(): Promise<void>;

  /**
   * Clean completed jobs
   */
  cleanCompleted(olderThanMs?: number): Promise<number>;
}
