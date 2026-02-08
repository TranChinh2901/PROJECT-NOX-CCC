/**
 * NotificationCenter Storybook Stories
 *
 * Stories for the NotificationCenter component demonstrating different use cases.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationCenter } from './NotificationCenter';
import { action } from '@storybook/addon-actions';
import { boolean, number, text } from '@storybook/addon-controls';
import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification.types';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Notification/NotificationCenter',
  component: NotificationCenter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive notification center with sidebar and modal variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialOpen: {
      control: 'boolean',
      description: 'Initial open state',
    },
    variant: {
      control: { type: 'radio' },
      options: ['sidebar', 'modal'],
      description: 'Display variant',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

/**
 * Sidebar Variant - Default
 *
 * The default sidebar variant that slides in from the right on mobile
 * and stays visible on desktop.
 */
export const SidebarDefault: Story = {
  args: {
    initialOpen: true,
    variant: 'sidebar',
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationCenter initialOpen={true} variant="sidebar" />`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-[#1C1917]">
        <div className="flex-1 p-8 text-[#FAFAF9]">
          <h1 className="text-2xl font-bold mb-4">Account Dashboard</h1>
          <p className="mb-4 text-[#A1A1AA]">This is your dashboard. Click the bell icon to open the notification center.</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#CA8A04]/20 flex items-center justify-center">
              <span className="font-bold text-[#CA8A04]">JD</span>
            </div>
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-[#A1A1AA]">john@example.com</p>
            </div>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};

/**
 * Modal Variant
 *
 * The modal variant shows as a centered overlay with backdrop.
 */
export const ModalVariant: Story = {
  args: {
    initialOpen: false,
    variant: 'modal',
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationCenter initialOpen={false} variant="modal" />`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-[#1C1917] items-center justify-center">
        <div className="text-center text-[#FAFAF9]">
          <h1 className="text-2xl font-bold mb-4">Account Dashboard</h1>
          <p className="mb-8 text-[#A1A1AA]">Click the bell icon below to open the notification center.</p>
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * With Notification Count
 *
 * Shows the notification center with an unread count badge.
 */
export const WithUnreadCount: Story = {
  args: {
    initialOpen: false,
    variant: 'modal',
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationCenter initialOpen={false} variant="modal" />`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-[#1C1917] items-center justify-center">
        <div className="text-center text-[#FAFAF9]">
          <h1 className="text-2xl font-bold mb-4">Account Dashboard</h1>
          <div className="relative inline-block mb-8">
            <Story />
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#CA8A04] text-[10px] font-bold text-white ring-2 ring-[#1C1917]">
              5
            </span>
          </div>
          <p className="text-[#A1A1AA]">Click the bell to open</p>
        </div>
      </div>
    ),
  ],
};

/**
 * Mobile Responsive
 *
 * Demonstrates the mobile responsive behavior of the sidebar variant.
 */
export const MobileResponsive: Story = {
  args: {
    initialOpen: false,
    variant: 'sidebar',
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationCenter initialOpen={false} variant="sidebar" />`,
      },
    },
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-[#1C1917]">
        <div className="flex-1 p-8 text-[#FAFAF9]">
          <h1 className="text-2xl font-bold mb-4">Mobile Dashboard</h1>
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Empty State
 *
 * Shows the notification center with no notifications.
 */
export const EmptyState: Story = {
  args: {
    initialOpen: true,
    variant: 'sidebar',
  },
  parameters: {
    docs: {
      source: {
        code: `<NotificationCenter initialOpen={true} variant="sidebar" />`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-[#1C1917]">
        <div className="flex-1 p-8 text-[#FAFAF9]">
          <h1 className="text-2xl font-bold mb-4">Account Dashboard</h1>
          <Story />
        </div>
        <Story />
      </div>
    ),
  ],
};
