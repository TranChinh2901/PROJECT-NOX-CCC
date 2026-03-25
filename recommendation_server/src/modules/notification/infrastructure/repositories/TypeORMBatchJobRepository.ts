/**
 * Infrastructure: TypeORM Batch Job Repository
 * Implements IBatchJobRepository using TypeORM
 */
import { Repository, LessThan, MoreThanOrEqual, Between, In } from 'typeorm';
import { IBatchJobRepository, BatchJobFilter, PaginatedBatchJobs } from '../../domain/repositories/IBatchJobRepository';
import { NotificationBatchJob, BatchJobStatus, BatchJobType } from '../../entity/notification-batch-job';
import { AppDataSource } from '@/config/database.config';

export class TypeORMBatchJobRepository implements IBatchJobRepository {
  private repository: Repository<NotificationBatchJob>;

  constructor() {
    this.repository = AppDataSource.getRepository(NotificationBatchJob);
  }

  async findById(id: number): Promise<NotificationBatchJob | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findWithFilter(filter: BatchJobFilter): Promise<PaginatedBatchJobs> {
    const where: any = {};

    if (filter.status !== undefined) {
      where.status = filter.status;
    }
    if (filter.jobType !== undefined) {
      where.job_type = filter.jobType;
    }
    if (filter.fromDate && filter.toDate) {
      where.created_at = Between(filter.fromDate, filter.toDate);
    } else if (filter.fromDate) {
      where.created_at = MoreThanOrEqual(filter.fromDate);
    }

    const [jobs, total] = await this.repository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: filter.offset || 0,
      take: filter.limit || 20,
    });

    const hasMore = (filter.offset || 0) + jobs.length < total;

    return {
      jobs,
      total,
      hasMore,
    };
  }

  async findActiveJobs(): Promise<NotificationBatchJob[]> {
    return this.repository.find({
      where: { status: In(['pending', 'running']) },
      order: { created_at: 'ASC' },
    });
  }

  async findPendingJobs(limit: number = 10): Promise<NotificationBatchJob[]> {
    return this.repository.find({
      where: { status: 'pending' },
      order: { created_at: 'ASC' },
      take: limit,
    });
  }

  async save(job: NotificationBatchJob): Promise<NotificationBatchJob> {
    return this.repository.save(job);
  }

  async updateStatus(
    id: number,
    status: BatchJobStatus,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    const updateData: any = { status };

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    const result = await this.repository.update({ id }, updateData);
    return (result.affected || 0) > 0;
  }

  async updateProgress(
    id: number,
    sentCount: number,
    failedCount: number,
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id },
      {
        sent_count: sentCount,
        failed_count: failedCount,
      },
    );
    return (result.affected || 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected || 0) > 0;
  }

  async deleteOldJobs(daysOld: number): Promise<number> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysOld);

    const result = await this.repository.delete({
      status: 'completed',
      completed_at: LessThan(dateLimit),
    });
    return result.affected || 0;
  }
}
