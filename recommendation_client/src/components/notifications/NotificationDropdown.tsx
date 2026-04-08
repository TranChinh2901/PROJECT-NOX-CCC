'use client';

/**
 * NotificationDropdown Component
 *
 * Dropdown panel displaying recent notifications.
 */

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Check, RefreshCw, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { NotificationItemSkeleton } from './NotificationItemSkeleton';
import { cn } from '@/lib/utils';

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  maxHeight?: number;
  width?: number;
  settingsHref?: string;
  listHref?: string;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  maxHeight = 400,
  width = 380,
  settingsHref = '/admin/notifications/settings',
  listHref = '/admin/notifications',
}: NotificationDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refresh,
  } = useNotifications();

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recentNotifications = notifications.slice(0, 5);
  const isConnected = connectionStatus === 'connected';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        id="notification-dropdown"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          'bg-white shadow-xl ring-1 ring-black ring-opacity-5',
          'z-50 flex flex-col',
          // Mobile: Full screen
          'fixed inset-0',
          // Desktop: Dropdown
          'sm:inset-auto sm:absolute sm:top-full sm:right-0',
          'sm:rounded-lg sm:mt-2',
          'animate-in fade-in-0 zoom-in-95 sm:slide-in-from-top-2'
        )}
        style={{
          maxHeight: typeof window !== 'undefined' && window.innerWidth >= 640 ? maxHeight : undefined,
          width: typeof window !== 'undefined' && window.innerWidth >= 640 ? width : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[rgb(var(--admin-primary))] text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Connection status */}
            <span
              className={cn(
                'p-1 rounded-md',
                isConnected ? 'text-green-500' : 'text-slate-400'
              )}
              title={isConnected ? 'Connected' : 'Disconnected'}
              aria-label={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </span>
            {/* Refresh */}
            <button
              onClick={() => refresh()}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Refresh notifications"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            {/* Settings */}
            <Link
              href={settingsHref}
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            {/* Close (mobile only) */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-slate-100">
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 text-sm text-[rgb(var(--admin-primary))] hover:underline"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification list */}
        <div
          className="flex-1 overflow-y-auto"
          role="list"
          aria-label="Notification list"
        >
          {isLoading && notifications.length === 0 ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <NotificationItemSkeleton key={i} compact />
            ))
          ) : recentNotifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">
                No notifications
              </h3>
              <p className="text-sm text-slate-500">
                You are all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            // Notification items
            <div className="divide-y divide-slate-100">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onArchive={archiveNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <Link
            href={listHref}
            onClick={onClose}
            className={cn(
              'block w-full text-center text-sm font-medium',
              'text-[rgb(var(--admin-primary))] hover:underline'
            )}
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
}

export default NotificationDropdown;
