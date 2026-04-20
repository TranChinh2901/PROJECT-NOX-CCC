import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Locator, Page, TestInfo } from '@playwright/test';

export type ProductLinkEvidence = {
  href: string;
  title: string;
  hasImage: boolean;
  hasPrice: boolean;
  reason?: string;
};

type AttachLaunchEvidenceOptions = {
  screenshotTarget?: Locator;
  mirrorScreenshotPath?: string;
};

export function normalizeProductPath(href: string): string {
  return new URL(href, 'http://127.0.0.1').pathname;
}

export async function findHomepageRecommendationSection(page: Page): Promise<Locator> {
  return page
    .locator('section')
    .filter({
      has: page.locator('p').filter({ hasText: /Dành cho bạn|Xu hướng nổi bật/i }),
    })
    .first();
}

export async function findPdpSimilarItemsSection(page: Page): Promise<Locator> {
  return page
    .locator('section')
    .filter({
      has: page.getByRole('heading', { name: 'Sản phẩm liên quan' }),
    })
    .first();
}

export async function collectHomepageRecommendationCards(
  section: Locator,
): Promise<ProductLinkEvidence[]> {
  const cardWrappers = section.locator('div.grid > div.space-y-2');
  const count = await cardWrappers.count();
  const cards: ProductLinkEvidence[] = [];

  for (let index = 0; index < count; index += 1) {
    const wrapper = cardWrappers.nth(index);
    const article = wrapper.locator('article').first();
    const link = article.locator('a[href^="/product/"]').first();
    const title = ((await article.locator('h3').first().textContent()) || '').trim();
    const href = await link.getAttribute('href');
    const reason = ((await wrapper.locator('p').last().textContent()) || '').trim();

    cards.push({
      href: normalizeProductPath(href || '/'),
      title,
      hasImage: (await article.locator('img').count()) > 0,
      hasPrice: /₫/.test((await article.textContent()) || ''),
      reason: reason || undefined,
    });
  }

  return cards;
}

export async function collectPdpSimilarItemCards(section: Locator): Promise<ProductLinkEvidence[]> {
  const links = section.locator('div.grid a[href^="/product/"]');
  const count = await links.count();
  const cards: ProductLinkEvidence[] = [];

  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    const href = await link.getAttribute('href');
    const title = ((await link.locator('h3').first().textContent()) || '').trim();

    cards.push({
      href: normalizeProductPath(href || '/'),
      title,
      hasImage: (await link.locator('img').count()) > 0,
      hasPrice: /₫/.test((await link.textContent()) || ''),
    });
  }

  return cards;
}

export async function collectCandidateProductPaths(page: Page, limit = 8): Promise<string[]> {
  const collected = new Set<string>();
  const homepageSection = await findHomepageRecommendationSection(page);

  if ((await homepageSection.count()) > 0) {
    const recommendationLinks = await homepageSection
      .locator('a[href^="/product/"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute('href'))
          .filter((href): href is string => Boolean(href)),
      );

    recommendationLinks.forEach((href) => {
      if (collected.size < limit) {
        collected.add(new URL(href, 'http://127.0.0.1').pathname);
      }
    });
  }

  const catalogLinks = await page.locator('#catalog a[href^="/product/"]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('href'))
      .filter((href): href is string => Boolean(href)),
  );

  catalogLinks.forEach((href) => {
    if (collected.size < limit) {
      collected.add(new URL(href, 'http://127.0.0.1').pathname);
    }
  });

  return Array.from(collected);
}

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

async function resolveRepoRelativePath(targetPath: string): Promise<string> {
  const repoRoot = REPO_ROOT;
  const sisyphusDirectory = path.join(repoRoot, '.sisyphus');

  await access(sisyphusDirectory);
  return path.join(repoRoot, targetPath);
}

export async function attachLaunchEvidence(
  testInfo: TestInfo,
  evidenceName: string,
  payload: Record<string, unknown>,
  options: AttachLaunchEvidenceOptions = {},
): Promise<void> {
  const outputDirectory = testInfo.outputPath('launch-review');
  await mkdir(outputDirectory, { recursive: true });

  const jsonPath = path.join(outputDirectory, `${evidenceName}.json`);
  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await testInfo.attach(`${evidenceName}.json`, {
    path: jsonPath,
    contentType: 'application/json',
  });

  if (options.screenshotTarget) {
    const screenshotPath = path.join(outputDirectory, `${evidenceName}.png`);
    await options.screenshotTarget.screenshot({ path: screenshotPath });
    await testInfo.attach(`${evidenceName}.png`, {
      path: screenshotPath,
      contentType: 'image/png',
    });

    if (options.mirrorScreenshotPath) {
      const mirroredPath = await resolveRepoRelativePath(options.mirrorScreenshotPath);
      await mkdir(path.dirname(mirroredPath), { recursive: true });
      await copyFile(screenshotPath, mirroredPath);
    }
  }
}
