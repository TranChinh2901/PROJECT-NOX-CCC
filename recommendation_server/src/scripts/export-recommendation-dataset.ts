import 'reflect-metadata';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { AppDataSource } from '@/config/database.config';
import { UserBehaviorLog } from '@/modules/ai/entity/user-behavior-log';

type AggregatedInteractionRow = {
  user_id: number;
  product_id: number;
  category_id: number | null;
  brand_id: number | null;
  view_count: number;
  add_to_cart_count: number;
  wishlist_count: number;
  purchase_count: number;
  review_count: number;
  interaction_count: number;
  interaction_score: number;
  last_interaction_at: string;
};

const ACTION_WEIGHTS: Record<string, number> = {
  view: 1,
  click: 1,
  add_to_cart: 3,
  wishlist_add: 4,
  purchase: 6,
  review_view: 2,
};

const DEFAULT_LOOKBACK_DAYS = 180;
const DEFAULT_OUTPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-training-data.csv'
);

const parseFlag = (flagName: string): string | undefined => {
  const exactMatch = process.argv.find((argument) => argument.startsWith(`${flagName}=`));
  if (exactMatch) {
    return exactMatch.slice(flagName.length + 1);
  }

  const index = process.argv.findIndex((argument) => argument === flagName);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
};

const toNumber = (value: string | number | null | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapeCsv = (value: string | number | null): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const serialized = String(value);
  if (serialized.includes(',') || serialized.includes('"') || serialized.includes('\n')) {
    return `"${serialized.replace(/"/g, '""')}"`;
  }

  return serialized;
};

async function exportRecommendationDataset(): Promise<void> {
  const lookbackDays = toNumber(parseFlag('--days') ?? DEFAULT_LOOKBACK_DAYS);
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  await AppDataSource.initialize();

  try {
    const repository = AppDataSource.getRepository(UserBehaviorLog);
    const rows = await repository
      .createQueryBuilder('log')
      .leftJoin('log.product', 'product')
      .select('log.user_id', 'user_id')
      .addSelect('log.product_id', 'product_id')
      .addSelect('product.category_id', 'category_id')
      .addSelect('product.brand_id', 'brand_id')
      .addSelect(
        `SUM(CASE WHEN log.action_type = 'view' THEN 1 ELSE 0 END)`,
        'view_count'
      )
      .addSelect(
        `SUM(CASE WHEN log.action_type = 'add_to_cart' THEN 1 ELSE 0 END)`,
        'add_to_cart_count'
      )
      .addSelect(
        `SUM(CASE WHEN log.action_type = 'wishlist_add' THEN 1 ELSE 0 END)`,
        'wishlist_count'
      )
      .addSelect(
        `SUM(CASE WHEN log.action_type = 'purchase' THEN 1 ELSE 0 END)`,
        'purchase_count'
      )
      .addSelect(
        `SUM(CASE WHEN log.action_type = 'review_view' THEN 1 ELSE 0 END)`,
        'review_count'
      )
      .addSelect('COUNT(*)', 'interaction_count')
      .addSelect('MAX(log.created_at)', 'last_interaction_at')
      .where('log.user_id IS NOT NULL')
      .andWhere('log.product_id IS NOT NULL')
      .andWhere('log.created_at >= :since', { since })
      .groupBy('log.user_id')
      .addGroupBy('log.product_id')
      .addGroupBy('product.category_id')
      .addGroupBy('product.brand_id')
      .orderBy('log.user_id', 'ASC')
      .addOrderBy('interaction_count', 'DESC')
      .getRawMany<Record<string, string>>();

    const dataset: AggregatedInteractionRow[] = rows.map((row) => {
      const viewCount = toNumber(row.view_count);
      const addToCartCount = toNumber(row.add_to_cart_count);
      const wishlistCount = toNumber(row.wishlist_count);
      const purchaseCount = toNumber(row.purchase_count);
      const reviewCount = toNumber(row.review_count);

      const interactionScore =
        viewCount * ACTION_WEIGHTS.view +
        addToCartCount * ACTION_WEIGHTS.add_to_cart +
        wishlistCount * ACTION_WEIGHTS.wishlist_add +
        purchaseCount * ACTION_WEIGHTS.purchase +
        reviewCount * ACTION_WEIGHTS.review_view;

      return {
        user_id: toNumber(row.user_id),
        product_id: toNumber(row.product_id),
        category_id: row.category_id ? toNumber(row.category_id) : null,
        brand_id: row.brand_id ? toNumber(row.brand_id) : null,
        view_count: viewCount,
        add_to_cart_count: addToCartCount,
        wishlist_count: wishlistCount,
        purchase_count: purchaseCount,
        review_count: reviewCount,
        interaction_count: toNumber(row.interaction_count),
        interaction_score: interactionScore,
        last_interaction_at: row.last_interaction_at,
      };
    });

    const csvHeader = [
      'user_id',
      'product_id',
      'category_id',
      'brand_id',
      'view_count',
      'add_to_cart_count',
      'wishlist_count',
      'purchase_count',
      'review_count',
      'interaction_count',
      'interaction_score',
      'last_interaction_at',
    ];

    const csvLines = [
      csvHeader.join(','),
      ...dataset.map((row) =>
        [
          row.user_id,
          row.product_id,
          row.category_id,
          row.brand_id,
          row.view_count,
          row.add_to_cart_count,
          row.wishlist_count,
          row.purchase_count,
          row.review_count,
          row.interaction_count,
          row.interaction_score,
          row.last_interaction_at,
        ]
          .map((value) => escapeCsv(value))
          .join(',')
      ),
    ];

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${csvLines.join('\n')}\n`, 'utf8');

    console.log('Recommendation training dataset exported successfully.');
    console.log(`- Lookback days: ${lookbackDays}`);
    console.log(`- Rows: ${dataset.length}`);
    console.log(`- Output: ${outputPath}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void exportRecommendationDataset().catch((error) => {
  console.error('Failed to export recommendation dataset:', error);
  process.exit(1);
});
