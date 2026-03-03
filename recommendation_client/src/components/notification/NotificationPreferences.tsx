'use client';


import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Moon,
  Clock,
  Save,
  Check,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/notifications';
import { NotificationType, NotificationPriority } from '@/types/notification.types';
import type { NotificationPreferences as PreferencesType } from '@/types/notification.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

interface ChannelConfig {
  channel: 'inApp' | 'email' | 'push' | 'sms';
  label: string;
  icon: React.ReactNode;
  description: string;
}

const channelConfigs: ChannelConfig[] = [
  {
    channel: 'inApp',
    label: 'In-App',
    icon: <Bell size={20} />,
    description: 'Show notifications in the app',
  },
  {
    channel: 'email',
    label: 'Email',
    icon: <Mail size={20} />,
    description: 'Receive notifications via email',
  },
  {
    channel: 'push',
    label: 'Push',
    icon: <Smartphone size={20} />,
    description: 'Browser push notifications',
  },
  {
    channel: 'sms',
    label: 'SMS',
    icon: <MessageSquare size={20} />,
    description: 'Text message notifications',
  },
];

const notificationTypes: Record<NotificationType, { label: string; description: string; icon: React.ReactNode }> = {
  order: {
    label: 'Order Updates',
    description: 'Get notified about order status changes',
    icon: <Mail size={16} className="text-blue-400" />,
  },
  inventory: {
    label: 'Inventory Alerts',
    description: 'Low stock and out of stock notifications',
    icon: <AlertCircle size={16} className="text-amber-400" />,
  },
  review: {
    label: 'New Reviews',
    description: 'Notifications when customers leave reviews',
    icon: <Bell size={16} className="text-green-400" />,
  },
  user: {
    label: 'User Activity',
    description: 'New user registrations and account changes',
    icon: <Bell size={16} className="text-purple-400" />,
  },
  system: {
    label: 'System Announcements',
    description: 'Important system updates and maintenance',
    icon: <Bell size={16} className="text-slate-400" />,
  },
  promotion: {
    label: 'Promotions',
    description: 'Promotional campaigns and discounts',
    icon: <Bell size={16} className="text-pink-400" />,
  },
  payment: {
    label: 'Payment Alerts',
    description: 'Payment confirmations and issues',
    icon: <Bell size={16} className="text-emerald-400" />,
  },
  shipping: {
    label: 'Shipping Updates',
    description: 'Shipping status and delivery notifications',
    icon: <Bell size={16} className="text-indigo-400" />,
  },
};

export interface UserNotificationPreferencesProps {
  preferences: PreferencesType | null;
  isLoading?: boolean;
}

export function UserNotificationPreferences({
  preferences: userPreferences,
  isLoading = false,
}: NotificationPreferencesProps) {
  const {
    preferences,
    isLoading: contextLoading,
    toggleChannel,
    toggleCategory,
    setCategoryChannels,
    setQuietHours,
    setFrequency,
    toggleMasterSwitch,
    updatePreferences,
  } = useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CA8A04]" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#A1A1AA]">Unable to load notification preferences.</p>
        <Link href="/account/notifications" className="text-[#CA8A04] hover:underline">
          Back to notifications
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(preferences);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1917] pt-24 pb-12 px-4 md:px-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account/notifications"
          className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#FAFAF9] mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to notifications
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-[#FAFAF9]">Notification Settings</h1>
        </div>
        <p className="text-[#A1A1AA]">Manage how and when you receive notifications</p>
      </div>

      {/* Master switch */}
      <section className="bg-[#292524] rounded-xl p-6 mb-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CA8A04]/10 flex items-center justify-center">
              <Bell size={20} className="text-[#CA8A04]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#FAFAF9]">Notifications</h2>
              <p className="text-sm text-[#A1A1AA]">Enable or disable all notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={(e) => toggleMasterSwitch(e.target.checked)}
              className="sr-only peer"
              aria-label="Enable notifications"
            />
            <div
              className={cn(
                'w-12 h-7 rounded-full peer transition-colors',
                'bg-[#3F3F46] peer-checked:bg-[#CA8A04]',
                'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                'after:bg-white after:rounded-full after:h-5 after:w-5',
                'after:transition-all peer-checked:after:translate-x-5'
              )}
            />
          </label>
        </div>
      </section>

      {preferences.enabled && (
        <>
          {/* Delivery channels */}
          <section className="bg-[#292524] rounded-xl p-6 mb-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#FAFAF9] mb-4">Delivery Channels</h2>
            <p className="text-sm text-[#A1A1AA] mb-6">
              Choose how you want to receive notifications
            </p>
            <div className="grid grid-cols-2 gap-4">
              {channelConfigs.map((config) => {
                const isEnabled = preferences.channels[config.channel];
                return (
                  <button
                    key={config.channel}
                    onClick={() => toggleChannel(config.channel, !isEnabled)}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      isEnabled
                        ? 'border-[#CA8A04] bg-[#CA8A04]/5'
                        : 'border-[#3F3F46] hover:border-[#71717A]'
                    )}
                    aria-pressed={isEnabled}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                        isEnabled ? 'bg-[#CA8A04]/20' : 'bg-[#3F3F46]'
                      )}
                    >
                      {config.icon}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isEnabled ? 'text-[#CA8A04]' : 'text-[#D4D4D8]'
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-[#A1A1AA] text-center">{config.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notification categories */}
          <section className="bg-[#292524] rounded-xl p-6 mb-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#FAFAF9] mb-4">Notification Categories</h2>
            <p className="text-sm text-[#A1A1AA] mb-6">
              Customize notifications for each category
            </p>
            <div className="space-y-4">
              {(Object.keys(notificationTypes) as NotificationType[]).map((type) => {
                const categorySettings = preferences.categories[type];
                if (!categorySettings) return null;

                const typeInfo = notificationTypes[type];
                return (
                  <div key={type} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-[#3F3F46] flex items-center justify-center">
                        {typeInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-[#FAFAF9]">{typeInfo.label}</h3>
                          <p className="text-sm text-[#A1A1AA]">{typeInfo.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={categorySettings.enabled}
                            onChange={(e) => toggleCategory(type, e.target.checked)}
                            className="sr-only peer"
                            aria-label={`Enable ${typeInfo.label}`}
                          />
                          <div
                            className={cn(
                              'w-10 h-6 rounded-full peer transition-colors',
                              'bg-[#3F3F46] peer-checked:bg-[#CA8A04]',
                              'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                              'after:bg-white after:rounded-full after:h-4 after:w-4',
                              'after:transition-all peer-checked:after:translate-x-4'
                            )}
                          />
                        </label>
                      </div>

                      {categorySettings.enabled && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {channelConfigs.map((channelConfig) => {
                            if (!preferences.channels[channelConfig.channel]) return null;
                            const isActive = categorySettings.channels.includes(channelConfig.channel);
                            return (
                              <button
                                key={channelConfig.channel}
                                onClick={() => {
                                  const newChannels = isActive
                                    ? categorySettings.channels.filter((c) => c !== channelConfig.channel)
                                    : [...categorySettings.channels, channelConfig.channel];
                                  setCategoryChannels(type, newChannels);
                                }}
                                className={cn(
                                  'px-3 py-1.5 text-xs rounded-lg transition-colors border',
                                  isActive
                                    ? 'bg-[#CA8A04] text-white border-[#CA8A04]'
                                    : 'bg-[#3F3F46] text-[#A1A1AA] border-[#3F3F46] hover:border-[#71717A]'
                                )}
                              >
                                {channelConfig.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quiet hours */}
          <section className="bg-[#292524] rounded-xl p-6 mb-6 border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-[#3F3F46] flex items-center justify-center">
                  <Moon size={20} className="text-[#A1A1AA]" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#FAFAF9]">Quiet Hours</h2>
                <p className="text-sm text-[#A1A1AA]">Pause notifications during specific times</p>
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
                <div
                  className={cn(
                    'w-11 h-6 rounded-full peer transition-colors',
                    'bg-[#3F3F46] peer-checked:bg-[#CA8A04]',
                    'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                    'after:bg-white after:rounded-full after:h-4 after:w-4',
                    'after:transition-all peer-checked:after:translate-x-5'
                  )}
                />
              </label>
              <span className="text-sm text-[#D4D4D8]">Enable quiet hours</span>
            </div>

            {preferences.quietHours?.enabled && (
              <div className="flex flex-wrap items-center gap-6 p-4 bg-[#1C1917] rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-[#A1A1AA]" />
                  <label className="text-sm text-[#D4D4D8]">From</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => setQuietHours({
                      ...preferences.quietHours!,
                      start: e.target.value,
                    })}
                    className="px-3 py-1.5 text-sm bg-[#3F3F46] border border-[#3F3F46] rounded-lg text-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#D4D4D8]">To</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => setQuietHours({
                      ...preferences.quietHours!,
                      end: e.target.value,
                    })}
                    className="px-3 py-1.5 text-sm bg-[#3F3F46] border border-[#3F3F46] rounded-lg text-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Notification frequency */}
          <section className="bg-[#292524] rounded-xl p-6 mb-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#FAFAF9] mb-4">Email Frequency</h2>
            <p className="text-sm text-[#A1A1AA] mb-6">
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
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    preferences.frequency === option.value
                      ? 'border-[#CA8A04] bg-[#CA8A04]/5'
                      : 'border-[#3F3F46] hover:border-[#71717A]'
                  )}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={preferences.frequency === option.value}
                    onChange={() => setFrequency(option.value)}
                    className="mt-1 text-[#CA8A04] focus:ring-[#CA8A04]"
                  />
                  <div>
                    <span className="font-medium text-[#FAFAF9]">{option.label}</span>
                    <p className="text-sm text-[#A1A1AA]">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              size="md"
              leftIcon={isSaving ? undefined : <Save size={18} />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationPreferences;
