'use client';

/**
 * Notification Settings Page Route
 *
 * User notification preferences management.
 */

import { Suspense } from 'react';
import { NotificationSettingsPage } from '@/components/notifications';
import PageSkeleton from '@/components/common/PageSkeleton';

export default function NotificationSettingsRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationSettingsPage />
    </Suspense>
  );
}
