import { Suspense } from 'react';
import { Fira_Sans, Fira_Code } from 'next/font/google';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';
import PageSkeleton from '@/components/common/PageSkeleton';

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className={firaSans.className}>
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
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
