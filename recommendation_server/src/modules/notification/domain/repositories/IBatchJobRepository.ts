/**
 * Repository Interface: IBatchJobRepository
 * Defines the contract for notification batch job persistence.
 */
import { BatchJobStatus, BatchJobType, NotificationBatchJob } from '../entity/notification-batch-job';

export interface BatchJobFilter {
  status?: BatchJobStatus;
  jobType?: BatchJobType;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedBatchJobs {
  jobs: NotificationBatchJob[];
  total: number;
  hasMore: boolean;
}

export interface IBatchJobRepository {
  /**
   * Find batch job by ID
   */
  findById(id: number): Promise<NotificationBatchJob | null>;

  /**
   * Find batch jobs with filters
   */
  findWithFilter(filter: BatchJobFilter): Promise<PaginatedBatchJobs>;

  /**
   * Find active/running jobs
   */
  findActiveJobs(): Promise<NotificationBatchJob[]>;

  /**
   * Find pending jobs for processing
   */
  findPendingJobs(limit?: number): Promise<NotificationBatchJob[]>;

  /**
   * Save a batch job (create or update)
   */
  save(job: NotificationBatchJob): Promise<NotificationBatchJob>;

  /**
   * Update job status
   */
  updateStatus(id: number, status: BatchJobStatus, metadata?: Record<string, any>): Promise<boolean>;

  /**
   * Update job progress
   */
  updateProgress(id: number, sentCount: number, failedCount: number): Promise<boolean>;

  /**
   * Delete a batch job
   */
  delete(id: number): Promise<boolean>;

  /**
   * Delete old completed jobs
   */
  deleteOldJobs(daysOld: number): Promise<number>;
}
