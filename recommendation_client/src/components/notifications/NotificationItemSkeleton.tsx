'use client';

/**
 * NotificationItemSkeleton Component
 *
 * Loading placeholder for notification items.
 */

import { cn } from '@/lib/utils';

export interface NotificationItemSkeletonProps {
  compact?: boolean;
}

export function NotificationItemSkeleton({ compact = false }: NotificationItemSkeletonProps) {
  return (
    <div
      className={cn(
        'flex gap-3 p-3 animate-pulse',
        compact ? 'py-2' : 'py-3'
      )}
      aria-hidden="true"
    >
      {/* Icon skeleton */}
      <div
        className={cn(
          'rounded-full bg-slate-200 flex-shrink-0',
          compact ? 'w-8 h-8' : 'w-10 h-10'
        )}
      />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-16" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-full" />
        {!compact && <div className="h-3 bg-slate-200 rounded w-2/3" />}
      </div>
    </div>
  );
}

export default NotificationItemSkeleton;
