/**
 * Application DTOs Barrel Export
 */

export {
  CreateNotificationRequestDTO,
  CreateBulkNotificationRequestDTO,
} from './CreateNotificationRequest';

export {
  NotificationResponseDTO,
  DeliveryStatusDTO,
  CreateNotificationResponseDTO,
  CreateBulkNotificationResponseDTO,
} from './CreateNotificationResponse';

export { GetNotificationsRequestDTO } from './GetNotificationsRequest';
export { GetNotificationsResponseDTO } from './GetNotificationsResponse';

export {
  UpdatePreferencesRequestDTO,
  UpdateChannelPreferencesDTO,
  UpdateCategoryPreferencesDTO,
  UpdateQuietHoursDTO,
  UpdateEmailDigestDTO,
} from './UpdatePreferencesRequest';

export { PreferencesResponseDTO, UpdatePreferencesResponseDTO } from './UpdatePreferencesResponse';

export {
  MarkAsReadRequestDTO,
  MarkManyAsReadRequestDTO,
  MarkAllAsReadRequestDTO,
} from './MarkAsReadRequest';

export {
  MarkAsReadResponseDTO,
  MarkManyAsReadResponseDTO,
  MarkAllAsReadResponseDTO,
} from './MarkAsReadResponse';
