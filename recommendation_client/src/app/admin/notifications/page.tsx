'use client';

/**
 * Notifications Page Route
 *
 * Displays the full notification list with filters and bulk actions.
 */

import { Suspense } from 'react';
import { NotificationListPage } from '@/components/notifications';
import PageSkeleton from '@/components/common/PageSkeleton';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationListPage />
    </Suspense>
  );
}
