/**
 * Notification Components
 *
 * User-facing notification components for the notification center.
 */

export { NotificationCenter } from './NotificationCenter';
export type { NotificationCenterProps } from './NotificationCenter';

export { NotificationItem } from './NotificationItem';
export type { NotificationItemProps } from './NotificationItem';

export { NotificationFilterChip } from './NotificationFilterChip';
export type { NotificationFilterChipProps } from './NotificationFilterChip';

export { NotificationEmptyState } from './NotificationEmptyState';
export type { NotificationEmptyStateProps } from './NotificationEmptyState';

export { NotificationPreferences } from './NotificationPreferences';
export type { NotificationPreferencesProps } from './NotificationPreferences';

// Re-export types for convenience
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationFilters,
  NotificationPreferences,
} from '@/types/notification.types';
