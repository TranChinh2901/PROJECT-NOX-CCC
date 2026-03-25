'use client';

/**
 * ToastNotification Component
 *
 * Custom toast notification component for real-time updates.
 */

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Notification, NotificationAction } from '@/types/notification.types';
import { NotificationTypeIcon } from './icons';
import { cn } from '@/lib/utils';

export interface ToastNotificationProps {
  notification: Notification;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onDismiss?: () => void;
  onAction?: (action: NotificationAction) => void;
}

export function ToastNotification({
  notification,
  onDismiss,
  onAction,
}: ToastNotificationProps) {
  const router = useRouter();

  const handleClick = () => {
    if (notification.href) {
      router.push(notification.href);
      onDismiss?.();
    }
  };

  const handleActionClick = (action: NotificationAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
    onAction?.(action);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto',
        'ring-1 ring-black ring-opacity-5 overflow-hidden',
        'animate-in slide-in-from-right-full duration-300'
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'p-4 cursor-pointer hover:bg-slate-50 transition-colors',
          notification.href && 'cursor-pointer'
        )}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <NotificationTypeIcon
            type={notification.type}
            priority={notification.priority}
            size="sm"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 line-clamp-1">
              {notification.title}
            </p>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {notification.summary || notification.message}
            </p>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {notification.actions.slice(0, 2).map((action) => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(action);
                    }}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      action.variant === 'primary' && 'bg-[rgb(var(--admin-primary))] text-white hover:opacity-90',
                      action.variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      action.variant === 'danger' && 'bg-red-100 text-red-700 hover:bg-red-200',
                      !action.variant && 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Priority indicator */}
      {(notification.priority === 'high' || notification.priority === 'urgent') && (
        <div
          className={cn(
            'h-1',
            notification.priority === 'urgent' ? 'bg-red-500' : 'bg-amber-500'
          )}
        />
      )}
    </div>
  );
}

export default ToastNotification;
