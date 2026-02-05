'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Tags,
  Bell,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

interface ResponsiveSidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export default function ResponsiveSidebar({ onToggle }: ResponsiveSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Desktop: collapsed state
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Keyboard shortcut: Alt+S to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setCollapsed(prev => {
          const newState = !prev;
          onToggle?.(newState);
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleDesktopSidebar = () => {
    setCollapsed(prev => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  };

  const toggleMobileDrawer = () => {
    setMobileOpen(prev => !prev);
  };

  const closeMobileDrawer = () => {
    setMobileOpen(false);
  };

  const renderNavItems = (mobile = false) => (
    <ul className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={mobile ? closeMobileDrawer : undefined}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg transition-all duration-200',
                'group relative',
                active
                  ? 'bg-[rgb(var(--admin-primary))] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                collapsed && !mobile ? 'justify-center' : 'space-x-3'
              )}
              aria-label={item.label}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-opacity duration-200',
                collapsed && !mobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                  active ? 'bg-white/20 text-white' : 'bg-[rgb(var(--admin-primary))] text-white',
                  collapsed && !mobile && 'hidden'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center px-4">
        <button
          onClick={toggleMobileDrawer}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-slate-900">Admin Panel</h1>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            <button
              onClick={closeMobileDrawer}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {renderNavItems(true)}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-slate-200">
            <Link
              href="/"
              onClick={closeMobileDrawer}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Back to Store</span>
            </Link>

            <button
              onClick={() => {
                logout();
                closeMobileDrawer();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-[#dc2626] hover:text-white transition-colors mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:flex fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full w-full">
          {/* Desktop Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h1 className={cn(
              'text-xl font-bold text-slate-900 transition-opacity duration-200',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              Admin Panel
            </h1>
            <button
              onClick={toggleDesktopSidebar}
              className={cn(
                'p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors',
                collapsed && 'mx-auto'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar (Alt+S)' : 'Collapse sidebar (Alt+S)'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {renderNavItems(false)}
          </nav>

          {/* Desktop Footer */}
          <div className="p-4 border-t border-slate-200">
            <Link
              href="/"
              className={cn(
                'flex items-center px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors',
                collapsed ? 'justify-center' : 'space-x-3'
              )}
              aria-label="Back to Store"
              title={collapsed ? 'Back to Store' : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-opacity duration-200',
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                Back to Store
              </span>
            </Link>

            <button
              onClick={() => logout()}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-lg text-slate-600 hover:bg-[#dc2626] hover:text-white transition-colors mt-2',
                collapsed ? 'justify-center' : 'space-x-3'
              )}
              aria-label="Logout"
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-opacity duration-200',
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
