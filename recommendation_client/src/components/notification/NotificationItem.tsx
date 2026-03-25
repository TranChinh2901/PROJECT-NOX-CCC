'use client';

/**
 * NotificationItem Component
 *
 * Displays individual notification with actions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Check,
  Trash2,
  Archive,
  ExternalLink,
  Package,
  AlertTriangle,
  Star,
  User,
  Tag,
  CreditCard,
  Truck,
  Bell,
} from 'lucide-react';
import { Notification } from '@/types/notification.types';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: 'border-l-[#A1A1AA]',
  medium: 'border-l-[#71717A]',
  high: 'border-l-[#CA8A04]',
  urgent: 'border-l-[#EF4444] animate-pulse',
};

const priorityBadgeColors = {
  low: 'bg-[#A1A1AA] text-white',
  medium: 'bg-[#71717A] text-white',
  high: 'bg-[#CA8A04] text-white',
  urgent: 'bg-[#EF4444] text-white animate-pulse',
};

const typeIcons = {
  order: Package,
  inventory: AlertTriangle,
  review: Star,
  user: User,
  system: Bell,
  promotion: Tag,
  payment: CreditCard,
  shipping: Truck,
};

export interface NotificationItemProps {
  notification: Notification;
  onRead?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export function NotificationItem({
  notification,
  onRead,
  onDelete,
  onArchive,
}: NotificationItemProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isRead, setIsRead] = useState(notification.status === 'read' || notification.status === 'archived');
  const [isArchived, setIsArchived] = useState(notification.status === 'archived');
  const menuRef = useRef<HTMLDivElement>(null);

  const Icon = typeIcons[notification.type] || Bell;
  const priorityColor = priorityColors[notification.priority];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    if (isRead) {
      // Notification already read, just navigate
      if (notification.href) {
        router.push(notification.href);
      }
    } else {
      // Mark as read and navigate
      if (onRead) {
        onRead();
        setIsRead(true);
      }
      if (notification.href) {
        router.push(notification.href);
      }
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRead) {
      onRead();
      setIsRead(true);
    }
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
      setShowActions(false);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive();
      setIsArchived(true);
      setShowActions(false);
    }
  };

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      // Archive reverses archived status
      onArchive();
      setIsArchived(false);
      setShowActions(false);
    }
  };

  return (
    <article
      className={cn(
        'group relative p-4 rounded-xl border transition-all duration-200 hover:border-white/10 hover:bg-white/5',
        isArchived ? 'opacity-60' : '',
        priorityColor,
        'border-l-4 border-l-transparent'
      )}
      role="listitem"
      aria-label={`${notification.type} notification: ${notification.title}`}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#CA8A04]/10 flex items-center justify-center">
            <Icon size={20} className="text-[#CA8A04]" />
          </div>
          {!isRead && !isArchived && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CA8A04] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#CA8A04]" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={cn(
                    'text-sm font-semibold truncate pr-2 transition-colors',
                    isRead ? 'text-[#A1A1AA]' : 'text-[#FAFAF9]'
                  )}
                >
                  {notification.title}
                </h4>
                {notification.priority === 'urgent' && (
                  <span className="px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold uppercase tracking-wider rounded">
                    Urgent
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-sm line-clamp-2 mb-2',
                  isRead ? 'text-[#A1A1AA]' : 'text-[#D4D4D8]'
                )}
              >
                {notification.message}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#71717A]">
                <time dateTime={new Date(notification.createdAt).toISOString()}>
                  {new Date(notification.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                {notification.type !== 'system' && (
                  <span className="capitalize">{notification.type}</span>
                )}
              </div>
            </div>

            {/* More Actions Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors"
                aria-label="More actions"
                aria-expanded={showActions}
              >
                <MoreVertical size={18} />
              </button>

              {/* Dropdown Menu */}
              {showActions && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-[#1C1917] border border-white/10 rounded-lg shadow-xl z-50 py-1"
                  role="menu"
                >
                  {!isRead && (
                    <button
                      onClick={handleMarkAsRead}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FAFAF9] hover:bg-white/5"
                      role="menuitem"
                    >
                      <Check size={16} />
                      Mark as read
                    </button>
                  )}
                  {notification.href && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FAFAF9] hover:bg-white/5"
                      role="menuitem"
                    >
                      <ExternalLink size={16} />
                      View details
                    </button>
                  )}
                  {!isArchived ? (
                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FAFAF9] hover:bg-white/5"
                      role="menuitem"
                    >
                      <Archive size={16} />
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={handleUnarchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FAFAF9] hover:bg-white/5"
                      role="menuitem"
                    >
                      <Archive size={16} />
                      Unarchive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      role="menuitem"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default NotificationItem;
