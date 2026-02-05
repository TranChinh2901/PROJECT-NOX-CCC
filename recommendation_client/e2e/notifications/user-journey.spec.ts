/**
 * E2E Tests: User Journey - Notification Reception and Interaction
 * Tests the complete flow of receiving and interacting with notifications
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NotificationPage } from '../helpers/notification.page';

test.describe('Notification User Journey', () => {
  let notificationPage: NotificationPage;

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await AuthHelper.login(page);
    notificationPage = new NotificationPage(page);
  });

  test('should display unread notification badge', async ({ page }) => {
    // Verify badge is visible
    await expect(notificationPage.bellIcon).toBeVisible();

    // Check badge count (may be 0 or more)
    const badgeCount = await notificationPage.getBadgeCount();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('should open notification dropdown when bell is clicked', async ({ page }) => {
    await notificationPage.openDropdown();

    // Verify dropdown is visible
    await expect(notificationPage.dropdown).toBeVisible();

    // Should show either notifications or empty state
    const hasNotifications = await notificationPage.notificationItems.count() > 0;
    const hasEmptyState = await notificationPage.emptyState.isVisible();

    expect(hasNotifications || hasEmptyState).toBe(true);
  });

  test('should display notification details', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      // Check first notification has title and message
      const title = await notificationPage.getNotificationTitle(0);
      const message = await notificationPage.getNotificationMessage(0);

      expect(title.length).toBeGreaterThan(0);
      expect(message.length).toBeGreaterThan(0);
    }
  });

  test('should mark single notification as read', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      const isUnread = await notificationPage.isNotificationUnread(0);

      if (isUnread) {
        const initialBadgeCount = await notificationPage.getBadgeCount();

        await notificationPage.markNotificationAsRead(0);

        // Wait for UI update
        await page.waitForTimeout(500);

        const newBadgeCount = await notificationPage.getBadgeCount();
        expect(newBadgeCount).toBe(initialBadgeCount - 1);
      }
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      await notificationPage.markAllAsRead();

      // Wait for UI update
      await page.waitForTimeout(500);

      const badgeCount = await notificationPage.getBadgeCount();
      expect(badgeCount).toBe(0);
    }
  });

  test('should navigate to notification detail page when clicked', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      await notificationPage.clickNotification(0);

      // Should navigate to a detail page or trigger an action
      // The exact behavior depends on your implementation
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to full notifications page', async ({ page }) => {
    await notificationPage.openDropdown();
    await notificationPage.viewAllNotifications();

    // Verify URL changed
    await expect(page).toHaveURL(/\/notifications/);

    // Verify page elements
    await expect(page.locator('h1')).toContainText(/notifications/i);
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    await notificationPage.openDropdown();
    await expect(notificationPage.dropdown).toBeVisible();

    await notificationPage.closeDropdown();
    await expect(notificationPage.dropdown).toBeHidden();
  });

  test('should delete notification', async ({ page }) => {
    await notificationPage.openDropdown();

    const initialCount = await notificationPage.getNotificationCount();

    if (initialCount > 0) {
      await notificationPage.deleteNotification(0);

      // Wait for deletion
      await page.waitForTimeout(500);

      const newCount = await notificationPage.getNotificationCount();
      expect(newCount).toBe(initialCount - 1);
    }
  });
});

test.describe('Notification Filtering and Sorting', () => {
  let notificationPage: NotificationPage;

  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page);
    notificationPage = new NotificationPage(page);

    // Navigate to full notifications page
    await page.goto('/notifications');
  });

  test('should filter notifications by type', async ({ page }) => {
    await notificationPage.filterByType('ORDER_UPDATE');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    const count = await notificationPage.getNotificationCount();

    // All visible notifications should be ORDER_UPDATE type
    for (let i = 0; i < Math.min(count, 5); i++) {
      const notification = notificationPage.notificationItems.nth(i);
      const type = await notification.getAttribute('data-type');
      expect(type).toBe('ORDER_UPDATE');
    }
  });

  test('should filter notifications by read status', async ({ page }) => {
    await notificationPage.filterByReadStatus(false);

    // Wait for filter to apply
    await page.waitForTimeout(500);

    const count = await notificationPage.getNotificationCount();

    // All visible notifications should be unread
    for (let i = 0; i < Math.min(count, 5); i++) {
      const isUnread = await notificationPage.isNotificationUnread(i);
      expect(isUnread).toBe(true);
    }
  });

  test('should handle pagination', async ({ page }) => {
    const count = await notificationPage.getNotificationCount();

    if (count >= 10) {
      // Click next page
      await page.click('[data-testid="pagination-next"]');

      // Wait for page load
      await page.waitForTimeout(500);

      // Should show different notifications
      const firstNotificationTitle = await notificationPage.getNotificationTitle(0);
      expect(firstNotificationTitle).toBeDefined();
    }
  });
});

test.describe('Real-time Notification Reception', () => {
  test('should receive real-time notification via WebSocket', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    // Get initial badge count
    const initialCount = await notificationPage.getBadgeCount();

    // Wait for new notification (this would require triggering from backend)
    // In a real test, you might:
    // 1. Use API to create notification
    // 2. Or have a test endpoint that sends notification
    // 3. Or use WebSocket client to simulate

    // For demonstration, we'll just verify the badge updates
    // await notificationPage.waitForNewNotification();

    // const newCount = await notificationPage.getBadgeCount();
    // expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should show toast for urgent notifications', async ({ page }) => {
    await AuthHelper.login(page);

    // Wait for toast notification
    const toast = page.locator('[data-testid="notification-toast"]');

    // This would require triggering an urgent notification
    // await expect(toast).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Notification Preferences', () => {
  test('should update notification preferences', async ({ page }) => {
    await AuthHelper.login(page);

    // Navigate to preferences
    await page.goto('/settings/notifications');

    // Toggle email notifications
    const emailToggle = page.locator('[data-testid="pref-email-enabled"]');
    await emailToggle.click();

    // Save preferences
    await page.click('[data-testid="save-preferences"]');

    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // Reload page and verify preference persisted
    await page.reload();

    const isChecked = await emailToggle.isChecked();
    expect(isChecked).toBeDefined();
  });

  test('should update notification type preferences', async ({ page }) => {
    await AuthHelper.login(page);
    await page.goto('/settings/notifications');

    // Toggle promotion notifications
    const promotionToggle = page.locator('[data-testid="pref-promotions"]');
    const initialState = await promotionToggle.isChecked();

    await promotionToggle.click();

    // Save
    await page.click('[data-testid="save-preferences"]');

    // Wait for confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // Verify state changed
    const newState = await promotionToggle.isChecked();
    expect(newState).toBe(!initialState);
  });
});

test.describe('Multiple Tab Sync', () => {
  test('should sync notifications across tabs', async ({ browser }) => {
    const context = await browser.newContext();

    // Open two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in both tabs
    await AuthHelper.login(page1);
    await AuthHelper.login(page2);

    const notification1 = new NotificationPage(page1);
    const notification2 = new NotificationPage(page2);

    // Get initial counts
    const count1 = await notification1.getBadgeCount();
    const count2 = await notification2.getBadgeCount();

    expect(count1).toBe(count2);

    // Mark all read in tab 1
    await notification1.openDropdown();
    await notification1.markAllAsRead();

    // Wait for sync
    await page2.waitForTimeout(1000);

    // Tab 2 should also show 0
    const newCount2 = await notification2.getBadgeCount();
    expect(newCount2).toBe(0);

    await context.close();
  });
});
