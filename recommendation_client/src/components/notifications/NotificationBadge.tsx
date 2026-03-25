'use client';

/**
 * NotificationBadge Component
 *
 * Displays unread notification count with optional pulse animation.
 */

import { cn } from '@/lib/utils';

export interface NotificationBadgeProps {
  count: number;
  max?: number;
  pulse?: boolean;
  className?: string;
}

export function NotificationBadge({
  count,
  max = 99,
  pulse = false,
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'text-[10px] font-semibold text-white',
        'bg-[rgb(var(--admin-error))] rounded-full',
        'ring-2 ring-white',
        pulse && 'animate-pulse',
        className
      )}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  );
}

export default NotificationBadge;
