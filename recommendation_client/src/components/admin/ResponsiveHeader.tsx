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
      'bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-8',
      'transition-all duration-300',
      // Account for mobile header height
      'mt-16 lg:mt-0'
    )}>
      <div className="flex items-center justify-between w-full">
        {/* Search Bar */}
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className={cn(
                'w-full pl-10 pr-4 py-2 bg-white text-slate-900',
                'border border-slate-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))] focus:border-transparent',
                'transition-all duration-200'
              )}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right Side: Notifications + User Profile */}
        <div className="flex items-center space-x-4 lg:space-x-6">
          {/* Notifications */}
          <NotificationBell />

          {/* User Profile */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[rgb(var(--admin-primary))] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm lg:text-base">
                {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-slate-900 font-medium text-sm">{user?.fullname || 'Admin'}</p>
              <p className="text-slate-500 text-xs capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
