'use client';

/**
 * Notification Preferences Hook
 *
 * Provides notification preferences state and update methods.
 */

import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType, NotificationPreferences } from '@/types/notification.types';

export function useNotificationPreferences() {
  const { preferences, updatePreferences, isLoading } = useNotifications();

  const toggleChannel = useCallback(
    async (channel: 'inApp' | 'email' | 'push' | 'sms', enabled: boolean) => {
      if (!preferences) return;

      await updatePreferences({
        channels: {
          ...preferences.channels,
          [channel]: enabled,
        },
      });
    },
    [preferences, updatePreferences]
  );

  const toggleCategory = useCallback(
    async (type: NotificationType, enabled: boolean) => {
      if (!preferences) return;

      await updatePreferences({
        categories: {
          ...preferences.categories,
          [type]: {
            ...preferences.categories[type],
            enabled,
          },
        },
      });
    },
    [preferences, updatePreferences]
  );

  const setCategoryChannels = useCallback(
    async (type: NotificationType, channels: ('inApp' | 'email' | 'push' | 'sms')[]) => {
      if (!preferences) return;

      await updatePreferences({
        categories: {
          ...preferences.categories,
          [type]: {
            ...preferences.categories[type],
            channels,
          },
        },
      });
    },
    [preferences, updatePreferences]
  );

  const setQuietHours = useCallback(
    async (quietHours: NotificationPreferences['quietHours']) => {
      await updatePreferences({ quietHours });
    },
    [updatePreferences]
  );

  const setFrequency = useCallback(
    async (frequency: NotificationPreferences['frequency']) => {
      await updatePreferences({ frequency });
    },
    [updatePreferences]
  );

  const toggleMasterSwitch = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ enabled });
    },
    [updatePreferences]
  );

  return {
    preferences,
    isLoading,
    toggleChannel,
    toggleCategory,
    setCategoryChannels,
    setQuietHours,
    setFrequency,
    toggleMasterSwitch,
    updatePreferences,
  };
}
