'use client';

import { Suspense, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import ResponsiveHeader from '@/components/admin/ResponsiveHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { RoleType } from '@/types/auth.types';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/account/login?redirect=/admin');
      return;
    }

    if (user?.role !== RoleType.ADMIN) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  if (isLoading || !isAuthenticated || user?.role !== RoleType.ADMIN) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--admin-background))] text-[rgb(var(--admin-text))]">
      <ResponsiveSidebar onToggle={setSidebarCollapsed} />
      <div className={cn(
        'flex-1 transition-all duration-300 ease-out',
        // Desktop margin adjustment based on sidebar state
        'lg:ml-64',
        sidebarCollapsed && 'lg:ml-20'
      )}>
        <ResponsiveHeader sidebarCollapsed={sidebarCollapsed} />
        <main className="p-5 lg:p-8 xl:p-10">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        {
          ['--font-admin-sans' as string]: '"IBM Plex Sans", "Segoe UI", Helvetica, sans-serif',
          ['--font-admin-mono' as string]: '"IBM Plex Mono", "SFMono-Regular", monospace',
        } as CSSProperties
      }
    >
      <NotificationProvider
        wsEndpoint={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}
        enableToasts={true}
      >
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#1e293b',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: 'rgb(var(--admin-success))',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: 'rgb(var(--admin-error))',
                secondary: '#fff',
              },
            },
          }}
        />
      </NotificationProvider>
    </div>
  );
}
