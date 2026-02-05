/**
 * Notification REST API Client
 *
 * Handles all notification-related HTTP requests.
 */

import apiClient from './apiClient';
import {
  Notification,
  NotificationFilters,
  NotificationPreferences,
  PaginatedNotifications,
  GetNotificationsParams,
  UnreadCountResponse,
} from '@/types/notification.types';

export const notificationApi = {
  /**
   * Get paginated notifications with optional filters
   */
  getNotifications: async (
    params: GetNotificationsParams = {}
  ): Promise<PaginatedNotifications> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.status && params.status !== 'all') queryParams.set('status', params.status);
    if (params.type && params.type !== 'all') queryParams.set('type', params.type);
    if (params.priority && params.priority !== 'all') queryParams.set('priority', params.priority);
    if (params.search) queryParams.set('search', params.search);
    if (params.dateRange) {
      queryParams.set('startDate', params.dateRange.start.toISOString());
      queryParams.set('endDate', params.dateRange.end.toISOString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';

    return apiClient.get<PaginatedNotifications>(url);
  },

  /**
   * Get a single notification by ID
   */
  getNotification: async (id: string): Promise<Notification> => {
    return apiClient.get<Notification>(`/notifications/${id}`);
  },

  /**
   * Get the count of unread notifications
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread/count');
    return response.count;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (ids: string[]): Promise<void> => {
    await apiClient.patch('/notifications/read', { ids });
  },

  /**
   * Delete a single notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete multiple notifications
   */
  deleteMultiple: async (ids: string[]): Promise<void> => {
    await apiClient.delete('/notifications', { data: { ids } });
  },

  /**
   * Archive a notification
   */
  archiveNotification: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/archive`);
  },

  /**
   * Get user notification preferences
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },

  /**
   * Update user notification preferences
   */
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    return apiClient.patch<NotificationPreferences>(
      '/notifications/preferences',
      preferences
    );
  },
};
