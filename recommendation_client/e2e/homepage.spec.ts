import { expect, test, type Page } from '@playwright/test';

import { AuthHelper } from './helpers/auth.helper';
import {
  attachLaunchEvidence,
  collectHomepageRecommendationCards,
  findHomepageRecommendationSection,
} from './helpers/recommendation-launch.helper';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function waitForHomepageCatalogToSettle(page: Page) {
  const catalogCards = page.locator('#catalog article');
  const emptyState = page.getByRole('heading', { name: 'Không tìm thấy sản phẩm phù hợp' });

  await expect(page.locator('#catalog')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect
    .poll(async () => (await catalogCards.count()) + (await emptyState.count()), {
      timeout: 10000,
    })
    .toBeGreaterThan(0);

  return { catalogCards, emptyState };
}

test.describe('Homepage', () => {
  test('links the hero CTA to the catalog section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Góc Làm Việc Chuyên Nghiệp.' })).toBeVisible();

    await page.getByRole('link', { name: 'Mua sắm ngay' }).click();

    await expect(page).toHaveURL(/#catalog$/);
    await expect(page.locator('#catalog')).toBeVisible();
  });

  test('renders a bounded initial catalog grid', async ({ page }) => {
    await page.goto('/');

    const { catalogCards, emptyState } = await waitForHomepageCatalogToSettle(page);

    const initialCount = await catalogCards.count();

    if (initialCount === 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    expect(initialCount).toBeGreaterThan(0);
    expect(initialCount).toBeLessThanOrEqual(16);
  });

  test('loads more catalog products on demand', async ({ page }) => {
    await page.goto('/');

    const { catalogCards, emptyState } = await waitForHomepageCatalogToSettle(page);
    const loadMoreButton = page.getByRole('button', { name: 'Xem thêm' });

    const initialCount = await catalogCards.count();

    if (initialCount === 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    if ((await loadMoreButton.count()) === 0 || !(await loadMoreButton.isVisible())) {
      expect(initialCount).toBeLessThanOrEqual(16);
      return;
    }

    await loadMoreButton.click();
    await expect.poll(async () => catalogCards.count()).toBeGreaterThan(initialCount);
  });
});

test.describe('Homepage launch verification', () => {
  test('verifies recommendation cards render safely for launch review', async ({ page }, testInfo) => {
    const credentialedMode = AuthHelper.hasRuntimeCredentials();
    const authMode = credentialedMode ? 'qa-runtime-secret' : 'anonymous';

    if (AuthHelper.hasRuntimeCredentials()) {
      await AuthHelper.loginWithRuntimeCredentials(page);
    } else {
      await page.goto('/');
    }

    await waitForHomepageCatalogToSettle(page);

    const recommendationSection = await findHomepageRecommendationSection(page);

    if ((await recommendationSection.count()) === 0) {
      await attachLaunchEvidence(testInfo, 'homepage-recommendations', {
        authMode,
        state: 'hidden',
        path: new URL(page.url()).pathname,
        reason: 'recommendation-section-not-rendered',
      });

      if (credentialedMode) {
        expect(
          await recommendationSection.count(),
          'Credentialed launch verification requires a visible homepage recommendation rail.',
        ).toBeGreaterThan(0);
      }

      return;
    }

    await expect(recommendationSection).toBeVisible();

    const cards = await collectHomepageRecommendationCards(recommendationSection);
    const hrefs = cards.map((card) => card.href);

    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    cards.forEach((card) => {
      expect(card.href).toMatch(/^\/product\/.+/);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.hasImage).toBe(true);
      expect(card.hasPrice).toBe(true);
    });

    await attachLaunchEvidence(
      testInfo,
      'homepage-recommendations',
      {
        authMode,
        state: 'visible',
        path: new URL(page.url()).pathname,
        cardCount: cards.length,
        hrefs,
        cards,
      },
      {
        screenshotTarget: recommendationSection,
        mirrorScreenshotPath: '.sisyphus/evidence/task-9-playwright-homepage.png',
      },
    );
  });
});
