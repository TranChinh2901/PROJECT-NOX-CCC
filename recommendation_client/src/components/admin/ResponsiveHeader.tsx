'use client';

import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications';
import { cn } from '@/lib/utils';

interface ResponsiveHeaderProps {
  sidebarCollapsed?: boolean;
}

export default function ResponsiveHeader({ sidebarCollapsed = false }: ResponsiveHeaderProps) {
  const { user } = useAuth();

  return (
    <header className={cn(
      'bg-white border-b border-[rgb(var(--admin-border))] h-16 flex items-center px-5 lg:px-8 shadow-sm',
      'transition-all duration-300',
      // Account for mobile header height
      'mt-16 lg:mt-0'
    )}>
      <div className="flex items-center justify-between w-full gap-6">
        {/* Search Bar */}
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[rgb(var(--admin-text-subtle))] w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className={cn(
                'w-full pl-11 pr-4 py-2.5 bg-[rgb(var(--admin-background))] text-[rgb(var(--admin-text))]',
                'border border-transparent rounded-lg',
                'placeholder:text-[rgb(var(--admin-text-subtle))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]/30 focus:border-[rgb(var(--admin-primary))] focus:bg-white',
                'transition-all duration-200'
              )}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right Side: Notifications + User Profile */}
        <div className="flex items-center space-x-4 lg:space-x-5">
          {/* Notifications */}
          <NotificationBell />

          {/* User Profile */}
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[rgb(var(--admin-primary))] to-[rgb(var(--admin-primary-hover))] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <span className="text-white font-bold text-sm lg:text-base">
                {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[rgb(var(--admin-text))] font-semibold text-sm leading-tight">{user?.fullname || 'Admin'}</p>
              <p className="text-[rgb(var(--admin-text-muted))] text-xs capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
