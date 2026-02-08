'use client';

/**
 * NotificationCenter Component
 *
 * User-facing notification center with sidebar and modeless panel options.
 * Features real-time updates, filtering, and notification management.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Filter, Check, Trash2, Archive, MoreVertical, Settings, ChevronDown } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { NotificationFilterChip } from './NotificationFilterChip';
import { NotificationEmptyState } from './NotificationEmptyState';
import { cn } from '@/lib/utils';
import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification.types';
import { Button } from '@/components/common/Button';
import { LiquidButton } from '../ui/LiquidButton';
import Link from 'next/link';

// Status options for filtering
const statusOptions: { value: NotificationStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Notifications', icon: <Bell size={16} /> },
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

export interface NotificationCenterProps {
  initialOpen?: boolean;
  onClose?: () => void;
  variant?: 'sidebar' | 'modal';
  className?: string;
}

export function NotificationCenter({
  initialOpen = false,
  onClose,
  variant = 'sidebar',
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Toggle open state
  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (!newState && onClose) {
      onClose();
    }
  };

  // Handle status filter change
  const handleStatusChange = (status: NotificationStatus | 'all') => {
    setSelectedStatus(status);
    fetchNotifications({ status: status === 'all' ? undefined : status });
  };

  // Handle priority filter change
  const handlePriorityChange = (priority: NotificationPriority | 'all') => {
    setSelectedPriority(priority);
    fetchNotifications({ priority: priority === 'all' ? undefined : priority });
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotifications({ search: searchQuery || undefined });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    fetchNotifications({});
  };

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

  // Auto-close on mobile when notification is clicked
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleOpen();
        return;
      }

      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isConnected = connectionStatus === 'connected';
  const hasUnread = unreadCount > 0;

  return (
    <>
      {/* Trigger Button (for modal variant) */}
      {variant === 'modal' && (
        <button
          onClick={toggleOpen}
          className="relative p-2 rounded-full transition-colors text-[#FAFAF9] hover:bg-white/10"
          aria-label="Open notifications"
        >
          <Bell size={24} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#CA8A04] text-[10px] font-bold text-white ring-2 ring-[#1C1917]">
              {unreadCount > 99 ? '99+' : String(unreadCount)}
            </span>
          )}
        </button>
      )}

      {/* Sidebar / Modal Container */}
      <div
        className={cn(
          'flex flex-col bg-[#1C1917] text-[#FAFAF9]',
          // Sidebar variant
          variant === 'sidebar' && cn(
            'h-full w-full md:w-96 border-r border-white/10',
            'absolute inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : 'translate-x-full',
            'md:relative md:translate-x-0'
          ),
          // Modal variant
          variant === 'modal' && cn(
            'fixed inset-0 z-50',
            isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          ),
          className
        )}
      >
        {/* Mobile Overlay */}
        {isOpen && variant === 'modal' && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={toggleOpen}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Content */}
        <div
          ref={containerRef}
          className={cn(
            'flex flex-col h-full',
            variant === 'sidebar' ? 'w-full' : 'w-full md:w-[400px] lg:w-[450px]'
          )}
          role="dialog"
          aria-modal={variant === 'modal' ? isOpen : undefined}
          aria-label="Notification Center"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell size={24} className="text-[#CA8A04]" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#CA8A04] text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#FAFAF9]">Notifications</h2>
                <p className="text-sm text-[#A1A1AA]">
                  {isLoading ? 'Loading...' : `${filteredNotifications.length} notifications`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {variant === 'modal' && (
                <button
                  onClick={toggleOpen}
                  className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors"
                  aria-label="Close notifications"
                >
                  <X size={20} />
                </button>
              )}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Refresh notifications"
              >
                <Bell size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <Link
                href="/account/settings/notifications"
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/10 transition-colors"
                aria-label="Notification settings"
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>

          {/* Status Filter Tabs (Desktop) */}
          <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto border-b border-white/10 no-scrollbar">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  selectedStatus === option.value
                    ? 'bg-[#CA8A04]/20 text-[#CA8A04] border border-[#CA8A04]/30'
                    : 'text-[#A1A1AA] hover:text-[#FAFAF9] hover:bg-white/5'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>

          {/* Filters Bar (Mobile) */}
          <div className="px-6 py-3 border-b border-white/10 md:hidden">
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#FAFAF9]"
            >
              <Filter size={16} />
              Filters
              <ChevronDown
                size={16}
                className={cn('transition-transform', isMobileFiltersOpen && 'rotate-180')}
              />
            </button>
            {isMobileFiltersOpen && (
              <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
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
                          'px-3 py-1.5 text-xs rounded-full transition-colors',
                          selectedPriority === option.value
                            ? 'bg-[#CA8A04] text-white'
                            : 'bg-white/10 text-[#A1A1AA] hover:bg-white/20'
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

          {/* Search & Mobile Priority Filter */}
          <div className="px-6 py-4 border-b border-white/10 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[#FAFAF9] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/50 focus:border-[#CA8A04] transition-all"
                aria-label="Search notifications"
              />
              <Bell size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
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
                  <X size={16} />
                </button>
              )}
            </form>
          </div>

          {/* Priority Filter (Desktop) */}
          <div className="px-6 py-3 border-b border-white/10 hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Priority:</span>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePriorityChange(option.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-full transition-colors',
                      selectedPriority === option.value
                        ? 'bg-[#CA8A04] text-white'
                        : 'bg-white/10 text-[#A1A1AA] hover:bg-white/20'
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
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {isLoading && filteredNotifications.length === 0 ? (
              // Loading State
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
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

          {/* Footer Actions */}
          {hasUnread && filteredNotifications.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<Check size={16} />}
                onClick={() => {
                  markAllAsRead();
                  handleClearFilters();
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}

          {/* Connection Status Indicator (Mobile Only) */}
          <div className="md:hidden px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-amber-500'
              )}
              aria-label={isConnected ? 'Connected to real-time updates' : 'Disconnected'}
            />
            <span className="text-xs text-[#A1A1AA]">
              {isConnected ? 'Live updates enabled' : 'Offline - showing cached data'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationCenter;
