/**
 * Notification REST API Client
 *
 * Adapts the frontend notification model to the backend contract.
 */

import apiClient from './apiClient';
import {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
  GetNotificationsParams,
  NotificationType,
  NotificationPriority,
} from '@/types/notification.types';

type BackendNotification = {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
};

type BackendNotificationsResponse = {
  notifications: BackendNotification[];
  unreadCount?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

type BackendPreferencesPayload = {
  preferences: {
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
  };
};

type NotificationChannel = 'inApp' | 'email' | 'push' | 'sms';

const notificationTypeToBackendFilter: Record<NotificationType, string> = {
  order: 'order',
  inventory: 'inventory',
  review: 'review',
  user: 'user',
  system: 'system',
  promotion: 'promotion',
  payment: 'payment',
  shipping: 'shipping',
};

const mapTypeFromBackend = (type: string): NotificationType => {
  if (type.includes('refund') || type.includes('payment')) return 'payment';
  if (type.includes('ship') || type.includes('deliver')) return 'shipping';
  if (
    type.includes('price') ||
    type.includes('stock') ||
    type.includes('cart') ||
    type.includes('recommend') ||
    type.includes('similar') ||
    type.includes('trending')
  ) {
    return 'inventory';
  }
  if (type.includes('review')) return 'review';
  if (type.includes('promotion') || type === 'flash_sale') return 'promotion';
  if (type.startsWith('order_')) return 'order';
  if (type.includes('account') || type.includes('user') || type === 'welcome') return 'user';
  return 'system';
};

const mapPriorityFromBackend = (priority: string): NotificationPriority => {
  switch (priority) {
    case 'low':
    case 'high':
    case 'urgent':
      return priority;
    default:
      return 'medium';
  }
};

const mapPriorityToBackend = (
  priority?: NotificationPriority | 'all'
): string | undefined => {
  if (!priority || priority === 'all') return undefined;
  return priority === 'medium' ? 'normal' : priority;
};

const createCategorySettings = (
  enabled: boolean,
  channels: NotificationChannel[],
  priority: NotificationPriority = 'medium'
) => ({
  enabled,
  channels,
  priority,
});

const mapPreferencesFromBackend = (
  payload: BackendPreferencesPayload['preferences']
): NotificationPreferences => {
  const activeChannels = (Object.entries(payload.channels) as Array<
    [NotificationChannel, boolean]
  >)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);

  return {
    enabled: activeChannels.length > 0,
    channels: payload.channels,
    categories: {
      order: createCategorySettings(payload.categories.orderUpdates, activeChannels, 'high'),
      inventory: createCategorySettings(payload.categories.priceAlerts, activeChannels),
      review: createCategorySettings(payload.categories.reviews, activeChannels),
      user: createCategorySettings(payload.categories.newsletter, activeChannels, 'low'),
      system: createCategorySettings(payload.categories.systemUpdates, activeChannels, 'high'),
      promotion: createCategorySettings(payload.categories.promotions, activeChannels),
      payment: createCategorySettings(payload.categories.orderUpdates, activeChannels, 'high'),
      shipping: createCategorySettings(payload.categories.orderUpdates, activeChannels, 'high'),
    },
    quietHours: {
      enabled: payload.quietHours.enabled,
      start: payload.quietHours.start ?? '22:00',
      end: payload.quietHours.end ?? '07:00',
      timezone: 'Asia/Ho_Chi_Minh',
    },
    frequency:
      payload.emailDigest.frequency === 'daily'
        ? 'digest_daily'
        : payload.emailDigest.frequency === 'weekly'
          ? 'digest_weekly'
          : 'realtime',
  };
};

const mapPreferencesToBackend = (
  preferences: Partial<NotificationPreferences>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (preferences.channels) {
    payload.channels = preferences.channels;
  }

  if (preferences.categories) {
    payload.categories = {
      orderUpdates:
        preferences.categories.order?.enabled ??
        preferences.categories.shipping?.enabled ??
        preferences.categories.payment?.enabled,
      promotions: preferences.categories.promotion?.enabled,
      recommendations: preferences.categories.inventory?.enabled,
      reviews: preferences.categories.review?.enabled,
      priceAlerts: preferences.categories.inventory?.enabled,
      newsletter: preferences.categories.user?.enabled,
      systemUpdates: preferences.categories.system?.enabled,
    };
  }

  if (preferences.quietHours) {
    payload.quietHours = {
      enabled: preferences.quietHours.enabled,
      start: preferences.quietHours.start,
      end: preferences.quietHours.end,
    };
  }

  if (preferences.frequency) {
    payload.emailDigest = {
      enabled: preferences.frequency !== 'realtime',
      frequency:
        preferences.frequency === 'digest_daily'
          ? 'daily'
          : preferences.frequency === 'digest_weekly'
            ? 'weekly'
            : 'immediate',
    };
  }

  if (typeof preferences.enabled === 'boolean' && !payload.channels) {
    payload.channels = preferences.enabled
      ? { inApp: true, email: true, push: false, sms: false }
      : { inApp: false, email: false, push: false, sms: false };
  }

  return payload;
};

export const mapNotificationFromBackend = (notification: BackendNotification): Notification => ({
  id: String(notification.id),
  type: mapTypeFromBackend(notification.type),
  priority: mapPriorityFromBackend(notification.priority),
  status: notification.isArchived ? 'archived' : notification.isRead ? 'read' : 'unread',
  title: notification.title,
  message: notification.message,
  summary: notification.message,
  imageUrl: notification.imageUrl,
  href:
    notification.actionUrl?.startsWith('/orders/')
      ? notification.actionUrl.replace('/orders/', '/account/orders/')
      : notification.actionUrl,
  metadata: {
    ...(notification.data ?? {}),
    backendType: notification.type,
  },
  createdAt: new Date(notification.createdAt),
  readAt: notification.readAt ? new Date(notification.readAt) : undefined,
  expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
});

export const notificationApi = {
  getNotifications: async (params: GetNotificationsParams = {}): Promise<PaginatedNotifications> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.type && params.type !== 'all') {
      queryParams.set('type', notificationTypeToBackendFilter[params.type]);
    }
    if (params.status === 'read') queryParams.set('isRead', 'true');
    if (params.status === 'unread') queryParams.set('isRead', 'false');
    if (params.status === 'archived') queryParams.set('isArchived', 'true');
    const priority = mapPriorityToBackend(params.priority);
    if (priority) queryParams.set('priority', priority);
    if (params.search?.trim()) queryParams.set('search', params.search.trim());
    if (params.dateRange) {
      queryParams.set('fromDate', params.dateRange.start.toISOString());
      queryParams.set('toDate', params.dateRange.end.toISOString());
    }

    const url = queryParams.toString() ? `/notifications?${queryParams.toString()}` : '/notifications';
    const response = await apiClient.get<BackendNotificationsResponse>(url);

    return {
      data: response.notifications.map(mapNotificationFromBackend),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      hasMore: response.pagination.hasMore,
      unreadCount: response.unreadCount,
    };
  },

  getNotification: async (id: string): Promise<Notification> => {
    const response = await apiClient.get<{ notification: BackendNotification }>(`/notifications/${id}`);
    return mapNotificationFromBackend(response.notification);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.unreadCount;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  markMultipleAsRead: async (ids: string[]): Promise<void> => {
    await apiClient.post('/notifications/read', {
      notificationIds: ids.map((id) => Number(id)),
    });
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  deleteMultiple: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map((id) => notificationApi.deleteNotification(id)));
  },

  archiveNotification: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/archive`);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<BackendPreferencesPayload>('/notifications/preferences');
    return mapPreferencesFromBackend(response.preferences);
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put<BackendPreferencesPayload>(
      '/notifications/preferences',
      mapPreferencesToBackend(preferences)
    );
    return mapPreferencesFromBackend(response.preferences);
  },
};
