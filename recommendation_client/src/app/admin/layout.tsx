'use client';

import { Suspense, useState } from 'react';
import { Fira_Sans, Fira_Code } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import ResponsiveHeader from '@/components/admin/ResponsiveHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

const firaSans = Fira_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-admin-sans',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-admin-mono',
  display: 'swap',
});

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[rgb(var(--admin-background))] text-slate-900">
      <ResponsiveSidebar onToggle={setSidebarCollapsed} />
      <div className={cn(
        'flex-1 transition-all duration-300',
        // Desktop margin adjustment based on sidebar state
        'lg:ml-64',
        sidebarCollapsed && 'lg:ml-16'
      )}>
        <ResponsiveHeader sidebarCollapsed={sidebarCollapsed} />
        <main className="p-4 lg:p-8">
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
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className={firaSans.className}>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}
