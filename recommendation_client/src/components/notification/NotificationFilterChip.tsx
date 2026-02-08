'use client';

/**
 * NotificationFilterChip Component
 *
 * Filter chip for notification filtering.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface NotificationFilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

export function NotificationFilterChip({
  label,
  isActive,
  onClick,
  count,
}: NotificationFilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        isActive
          ? 'bg-[#CA8A04]/20 text-[#CA8A04] border border-[#CA8A04]/30'
          : 'bg-white/5 text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10'
      )}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs',
            isActive ? 'bg-[#CA8A04] text-white' : 'bg-[#3F3F46] text-[#A1A1AA]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default NotificationFilterChip;
