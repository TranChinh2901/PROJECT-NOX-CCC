import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';

type DatasetRow = {
  userId: number;
  productId: number;
  interactionScore: number;
  categoryId: number | null;
  brandId: number | null;
  purchaseCount: number;
  addToCartCount: number;
  wishlistCount: number;
  viewCount: number;
  lastInteractionAt: string;
};

type RecommendationOutput = {
  metadata: {
    generatedAt: string;
    sourceDataset: string;
    topKSimilarItems: number;
    topNRecommendations: number;
    userCount: number;
    itemCount: number;
  };
  recommendationsByUser: Record<
    string,
    Array<{
      productId: number;
      score: number;
      reason: string;
    }>
  >;
  similarItemsByProduct: Record<
    string,
    Array<{
      productId: number;
      score: number;
    }>
  >;
};

const DEFAULT_INPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-training-data.csv'
);
const DEFAULT_OUTPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-baseline-model.json'
);
const DEFAULT_TOP_K_SIMILAR = 20;
const DEFAULT_TOP_N_RECOMMENDATIONS = 10;

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

const toNumber = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const normalizeReason = (row: DatasetRow): string => {
  if (row.purchaseCount > 0) {
    return 'based on previous purchases';
  }

  if (row.addToCartCount > 0) {
    return 'similar to items added to cart';
  }

  if (row.wishlistCount > 0) {
    return 'similar to wishlist interests';
  }

  return 'based on recent browsing behavior';
};

const normalizeRecommendationScores = (
  recommendations: Array<{
    productId: number;
    score: number;
    reason: string;
  }>
): Array<{
  productId: number;
  score: number;
  reason: string;
}> => {
  const maxScore = recommendations.reduce(
    (currentMax, recommendation) => Math.max(currentMax, recommendation.score),
    0
  );

  if (maxScore <= 0) {
    return recommendations.map((recommendation) => ({
      ...recommendation,
      score: 0,
    }));
  }

  return recommendations.map((recommendation) => ({
    ...recommendation,
    score: Number((recommendation.score / maxScore).toFixed(6)),
  }));
};

async function loadDataset(inputPath: string): Promise<DatasetRow[]> {
  const rawCsv = await readFile(inputPath, 'utf8');
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const header = parseCsvLine(lines[0]);
  const columnIndex = new Map(header.map((column, index) => [column, index]));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const get = (column: string) => values[columnIndex.get(column) ?? -1];

    return {
      userId: toNumber(get('user_id')),
      productId: toNumber(get('product_id')),
      interactionScore: toNumber(get('interaction_score')),
      categoryId: get('category_id') ? toNumber(get('category_id')) : null,
      brandId: get('brand_id') ? toNumber(get('brand_id')) : null,
      purchaseCount: toNumber(get('purchase_count')),
      addToCartCount: toNumber(get('add_to_cart_count')),
      wishlistCount: toNumber(get('wishlist_count')),
      viewCount: toNumber(get('view_count')),
      lastInteractionAt: get('last_interaction_at') || '',
    };
  });
}

async function trainBaselineModel(): Promise<void> {
  const inputPath = parseFlag('--input') ?? DEFAULT_INPUT_PATH;
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;
  const topKSimilarItems = toNumber(parseFlag('--top-k') ?? String(DEFAULT_TOP_K_SIMILAR));
  const topNRecommendations = toNumber(parseFlag('--top-n') ?? String(DEFAULT_TOP_N_RECOMMENDATIONS));

  const dataset = await loadDataset(inputPath);

  if (dataset.length === 0) {
    throw new Error(`Dataset is empty or missing rows: ${inputPath}`);
  }

  const interactionsByUser = new Map<number, DatasetRow[]>();
  const usersByItem = new Map<number, Map<number, number>>();
  const itemNorms = new Map<number, number>();

  for (const row of dataset) {
    if (!interactionsByUser.has(row.userId)) {
      interactionsByUser.set(row.userId, []);
    }
    interactionsByUser.get(row.userId)!.push(row);

    if (!usersByItem.has(row.productId)) {
      usersByItem.set(row.productId, new Map());
    }
    usersByItem.get(row.productId)!.set(row.userId, row.interactionScore);
    itemNorms.set(
      row.productId,
      (itemNorms.get(row.productId) || 0) + row.interactionScore * row.interactionScore
    );
  }

  const productIds = Array.from(usersByItem.keys());
  const similarItemsByProduct: RecommendationOutput['similarItemsByProduct'] = {};

  for (const productId of productIds) {
    const productUsers = usersByItem.get(productId)!;
    const currentNorm = Math.sqrt(itemNorms.get(productId) || 1);
    const similarities: Array<{ productId: number; score: number }> = [];

    for (const otherProductId of productIds) {
      if (otherProductId === productId) {
        continue;
      }

      const otherUsers = usersByItem.get(otherProductId)!;
      let dotProduct = 0;

      for (const [userId, score] of productUsers.entries()) {
        const otherScore = otherUsers.get(userId);
        if (otherScore) {
          dotProduct += score * otherScore;
        }
      }

      if (dotProduct === 0) {
        continue;
      }

      const similarity =
        dotProduct /
        (currentNorm * Math.sqrt(itemNorms.get(otherProductId) || 1));

      if (similarity > 0) {
        similarities.push({
          productId: otherProductId,
          score: Number(similarity.toFixed(6)),
        });
      }
    }

    similarItemsByProduct[String(productId)] = similarities
      .sort((left, right) => right.score - left.score)
      .slice(0, topKSimilarItems);
  }

  const recommendationsByUser: RecommendationOutput['recommendationsByUser'] = {};

  for (const [userId, userRows] of interactionsByUser.entries()) {
    const seenProducts = new Set(userRows.map((row) => row.productId));
    const candidateScores = new Map<number, number>();
    const candidateReasons = new Map<number, string[]>();

    for (const row of userRows) {
      const similarItems = similarItemsByProduct[String(row.productId)] || [];

      for (const similarItem of similarItems) {
        if (seenProducts.has(similarItem.productId)) {
          continue;
        }

        const accumulatedScore =
          (candidateScores.get(similarItem.productId) || 0) +
          similarItem.score * row.interactionScore;
        candidateScores.set(similarItem.productId, accumulatedScore);

        const reasons = candidateReasons.get(similarItem.productId) || [];
        reasons.push(normalizeReason(row));
        candidateReasons.set(similarItem.productId, reasons);
      }
    }

    recommendationsByUser[String(userId)] = normalizeRecommendationScores(
      Array.from(candidateScores.entries())
        .map(([productId, score]) => {
          const reasons = candidateReasons.get(productId) || [];
          const uniqueReason = Array.from(new Set(reasons))[0] || 'similar user-item interactions';

          return {
            productId,
            score,
            reason: uniqueReason,
          };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, topNRecommendations)
    );
  }

  const modelOutput: RecommendationOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceDataset: inputPath,
      topKSimilarItems,
      topNRecommendations,
      userCount: interactionsByUser.size,
      itemCount: productIds.length,
    },
    recommendationsByUser,
    similarItemsByProduct,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(modelOutput, null, 2)}\n`, 'utf8');

  console.log('Recommendation baseline model trained successfully.');
  console.log(`- Input: ${inputPath}`);
  console.log(`- Output: ${outputPath}`);
  console.log(`- Users: ${interactionsByUser.size}`);
  console.log(`- Items: ${productIds.length}`);
  console.log(`- Top-N recommendations/user: ${topNRecommendations}`);
  console.log(`- Top-K similar items/product: ${topKSimilarItems}`);
}

void trainBaselineModel().catch((error) => {
  console.error('Failed to train recommendation baseline model:', error);
  process.exit(1);
});
