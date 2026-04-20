import { expect, test } from '@playwright/test';

import { AuthHelper } from './helpers/auth.helper';
import {
  attachLaunchEvidence,
  collectCandidateProductPaths,
  collectPdpSimilarItemCards,
  findPdpSimilarItemsSection,
} from './helpers/recommendation-launch.helper';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.describe('Product detail launch verification', () => {
  test('verifies similar items exclude the current product and link to alternates', async ({ page }, testInfo) => {
    const credentialedMode = AuthHelper.hasRuntimeCredentials();
    const authMode = credentialedMode ? 'qa-runtime-secret' : 'anonymous';

    if (AuthHelper.hasRuntimeCredentials()) {
      await AuthHelper.loginWithRuntimeCredentials(page);
    } else {
      await page.goto('/');
    }

    await expect(page.locator('#catalog')).toBeVisible();

    const candidatePaths = await collectCandidateProductPaths(page, credentialedMode ? 24 : 8);

    if (candidatePaths.length === 0) {
      await attachLaunchEvidence(testInfo, 'pdp-similar-items', {
        authMode,
        state: 'hidden',
        candidatePaths,
        reason: 'no-homepage-product-links-available-for-pdp-sampling',
      });

      if (credentialedMode) {
        expect(
          candidatePaths.length,
          'Credentialed launch verification requires PDP sampling candidates from the homepage.',
        ).toBeGreaterThan(0);
      }

      return;
    }

    const hiddenCandidates: string[] = [];

    for (const candidatePath of candidatePaths) {
      await page.goto(candidatePath);
      await expect(page.locator('main')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expect
        .poll(async () => await page.getByText('Đang tải sản phẩm...').count(), {
          timeout: 10000,
        })
        .toBe(0);

      const currentPath = new URL(page.url()).pathname;
      const similarItemsSection = await findPdpSimilarItemsSection(page);

      if ((await similarItemsSection.count()) === 0) {
        hiddenCandidates.push(currentPath);
        continue;
      }

      await expect(similarItemsSection).toBeVisible();

      const cards = await collectPdpSimilarItemCards(similarItemsSection);
      const hrefs = cards.map((card) => card.href);

      expect(cards.length).toBeGreaterThan(0);
      expect(new Set(hrefs).size).toBe(hrefs.length);

      cards.forEach((card) => {
        expect(card.href).toMatch(/^\/product\/.+/);
        expect(card.href).not.toBe(currentPath);
        expect(card.title.length).toBeGreaterThan(0);
        expect(card.hasImage).toBe(true);
        expect(card.hasPrice).toBe(true);
      });

      await attachLaunchEvidence(
        testInfo,
        'pdp-similar-items',
        {
          authMode,
          state: 'visible',
          currentPath,
          cardCount: cards.length,
          hrefs,
          cards,
        },
        {
          screenshotTarget: similarItemsSection,
          mirrorScreenshotPath: '.sisyphus/evidence/task-9-playwright-pdp.png',
        },
      );

      return;
    }

    await attachLaunchEvidence(testInfo, 'pdp-similar-items', {
      authMode,
      state: 'hidden',
      candidatePaths,
      hiddenCandidates,
      reason: 'similar-items-section-not-rendered-for-sampled-products',
    });

    if (credentialedMode) {
      expect(
        hiddenCandidates,
        'Credentialed launch verification requires at least one sampled PDP with a visible similar-items section.',
      ).toHaveLength(0);
    }
  });
});
