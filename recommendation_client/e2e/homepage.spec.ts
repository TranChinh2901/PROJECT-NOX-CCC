import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('links the hero CTA to the catalog section', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();

    await page.getByRole('link', { name: 'Khám phá sản phẩm' }).click();

    await expect(page).toHaveURL(/#catalog$/);
    await expect(page.locator('#catalog')).toBeVisible();
  });

  test('renders a bounded initial catalog grid', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#catalog')).toBeVisible();
    await expect(page.locator('#catalog article')).toHaveCount(10);
  });

  test('loads more catalog products on demand', async ({ page }) => {
    await page.goto('/');

    const catalogCards = page.locator('#catalog article');

    await expect(catalogCards).toHaveCount(10);
    await page.getByRole('button', { name: 'Xem thêm' }).click();
    await expect(catalogCards).toHaveCount(20);
  });
});
