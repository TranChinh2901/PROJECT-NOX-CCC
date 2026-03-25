'use client';

/**
 * WebSocket Connection Hook
 *
 * Provides WebSocket connection state and control methods.
 */

import { useNotifications } from '@/contexts/NotificationContext';

export function useNotificationSocket() {
  const {
    connectionStatus,
    reconnect,
    disconnect,
  } = useNotifications();

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    hasError: connectionStatus === 'error',
    reconnect,
    disconnect,
  };
}
