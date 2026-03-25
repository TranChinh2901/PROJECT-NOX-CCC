/**
 * Notification Page Object
 * Encapsulates notification UI interactions
 */
import { Page, Locator } from '@playwright/test';

export class NotificationPage {
  readonly page: Page;
  readonly bellIcon: Locator;
  readonly badge: Locator;
  readonly dropdown: Locator;
  readonly notificationItems: Locator;
  readonly markAllReadButton: Locator;
  readonly viewAllLink: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bellIcon = page.locator('[data-testid="notification-bell"]');
    this.badge = page.locator('[data-testid="notification-badge"]');
    this.dropdown = page.locator('[data-testid="notification-dropdown"]');
    this.notificationItems = page.locator('[data-testid="notification-item"]');
    this.markAllReadButton = page.locator('[data-testid="mark-all-read"]');
    this.viewAllLink = page.locator('[data-testid="view-all-notifications"]');
    this.emptyState = page.locator('[data-testid="notifications-empty"]');
  }

  async openDropdown(): Promise<void> {
    await this.bellIcon.click();
    await this.dropdown.waitFor({ state: 'visible' });
  }

  async closeDropdown(): Promise<void> {
    // Click outside the dropdown
    await this.page.click('body');
    await this.dropdown.waitFor({ state: 'hidden' });
  }

  async getBadgeCount(): Promise<number> {
    const text = await this.badge.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  async getNotificationCount(): Promise<number> {
    return await this.notificationItems.count();
  }

  async clickNotification(index: number): Promise<void> {
    await this.notificationItems.nth(index).click();
  }

  async markNotificationAsRead(index: number): Promise<void> {
    const notification = this.notificationItems.nth(index);
    await notification.hover();
    await notification.locator('[data-testid="mark-read"]').click();
  }

  async markAllAsRead(): Promise<void> {
    await this.markAllReadButton.click();
  }

  async viewAllNotifications(): Promise<void> {
    await this.viewAllLink.click();
    await this.page.waitForURL('/notifications');
  }

  async waitForNewNotification(timeout: number = 5000): Promise<void> {
    const initialCount = await this.getBadgeCount();

    await this.page.waitForFunction(
      (expectedCount) => {
        const badge = document.querySelector('[data-testid="notification-badge"]');
        const currentCount = badge ? parseInt(badge.textContent || '0', 10) : 0;
        return currentCount > expectedCount;
      },
      initialCount,
      { timeout }
    );
  }

  async getNotificationTitle(index: number): Promise<string> {
    const notification = this.notificationItems.nth(index);
    return await notification.locator('[data-testid="notification-title"]').textContent() || '';
  }

  async getNotificationMessage(index: number): Promise<string> {
    const notification = this.notificationItems.nth(index);
    return await notification.locator('[data-testid="notification-message"]').textContent() || '';
  }

  async isNotificationUnread(index: number): Promise<boolean> {
    const notification = this.notificationItems.nth(index);
    const classList = await notification.getAttribute('class');
    return classList?.includes('unread') || false;
  }

  async deleteNotification(index: number): Promise<void> {
    const notification = this.notificationItems.nth(index);
    await notification.hover();
    await notification.locator('[data-testid="delete-notification"]').click();
  }

  async filterByType(type: string): Promise<void> {
    await this.page.selectOption('[data-testid="notification-filter-type"]', type);
  }

  async filterByReadStatus(isRead: boolean): Promise<void> {
    const value = isRead ? 'read' : 'unread';
    await this.page.selectOption('[data-testid="notification-filter-read"]', value);
  }
}
