/**
 * Example: Instrumented Notification Delivery Service
 * This shows how to integrate monitoring into the existing NotificationDeliveryService
 */

import {
  INotificationDeliveryService,
  DeliveryResult,
  DeliveryOptions,
} from '../../domain/services/INotificationDeliveryService';
import { IWebSocketService } from '../../domain/services/IWebSocketService';
import { IEmailService } from '../../domain/services/IEmailService';
import { NotificationDomain } from '../../domain/entities/NotificationDomain';
import { NotificationPreferencesDomain } from '../../domain/entities/NotificationPreferencesDomain';
import { DeliveryChannel, DeliveryStatus } from '../../enum/notification.enum';
import { NotificationDeliveryLog } from '../../entity/notification-delivery-log';
import { AppDataSource } from '@/config/database.config';
import { Repository } from 'typeorm';

// Import monitoring components
import { metricsCollector, logger } from '../monitoring';

interface ScheduledJob {
  id: string;
  notificationId: number;
  channels: DeliveryChannel[];
  deliverAt: Date;
  cancelled: boolean;
}

export class InstrumentedNotificationDeliveryService implements INotificationDeliveryService {
  private deliveryLogRepository: Repository<NotificationDeliveryLog>;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private userEmails: Map<number, string> = new Map();

  constructor(
    private readonly webSocketService: IWebSocketService,
    private readonly emailService: IEmailService,
  ) {
    this.deliveryLogRepository = AppDataSource.getRepository(NotificationDeliveryLog);
  }

  async deliver(
    notification: NotificationDomain,
    preferences: NotificationPreferencesDomain,
    options: DeliveryOptions = {},
  ): Promise<DeliveryResult[]> {
    const startTime = Date.now();
    const correlationId = logger.getCorrelationId();

    logger.info('notification.delivery.started', 'Starting notification delivery', {
      correlationId,
      notificationId: notification.id,
      userId: notification.userId.getValue(),
      type: notification.type.getValue(),
    });

    const results: DeliveryResult[] = [];

    try {
      // Determine which channels to use
      let channels = options.channels;
      if (!channels) {
        channels = preferences.getEnabledChannelsForType(notification.type.getValue());
      }

      // Check if we should delay for quiet hours
      if (!options.skipPreferenceCheck && this.shouldDelayDelivery(preferences)) {
        const deliverAt = this.getNextDeliveryTime(preferences);
        const jobId = await this.scheduleDelivery(notification, deliverAt, channels);

        logger.info('notification.delivery.scheduled', 'Notification scheduled for quiet hours', {
          correlationId,
          notificationId: notification.id,
          deliverAt: deliverAt.toISOString(),
          jobId,
        });

        // Track scheduled delivery
        metricsCollector.incrementNotificationsDelivered('scheduled', DeliveryStatus.PENDING);

        return channels.map(channel => ({
          channel,
          status: DeliveryStatus.PENDING,
        }));
      }

      // Deliver to each channel
      for (const channel of channels) {
        const channelStartTime = Date.now();

        try {
          const result = await this.deliverToChannel(
            notification,
            channel,
            await this.getUserEmail(notification.userId.getValue()),
          );
          results.push(result);

          // Track successful delivery
          const channelDuration = (Date.now() - channelStartTime) / 1000;
          metricsCollector.observeNotificationDeliveryDuration(channel, channelDuration);
          metricsCollector.incrementNotificationsDelivered(channel, result.status);

          logger.logNotificationDelivered(
            notification.id!,
            channel,
            channelDuration * 1000,
            correlationId
          );

          // Log delivery attempt
          await this.logDelivery(notification.id!, channel, result);
        } catch (error) {
          logger.logNotificationDeliveryFailed(
            notification.id!,
            channel,
            error as Error,
            0,
            correlationId
          );

          metricsCollector.incrementNotificationsFailed(
            channel,
            error instanceof Error ? error.name : 'unknown_error'
          );

          const failedResult: DeliveryResult = {
            channel,
            status: DeliveryStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          results.push(failedResult);
          await this.logDelivery(notification.id!, channel, failedResult);

          // Queue for retry if enabled
          if (options.retryOnFailure) {
            this.queueRetry(notification.id!, channel, 1, options.maxRetries);
          }
        }
      }

      // Track overall delivery duration
      const totalDuration = (Date.now() - startTime) / 1000;
      metricsCollector.observeNotificationDeliveryDuration('total', totalDuration);

      return results;
    } catch (error) {
      logger.error('notification.delivery.failed', 'Notification delivery failed', error as Error, {
        correlationId,
        notificationId: notification.id,
      });

      throw error;
    }
  }

  async deliverToChannel(
    notification: NotificationDomain,
    channel: DeliveryChannel,
    userEmail?: string,
  ): Promise<DeliveryResult> {
    switch (channel) {
      case DeliveryChannel.IN_APP:
        return this.deliverInApp(notification);

      case DeliveryChannel.EMAIL:
        if (!userEmail) {
          return {
            channel,
            status: DeliveryStatus.FAILED,
            error: 'User email not available',
          };
        }
        return this.deliverEmail(notification, userEmail);

      case DeliveryChannel.PUSH:
        return {
          channel,
          status: DeliveryStatus.FAILED,
          error: 'Push notifications not implemented',
        };

      case DeliveryChannel.SMS:
        return {
          channel,
          status: DeliveryStatus.FAILED,
          error: 'SMS notifications not implemented',
        };

      default:
        return {
          channel,
          status: DeliveryStatus.FAILED,
          error: `Unknown channel: ${channel}`,
        };
    }
  }

  private async deliverInApp(notification: NotificationDomain): Promise<DeliveryResult> {
    const startTime = Date.now();
    const userId = notification.userId.getValue();

    try {
      const delivered = await this.webSocketService.sendToUser(userId, notification);

      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeNotificationDeliveryDuration('websocket', duration);

      if (delivered) {
        metricsCollector.incrementWebSocketMessages('notification_delivered');
      }

      return {
        channel: DeliveryChannel.IN_APP,
        status: delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.SENT,
        deliveredAt: delivered ? new Date() : undefined,
      };
    } catch (error) {
      metricsCollector.incrementWebSocketMessages('notification_failed');
      throw error;
    }
  }

  private async deliverEmail(
    notification: NotificationDomain,
    email: string,
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      const result = await this.emailService.sendNotificationEmail(
        email,
        notification.title,
        notification.message,
        notification.actionUrl,
      );

      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeEmailDeliveryDuration(duration);

      if (result.success) {
        metricsCollector.incrementEmailsSent('success');
        logger.logEmailSent('notification', email, duration * 1000);
      } else {
        metricsCollector.incrementEmailsSent('failed');
        logger.logEmailFailed('notification', email, new Error(result.error || 'Unknown error'));
      }

      return {
        channel: DeliveryChannel.EMAIL,
        status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
        deliveredAt: result.success ? new Date() : undefined,
        error: result.error,
      };
    } catch (error) {
      metricsCollector.incrementEmailsSent('failed');
      throw error;
    }
  }

  async retryDelivery(
    notificationId: number,
    channel: DeliveryChannel,
    attempt: number,
  ): Promise<DeliveryResult> {
    logger.info('notification.delivery.retry', 'Retrying notification delivery', {
      notificationId,
      channel,
      attempt,
    });

    return {
      channel,
      status: DeliveryStatus.RETRY,
      retryCount: attempt,
    };
  }

  async getDeliveryStatus(notificationId: number): Promise<DeliveryResult[]> {
    const startTime = Date.now();

    try {
      const logs = await this.deliveryLogRepository.find({
        where: { notification_id: notificationId },
        order: { created_at: 'DESC' },
      });

      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeDatabaseQueryDuration('get_delivery_status', duration);

      return logs.map(log => ({
        channel: log.channel,
        status: log.status,
        deliveredAt: log.delivered_at,
        error: log.error_message || undefined,
        retryCount: log.retry_count,
      }));
    } catch (error) {
      logger.error('delivery.status.query.failed', 'Failed to get delivery status', error as Error, {
        notificationId,
      });
      throw error;
    }
  }

  async scheduleDelivery(
    notification: NotificationDomain,
    deliverAt: Date,
    channels?: DeliveryChannel[],
  ): Promise<string> {
    const jobId = `scheduled-${notification.id}-${Date.now()}`;

    const job: ScheduledJob = {
      id: jobId,
      notificationId: notification.id!,
      channels: channels || [DeliveryChannel.IN_APP],
      deliverAt,
      cancelled: false,
    };

    this.scheduledJobs.set(jobId, job);

    // Update queue depth metric
    metricsCollector.setQueueDepth('scheduled_delivery', this.scheduledJobs.size);

    const delayMs = deliverAt.getTime() - Date.now();
    if (delayMs > 0) {
      setTimeout(async () => {
        if (!job.cancelled) {
          logger.info('scheduled.delivery.executing', 'Executing scheduled delivery', {
            jobId,
            notificationId: job.notificationId,
          });
        }
      }, Math.min(delayMs, 2147483647));
    }

    return jobId;
  }

  async cancelScheduledDelivery(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.cancelled = true;
      this.scheduledJobs.delete(jobId);

      // Update queue depth metric
      metricsCollector.setQueueDepth('scheduled_delivery', this.scheduledJobs.size);

      logger.info('scheduled.delivery.cancelled', 'Cancelled scheduled delivery', { jobId });
      return true;
    }
    return false;
  }

  shouldDelayDelivery(preferences: NotificationPreferencesDomain): boolean {
    return preferences.isInQuietHours();
  }

  getNextDeliveryTime(preferences: NotificationPreferencesDomain): Date {
    if (!preferences.quietHoursEnabled || !preferences.quietHoursEnd) {
      return new Date();
    }

    const now = new Date();
    const [hours, minutes] = preferences.quietHoursEnd.split(':').map(Number);

    const deliveryTime = new Date(now);
    deliveryTime.setHours(hours, minutes, 0, 0);

    if (deliveryTime <= now) {
      deliveryTime.setDate(deliveryTime.getDate() + 1);
    }

    return deliveryTime;
  }

  private async logDelivery(
    notificationId: number,
    channel: DeliveryChannel,
    result: DeliveryResult,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const log = this.deliveryLogRepository.create({
        notification_id: notificationId,
        channel,
        status: result.status,
        retry_count: result.retryCount || 0,
        sent_at: result.status === DeliveryStatus.SENT ? new Date() : undefined,
        delivered_at: result.deliveredAt,
        error_message: result.error,
      });

      await this.deliveryLogRepository.save(log);

      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeDatabaseQueryDuration('insert_delivery_log', duration);
    } catch (error) {
      logger.error('delivery.log.failed', 'Failed to log delivery', error as Error, {
        notificationId,
        channel,
      });
    }
  }

  private queueRetry(
    notificationId: number,
    channel: DeliveryChannel,
    attempt: number,
    maxRetries: number = 3,
  ): void {
    if (attempt >= maxRetries) {
      logger.warn('delivery.retry.max_reached', 'Max retries reached', {
        notificationId,
        channel,
        attempt,
      });
      return;
    }

    const delayMs = Math.pow(2, attempt) * 1000;
    logger.info('delivery.retry.queued', 'Queuing retry', {
      notificationId,
      channel,
      attempt,
      delayMs,
    });

    setTimeout(() => {
      this.retryDelivery(notificationId, channel, attempt + 1);
    }, delayMs);
  }

  private async getUserEmail(userId: number): Promise<string | undefined> {
    // Check cache first
    if (this.userEmails.has(userId)) {
      metricsCollector.incrementCacheHits('user_email');
      logger.logCacheHit('user_email', `user_${userId}`);
      return this.userEmails.get(userId);
    }

    metricsCollector.incrementCacheMisses('user_email');
    logger.logCacheMiss('user_email', `user_${userId}`);

    const startTime = Date.now();

    try {
      const userRepository = AppDataSource.getRepository('users');
      const user = await userRepository.findOne({ where: { id: userId } });

      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeDatabaseQueryDuration('get_user_email', duration);

      if (user) {
        const email = (user as any).email;
        this.userEmails.set(userId, email);
        return email;
      }
    } catch (error) {
      logger.error('user.email.query.failed', 'Failed to fetch user email', error as Error, {
        userId,
      });
    }

    return undefined;
  }
}
