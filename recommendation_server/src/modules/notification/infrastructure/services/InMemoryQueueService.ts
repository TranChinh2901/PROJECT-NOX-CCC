/**
 * Infrastructure: In-Memory Queue Service
 * Implements INotificationQueueService for processing notifications
 * Note: For production, use Bull with Redis for persistence and reliability
 */
import {
  INotificationQueueService,
  QueueJob,
} from '../../domain/services/INotificationQueueService';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import { DeliveryChannel } from '../../enum/notification.enum';

interface InMemoryJob {
  id: string;
  name: string;
  data: Record<string, any>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedReason?: string;
  delayUntil?: Date;
}

type JobProcessor = (job: InMemoryJob) => Promise<void>;

export class InMemoryQueueService implements INotificationQueueService {
  private jobs: Map<string, InMemoryJob> = new Map();
  private jobCounter: number = 0;
  private processors: Map<string, JobProcessor> = new Map();
  private paused: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    // Start processing loop
    this.startProcessing();
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      if (!this.paused) {
        this.processNextJob();
      }
    }, 100); // Check every 100ms
  }

  private async processNextJob(): Promise<void> {
    // Find next waiting job
    for (const [id, job] of this.jobs) {
      if (job.status === 'waiting') {
        // Check if delayed
        if (job.delayUntil && job.delayUntil > new Date()) {
          continue;
        }

        // Process the job
        job.status = 'active';

        try {
          const processor = this.processors.get(job.name);
          if (processor) {
            await processor(job);
            job.status = 'completed';
            job.processedAt = new Date();
          } else {
            console.log(`No processor registered for job type: ${job.name}`);
            job.status = 'completed';
            job.processedAt = new Date();
          }
        } catch (error) {
          job.status = 'failed';
          job.failedReason = error instanceof Error ? error.message : 'Unknown error';
          job.attempts++;
        }

        break; // Process one job at a time
      }
    }
  }

  /**
   * Register a job processor
   */
  registerProcessor(jobName: string, processor: JobProcessor): void {
    this.processors.set(jobName, processor);
  }

  private generateId(): string {
    return `job-${++this.jobCounter}-${Date.now()}`;
  }

  async addCreationJob(
    notification: Omit<NotificationDomain, 'id'>,
    priority: 'normal' | 'high' = 'normal',
  ): Promise<string> {
    const id = this.generateId();
    const job: InMemoryJob = {
      id,
      name: 'notification:create',
      data: { notification: (notification as any).toPersistence?.() || notification },
      status: 'waiting',
      attempts: 0,
      createdAt: new Date(),
    };

    // High priority jobs go to front (in a real queue, use priority property)
    this.jobs.set(id, job);

    return id;
  }

  async addDeliveryJob(
    notificationId: number,
    userId: number,
    channels: DeliveryChannel[],
    priority: 'normal' | 'high' = 'normal',
  ): Promise<string> {
    const id = this.generateId();
    const job: InMemoryJob = {
      id,
      name: 'notification:deliver',
      data: { notificationId, userId, channels },
      status: 'waiting',
      attempts: 0,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);

    return id;
  }

  async addEmailRetryJob(
    notificationId: number,
    email: string,
    attempt: number,
    delayMs: number = 0,
  ): Promise<string> {
    const id = this.generateId();
    const job: InMemoryJob = {
      id,
      name: 'email:retry',
      data: { notificationId, email, attempt },
      status: delayMs > 0 ? 'delayed' : 'waiting',
      attempts: 0,
      createdAt: new Date(),
      delayUntil: delayMs > 0 ? new Date(Date.now() + delayMs) : undefined,
    };

    this.jobs.set(id, job);

    // If delayed, schedule status change
    if (delayMs > 0) {
      setTimeout(() => {
        const j = this.jobs.get(id);
        if (j && j.status === 'delayed') {
          j.status = 'waiting';
        }
      }, delayMs);
    }

    return id;
  }

  async addBulkCreationJob(
    notifications: Array<Omit<NotificationDomain, 'id'>>,
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const notification of notifications) {
      const id = await this.addCreationJob(notification);
      ids.push(id);
    }

    return ids;
  }

  async getJobStatus(jobId: string): Promise<QueueJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      status: job.status,
      attempts: job.attempts,
      createdAt: job.createdAt,
      processedAt: job.processedAt,
      failedReason: job.failedReason,
    };
  }

  async removeJob(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };

    for (const job of this.jobs.values()) {
      stats[job.status]++;
    }

    return stats;
  }

  async pause(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<void> {
    this.paused = false;
  }

  async cleanCompleted(olderThanMs: number = 3600000): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' && job.processedAt && job.processedAt.getTime() < cutoff) {
        this.jobs.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Shutdown the queue service
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}
