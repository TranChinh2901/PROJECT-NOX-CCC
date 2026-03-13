'use client';

/**
 * NotificationList Component
 *
 * Scrollable list of notifications with infinite scroll support.
 */

import { useRef, useCallback } from 'react';
import { Notification } from '@/types/notification.types';
import { NotificationItem } from './NotificationItem';
import { NotificationItemSkeleton } from './NotificationItemSkeleton';
import { cn } from '@/lib/utils';

export interface NotificationListProps {
  notifications: Notification[];
  selectedIds?: Set<string>;
  selectable?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  selectedIds = new Set(),
  selectable = false,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRead,
  onDelete,
  onArchive,
  onSelect,
  onNotificationClick,
}: NotificationListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastNotificationRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      }, {
        threshold: 0.5,
        rootMargin: '100px',
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, hasMore, onLoadMore]
  );

  if (!isLoading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          Không tìm thấy thông báo
        </h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Không có thông báo nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh bộ lọc hoặc kiểm tra lại sau.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden"
      role="list"
      aria-label="Thông báo"
    >
      {notifications.map((notification, index) => {
        const isLast = index === notifications.length - 1;
        const isSelected = selectedIds.has(notification.id);

        return (
          <div
            key={notification.id}
            ref={isLast ? lastNotificationRef : undefined}
            className={cn(
              'group relative',
              isSelected && 'bg-[rgb(var(--admin-primary))]/5'
            )}
          >
            {selectable && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect?.(notification.id, e.target.checked)}
                  className={cn(
                    'w-4 h-4 rounded border-slate-300',
                    'text-[rgb(var(--admin-primary))]',
                    'focus:ring-[rgb(var(--admin-primary))] focus:ring-offset-0'
                  )}
                  aria-label={`Select notification: ${notification.title}`}
                />
              </div>
            )}
            <div className={cn(selectable && 'pl-10')}>
              <NotificationItem
                notification={notification}
                onRead={onRead}
                onDelete={onDelete}
                onArchive={onArchive}
                onClick={onNotificationClick}
              />
            </div>
          </div>
        );
      })}

      {/* Loading more */}
      {isLoading && (
        <>
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
        </>
      )}

      {/* Load more indicator */}
      {!isLoading && hasMore && (
        <div className="py-4 text-center">
          <span className="text-sm text-slate-500">Cuộn để xem thêm</span>
        </div>
      )}
    </div>
  );
}

export default NotificationList;
