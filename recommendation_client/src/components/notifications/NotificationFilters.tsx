'use client';

/**
 * NotificationFilters Component
 *
 * Filter controls for the notification list page.
 */

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import {
  NotificationFilters as FiltersType,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '@/types/notification.types';
import { cn } from '@/lib/utils';

export interface NotificationFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onClear: () => void;
}

const typeOptions: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'order', label: 'Orders' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'review', label: 'Reviews' },
  { value: 'user', label: 'Users' },
  { value: 'system', label: 'System' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'payment', label: 'Payments' },
  { value: 'shipping', label: 'Shipping' },
];

const priorityOptions: { value: NotificationPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const statusOptions: { value: NotificationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
];

export function NotificationFilters({
  filters,
  onFiltersChange,
  onClear,
}: NotificationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  const handleTypeChange = (value: NotificationType | 'all') => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? undefined : value,
    });
  };

  const handlePriorityChange = (value: NotificationPriority | 'all') => {
    onFiltersChange({
      ...filters,
      priority: value === 'all' ? undefined : value,
    });
  };

  const handleStatusChange = (value: NotificationStatus | 'all') => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : value,
    });
  };

  const hasActiveFilters =
    filters.type ||
    filters.priority ||
    filters.status ||
    filters.search ||
    filters.dateRange;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search notifications..."
            className={cn(
              'w-full pl-10 pr-4 py-2 text-sm',
              'bg-slate-50 border border-slate-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))] focus:border-transparent',
              'placeholder:text-slate-400'
            )}
            aria-label="Search notifications"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, search: undefined });
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter toggle for mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 md:hidden"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-[rgb(var(--admin-primary))] text-white rounded-full">
              Active
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'transform rotate-180'
          )}
        />
      </button>

      {/* Filter options */}
      <div
        className={cn(
          'space-y-4',
          'md:block',
          !isExpanded && 'hidden md:block'
        )}
      >
        {/* Status filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors',
                  (filters.status || 'all') === option.value
                    ? 'bg-[rgb(var(--admin-primary))] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Type
          </label>
          <select
            value={filters.type || 'all'}
            onChange={(e) => handleTypeChange(e.target.value as NotificationType | 'all')}
            className={cn(
              'w-full px-3 py-2 text-sm',
              'bg-slate-50 border border-slate-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))] focus:border-transparent'
            )}
            aria-label="Filter by type"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Priority
          </label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => handlePriorityChange(e.target.value as NotificationPriority | 'all')}
            className={cn(
              'w-full px-3 py-2 text-sm',
              'bg-slate-50 border border-slate-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))] focus:border-transparent'
            )}
            aria-label="Filter by priority"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationFilters;
