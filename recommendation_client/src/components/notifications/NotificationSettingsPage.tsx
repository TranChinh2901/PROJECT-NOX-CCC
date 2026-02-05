'use client';

/**
 * NotificationSettingsPage Component
 *
 * User notification preferences management page.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Bell, Mail, Smartphone, MessageSquare, Moon, Clock } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/notifications';
import { NotificationType, NotificationPreferences } from '@/types/notification.types';
import { cn } from '@/lib/utils';

const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
  order: { label: 'Order Updates', description: 'Get notified about order status changes' },
  inventory: { label: 'Inventory Alerts', description: 'Low stock and out of stock notifications' },
  review: { label: 'New Reviews', description: 'Notifications when customers leave reviews' },
  user: { label: 'User Activity', description: 'New user registrations and account changes' },
  system: { label: 'System Announcements', description: 'Important system updates and maintenance' },
  promotion: { label: 'Promotions', description: 'Promotional campaigns and discounts' },
  payment: { label: 'Payment Alerts', description: 'Payment confirmations and issues' },
  shipping: { label: 'Shipping Updates', description: 'Shipping status and delivery notifications' },
};

const channelIcons = {
  inApp: Bell,
  email: Mail,
  push: Smartphone,
  sms: MessageSquare,
};

const channelLabels = {
  inApp: 'In-App',
  email: 'Email',
  push: 'Push',
  sms: 'SMS',
};

export function NotificationSettingsPage() {
  const {
    preferences,
    isLoading,
    toggleChannel,
    toggleCategory,
    setCategoryChannels,
    setQuietHours,
    setFrequency,
    toggleMasterSwitch,
  } = useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);

  if (!preferences && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--admin-primary))]" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Unable to load notification preferences.</p>
        <Link
          href="/admin/notifications"
          className="text-[rgb(var(--admin-primary))] hover:underline"
        >
          Back to notifications
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notifications
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Master switch */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">Enable or disable all notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => toggleMasterSwitch(e.target.checked)}
              className="sr-only peer"
              aria-label="Enable notifications"
            />
            <div className={cn(
              'w-11 h-6 rounded-full peer transition-colors',
              'bg-slate-200 peer-checked:bg-[rgb(var(--admin-primary))]',
              'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
              'after:bg-white after:rounded-full after:h-5 after:w-5',
              'after:transition-all peer-checked:after:translate-x-5'
            )} />
          </label>
        </div>
      </section>

      {preferences.enabled && (
        <>
          {/* Delivery channels */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Delivery Channels</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choose how you want to receive notifications
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(preferences.channels) as (keyof typeof preferences.channels)[]).map((channel) => {
                const Icon = channelIcons[channel];
                const isEnabled = preferences.channels[channel];
                return (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(channel, !isEnabled)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      isEnabled
                        ? 'border-[rgb(var(--admin-primary))] bg-[rgb(var(--admin-primary))]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    aria-pressed={isEnabled}
                  >
                    <Icon className={cn(
                      'w-6 h-6',
                      isEnabled ? 'text-[rgb(var(--admin-primary))]' : 'text-slate-400'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      isEnabled ? 'text-[rgb(var(--admin-primary))]' : 'text-slate-600'
                    )}>
                      {channelLabels[channel]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notification categories */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Categories</h2>
            <p className="text-sm text-slate-500 mb-6">
              Customize notifications for each category
            </p>
            <div className="divide-y divide-slate-100">
              {(Object.keys(notificationTypeLabels) as NotificationType[]).map((type) => {
                const { label, description } = notificationTypeLabels[type];
                const categorySettings = preferences.categories[type];
                if (!categorySettings) return null;

                return (
                  <div key={type} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-slate-900">{label}</h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={categorySettings.enabled}
                              onChange={(e) => toggleCategory(type, e.target.checked)}
                              className="sr-only peer"
                              aria-label={`Enable ${label}`}
                            />
                            <div className={cn(
                              'w-9 h-5 rounded-full peer transition-colors',
                              'bg-slate-200 peer-checked:bg-[rgb(var(--admin-primary))]',
                              'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                              'after:bg-white after:rounded-full after:h-4 after:w-4',
                              'after:transition-all peer-checked:after:translate-x-4'
                            )} />
                          </label>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{description}</p>
                      </div>
                    </div>

                    {categorySettings.enabled && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(Object.keys(channelLabels) as (keyof typeof channelLabels)[]).map((channel) => {
                          if (!preferences.channels[channel]) return null;
                          const isActive = categorySettings.channels.includes(channel);
                          return (
                            <button
                              key={channel}
                              onClick={() => {
                                const newChannels = isActive
                                  ? categorySettings.channels.filter((c) => c !== channel)
                                  : [...categorySettings.channels, channel];
                                setCategoryChannels(type, newChannels);
                              }}
                              className={cn(
                                'px-3 py-1 text-sm rounded-full transition-colors',
                                isActive
                                  ? 'bg-[rgb(var(--admin-primary))] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              )}
                            >
                              {channelLabels[channel]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quiet hours */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-5 h-5 text-slate-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quiet Hours</h2>
                <p className="text-sm text-slate-500">Pause notifications during specific times</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quietHours?.enabled ?? false}
                  onChange={(e) => setQuietHours({
                    enabled: e.target.checked,
                    start: preferences.quietHours?.start || '22:00',
                    end: preferences.quietHours?.end || '08:00',
                    timezone: preferences.quietHours?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  })}
                  className="sr-only peer"
                  aria-label="Enable quiet hours"
                />
                <div className={cn(
                  'w-11 h-6 rounded-full peer transition-colors',
                  'bg-slate-200 peer-checked:bg-[rgb(var(--admin-primary))]',
                  'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                  'after:bg-white after:rounded-full after:h-5 after:w-5',
                  'after:transition-all peer-checked:after:translate-x-5'
                )} />
              </label>
              <span className="text-sm text-slate-700">Enable quiet hours</span>
            </div>

            {preferences.quietHours?.enabled && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <label className="text-sm text-slate-600">From</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => setQuietHours({
                      ...preferences.quietHours!,
                      start: e.target.value,
                    })}
                    className={cn(
                      'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]'
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">To</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => setQuietHours({
                      ...preferences.quietHours!,
                      end: e.target.value,
                    })}
                    className={cn(
                      'px-3 py-1.5 text-sm border border-slate-200 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--admin-primary))]'
                    )}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Notification frequency */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Frequency</h2>
            <p className="text-sm text-slate-500 mb-6">
              How often would you like to receive email notifications?
            </p>
            <div className="space-y-3">
              {[
                { value: 'realtime' as const, label: 'Real-time', description: 'Get notified immediately' },
                { value: 'digest_daily' as const, label: 'Daily Digest', description: 'One summary email per day' },
                { value: 'digest_weekly' as const, label: 'Weekly Digest', description: 'One summary email per week' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    preferences.frequency === option.value
                      ? 'border-[rgb(var(--admin-primary))] bg-[rgb(var(--admin-primary))]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={preferences.frequency === option.value}
                    onChange={() => setFrequency(option.value)}
                    className="mt-1 text-[rgb(var(--admin-primary))] focus:ring-[rgb(var(--admin-primary))]"
                  />
                  <div>
                    <span className="font-medium text-slate-900">{option.label}</span>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Save button (for future server-side saving) */}
      {preferences.enabled && (
        <div className="flex justify-end">
          <button
            disabled={isSaving}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg',
              'bg-[rgb(var(--admin-primary))] text-white font-medium',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationSettingsPage;
