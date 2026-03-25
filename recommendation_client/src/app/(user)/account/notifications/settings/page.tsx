'use client';

import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationPreferences } from '@/components/notification/NotificationPreferences';

export default function NotificationSettingsPage() {
  return (
    <NotificationProvider
      wsEndpoint={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}
      enableToasts={true}
    >
      <NotificationPreferences />
    </NotificationProvider>
  );
}
