/**
 * NotificationPreferences Storybook Stories
 *
 * Stories for the NotificationPreferences component demonstrating different settings.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationPreferences } from './NotificationPreferences';
import { action } from '@storybook/addon-actions';
import { boolean, object } from '@storybook/addon-controls';
import { NotificationType, NotificationPriority } from '@/types/notification.types';

const meta: Meta<typeof NotificationPreferences> = {
  title: 'Notification/NotificationPreferences',
  component: NotificationPreferences,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'User notification preferences management page with channels, categories, quiet hours, and frequency settings.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    preferences: {
      control: 'object',
      description: 'Notification preferences object',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationPreferences>;

// Default preferences for stories
const defaultPreferences = {
  enabled: true,
  channels: {
    inApp: true,
    email: true,
    push: false,
    sms: false,
  },
  categories: {
    order: {
      enabled: true,
      channels: ['inApp', 'email', 'push'],
      priority: 'medium' as NotificationPriority,
    },
    inventory: {
      enabled: true,
      channels: ['inApp', 'push'],
      priority: 'high' as NotificationPriority,
    },
    review: {
      enabled: true,
      channels: ['inApp', 'email'],
      priority: 'low' as NotificationPriority,
    },
    user: {
      enabled: false,
      channels: ['inApp'],
      priority: 'medium' as NotificationPriority,
    },
    system: {
      enabled: true,
      channels: ['inApp'],
      priority: 'low' as NotificationPriority,
    },
    promotion: {
      enabled: true,
      channels: ['email', 'push'],
      priority: 'low' as NotificationPriority,
    },
    payment: {
      enabled: true,
      channels: ['inApp', 'email', 'sms'],
      priority: 'high' as NotificationPriority,
    },
    shipping: {
      enabled: true,
      channels: ['inApp', 'email', 'push'],
      priority: 'medium' as NotificationPriority,
    },
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  frequency: 'realtime' as const,
};

/**
 * Default Preferences
 *
 * Shows the notification preferences page with default settings.
 */
export const DefaultSettings: Story = {
  args: {
    preferences: defaultPreferences,
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationPreferences preferences={preferences} />`,
      },
    },
  },
};

/**
 * Disabled Notifications
 *
 * Shows the preferences when notifications are disabled.
 */
export const DisabledNotifications: Story = {
  args: {
    preferences: {
      ...defaultPreferences,
      enabled: false,
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `
<NotificationPreferences
  preferences={{
    ...defaultPreferences,
    enabled: false
  }}
/>
        `,
      },
    },
  },
};

/**
 * With Loading State
 *
 * Shows the preferences page while loading.
 */
export const WithLoadingState: Story = {
  args: {
    preferences: null,
    isLoading: true,
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationPreferences preferences={null} isLoading={true} />`,
      },
    },
  },
};

/**
 * With Quiet Hours Enabled
 *
 * Shows the preferences with quiet hours feature enabled.
 */
export const QuietHoursEnabled: Story = {
  args: {
    preferences: {
      ...defaultPreferences,
      quietHours: {
        enabled: true,
        start: '23:00',
        end: '07:00',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `
<NotificationPreferences
  preferences={{
    ...defaultPreferences,
    quietHours: {
      enabled: true,
      start: '23:00',
      end: '07:00',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  }}
/>
        `,
      },
    },
  },
};

/**
 * All Channels Enabled
 *
 * Shows the preferences with all delivery channels enabled.
 */
export const AllChannelsEnabled: Story = {
  args: {
    preferences: {
      ...defaultPreferences,
      channels: {
        inApp: true,
        email: true,
        push: true,
        sms: true,
      },
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `
<NotificationPreferences
  preferences={{
    ...defaultPreferences,
    channels: {
      inApp: true,
      email: true,
      push: true,
      sms: true
    }
  }}
/>
        `,
      },
    },
  },
};

/**
 * With Email Frequency Settings
 *
 * Shows the preferences with email frequency options.
 */
export const WithFrequencySettings: Story = {
  args: {
    preferences: {
      ...defaultPreferences,
      frequency: 'digest_daily' as const,
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `
<NotificationPreferences
  preferences={{
    ...defaultPreferences,
    frequency: 'digest_daily'
  }}
/>
        `,
      },
    },
  },
};

/**
 * Complete Setup
 *
 * Shows the preferences with a complete setup including all categories.
 */
export const CompleteSetup: Story = {
  args: {
    preferences: {
      enabled: true,
      channels: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      categories: {
        order: {
          enabled: true,
          channels: ['inApp', 'email'],
          priority: 'high' as NotificationPriority,
        },
        inventory: {
          enabled: true,
          channels: ['inApp', 'push'],
          priority: 'high' as NotificationPriority,
        },
        review: {
          enabled: true,
          channels: ['inApp'],
          priority: 'low' as NotificationPriority,
        },
        user: {
          enabled: true,
          channels: ['inApp', 'email'],
          priority: 'medium' as NotificationPriority,
        },
        system: {
          enabled: true,
          channels: ['inApp'],
          priority: 'low' as NotificationPriority,
        },
        promotion: {
          enabled: false,
          channels: ['email'],
          priority: 'low' as NotificationPriority,
        },
        payment: {
          enabled: true,
          channels: ['inApp', 'email', 'sms'],
          priority: 'high' as NotificationPriority,
        },
        shipping: {
          enabled: true,
          channels: ['inApp', 'email'],
          priority: 'medium' as NotificationPriority,
        },
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Ho_Chi_Minh',
      },
      frequency: 'digest_daily' as const,
    },
    isLoading: false,
  },
  parameters: {
    docs: {
      source: {
        code: `
<NotificationPreferences
  preferences={{
    enabled: true,
    channels: { inApp: true, email: true, push: true, sms: false },
    categories: {
      order: { enabled: true, channels: ['inApp', 'email'], priority: 'high' },
      inventory: { enabled: true, channels: ['inApp', 'push'], priority: 'high' },
      review: { enabled: true, channels: ['inApp'], priority: 'low' },
      user: { enabled: true, channels: ['inApp', 'email'], priority: 'medium' },
      system: { enabled: true, channels: ['inApp'], priority: 'low' },
      promotion: { enabled: false, channels: ['email'], priority: 'low' },
      payment: { enabled: true, channels: ['inApp', 'email', 'sms'], priority: 'high' },
      shipping: { enabled: true, channels: ['inApp', 'email'], priority: 'medium' }
    },
    quietHours: { enabled: true, start: '22:00', end: '08:00', timezone: 'Asia/Ho_Chi_Minh' },
    frequency: 'digest_daily'
  }}
/>
        `,
      },
    },
  },
};
