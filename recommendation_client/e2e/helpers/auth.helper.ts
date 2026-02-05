/**
 * Authentication Helper for E2E Tests
 * Handles login and token management
 */
import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export class AuthHelper {
  static readonly DEFAULT_USER: TestUser = {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User',
  };

  static readonly ADMIN_USER: TestUser = {
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'Admin User',
  };

  static async login(page: Page, user: TestUser = this.DEFAULT_USER): Promise<void> {
    await page.goto('/login');

    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);

    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 5000 });
  }

  static async logout(page: Page): Promise<void> {
    // Click user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
  }

  static async getAuthToken(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
  }

  static async setAuthToken(page: Page, token: string): Promise<void> {
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, token);
  }

  static async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    });
  }
}
