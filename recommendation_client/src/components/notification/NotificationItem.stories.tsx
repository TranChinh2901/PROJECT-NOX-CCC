/**
 * NotificationItem Storybook Stories
 *
 * Stories for the NotificationItem component demonstrating different notification types.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationItem } from './NotificationItem';
import { action } from '@storybook/addon-actions';
import { text, select } from '@storybook/addon-controls';
import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification.types';

const meta: Meta<typeof NotificationItem> = {
  title: 'Notification/NotificationItem',
  component: NotificationItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays individual notifications with actions like mark as read, archive, and delete.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    notification: {
      control: 'object',
      description: 'Notification object to display',
    },
    onRead: {
      action: 'onRead',
      description: 'Callback when notification is marked as read',
    },
    onDelete: {
      action: 'onDelete',
      description: 'Callback when notification is deleted',
    },
    onArchive: {
      action: 'onArchive',
      description: 'Callback when notification is archived',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationItem>;

// Sample notifications for stories
const orderNotification = {
  id: 'notif-001',
  type: 'order' as NotificationType,
  priority: 'high' as NotificationPriority,
  status: 'unread' as NotificationStatus,
  title: 'Order #12345 Shipped',
  message: 'Your order has been shipped and is on its way! Tracking number: 1Z999AA10123456784',
  summary: 'Order #12345 shipped',
  href: '/account/orders/12345',
  createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
};

const inventoryNotification = {
  id: 'notif-002',
  type: 'inventory' as NotificationType,
  priority: 'urgent' as NotificationPriority,
  status: 'unread' as NotificationStatus,
  title: 'Low Stock Alert',
  message: 'Product "Wireless Headphones" is running low on stock. Only 3 items remaining.',
  summary: 'Low stock: Wireless Headphones',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
};

const reviewNotification = {
  id: 'notif-003',
  type: 'review' as NotificationType,
  priority: 'medium' as NotificationPriority,
  status: 'read' as NotificationStatus,
  title: 'New Review Received',
  message: 'Customer "John Smith" left a 5-star review for your product "Wireless Headphones".',
  summary: '5-star review received',
  href: '/account/reviews/789',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  readAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
};

const systemNotification = {
  id: 'notif-004',
  type: 'system' as NotificationType,
  priority: 'low' as NotificationPriority,
  status: 'archived' as NotificationStatus,
  title: 'System Maintenance',
  message: 'Scheduled maintenance has been completed. All systems are now operational.',
  summary: 'System maintenance complete',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  archivedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
};

const paymentNotification = {
  id: 'notif-005',
  type: 'payment' as NotificationType,
  priority: 'high' as NotificationPriority,
  status: 'unread' as NotificationStatus,
  title: 'Payment Received',
  message: 'Your payment of $129.99 for order #12345 has been successfully processed.',
  summary: 'Payment of $129.99 received',
  href: '/account/orders/12345',
  createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
};

// Template for stories
const Template = (args: any) => <NotificationItem {...args} />;

/**
 * Order Notification - Unread
 *
 * A notification about a shipping order update.
 */
export const OrderUnread: Story = {
  args: {
    notification: orderNotification,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10">
        <Story />
      </div>
    ),
  ],
};

/**
 * Inventory Alert - Urgent Priority
 *
 * A high-priority notification with urgent visual indicators.
 */
export const InventoryUrgent: Story = {
  args: {
    notification: inventoryNotification,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10">
        <Story />
      </div>
    ),
  ],
};

/**
 * Review Notification - Read
 *
 * A notification that has already been marked as read.
 */
export const ReviewRead: Story = {
  args: {
    notification: reviewNotification,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10">
        <Story />
      </div>
    ),
  ],
};

/**
 * System Notification - Archived
 *
 * An archived notification showing the archived state.
 */
export const SystemArchived: Story = {
  args: {
    notification: systemNotification,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10">
        <Story />
      </div>
    ),
  ],
};

/**
 * Payment Notification - High Priority
 *
 * A payment notification with high priority indicators.
 */
export const PaymentHighPriority: Story = {
  args: {
    notification: paymentNotification,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10">
        <Story />
      </div>
    ),
  ],
};

/**
 * With All Actions
 *
 * Shows the notification with all action buttons functional.
 */
export const WithAllActions: Story = {
  args: {
    notification: orderNotification,
    onRead: action('Marked as read'),
    onDelete: action('Deleted'),
    onArchive: action('Archived'),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-[#1C1917] p-6 rounded-xl border border-white/10 space-y-4">
        <Story />
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => action('View all notifications')()}
            className="flex-1 py-2 rounded-lg bg-[#CA8A04] text-white text-sm font-medium hover:bg-[#B47B04] transition-colors"
          >
            View all notifications
          </button>
        </div>
      </div>
    ),
  ],
};

/**
 * Mobile View
 *
 * Notification item in a mobile view context.
 */
export const MobileView: Story = {
  args: {
    notification: orderNotification,
  },
  parameters: {
    docs: {
      source: {
        code: `
<div className="max-w-sm mx-auto">
  <NotificationItem {...args} />
</div>
        `,
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full bg-[#1C1917] p-4">
        <Story />
      </div>
    ),
  ],
};
