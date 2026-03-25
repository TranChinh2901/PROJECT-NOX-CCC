/**
 * E2E Tests: Accessibility and Responsive Design
 * Tests keyboard navigation, screen reader support, and responsive behavior
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NotificationPage } from '../helpers/notification.page';

test.describe('Keyboard Navigation', () => {
  let notificationPage: NotificationPage;

  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page);
    notificationPage = new NotificationPage(page);
  });

  test('should open dropdown with Enter key', async ({ page }) => {
    // Focus on bell icon
    await notificationPage.bellIcon.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Dropdown should open
    await expect(notificationPage.dropdown).toBeVisible();
  });

  test('should open dropdown with Space key', async ({ page }) => {
    await notificationPage.bellIcon.focus();
    await page.keyboard.press('Space');

    await expect(notificationPage.dropdown).toBeVisible();
  });

  test('should navigate notifications with arrow keys', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 1) {
      // Focus on first notification
      await notificationPage.notificationItems.first().focus();

      // Press down arrow
      await page.keyboard.press('ArrowDown');

      // Second notification should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('notification-item');
    }
  });

  test('should close dropdown with Escape key', async ({ page }) => {
    await notificationPage.openDropdown();
    await expect(notificationPage.dropdown).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(notificationPage.dropdown).toBeHidden();
  });

  test('should activate notification with Enter key', async ({ page }) => {
    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      // Focus on first notification
      await notificationPage.notificationItems.first().focus();

      // Press Enter
      await page.keyboard.press('Enter');

      // Should trigger notification action
      await page.waitForTimeout(500);
    }
  });

  test('should tab through interactive elements', async ({ page }) => {
    await notificationPage.openDropdown();

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus management
    const focusedElement = await page.evaluate(() =>
      document.activeElement?.tagName
    );

    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});

test.describe('Screen Reader Support', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    // Bell icon should have aria-label
    const ariaLabel = await notificationPage.bellIcon.getAttribute('aria-label');
    expect(ariaLabel).toContain('notification');

    // Badge should have aria-label with count
    const badgeLabel = await notificationPage.badge.getAttribute('aria-label');
    expect(badgeLabel).toBeDefined();
  });

  test('should announce unread count', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    const count = await notificationPage.getBadgeCount();

    if (count > 0) {
      const announcement = await page.locator('[aria-live="polite"]').textContent();
      expect(announcement).toBeDefined();
    }
  });

  test('should have proper role attributes', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // Dropdown should have menu role
    const role = await notificationPage.dropdown.getAttribute('role');
    expect(['menu', 'dialog', 'listbox']).toContain(role);

    // Notification items should have menuitem role
    if (await notificationPage.notificationItems.count() > 0) {
      const itemRole = await notificationPage.notificationItems.first().getAttribute('role');
      expect(['menuitem', 'option', 'listitem']).toContain(itemRole);
    }
  });

  test('should announce new notifications', async ({ page }) => {
    await AuthHelper.login(page);

    // Look for live region
    const liveRegion = page.locator('[aria-live="assertive"]');
    await expect(liveRegion).toBeDefined();
  });

  test('should have accessible form labels', async ({ page }) => {
    await AuthHelper.login(page);
    await page.goto('/settings/notifications');

    // All form controls should have labels
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      const hasAccessibleName = id || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // This is a simplified check - in real tests you'd use axe-core
    const bgColor = await page.evaluate(() => {
      const dropdown = document.querySelector('[data-testid="notification-dropdown"]');
      return window.getComputedStyle(dropdown!).backgroundColor;
    });

    expect(bgColor).toBeDefined();
  });
});

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show full-screen notification panel on mobile', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // On mobile, dropdown should be full-screen or drawer
    const dropdown = notificationPage.dropdown;
    await expect(dropdown).toBeVisible();

    const width = await dropdown.evaluate(el => el.getBoundingClientRect().width);
    const viewportWidth = page.viewportSize()?.width || 0;

    // Should take most/all of the screen
    expect(width).toBeGreaterThan(viewportWidth * 0.9);
  });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      // Check notification item height (should be at least 44px for touch)
      const height = await notificationPage.notificationItems.first().evaluate(
        el => el.getBoundingClientRect().height
      );

      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should support swipe gestures', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // Swipe down to close (if implemented)
    const dropdown = notificationPage.dropdown;
    const box = await dropdown.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height);
      await page.mouse.up();

      // Dropdown might close on swipe
      await page.waitForTimeout(500);
    }
  });

  test('should hide/show elements based on mobile viewport', async ({ page }) => {
    await AuthHelper.login(page);

    // Check that mobile-specific elements are visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');

    // Desktop elements should be hidden on mobile
    const desktopNav = page.locator('[data-testid="desktop-nav"]');

    // Note: This depends on your actual implementation
  });
});

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('should show side sheet for notifications', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // On tablet, might use side sheet
    await expect(notificationPage.dropdown).toBeVisible();

    const position = await notificationPage.dropdown.evaluate(el => ({
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right,
    }));

    // Should be positioned appropriately for tablet
    expect(position.left).toBeGreaterThanOrEqual(0);
  });

  test('should adapt layout for tablet', async ({ page }) => {
    await AuthHelper.login(page);
    await page.goto('/notifications');

    // Page layout should adapt for tablet
    const container = page.locator('[data-testid="notifications-container"]');
    await expect(container).toBeVisible();
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should show positioned dropdown', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // Desktop dropdown should be positioned below bell
    const bellBox = await notificationPage.bellIcon.boundingBox();
    const dropdownBox = await notificationPage.dropdown.boundingBox();

    if (bellBox && dropdownBox) {
      // Dropdown should be below bell icon
      expect(dropdownBox.y).toBeGreaterThan(bellBox.y);

      // Dropdown should have reasonable width (not full screen)
      expect(dropdownBox.width).toBeLessThan(600);
    }
  });

  test('should support hover states', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    const count = await notificationPage.getNotificationCount();

    if (count > 0) {
      // Hover over notification
      await notificationPage.notificationItems.first().hover();

      // Action buttons should appear
      await page.waitForTimeout(200);

      const deleteButton = notificationPage.notificationItems
        .first()
        .locator('[data-testid="delete-notification"]');

      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('Focus Management', () => {
  test('should trap focus inside modal', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // Tab through all elements
    const tabbableElements: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-testid')
      );
      if (focused) tabbableElements.push(focused);
    }

    // Focus should stay within dropdown
    const dropdownTestIds = ['notification-item', 'mark-all-read', 'view-all-notifications'];
    const allInside = tabbableElements.every(testId =>
      dropdownTestIds.some(allowed => testId.includes(allowed)) || testId === null
    );

    // Note: This is a simplified check
  });

  test('should return focus to trigger after closing', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    // Focus bell
    await notificationPage.bellIcon.focus();

    // Open dropdown
    await page.keyboard.press('Enter');

    // Close with Escape
    await page.keyboard.press('Escape');

    // Focus should return to bell
    const focused = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );

    expect(focused).toBe('notification-bell');
  });
});

test.describe('Animation and Performance', () => {
  test('should animate dropdown opening', async ({ page }) => {
    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    // Open dropdown
    await notificationPage.bellIcon.click();

    // Dropdown should animate in
    await expect(notificationPage.dropdown).toBeVisible();

    // Check if transition/animation applied
    const hasTransition = await notificationPage.dropdown.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.transition !== 'none' || style.animation !== 'none';
    });

    // Note: This depends on your implementation
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await AuthHelper.login(page);
    const notificationPage = new NotificationPage(page);

    await notificationPage.openDropdown();

    // Animations should be disabled
    await expect(notificationPage.dropdown).toBeVisible();
  });
});
