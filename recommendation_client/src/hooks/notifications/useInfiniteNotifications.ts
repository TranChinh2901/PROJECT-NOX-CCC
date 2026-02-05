'use client';

/**
 * Infinite Scroll Notifications Hook
 *
 * Provides intersection observer-based infinite scrolling for notifications.
 */

import { useCallback, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export function useInfiniteNotifications() {
  const { notifications, hasMore, isLoading, fetchMore } = useNotifications();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastNotificationRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMore();
        }
      }, {
        threshold: 0.5,
        rootMargin: '100px',
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, hasMore, fetchMore]
  );

  return {
    notifications,
    lastNotificationRef,
    isLoading,
    hasMore,
  };
}
