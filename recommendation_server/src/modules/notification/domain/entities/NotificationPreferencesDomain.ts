/**
 * Domain Entity: NotificationPreferencesDomain
 * Represents user preferences for notifications
 */
import { UserId } from '../value-objects';
import { DeliveryChannel, NotificationType } from '../../enum/notification.enum';

export interface NotificationPreferencesProps {
  id?: number;
  userId: number;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  orderUpdates?: boolean;
  promotions?: boolean;
  recommendations?: boolean;
  reviews?: boolean;
  priceAlerts?: boolean;
  newsletter?: boolean;
  systemUpdates?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  emailDigestEnabled?: boolean;
  emailFrequency?: 'immediate' | 'daily' | 'weekly';
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationPreferencesDomain {
  readonly id?: number;
  readonly userId: UserId;
  private _inAppEnabled: boolean;
  private _emailEnabled: boolean;
  private _pushEnabled: boolean;
  private _smsEnabled: boolean;
  private _orderUpdates: boolean;
  private _promotions: boolean;
  private _recommendations: boolean;
  private _reviews: boolean;
  private _priceAlerts: boolean;
  private _newsletter: boolean;
  private _systemUpdates: boolean;
  private _quietHoursEnabled: boolean;
  private _quietHoursStart?: string;
  private _quietHoursEnd?: string;
  private _emailDigestEnabled: boolean;
  private _emailFrequency: 'immediate' | 'daily' | 'weekly';
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: NotificationPreferencesProps) {
    this.id = props.id;
    this.userId = UserId.create(props.userId);
    this._inAppEnabled = props.inAppEnabled ?? true;
    this._emailEnabled = props.emailEnabled ?? true;
    this._pushEnabled = props.pushEnabled ?? false;
    this._smsEnabled = props.smsEnabled ?? false;
    this._orderUpdates = props.orderUpdates ?? true;
    this._promotions = props.promotions ?? true;
    this._recommendations = props.recommendations ?? true;
    this._reviews = props.reviews ?? true;
    this._priceAlerts = props.priceAlerts ?? true;
    this._newsletter = props.newsletter ?? false;
    this._systemUpdates = props.systemUpdates ?? true;
    this._quietHoursEnabled = props.quietHoursEnabled ?? false;
    this._quietHoursStart = props.quietHoursStart;
    this._quietHoursEnd = props.quietHoursEnd;
    this._emailDigestEnabled = props.emailDigestEnabled ?? false;
    this._emailFrequency = props.emailFrequency ?? 'immediate';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Create default preferences for a new user
   */
  static createDefault(userId: number): NotificationPreferencesDomain {
    return new NotificationPreferencesDomain({
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: NotificationPreferencesProps): NotificationPreferencesDomain {
    return new NotificationPreferencesDomain(props);
  }

  // Getters
  get inAppEnabled(): boolean {
    return this._inAppEnabled;
  }
  get emailEnabled(): boolean {
    return this._emailEnabled;
  }
  get pushEnabled(): boolean {
    return this._pushEnabled;
  }
  get smsEnabled(): boolean {
    return this._smsEnabled;
  }
  get orderUpdates(): boolean {
    return this._orderUpdates;
  }
  get promotions(): boolean {
    return this._promotions;
  }
  get recommendations(): boolean {
    return this._recommendations;
  }
  get reviews(): boolean {
    return this._reviews;
  }
  get priceAlerts(): boolean {
    return this._priceAlerts;
  }
  get newsletter(): boolean {
    return this._newsletter;
  }
  get systemUpdates(): boolean {
    return this._systemUpdates;
  }
  get quietHoursEnabled(): boolean {
    return this._quietHoursEnabled;
  }
  get quietHoursStart(): string | undefined {
    return this._quietHoursStart;
  }
  get quietHoursEnd(): string | undefined {
    return this._quietHoursEnd;
  }
  get emailDigestEnabled(): boolean {
    return this._emailDigestEnabled;
  }
  get emailFrequency(): 'immediate' | 'daily' | 'weekly' {
    return this._emailFrequency;
  }

  /**
   * Update channel preferences
   */
  updateChannelPreferences(preferences: {
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
  }): void {
    if (preferences.inAppEnabled !== undefined) {
      this._inAppEnabled = preferences.inAppEnabled;
    }
    if (preferences.emailEnabled !== undefined) {
      this._emailEnabled = preferences.emailEnabled;
    }
    if (preferences.pushEnabled !== undefined) {
      this._pushEnabled = preferences.pushEnabled;
    }
    if (preferences.smsEnabled !== undefined) {
      this._smsEnabled = preferences.smsEnabled;
    }
  }

  /**
   * Update category preferences
   */
  updateCategoryPreferences(preferences: {
    orderUpdates?: boolean;
    promotions?: boolean;
    recommendations?: boolean;
    reviews?: boolean;
    priceAlerts?: boolean;
    newsletter?: boolean;
    systemUpdates?: boolean;
  }): void {
    if (preferences.orderUpdates !== undefined) {
      this._orderUpdates = preferences.orderUpdates;
    }
    if (preferences.promotions !== undefined) {
      this._promotions = preferences.promotions;
    }
    if (preferences.recommendations !== undefined) {
      this._recommendations = preferences.recommendations;
    }
    if (preferences.reviews !== undefined) {
      this._reviews = preferences.reviews;
    }
    if (preferences.priceAlerts !== undefined) {
      this._priceAlerts = preferences.priceAlerts;
    }
    if (preferences.newsletter !== undefined) {
      this._newsletter = preferences.newsletter;
    }
    if (preferences.systemUpdates !== undefined) {
      this._systemUpdates = preferences.systemUpdates;
    }
  }

  /**
   * Update quiet hours settings
   */
  updateQuietHours(enabled: boolean, start?: string, end?: string): void {
    this._quietHoursEnabled = enabled;
    if (enabled && start && end) {
      this._quietHoursStart = start;
      this._quietHoursEnd = end;
    } else if (!enabled) {
      this._quietHoursStart = undefined;
      this._quietHoursEnd = undefined;
    }
  }

  /**
   * Update email digest settings
   */
  updateEmailDigest(enabled: boolean, frequency?: 'immediate' | 'daily' | 'weekly'): void {
    this._emailDigestEnabled = enabled;
    if (frequency) {
      this._emailFrequency = frequency;
    }
  }

  /**
   * Check if a channel is enabled
   */
  isChannelEnabled(channel: DeliveryChannel): boolean {
    switch (channel) {
      case DeliveryChannel.IN_APP:
        return this._inAppEnabled;
      case DeliveryChannel.EMAIL:
        return this._emailEnabled;
      case DeliveryChannel.PUSH:
        return this._pushEnabled;
      case DeliveryChannel.SMS:
        return this._smsEnabled;
      default:
        return false;
    }
  }

  /**
   * Check if a notification type is enabled based on category
   */
  isNotificationTypeEnabled(type: NotificationType): boolean {
    // Order-related
    if (
      [
        NotificationType.ORDER_PLACED,
        NotificationType.ORDER_CONFIRMED,
        NotificationType.ORDER_SHIPPED,
        NotificationType.ORDER_DELIVERED,
        NotificationType.ORDER_CANCELLED,
        NotificationType.ORDER_REFUNDED,
      ].includes(type)
    ) {
      return this._orderUpdates;
    }

    // Promotion-related
    if (
      [
        NotificationType.PROMOTION_AVAILABLE,
        NotificationType.PROMOTION_EXPIRING,
        NotificationType.FLASH_SALE,
      ].includes(type)
    ) {
      return this._promotions;
    }

    // Recommendation-related
    if (
      [
        NotificationType.PERSONALIZED_RECOMMENDATION,
        NotificationType.SIMILAR_PRODUCTS,
        NotificationType.TRENDING_PRODUCTS,
      ].includes(type)
    ) {
      return this._recommendations;
    }

    // Review-related
    if (
      [NotificationType.REVIEW_PUBLISHED, NotificationType.REVIEW_RESPONSE].includes(
        type,
      )
    ) {
      return this._reviews;
    }

    // Price/Stock alerts
    if (
      [
        NotificationType.PRICE_DROP,
        NotificationType.BACK_IN_STOCK,
        NotificationType.LOW_STOCK_ALERT,
        NotificationType.CART_ABANDONED,
      ].includes(type)
    ) {
      return this._priceAlerts;
    }

    // System-related (always enabled for important ones)
    if (
      [
        NotificationType.ADMIN_ALERT,
        NotificationType.SYSTEM_MAINTENANCE,
        NotificationType.WELCOME,
        NotificationType.PASSWORD_CHANGED,
        NotificationType.ACCOUNT_VERIFIED,
      ].includes(type)
    ) {
      return this._systemUpdates;
    }

    // Default to enabled for general notifications
    return true;
  }

  /**
   * Check if currently in quiet hours
   */
  isInQuietHours(): boolean {
    if (!this._quietHoursEnabled || !this._quietHoursStart || !this._quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = this._quietHoursStart;
    const end = this._quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    // Regular quiet hours (e.g., 09:00 to 17:00)
    return currentTime >= start && currentTime < end;
  }

  /**
   * Get enabled channels for a notification type
   */
  getEnabledChannelsForType(type: NotificationType): DeliveryChannel[] {
    if (!this.isNotificationTypeEnabled(type)) {
      return [];
    }

    const channels: DeliveryChannel[] = [];

    if (this._inAppEnabled) {
      channels.push(DeliveryChannel.IN_APP);
    }
    if (this._emailEnabled) {
      channels.push(DeliveryChannel.EMAIL);
    }
    if (this._pushEnabled) {
      channels.push(DeliveryChannel.PUSH);
    }
    if (this._smsEnabled) {
      channels.push(DeliveryChannel.SMS);
    }

    return channels;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId.getValue(),
      channels: {
        inApp: this._inAppEnabled,
        email: this._emailEnabled,
        push: this._pushEnabled,
        sms: this._smsEnabled,
      },
      categories: {
        orderUpdates: this._orderUpdates,
        promotions: this._promotions,
        recommendations: this._recommendations,
        reviews: this._reviews,
        priceAlerts: this._priceAlerts,
        newsletter: this._newsletter,
        systemUpdates: this._systemUpdates,
      },
      quietHours: {
        enabled: this._quietHoursEnabled,
        start: this._quietHoursStart,
        end: this._quietHoursEnd,
      },
      emailDigest: {
        enabled: this._emailDigestEnabled,
        frequency: this._emailFrequency,
      },
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.userId.getValue(),
      in_app_enabled: this._inAppEnabled,
      email_enabled: this._emailEnabled,
      push_enabled: this._pushEnabled,
      sms_enabled: this._smsEnabled,
      order_updates: this._orderUpdates,
      promotions: this._promotions,
      recommendations: this._recommendations,
      reviews: this._reviews,
      price_alerts: this._priceAlerts,
      newsletter: this._newsletter,
      system_updates: this._systemUpdates,
      quiet_hours_enabled: this._quietHoursEnabled,
      quiet_hours_start: this._quietHoursStart,
      quiet_hours_end: this._quietHoursEnd,
      email_digest_enabled: this._emailDigestEnabled,
      email_frequency: this._emailFrequency,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
