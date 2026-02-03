'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Tags,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#1C1917] border-r border-[#292524] z-50">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-[#292524]">
          <h1 className="text-xl font-bold text-[#FAFAF9]">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-[#7366ff] text-white'
                        : 'text-[#A1A1AA] hover:bg-[#292524] hover:text-[#FAFAF9]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#292524]">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-[#A1A1AA] hover:bg-[#292524] hover:text-[#FAFAF9] transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Store</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-[#A1A1AA] hover:bg-[#dc2626] hover:text-white transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}