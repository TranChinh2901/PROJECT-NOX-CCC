import { Suspense } from 'react';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';
import PageSkeleton from '@/components/common/PageSkeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="flex">
            <AdminSidebar />
            <div className="flex-1 ml-64">
              <AdminHeader />
              <main className="p-8">
                <Suspense fallback={<PageSkeleton />}>
                  {children}
                </Suspense>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
