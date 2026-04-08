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
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Bảng điều khiển', exact: true },
  { href: '/admin/users', icon: Users, label: 'Người dùng' },
  { href: '/admin/products', icon: Package, label: 'Sản phẩm' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { href: '/admin/categories', icon: Tags, label: 'Danh mục' },
  { href: '/admin/notifications', icon: Bell, label: 'Thông báo' },
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
  const [mobileDrawerPath, setMobileDrawerPath] = useState(pathname);
  const isMobileDrawerOpen = mobileOpen && mobileDrawerPath === pathname;

  useBodyScrollLock(isMobileDrawerOpen);

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

  const toggleDesktopSidebar = () => {
    setCollapsed(prev => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  };

  const toggleMobileDrawer = () => {
    setMobileOpen((prev) => {
      if (prev && mobileDrawerPath === pathname) {
        return false;
      }

      setMobileDrawerPath(pathname);
      return true;
    });
  };

  const closeMobileDrawer = () => {
    setMobileOpen(false);
  };

  const renderNavItems = (mobile = false) => (
    <ul className="space-y-1.5">
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
                'group relative font-medium',
                active
                  ? 'bg-[rgb(var(--admin-primary))] text-white shadow-md'
                  : 'text-[rgb(var(--admin-text-muted))] hover:bg-[rgb(var(--admin-primary))]/8 hover:text-[rgb(var(--admin-primary))]',
                collapsed && !mobile ? 'justify-center' : 'space-x-3'
              )}
              aria-label={item.label}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-all duration-200',
                collapsed && !mobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  'ml-auto px-2 py-0.5 text-xs font-bold rounded-full',
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[rgb(var(--admin-border))] h-16 flex items-center px-5 shadow-sm">
        <button
          onClick={toggleMobileDrawer}
          className="p-2 text-[rgb(var(--admin-text-muted))] hover:text-[rgb(var(--admin-primary))] hover:bg-[rgb(var(--admin-primary))]/8 rounded-lg transition-all duration-200"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-[rgb(var(--admin-text))] tracking-tight">Trang quản trị</h1>
      </div>

      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-72 bg-white border-r border-[rgb(var(--admin-border))] z-50 shadow-2xl overscroll-none',
          'transform transition-transform duration-300 ease-out',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="p-6 border-b border-[rgb(var(--admin-border))] flex items-center justify-between">
            <h1 className="text-xl font-bold text-[rgb(var(--admin-text))] tracking-tight">Trang quản trị</h1>
            <button
              onClick={closeMobileDrawer}
              className="p-2 text-[rgb(var(--admin-text-muted))] hover:text-[rgb(var(--admin-primary))] hover:bg-[rgb(var(--admin-primary))]/8 rounded-lg transition-all duration-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
            {renderNavItems(true)}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-[rgb(var(--admin-border))]">
            <Link
              href="/"
              onClick={closeMobileDrawer}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-[rgb(var(--admin-text-muted))] hover:bg-[rgb(var(--admin-primary))]/8 hover:text-[rgb(var(--admin-primary))] transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5" />
              <span>Về trang cửa hàng</span>
            </Link>

            <button
              onClick={() => {
                logout();
                closeMobileDrawer();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-[rgb(var(--admin-text-muted))] hover:bg-[rgb(var(--admin-error))]/10 hover:text-[rgb(var(--admin-error))] transition-all duration-200 mt-2 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:flex fixed left-0 top-0 h-full bg-white border-r border-[rgb(var(--admin-border))] z-40 shadow-sm',
          'transition-all duration-300 ease-out',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full w-full">
          {/* Desktop Header */}
          <div className={cn(
            'border-b border-[rgb(var(--admin-border))] flex items-center justify-between transition-all duration-300',
            collapsed ? 'p-4' : 'p-6'
          )}>
            <h1 className={cn(
              'text-xl font-bold text-[rgb(var(--admin-text))] tracking-tight transition-all duration-200',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              Trang quản trị
            </h1>
            <button
              onClick={toggleDesktopSidebar}
              className={cn(
                'p-2 text-[rgb(var(--admin-text-muted))] hover:text-[rgb(var(--admin-primary))] hover:bg-[rgb(var(--admin-primary))]/8 rounded-lg transition-all duration-200 flex-shrink-0',
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
          <div className="p-4 border-t border-[rgb(var(--admin-border))]">
            <Link
              href="/"
              className={cn(
                'flex items-center px-4 py-3 rounded-lg text-[rgb(var(--admin-text-muted))] hover:bg-[rgb(var(--admin-primary))]/8 hover:text-[rgb(var(--admin-primary))] transition-all duration-200 font-medium',
                collapsed ? 'justify-center' : 'space-x-3'
              )}
              aria-label="Về trang cửa hàng"
              title={collapsed ? 'Về trang cửa hàng' : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-all duration-200',
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                Về trang cửa hàng
              </span>
            </Link>

            <button
              onClick={() => logout()}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-lg text-[rgb(var(--admin-text-muted))] hover:bg-[rgb(var(--admin-error))]/10 hover:text-[rgb(var(--admin-error))] transition-all duration-200 mt-2 font-medium',
                collapsed ? 'justify-center' : 'space-x-3'
              )}
              aria-label="Đăng xuất"
              title={collapsed ? 'Đăng xuất' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'transition-all duration-200',
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                Đăng xuất
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
