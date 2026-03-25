'use client';

/**
 * NotificationListPage Component
 *
 * Full page notification list with filters, search, and bulk actions.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Settings, RefreshCw, Check, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationFilters as FiltersType } from '@/types/notification.types';
import { NotificationFilters } from './NotificationFilters';
import { NotificationBulkActions } from './NotificationBulkActions';
import { NotificationList } from './NotificationList';
import { cn } from '@/lib/utils';

export function NotificationListPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    totalCount,
    connectionStatus,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    archiveNotification,
    refresh,
  } = useNotifications();

  const [filters, setFilters] = useState<FiltersType>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
    fetchNotifications(newFilters);
  }, [fetchNotifications]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    fetchNotifications({});
  }, [fetchNotifications]);

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    setSelectedIds(allIds);
  }, [notifications]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkMarkAsRead = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await markMultipleAsRead(ids);
    setSelectedIds(new Set());
  }, [selectedIds, markMultipleAsRead]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await deleteMultiple(ids);
    setSelectedIds(new Set());
  }, [selectedIds, deleteMultiple]);

  const handleBulkArchive = useCallback(async () => {
    // Archive each selected notification
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await archiveNotification(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, archiveNotification]);

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} thông báo
              {unreadCount > 0 && ` (${unreadCount} chưa đọc)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <span
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              )}
              aria-label={isConnected ? 'Đã kết nối cập nhật thời gian thực' : 'Mất kết nối'}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isConnected ? 'Trực tiếp' : 'Ngoại tuyến'}</span>
            </span>

            {/* Refresh */}
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                'transition-colors disabled:opacity-50'
              )}
              aria-label="Làm mới thông báo"
            >
              <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            </button>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg',
                  'text-sm font-medium text-slate-700',
                  'bg-slate-100 hover:bg-slate-200 transition-colors'
                )}
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
              </button>
            )}

            {/* Toggle select mode */}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) {
                  setSelectedIds(new Set());
                }
              }}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectMode
                  ? 'bg-[rgb(var(--admin-primary))] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {selectMode ? 'Hủy' : 'Chọn'}
            </button>

            {/* Settings link */}
            <Link
              href="/admin/notifications/settings"
              className={cn(
                'p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                'transition-colors'
              )}
              aria-label="Cài đặt thông báo"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Select all when in select mode */}
        {selectMode && notifications.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-[rgb(var(--admin-primary))] hover:underline"
            >
              Chọn tất cả ({notifications.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-sm text-slate-500 hover:underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk actions */}
      <NotificationBulkActions
        selectedCount={selectedIds.size}
        onMarkAsRead={handleBulkMarkAsRead}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
        onClearSelection={handleClearSelection}
      />

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters sidebar */}
        <aside className="hidden lg:block">
          <NotificationFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Mobile filters */}
        <div className="lg:hidden">
          <NotificationFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Notification list */}
        <main>
          <NotificationList
            notifications={notifications}
            selectedIds={selectedIds}
            selectable={selectMode}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={fetchMore}
            onRead={markAsRead}
            onDelete={deleteNotification}
            onArchive={archiveNotification}
            onSelect={handleSelect}
          />
        </main>
      </div>
    </div>
  );
}

export default NotificationListPage;
