'use client';

/**
 * NotificationBulkActions Component
 *
 * Bulk action controls for selected notifications.
 */

import { Check, Trash2, Archive, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationBulkActionsProps {
  selectedCount: number;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onClearSelection: () => void;
}

export function NotificationBulkActions({
  selectedCount,
  onMarkAsRead,
  onDelete,
  onArchive,
  onClearSelection,
}: NotificationBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'sticky top-0 z-10',
        'flex items-center justify-between gap-4',
        'px-4 py-3 mb-4',
        'bg-[rgb(var(--admin-primary))] text-white rounded-lg',
        'shadow-lg'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{selectedCount} đã chọn</span>
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-white/20 rounded"
          aria-label="Bỏ chọn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onMarkAsRead}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5',
            'text-sm font-medium rounded-md',
            'bg-white/20 hover:bg-white/30 transition-colors'
          )}
        >
          <Check className="w-4 h-4" />
          <span className="hidden sm:inline">Đánh dấu đã đọc</span>
        </button>
        <button
          onClick={onArchive}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5',
            'text-sm font-medium rounded-md',
            'bg-white/20 hover:bg-white/30 transition-colors'
          )}
        >
          <Archive className="w-4 h-4" />
          <span className="hidden sm:inline">Lưu trữ</span>
        </button>
        <button
          onClick={onDelete}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5',
            'text-sm font-medium rounded-md',
            'bg-red-500/80 hover:bg-red-500 transition-colors'
          )}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Xóa</span>
        </button>
      </div>
    </div>
  );
}

export default NotificationBulkActions;
