'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, MapPin, UserCog } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import PageSkeleton from '@/components/common/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';

const settingsCards = [
  {
    title: 'Notifications',
    description: 'Manage order, system, and promotion alerts.',
    href: '/account/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Profile Details',
    description: 'Update your personal information and avatar.',
    href: '/account/profile/edit',
    icon: UserCog,
  },
  {
    title: 'Addresses',
    description: 'Manage saved delivery addresses for checkout.',
    href: '/account/addresses',
    icon: MapPin,
  },
] as const;

export default function AccountSettingsPage() {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <>
        <Header />
        <PageSkeleton rows={4} />
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/account/login');
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-32">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-600">Manage your account preferences and saved information.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {settingsCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="block">
                  <div className="group h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CA8A04]/10 text-[#CA8A04]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">{card.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
