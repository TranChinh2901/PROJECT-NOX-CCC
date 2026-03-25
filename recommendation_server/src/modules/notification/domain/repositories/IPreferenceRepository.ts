/**
 * Repository Interface: IPreferenceRepository
 * Defines the contract for notification preferences persistence.
 */
import { NotificationPreferencesDomain } from '../entities/NotificationPreferencesDomain';

export interface IPreferenceRepository {
  /**
   * Find preferences by user ID
   */
  findByUserId(userId: number): Promise<NotificationPreferencesDomain | null>;

  /**
   * Get or create preferences for a user
   * Returns existing preferences or creates default ones
   */
  getOrCreate(userId: number): Promise<NotificationPreferencesDomain>;

  /**
   * Save preferences (create or update)
   */
  save(preferences: NotificationPreferencesDomain): Promise<NotificationPreferencesDomain>;

  /**
   * Update channel preferences
   */
  updateChannelPreferences(
    userId: number,
    preferences: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
    },
  ): Promise<NotificationPreferencesDomain>;

  /**
   * Update category preferences
   */
  updateCategoryPreferences(
    userId: number,
    preferences: {
      orderUpdates?: boolean;
      promotions?: boolean;
      recommendations?: boolean;
      reviews?: boolean;
      priceAlerts?: boolean;
      newsletter?: boolean;
      systemUpdates?: boolean;
    },
  ): Promise<NotificationPreferencesDomain>;

  /**
   * Update quiet hours settings
   */
  updateQuietHours(
    userId: number,
    enabled: boolean,
    start?: string,
    end?: string,
  ): Promise<NotificationPreferencesDomain>;

  /**
   * Update email digest settings
   */
  updateEmailDigest(
    userId: number,
    enabled: boolean,
    frequency?: 'immediate' | 'daily' | 'weekly',
  ): Promise<NotificationPreferencesDomain>;

  /**
   * Delete preferences for a user
   */
  delete(userId: number): Promise<boolean>;
}
