'use client';

/**
 * NotificationEmptyState Component
 *
 * Empty state for notification list when no notifications are available.
 */

import React from 'react';
import { Bell, Filter, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

export interface NotificationEmptyStateProps {
  status?: 'all' | 'unread' | 'read' | 'archived';
  onClearFilters?: () => void;
  className?: string;
}

export function NotificationEmptyState({
  status = 'all',
  onClearFilters,
  className,
}: NotificationEmptyStateProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'unread':
        return {
          title: 'No unread notifications',
          subtitle: 'You are all caught up! Check back later for updates.',
          icon: Bell,
        };
      case 'read':
        return {
          title: 'No read notifications',
          subtitle: 'Your read folder is empty. When you mark notifications as read, they will appear here.',
          icon: Inbox,
        };
      case 'archived':
        return {
          title: 'No archived notifications',
          subtitle: 'You have no archived notifications. Archive notifications to keep your inbox clean.',
          icon: Inbox,
        };
      default:
        return {
          title: 'No notifications',
          subtitle: 'You are all caught up! Check back later for updates.',
          icon: Bell,
        };
    }
  };

  const { title, subtitle, icon: Icon } = getStatusMessage();

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Icon size={32} className="text-[#A1A1AA]" />
      </div>
      <h3 className="text-lg font-semibold text-[#FAFAF9] mb-2">{title}</h3>
      <p className="text-[#A1A1AA] mb-6 max-w-xs">{subtitle}</p>

      {/* Action Buttons */}
      {onClearFilters && (status !== 'all' || typeof status === 'string') && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <Filter size={16} />
          Clear Filters
        </Button>
      )}

      {/* Quick Actions */}
      {status === 'all' && (
        <div className="mt-8 pt-8 border-t border-white/10 w-full max-w-xs">
          <p className="text-sm text-[#A1A1AA] mb-4">Quick Actions</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAF9] px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationEmptyState;
