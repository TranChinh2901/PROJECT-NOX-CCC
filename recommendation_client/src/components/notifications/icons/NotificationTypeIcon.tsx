'use client';

/**
 * NotificationTypeIcon Component
 *
 * Renders appropriate icon based on notification type.
 */

import {
  Package,
  AlertTriangle,
  Star,
  User,
  Bell,
  Tag,
  CreditCard,
  Truck,
  LucideIcon,
} from 'lucide-react';
import { NotificationType, NotificationPriority } from '@/types/notification.types';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationType, LucideIcon> = {
  order: Package,
  inventory: AlertTriangle,
  review: Star,
  user: User,
  system: Bell,
  promotion: Tag,
  payment: CreditCard,
  shipping: Truck,
};

const colorMap: Record<NotificationType, string> = {
  order: 'bg-blue-100 text-blue-600',
  inventory: 'bg-amber-100 text-amber-600',
  review: 'bg-yellow-100 text-yellow-600',
  user: 'bg-purple-100 text-purple-600',
  system: 'bg-slate-100 text-slate-600',
  promotion: 'bg-green-100 text-green-600',
  payment: 'bg-emerald-100 text-emerald-600',
  shipping: 'bg-indigo-100 text-indigo-600',
};

const priorityRing: Record<NotificationPriority, string> = {
  low: '',
  medium: '',
  high: 'ring-2 ring-amber-300',
  urgent: 'ring-2 ring-red-400 animate-pulse',
};

export interface NotificationTypeIconProps {
  type: NotificationType;
  priority?: NotificationPriority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NotificationTypeIcon({
  type,
  priority = 'medium',
  size = 'md',
  className,
}: NotificationTypeIconProps) {
  const Icon = iconMap[type] || Bell;
  const colorClass = colorMap[type] || colorMap.system;
  const priorityClass = priorityRing[priority];

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        sizeClasses[size],
        colorClass,
        priorityClass,
        className
      )}
      aria-hidden="true"
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}

export default NotificationTypeIcon;
