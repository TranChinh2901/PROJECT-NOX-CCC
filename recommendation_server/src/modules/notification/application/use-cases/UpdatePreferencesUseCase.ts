/**
 * Use Case: UpdatePreferencesUseCase
 * Updates user notification preferences
 */
import { IPreferenceRepository } from '../../domain/repositories/IPreferenceRepository';
import { NotificationPreferencesDomain } from '../../domain/entities/NotificationPreferencesDomain';
import { UpdatePreferencesRequestDTO } from '../dto/UpdatePreferencesRequest';
import {
  UpdatePreferencesResponseDTO,
  PreferencesResponseDTO,
} from '../dto/UpdatePreferencesResponse';

export class UpdatePreferencesUseCase {
  constructor(private readonly preferenceRepository: IPreferenceRepository) {}

  /**
   * Get preferences for a user
   */
  async getPreferences(userId: number): Promise<PreferencesResponseDTO> {
    const preferences = await this.preferenceRepository.getOrCreate(userId);
    return this.mapToDTO(preferences);
  }

  /**
   * Update preferences for a user
   */
  async execute(request: UpdatePreferencesRequestDTO): Promise<UpdatePreferencesResponseDTO> {
    // 1. Get existing preferences or create defaults
    let preferences = await this.preferenceRepository.getOrCreate(request.userId);
    let updated = false;

    // 2. Update channel preferences if provided
    if (request.channels) {
      preferences.updateChannelPreferences({
        inAppEnabled: request.channels.inApp,
        emailEnabled: request.channels.email,
        pushEnabled: request.channels.push,
        smsEnabled: request.channels.sms,
      });
      updated = true;
    }

    // 3. Update category preferences if provided
    if (request.categories) {
      preferences.updateCategoryPreferences({
        orderUpdates: request.categories.orderUpdates,
        promotions: request.categories.promotions,
        recommendations: request.categories.recommendations,
        reviews: request.categories.reviews,
        priceAlerts: request.categories.priceAlerts,
        newsletter: request.categories.newsletter,
        systemUpdates: request.categories.systemUpdates,
      });
      updated = true;
    }

    // 4. Update quiet hours if provided
    if (request.quietHours) {
      preferences.updateQuietHours(
        request.quietHours.enabled,
        request.quietHours.start,
        request.quietHours.end,
      );
      updated = true;
    }

    // 5. Update email digest settings if provided
    if (request.emailDigest) {
      preferences.updateEmailDigest(
        request.emailDigest.enabled,
        request.emailDigest.frequency,
      );
      updated = true;
    }

    // 6. Save if updated
    if (updated) {
      preferences = await this.preferenceRepository.save(preferences);
    }

    return {
      preferences: this.mapToDTO(preferences),
      updated,
    };
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: number): Promise<PreferencesResponseDTO> {
    // Delete existing preferences
    await this.preferenceRepository.delete(userId);

    // Get or create will create defaults
    const preferences = await this.preferenceRepository.getOrCreate(userId);
    return this.mapToDTO(preferences);
  }

  /**
   * Map domain entity to response DTO
   */
  private mapToDTO(preferences: NotificationPreferencesDomain): PreferencesResponseDTO {
    const json = preferences.toJSON();
    return {
      id: json.id,
      userId: json.userId,
      channels: json.channels,
      categories: json.categories,
      quietHours: json.quietHours,
      emailDigest: json.emailDigest,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
