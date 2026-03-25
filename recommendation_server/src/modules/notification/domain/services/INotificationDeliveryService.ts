/**
 * Service Interface: INotificationDeliveryService
 * Defines the contract for notification delivery across channels
 */
import { NotificationDomain } from '../entities/NotificationDomain';
import { NotificationPreferencesDomain } from '../entities/NotificationPreferencesDomain';
import { DeliveryChannel, DeliveryStatus } from '../../enum/notification.enum';

export interface DeliveryResult {
  channel: DeliveryChannel;
  status: DeliveryStatus;
  deliveredAt?: Date;
  error?: string;
  retryCount?: number;
}

export interface DeliveryOptions {
  channels?: DeliveryChannel[];
  skipPreferenceCheck?: boolean;
  priority?: 'normal' | 'high';
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface INotificationDeliveryService {
  /**
   * Deliver a notification to a user through appropriate channels
   */
  deliver(
    notification: NotificationDomain,
    preferences: NotificationPreferencesDomain,
    options?: DeliveryOptions,
  ): Promise<DeliveryResult[]>;

  /**
   * Deliver to a specific channel
   */
  deliverToChannel(
    notification: NotificationDomain,
    channel: DeliveryChannel,
    userEmail?: string,
  ): Promise<DeliveryResult>;

  /**
   * Retry failed delivery
   */
  retryDelivery(
    notificationId: number,
    channel: DeliveryChannel,
    attempt: number,
  ): Promise<DeliveryResult>;

  /**
   * Get delivery status for a notification
   */
  getDeliveryStatus(notificationId: number): Promise<DeliveryResult[]>;

  /**
   * Schedule a notification for later delivery
   */
  scheduleDelivery(
    notification: NotificationDomain,
    deliverAt: Date,
    channels?: DeliveryChannel[],
  ): Promise<string>; // Returns job ID

  /**
   * Cancel scheduled delivery
   */
  cancelScheduledDelivery(jobId: string): Promise<boolean>;

  /**
   * Check if delivery should be delayed (quiet hours)
   */
  shouldDelayDelivery(preferences: NotificationPreferencesDomain): boolean;

  /**
   * Get next available delivery time (after quiet hours)
   */
  getNextDeliveryTime(preferences: NotificationPreferencesDomain): Date;
}
