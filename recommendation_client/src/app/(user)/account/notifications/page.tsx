'use client';

/**
 * Notifications Page
 *
 * User-facing notification center page accessible from account section.
 */

import { useState } from 'react';
import { Bell, Filter, Check, Archive, Settings } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from '@/components/notification/NotificationItem';
import { NotificationEmptyState } from '@/components/notification/NotificationEmptyState';
import { Button } from '@/components/common/Button';
import { NotificationFilters, NotificationPriority, NotificationStatus } from '@/types/notification.types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Status options for filtering
const statusOptions: { value: NotificationStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Bell size={16} /> },
  { value: 'unread', label: 'Unread', icon: <Bell size={16} className="fill-current" /> },
  { value: 'read', label: 'Read', icon: <Check size={16} /> },
  { value: 'archived', label: 'Archived', icon: <Archive size={16} /> },
];

// Priority filter options
const priorityOptions: { value: NotificationPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function NotificationsPageContent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refresh,
    fetchNotifications,
  } = useNotifications();

  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<NotificationFilters>({});

  // Handle status filter change
  const handleStatusChange = (status: NotificationStatus | 'all') => {
    setSelectedStatus(status);
    const newFilters = { ...filters, status: status === 'all' ? undefined : status };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  // Handle priority filter change
  const handlePriorityChange = (priority: NotificationPriority | 'all') => {
    setSelectedPriority(priority);
    const newFilters = { ...filters, priority: priority === 'all' ? undefined : priority };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery || undefined };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setFilters({});
    fetchNotifications({});
  };

  const isConnected = connectionStatus === 'connected';
  const hasUnread = unreadCount > 0;

  // Get filtered notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesStatus =
      selectedStatus === 'all' ||
      notification.status === selectedStatus ||
      (selectedStatus === 'read' && notification.status === 'read');
    const matchesPriority =
      selectedPriority === 'all' || notification.priority === selectedPriority;
    const matchesSearch =
      !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#1C1917] pt-32 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#FAFAF9] mb-1">Notifications</h1>
            <p className="text-[#A1A1AA]">
              {isLoading ? 'Loading...' : `${filteredNotifications.length} of ${notifications.length} notifications`}
              {hasUnread && ` • ${unreadCount} unread`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                isConnected
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-amber-500'
                )}
              />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Refresh notifications"
            >
              <Bell size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Mark all as read */}
            {hasUnread && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={16} />}
                onClick={() => {
                  markAllAsRead();
                }}
              >
                Mark all read
              </Button>
            )}

            {/* Settings */}
            <Link
              href="/account/notifications/settings"
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors"
              aria-label="Notification settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#292524] rounded-xl p-4 mb-6 border border-white/10">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Bell size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1C1917] border border-[#3F3F46] rounded-lg text-[#FAFAF9] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/50 focus:border-[#CA8A04] transition-all"
              aria-label="Search notifications"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleClearFilters();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FAFAF9]"
                aria-label="Clear search"
              >
                <Filter size={18} />
              </button>
            )}
          </div>
        </form>

        {/* Status Filter Tabs (Desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar md:pb-0">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                selectedStatus === option.value
                  ? 'bg-[#CA8A04] text-white'
                  : 'bg-[#3F3F46] text-[#A1A1AA] hover:bg-[#404042] hover:text-[#FAFAF9]'
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Priority Filter (Desktop) */}
        <div className="flex items-center gap-3 mt-4 hidden md:flex">
          <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Priority:</span>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePriorityChange(option.value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg transition-colors',
                  selectedPriority === option.value
                    ? 'bg-[#CA8A04] text-white'
                    : 'bg-[#3F3F46] text-[#A1A1AA] hover:bg-[#404042] hover:text-[#FAFAF9]'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {(selectedStatus !== 'all' || selectedPriority !== 'all' || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-xs text-[#A1A1AA] hover:text-red-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Mobile Filters Toggle */}
        <div className="md:hidden mt-4 pt-4 border-t border-[#3F3F46]">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#FAFAF9]"
          >
            <Filter size={16} />
            {isMobileFiltersOpen ? 'Hide filters' : 'Show filters'}
          </button>

          {isMobileFiltersOpen && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
              <div>
                <label className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-2 block">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePriorityChange(option.value)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-colors',
                        selectedPriority === option.value
                          ? 'bg-[#CA8A04] text-white'
                          : 'bg-[#3F3F46] text-[#A1A1AA] hover:bg-[#404042] hover:text-[#FAFAF9]'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading && filteredNotifications.length === 0 ? (
          // Loading State
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#3F3F46] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#3F3F46] rounded w-3/4" />
                <div className="h-3 bg-[#3F3F46] rounded w-full" />
                <div className="h-3 bg-[#3F3F46] rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          // Empty State
          <NotificationEmptyState
            status={selectedStatus}
            onClearFilters={handleClearFilters}
          />
        ) : (
          // Notifications
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
              onArchive={() => archiveNotification(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
