'use client';

/**
 * NotificationItem Component
 *
 * Displays individual notification with actions.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Check, Trash2, Archive, ExternalLink } from 'lucide-react';
import { Notification } from '@/types/notification.types';
import { NotificationTypeIcon } from './icons';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  compact = false,
  onRead,
  onDelete,
  onArchive,
  onClick,
}: NotificationItemProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    } else if (notification.href) {
      if (isUnread && onRead) {
        onRead(notification.id);
      }
      router.push(notification.href);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRead?.(notification.id);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
    setShowActions(false);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(notification.id);
    setShowActions(false);
  };

  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <article
      role="listitem"
      aria-label={`${notification.type} notification: ${notification.title}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
        if (e.key === 'r' && isUnread) {
          onRead?.(notification.id);
        }
        if (e.key === 'Delete') {
          onDelete?.(notification.id);
        }
      }}
      className={cn(
        'relative flex gap-3 p-3 cursor-pointer transition-colors',
        'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--admin-primary))]',
        isUnread && 'bg-blue-50/50',
        compact ? 'py-2' : 'py-3'
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--admin-primary))]"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <NotificationTypeIcon
        type={notification.type}
        priority={notification.priority}
        size={compact ? 'sm' : 'md'}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm line-clamp-1',
              isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
            )}
          >
            {notification.title}
          </h4>
          <time
            dateTime={new Date(notification.createdAt).toISOString()}
            className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0"
          >
            {formattedTime}
          </time>
        </div>
        <p
          id={`notification-${notification.id}-description`}
          className={cn(
            'text-sm text-slate-500 mt-0.5',
            compact ? 'line-clamp-1' : 'line-clamp-2'
          )}
        >
          {notification.message}
        </p>

        {/* Actions for non-compact mode */}
        {!compact && notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {notification.actions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (action.href) {
                    router.push(action.href);
                  } else if (action.onClick) {
                    action.onClick();
                  }
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

      {/* More actions menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className={cn(
            'p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100',
            'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
            showActions && 'opacity-100 bg-slate-100'
          )}
          aria-label="More actions"
          aria-expanded={showActions}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
              }}
            />
            <div
              className={cn(
                'absolute right-0 top-full mt-1 z-20',
                'bg-white rounded-lg shadow-lg border border-slate-200',
                'py-1 min-w-[140px]'
              )}
              role="menu"
            >
              {isUnread && (
                <button
                  onClick={handleMarkAsRead}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </button>
              )}
              {notification.href && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(notification.href!);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <ExternalLink className="w-4 h-4" />
                  View details
                </button>
              )}
              {onArchive && (
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default NotificationItem;
