/**
 * Infrastructure: TypeORM Preference Repository
 * Implements IPreferenceRepository using TypeORM
 */
import { Repository } from 'typeorm';
import { IPreferenceRepository } from '../../domain/repositories/IPreferenceRepository';
import { NotificationPreferencesDomain } from '../../domain/entities/NotificationPreferencesDomain';
import { NotificationPreference as PreferenceEntity } from '../../entity/notification-preference';
import { AppDataSource } from '@/config/database.config';

export class TypeORMPreferenceRepository implements IPreferenceRepository {
  private repository: Repository<PreferenceEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(PreferenceEntity);
  }

  async findByUserId(userId: number): Promise<NotificationPreferencesDomain | null> {
    const entity = await this.repository.findOne({ where: { user_id: userId } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async getOrCreate(userId: number): Promise<NotificationPreferencesDomain> {
    let entity = await this.repository.findOne({ where: { user_id: userId } });

    if (!entity) {
      // Create default preferences
      entity = this.repository.create({
        user_id: userId,
        in_app_enabled: true,
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        order_updates: true,
        promotions: true,
        recommendations: true,
        reviews: true,
        price_alerts: true,
        newsletter: false,
        system_updates: true,
        quiet_hours_enabled: false,
        email_digest_enabled: false,
        email_frequency: 'immediate',
      });
      entity = await this.repository.save(entity);
    }

    return this.toDomain(entity);
  }

  async save(preferences: NotificationPreferencesDomain): Promise<NotificationPreferencesDomain> {
    const persistence = preferences.toPersistence();

    let entity = await this.repository.findOne({ where: { user_id: persistence.user_id } });

    if (entity) {
      // Update existing
      entity.in_app_enabled = persistence.in_app_enabled;
      entity.email_enabled = persistence.email_enabled;
      entity.push_enabled = persistence.push_enabled;
      entity.sms_enabled = persistence.sms_enabled;
      entity.order_updates = persistence.order_updates;
      entity.promotions = persistence.promotions;
      entity.recommendations = persistence.recommendations;
      entity.reviews = persistence.reviews;
      entity.price_alerts = persistence.price_alerts;
      entity.newsletter = persistence.newsletter;
      entity.system_updates = persistence.system_updates;
      entity.quiet_hours_enabled = persistence.quiet_hours_enabled;
      entity.quiet_hours_start = persistence.quiet_hours_start;
      entity.quiet_hours_end = persistence.quiet_hours_end;
      entity.email_digest_enabled = persistence.email_digest_enabled;
      entity.email_frequency = persistence.email_frequency;
    } else {
      // Create new
      entity = this.repository.create({
        user_id: persistence.user_id,
        in_app_enabled: persistence.in_app_enabled,
        email_enabled: persistence.email_enabled,
        push_enabled: persistence.push_enabled,
        sms_enabled: persistence.sms_enabled,
        order_updates: persistence.order_updates,
        promotions: persistence.promotions,
        recommendations: persistence.recommendations,
        reviews: persistence.reviews,
        price_alerts: persistence.price_alerts,
        newsletter: persistence.newsletter,
        system_updates: persistence.system_updates,
        quiet_hours_enabled: persistence.quiet_hours_enabled,
        quiet_hours_start: persistence.quiet_hours_start,
        quiet_hours_end: persistence.quiet_hours_end,
        email_digest_enabled: persistence.email_digest_enabled,
        email_frequency: persistence.email_frequency,
      });
    }

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async updateChannelPreferences(
    userId: number,
    preferences: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
    },
  ): Promise<NotificationPreferencesDomain> {
    const domain = await this.getOrCreate(userId);
    domain.updateChannelPreferences(preferences);
    return this.save(domain);
  }

  async updateCategoryPreferences(
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
  ): Promise<NotificationPreferencesDomain> {
    const domain = await this.getOrCreate(userId);
    domain.updateCategoryPreferences(preferences);
    return this.save(domain);
  }

  async updateQuietHours(
    userId: number,
    enabled: boolean,
    start?: string,
    end?: string,
  ): Promise<NotificationPreferencesDomain> {
    const domain = await this.getOrCreate(userId);
    domain.updateQuietHours(enabled, start, end);
    return this.save(domain);
  }

  async updateEmailDigest(
    userId: number,
    enabled: boolean,
    frequency?: 'immediate' | 'daily' | 'weekly',
  ): Promise<NotificationPreferencesDomain> {
    const domain = await this.getOrCreate(userId);
    domain.updateEmailDigest(enabled, frequency);
    return this.save(domain);
  }

  async delete(userId: number): Promise<boolean> {
    const result = await this.repository.delete({ user_id: userId });
    return (result.affected || 0) > 0;
  }

  /**
   * Convert TypeORM entity to domain entity
   */
  private toDomain(entity: PreferenceEntity): NotificationPreferencesDomain {
    return NotificationPreferencesDomain.fromPersistence({
      id: entity.id,
      userId: entity.user_id,
      inAppEnabled: entity.in_app_enabled,
      emailEnabled: entity.email_enabled,
      pushEnabled: entity.push_enabled,
      smsEnabled: entity.sms_enabled,
      orderUpdates: entity.order_updates,
      promotions: entity.promotions,
      recommendations: entity.recommendations,
      reviews: entity.reviews,
      priceAlerts: entity.price_alerts,
      newsletter: entity.newsletter,
      systemUpdates: entity.system_updates,
      quietHoursEnabled: entity.quiet_hours_enabled,
      quietHoursStart: entity.quiet_hours_start,
      quietHoursEnd: entity.quiet_hours_end,
      emailDigestEnabled: entity.email_digest_enabled,
      emailFrequency: entity.email_frequency,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }
}
