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

  static hasRuntimeCredentials(): boolean {
    return Boolean(process.env.QA_EMAIL && process.env.QA_PASSWORD);
  }

  static getRuntimeUser(): TestUser {
    const email = process.env.QA_EMAIL;
    const password = process.env.QA_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Runtime-secret login requires QA_EMAIL and QA_PASSWORD environment variables.',
      );
    }

    return {
      email,
      password,
      name: process.env.QA_NAME || 'QA Runtime User',
    };
  }

  static async loginWithRuntimeCredentials(page: Page): Promise<void> {
    const runtimeUser = this.getRuntimeUser();

    await page.goto('/account/login?redirect=/');

    await page.fill('input[name="email"]', runtimeUser.email);
    await page.fill('input[name="password"]', runtimeUser.password);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/($|\?)/, { timeout: 15000 });
    } catch {
      const loginError = page.locator('form p.text-sm.text-red-600').first();

      if ((await loginError.count()) > 0 && (await loginError.isVisible())) {
        const message = (await loginError.textContent())?.trim();
        throw new Error(
          `Runtime-secret login failed before homepage redirect${message ? `: ${message}` : '.'}`,
        );
      }

      throw new Error(
        'Runtime-secret login did not reach the homepage within 15 seconds.',
      );
    }
  }

  static async login(page: Page, user: TestUser = this.DEFAULT_USER): Promise<void> {
    await page.goto('/account/login');

    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);

    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/($|\?)/, { timeout: 10000 });
  }

  static async logout(page: Page): Promise<void> {
    // Click user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Wait for redirect to login
    await page.waitForURL('/account/login', { timeout: 5000 });
  }

  static async getAuthToken(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
      return localStorage.getItem('technova_access_token') || localStorage.getItem('accessToken');
    });
  }

  static async setAuthToken(page: Page, token: string): Promise<void> {
    await page.evaluate((token) => {
      localStorage.setItem('technova_access_token', token);
      localStorage.setItem('accessToken', token);
    }, token);
  }

  static async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('technova_access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('technova_refresh_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('technova_user');
      localStorage.removeItem('user');
    });
  }
}
