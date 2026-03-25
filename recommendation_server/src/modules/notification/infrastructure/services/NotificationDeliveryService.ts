/**
 * Infrastructure: Notification Delivery Service
 * Implements INotificationDeliveryService with multi-channel delivery
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

interface ScheduledJob {
  id: string;
  notificationId: number;
  channels: DeliveryChannel[];
  deliverAt: Date;
  cancelled: boolean;
}

export class NotificationDeliveryService implements INotificationDeliveryService {
  private deliveryLogRepository: Repository<NotificationDeliveryLog>;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private userEmails: Map<number, string> = new Map(); // Cache for user emails

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
    const results: DeliveryResult[] = [];

    // Determine which channels to use
    let channels = options.channels;
    if (!channels) {
      channels = preferences.getEnabledChannelsForType(notification.type.getValue());
    }

    // Check if we should delay for quiet hours
    if (!options.skipPreferenceCheck && this.shouldDelayDelivery(preferences)) {
      const deliverAt = this.getNextDeliveryTime(preferences);
      const jobId = await this.scheduleDelivery(notification, deliverAt, channels);
      console.log(`Notification ${notification.id} scheduled for ${deliverAt.toISOString()} (job: ${jobId})`);

      // Return pending status for all channels
      return channels.map(channel => ({
        channel,
        status: DeliveryStatus.PENDING,
      }));
    }

    // Deliver to each channel
    for (const channel of channels) {
      try {
        const result = await this.deliverToChannel(
          notification,
          channel,
          await this.getUserEmail(notification.userId.getValue()),
        );
        results.push(result);

        // Log delivery attempt
        await this.logDelivery(notification.id!, channel, result);
      } catch (error) {
        console.error(`Failed to deliver to ${channel}:`, error);
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

    return results;
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
        // Push notifications not implemented yet
        return {
          channel,
          status: DeliveryStatus.FAILED,
          error: 'Push notifications not implemented',
        };

      case DeliveryChannel.SMS:
        // SMS notifications not implemented yet
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
    const userId = notification.userId.getValue();
    const delivered = await this.webSocketService.sendToUser(userId, notification);

    return {
      channel: DeliveryChannel.IN_APP,
      status: delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.SENT,
      deliveredAt: delivered ? new Date() : undefined,
    };
  }

  private async deliverEmail(
    notification: NotificationDomain,
    email: string,
  ): Promise<DeliveryResult> {
    const result = await this.emailService.sendNotificationEmail(
      email,
      notification.title,
      notification.message,
      notification.actionUrl,
    );

    return {
      channel: DeliveryChannel.EMAIL,
      status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
      deliveredAt: result.success ? new Date() : undefined,
      error: result.error,
    };
  }

  async retryDelivery(
    notificationId: number,
    channel: DeliveryChannel,
    attempt: number,
  ): Promise<DeliveryResult> {
    // This would be called by a queue processor
    console.log(`Retrying delivery for notification ${notificationId}, channel ${channel}, attempt ${attempt}`);

    // Implementation would fetch notification from DB and retry
    return {
      channel,
      status: DeliveryStatus.RETRY,
      retryCount: attempt,
    };
  }

  async getDeliveryStatus(notificationId: number): Promise<DeliveryResult[]> {
    const logs = await this.deliveryLogRepository.find({
      where: { notification_id: notificationId },
      order: { created_at: 'DESC' },
    });

    return logs.map(log => ({
      channel: log.channel,
      status: log.status,
      deliveredAt: log.delivered_at,
      error: log.error_message || undefined,
      retryCount: log.retry_count,
    }));
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

    // In production, this would use a proper job scheduler like Bull
    const delayMs = deliverAt.getTime() - Date.now();
    if (delayMs > 0) {
      setTimeout(async () => {
        if (!job.cancelled) {
          console.log(`Executing scheduled job ${jobId}`);
          // Execute delivery
        }
      }, Math.min(delayMs, 2147483647)); // Max setTimeout delay
    }

    return jobId;
  }

  async cancelScheduledDelivery(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.cancelled = true;
      this.scheduledJobs.delete(jobId);
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

    // If the end time is earlier today, it means quiet hours end tomorrow
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
    } catch (error) {
      console.error('Failed to log delivery:', error);
    }
  }

  private queueRetry(
    notificationId: number,
    channel: DeliveryChannel,
    attempt: number,
    maxRetries: number = 3,
  ): void {
    if (attempt >= maxRetries) {
      console.log(`Max retries reached for notification ${notificationId}, channel ${channel}`);
      return;
    }

    // In production, this would use a proper queue like Bull
    const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
    console.log(`Queueing retry for notification ${notificationId}, channel ${channel}, delay ${delayMs}ms`);

    setTimeout(() => {
      this.retryDelivery(notificationId, channel, attempt + 1);
    }, delayMs);
  }

  private async getUserEmail(userId: number): Promise<string | undefined> {
    // Check cache first
    if (this.userEmails.has(userId)) {
      return this.userEmails.get(userId);
    }

    // Fetch from database
    try {
      const userRepository = AppDataSource.getRepository('users');
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) {
        const email = (user as any).email;
        this.userEmails.set(userId, email);
        return email;
      }
    } catch (error) {
      console.error('Failed to fetch user email:', error);
    }

    return undefined;
  }
}
