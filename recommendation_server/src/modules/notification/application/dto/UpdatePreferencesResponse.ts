/**
 * DTO: UpdatePreferencesResponse
 * Response DTO for notification preferences
 */

export interface PreferencesResponseDTO {
  id: number;
  userId: number;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    orderUpdates: boolean;
    promotions: boolean;
    recommendations: boolean;
    reviews: boolean;
    priceAlerts: boolean;
    newsletter: boolean;
    systemUpdates: boolean;
  };
  quietHours: {
    enabled: boolean;
    start?: string;
    end?: string;
  };
  emailDigest: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesResponseDTO {
  preferences: PreferencesResponseDTO;
  updated: boolean;
}
