'use client';

/**
 * NotificationBell Component
 *
 * Header notification bell icon with unread badge and dropdown.
 */

import { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationBadge } from './NotificationBadge';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

export interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  maxBadgeCount?: number;
  onOpen?: () => void;
  onClose?: () => void;
}

export function NotificationBell({
  className,
  showBadge = true,
  maxBadgeCount = 99,
  onOpen,
  onClose,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { unreadCount } = useNotifications();

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
    buttonRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
          isOpen && 'bg-slate-100 text-slate-900',
          className
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="notification-dropdown"
      >
        <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
        {showBadge && unreadCount > 0 && (
          <NotificationBadge
            count={unreadCount}
            max={maxBadgeCount}
            pulse={unreadCount > 0}
          />
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
}

export default NotificationBell;
