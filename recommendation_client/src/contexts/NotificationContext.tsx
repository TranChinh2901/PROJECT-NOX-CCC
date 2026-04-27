'use client';

/**
 * Notification Context Provider
 *
 * Provides global state management for notifications including:
 * - Real-time WebSocket updates
 * - REST API integration
 * - Optimistic updates with rollback
 * - Pagination support
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  Notification,
  NotificationContextType,
  NotificationFilters,
  NotificationPreferences,
  WebSocketConnectionStatus,
  PaginatedNotifications,
} from '@/types/notification.types';
import { User } from '@/types/auth.types';
import { notificationApi } from '@/lib/api/notification.api';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationSocket } from '@/lib/websocket/notificationSocket';
import toast from 'react-hot-toast';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_PER_PAGE = 20;
const MAX_CACHED_NOTIFICATIONS = 100;
const CLIENT_WELCOME_ID_PREFIX = 'client-welcome-';

type ClientWelcomeState = {
  status: 'unread' | 'read' | 'archived' | 'deleted';
  createdAt: string;
  readAt?: string;
};

const getClientWelcomeId = (userId: number) => `${CLIENT_WELCOME_ID_PREFIX}${userId}`;
const getClientWelcomeStorageKey = (userId: number) =>
  `technova_welcome_notification_${userId}`;

const isClientWelcomeNotification = (id: string) =>
  id.startsWith(CLIENT_WELCOME_ID_PREFIX);

const readClientWelcomeState = (userId: number): ClientWelcomeState | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(getClientWelcomeStorageKey(userId));
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ClientWelcomeState;
  } catch {
    localStorage.removeItem(getClientWelcomeStorageKey(userId));
    return null;
  }
};

const writeClientWelcomeState = (userId: number, state: ClientWelcomeState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getClientWelcomeStorageKey(userId), JSON.stringify(state));
};

const createClientWelcomeNotification = (user: User): Notification | null => {
  if (typeof window === 'undefined') return null;

  const existingState = readClientWelcomeState(user.id);
  if (existingState?.status === 'deleted' || existingState?.status === 'archived') {
    return null;
  }

  const state: ClientWelcomeState =
    existingState ?? {
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

  if (!existingState) {
    writeClientWelcomeState(user.id, state);
  }

  const status: Notification['status'] = state.status === 'read' ? 'read' : 'unread';

  return {
    id: getClientWelcomeId(user.id),
    type: 'user',
    priority: 'medium',
    status,
    title: 'Xin chào!',
    message: `Chào mừng ${user.fullname} đến với TechNova. Chúc bạn có trải nghiệm mua sắm thật tốt tại website của chúng tôi.`,
    summary: 'Chào mừng bạn đến với TechNova.',
    href: '/',
    metadata: {
      backendType: 'welcome',
      source: 'client-fallback',
      userName: user.fullname,
    },
    createdAt: new Date(state.createdAt),
    readAt: state.readAt ? new Date(state.readAt) : undefined,
  };
};

interface NotificationProviderProps {
  children: React.ReactNode;
  wsEndpoint?: string;
  enableToasts?: boolean;
}

export function NotificationProvider({
  children,
  wsEndpoint = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000',
  enableToasts = true,
}: NotificationProviderProps) {
  // Core state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<NotificationFilters>({});

  // Refs
  const socketRef = useRef<NotificationSocket | null>(null);
  const { isAuthenticated, user } = useAuth();

  // WebSocket Event Handlers
  const handleNewNotification = useCallback((notification: Notification) => {
    let inserted = false;

    setNotifications((prev) => {
      // Prevent duplicates
      if (prev.some((n) => n.id === notification.id)) {
        return prev;
      }
      inserted = true;
      // Prepend new notification and cap at max cache size
      const updated = [notification, ...prev].slice(0, MAX_CACHED_NOTIFICATIONS);
      return updated;
    });

    if (inserted && notification.status === 'unread') {
      setUnreadCount((prev) => prev + 1);
    }

    if (inserted) {
      setTotalCount((prev) => prev + 1);
    }

    // Show toast for new notifications
    if (enableToasts && notification.priority !== 'low') {
      const toastDuration = notification.priority === 'urgent' ? 10000 : 5000;
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.summary || notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: toastDuration }
      );
    }
  }, [enableToasts]);

  const handleNotificationRead = useCallback((notificationIds: string[]) => {
    const notificationIdSet = new Set(notificationIds);

    setNotifications((prev) => {
      let unreadChanged = 0;
      const updated = prev.map((notification) => {
        if (!notificationIdSet.has(notification.id) || notification.status !== 'unread') {
          return notification;
        }

        unreadChanged += 1;
        return {
          ...notification,
          status: 'read' as const,
          readAt: new Date(),
        };
      });

      if (unreadChanged > 0) {
        setUnreadCount((prevUnread) => Math.max(0, prevUnread - unreadChanged));
      }

      return updated;
    });
  }, []);

  const handleUnreadCountUpdate = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnectionStatus('disconnected');
      }
      return;
    }

    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('technova_access_token');
    if (!token) return;

    // Create WebSocket connection
    socketRef.current = new NotificationSocket({
      url: wsEndpoint,
      token,
      onConnect: () => setConnectionStatus('connected'),
      onDisconnect: () => setConnectionStatus('disconnected'),
      onReconnecting: () => setConnectionStatus('reconnecting'),
      onError: (err) => {
        setConnectionStatus('error');
        setError(err);
      },
      onNotification: handleNewNotification,
      onNotificationRead: handleNotificationRead,
      onUnreadCount: handleUnreadCountUpdate,
    });

    setConnectionStatus('connecting');
    socketRef.current.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    user,
    wsEndpoint,
    handleNewNotification,
    handleNotificationRead,
    handleUnreadCountUpdate,
  ]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: PaginatedNotifications = await notificationApi.getNotifications({
        ...filters,
        page: 1,
        limit: NOTIFICATIONS_PER_PAGE,
      });

      const hasWelcomeNotification = response.data.some(
        (notification) => notification.metadata?.backendType === 'welcome'
      );
      const clientWelcome =
        user && !hasWelcomeNotification ? createClientWelcomeNotification(user) : null;
      const mergedNotifications = clientWelcome
        ? [clientWelcome, ...response.data]
        : response.data;
      const clientWelcomeUnread =
        clientWelcome?.status === 'unread' ? 1 : 0;

      setNotifications(mergedNotifications);
      setUnreadCount(
        response.unreadCount !== undefined
          ? response.unreadCount + clientWelcomeUnread
          : mergedNotifications.filter((notification) => notification.status === 'unread').length
      );
      setTotalCount(response.total + (clientWelcome ? 1 : 0));
      setHasMore(response.hasMore);
      setCurrentPage(1);
      setCurrentFilters(filters || {});
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch more (pagination)
  const fetchMore = useCallback(async () => {
    if (!isAuthenticated || !hasMore || isLoading) return;

    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const response: PaginatedNotifications = await notificationApi.getNotifications({
        ...currentFilters,
        page: nextPage,
        limit: NOTIFICATIONS_PER_PAGE,
      });

      setNotifications((prev) => [...prev, ...response.data]);
      setHasMore(response.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasMore, isLoading, currentPage, currentFilters]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications(currentFilters);
  }, [fetchNotifications, currentFilters]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.status === 'read') return;

    if (isClientWelcomeNotification(id) && user) {
      const readAt = new Date();
      writeClientWelcomeState(user.id, {
        status: 'read',
        createdAt: notification.createdAt.toISOString(),
        readAt: readAt.toISOString(),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'read' as const, readAt } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return;
    }

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: 'read' as const, readAt: new Date() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      // Rollback on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'unread' as const, readAt: undefined } : n
        )
      );
      setUnreadCount((prev) => prev + 1);
      toast.error('Failed to mark notification as read');
      throw err;
    }
  }, [notifications, user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const clientWelcome = notifications.find((notification) =>
      isClientWelcomeNotification(notification.id)
    );

    if (clientWelcome && user) {
      const readAt = new Date();
      writeClientWelcomeState(user.id, {
        status: 'read',
        createdAt: clientWelcome.createdAt.toISOString(),
        readAt: readAt.toISOString(),
      });
    }

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'read' as const, readAt: new Date() }))
    );
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error('Failed to mark all as read');
      throw err;
    }
  }, [notifications, unreadCount, user]);

  // Mark multiple as read
  const markMultipleAsRead = useCallback(async (ids: string[]) => {
    const idsSet = new Set(ids);
    const clientWelcome = notifications.find(
      (notification) =>
        idsSet.has(notification.id) && isClientWelcomeNotification(notification.id)
    );

    if (clientWelcome && user) {
      const readAt = new Date();
      writeClientWelcomeState(user.id, {
        status: 'read',
        createdAt: clientWelcome.createdAt.toISOString(),
        readAt: readAt.toISOString(),
      });
    }

    const unreadIds = notifications
      .filter((n) => idsSet.has(n.id) && n.status === 'unread')
      .map((n) => n.id);
    const serverIds = ids.filter((id) => !isClientWelcomeNotification(id));

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        idsSet.has(n.id) ? { ...n, status: 'read' as const, readAt: new Date() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - unreadIds.length));

    try {
      if (serverIds.length > 0) {
        await notificationApi.markMultipleAsRead(serverIds);
      }
    } catch (err) {
      // Refresh to get correct state
      await refresh();
      toast.error('Failed to mark notifications as read');
      throw err;
    }
  }, [notifications, refresh, user]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);

    if (isClientWelcomeNotification(id) && user && notification) {
      writeClientWelcomeState(user.id, {
        status: 'deleted',
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString(),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setTotalCount((prev) => Math.max(0, prev - 1));
      return;
    }

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification?.status === 'unread') {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setTotalCount((prev) => prev - 1);

    try {
      await notificationApi.deleteNotification(id);
      toast.success('Notification deleted');
    } catch (err) {
      // Rollback on error
      if (notification) {
        setNotifications((prev) => [...prev, notification].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        if (notification.status === 'unread') {
          setUnreadCount((prev) => prev + 1);
        }
        setTotalCount((prev) => prev + 1);
      }
      toast.error('Failed to delete notification');
      throw err;
    }
  }, [notifications, user]);

  // Delete multiple
  const deleteMultiple = useCallback(async (ids: string[]) => {
    const idsSet = new Set(ids);
    const toDelete = notifications.filter((n) => idsSet.has(n.id));
    const unreadToDelete = toDelete.filter((n) => n.status === 'unread').length;
    const clientWelcome = toDelete.find((notification) =>
      isClientWelcomeNotification(notification.id)
    );
    const serverIds = ids.filter((id) => !isClientWelcomeNotification(id));

    if (clientWelcome && user) {
      writeClientWelcomeState(user.id, {
        status: 'deleted',
        createdAt: clientWelcome.createdAt.toISOString(),
        readAt: clientWelcome.readAt?.toISOString(),
      });
    }

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !idsSet.has(n.id)));
    setUnreadCount((prev) => Math.max(0, prev - unreadToDelete));
    setTotalCount((prev) => prev - toDelete.length);

    try {
      if (serverIds.length > 0) {
        await notificationApi.deleteMultiple(serverIds);
      }
      toast.success(`${ids.length} notifications deleted`);
    } catch (err) {
      await refresh();
      toast.error('Failed to delete notifications');
      throw err;
    }
  }, [notifications, refresh, user]);

  // Archive notification
  const archiveNotification = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);

    if (isClientWelcomeNotification(id) && user && notification) {
      writeClientWelcomeState(user.id, {
        status: 'archived',
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString(),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return;
    }

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: 'archived' as const } : n
      )
    );
    if (notification?.status === 'unread') {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationApi.archiveNotification(id);
      toast.success('Notification archived');
    } catch (err) {
      await refresh();
      toast.error('Failed to archive notification');
      throw err;
    }
  }, [notifications, refresh, user]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    const previousPreferences = preferences;

    // Optimistic update
    setPreferences((prev) => prev ? { ...prev, ...newPreferences } : null);

    try {
      const updated = await notificationApi.updatePreferences(newPreferences);
      setPreferences(updated);
      toast.success('Preferences updated');
    } catch (err) {
      setPreferences(previousPreferences);
      toast.error('Failed to update preferences');
      throw err;
    }
  }, [preferences]);

  // WebSocket control methods
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.reconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();

      // Fetch preferences
      notificationApi.getPreferences()
        .then(setPreferences)
        .catch((err) => console.error('Failed to fetch notification preferences:', err));

    } else {
      // Clear state on logout
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setTotalCount(0);
      setHasMore(true);
      setCurrentPage(1);
      setCurrentFilters({});
      setError(null);
    }
  }, [isAuthenticated, fetchNotifications]);

  const value = useMemo<NotificationContextType>(() => ({
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    connectionStatus,
    preferences,

    // Pagination
    hasMore,
    currentPage,
    totalCount,

    // Actions
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    archiveNotification,

    // Data Fetching
    fetchNotifications,
    fetchMore,
    refresh,

    // Preferences
    updatePreferences,

    // WebSocket
    reconnect,
    disconnect,
  }), [
    notifications,
    unreadCount,
    isLoading,
    error,
    connectionStatus,
    preferences,
    hasMore,
    currentPage,
    totalCount,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    archiveNotification,
    fetchNotifications,
    fetchMore,
    refresh,
    updatePreferences,
    reconnect,
    disconnect,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
