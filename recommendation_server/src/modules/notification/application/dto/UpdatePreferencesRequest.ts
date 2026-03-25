/**
 * DTO: UpdatePreferencesRequest
 * Request DTO for updating notification preferences
 */

export interface UpdateChannelPreferencesDTO {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

export interface UpdateCategoryPreferencesDTO {
  orderUpdates?: boolean;
  promotions?: boolean;
  recommendations?: boolean;
  reviews?: boolean;
  priceAlerts?: boolean;
  newsletter?: boolean;
  systemUpdates?: boolean;
}

export interface UpdateQuietHoursDTO {
  enabled: boolean;
  start?: string; // HH:mm format
  end?: string; // HH:mm format
}

export interface UpdateEmailDigestDTO {
  enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
}

export interface UpdatePreferencesRequestDTO {
  userId: number;
  channels?: UpdateChannelPreferencesDTO;
  categories?: UpdateCategoryPreferencesDTO;
  quietHours?: UpdateQuietHoursDTO;
  emailDigest?: UpdateEmailDigestDTO;
}
