import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';

export type DatasetRow = {
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

type ModelOutput = {
  metadata?: Record<string, unknown>;
  similarItemsByProduct?: Record<string, Array<{ productId: number; score: number }>>;
};

export type RecommendationCandidate = {
  productId: number;
  score: number;
};

export type EvaluationSummary = {
  generatedAt: string;
  inputDataset: string;
  inputModel: string;
  algorithmTag: string;
  modelMetadata: Record<string, unknown>;
  datasetWindow: {
    earliestInteractionAt: string | null;
    latestInteractionAt: string | null;
    spanDays: number;
  };
  topK: number;
  topN: number | null;
  lookbackDays: number | null;
  holdoutCount: number;
  evaluatedUsers: number;
  skippedUsers: number;
  catalogSize: number;
  recommendedCatalogSize: number;
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  mrrAtK: number;
  coverageAtK: number;
  ndcgAtK: number;
  mapAtK: number;
  categoryCoverageAtK: number;
  brandCoverageAtK: number;
  noveltyAtK: number;
  intraListDiversityAtK: number;
  coldStartUserSlice: EvaluationSliceSummary;
  coldStartProductSlice: EvaluationSliceSummary;
};

export type EvaluationSliceSummary = {
  evaluatedUsers: number;
  holdoutItems: number;
  hitRateAtK: number;
  recallAtK: number;
};

type EvaluationSplit = {
  trainRowsByUser: Map<number, DatasetRow[]>;
  holdoutRowsByUser: Map<number, DatasetRow[]>;
  skippedUsers: number;
};

type ProductAttributes = {
  categoryId: number | null;
  brandId: number | null;
};

type EvaluationContext = {
  productAttributesById: Map<number, ProductAttributes>;
  itemUserCounts: Map<number, number>;
  totalUsers: number;
};

const DEFAULT_INPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-training-data.csv'
);
const DEFAULT_MODEL_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-baseline-model.json'
);
const DEFAULT_OUTPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-evaluation.json'
);
const DEFAULT_HISTORY_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-evaluation-history.json'
);
const DEFAULT_ALGORITHM_TAG = 'item-item-baseline';
const DEFAULT_TOP_K = 10;
const DEFAULT_HOLDOUT_COUNT = 1;
const COLD_START_USER_MAX_TRAIN_INTERACTIONS = 2;
const COLD_START_PRODUCT_MAX_USERS = 2;

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

const toNumber = (value: string | undefined, fallback: number = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMetric = (value: number): number => Number(value.toFixed(6));

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

export async function loadDataset(inputPath: string): Promise<DatasetRow[]> {
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

async function loadModel(inputPath: string): Promise<ModelOutput> {
  const rawModel = await readFile(inputPath, 'utf8');
  return JSON.parse(rawModel) as ModelOutput;
}

const compareRowsByRecency = (left: DatasetRow, right: DatasetRow): number => {
  const leftTimestamp = new Date(left.lastInteractionAt).getTime();
  const rightTimestamp = new Date(right.lastInteractionAt).getTime();

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  if (left.interactionScore !== right.interactionScore) {
    return left.interactionScore - right.interactionScore;
  }

  return left.productId - right.productId;
};

export function buildEvaluationSplit(
  dataset: DatasetRow[],
  holdoutCount: number
): EvaluationSplit {
  const rowsByUser = new Map<number, DatasetRow[]>();

  for (const row of dataset) {
    if (!rowsByUser.has(row.userId)) {
      rowsByUser.set(row.userId, []);
    }
    rowsByUser.get(row.userId)!.push(row);
  }

  const trainRowsByUser = new Map<number, DatasetRow[]>();
  const holdoutRowsByUser = new Map<number, DatasetRow[]>();
  let skippedUsers = 0;

  for (const [userId, rows] of rowsByUser.entries()) {
    const sortedRows = [...rows].sort(compareRowsByRecency);

    if (sortedRows.length <= holdoutCount) {
      skippedUsers += 1;
      continue;
    }

    trainRowsByUser.set(userId, sortedRows.slice(0, -holdoutCount));
    holdoutRowsByUser.set(userId, sortedRows.slice(-holdoutCount));
  }

  return {
    trainRowsByUser,
    holdoutRowsByUser,
    skippedUsers,
  };
}

export function buildEvaluationContext(dataset: DatasetRow[]): EvaluationContext {
  const productAttributesById = new Map<number, ProductAttributes>();
  const usersByItem = new Map<number, Set<number>>();
  const users = new Set<number>();

  for (const row of dataset) {
    users.add(row.userId);

    if (!productAttributesById.has(row.productId)) {
      productAttributesById.set(row.productId, {
        categoryId: row.categoryId,
        brandId: row.brandId,
      });
    }

    if (!usersByItem.has(row.productId)) {
      usersByItem.set(row.productId, new Set());
    }
    usersByItem.get(row.productId)!.add(row.userId);
  }

  return {
    productAttributesById,
    itemUserCounts: new Map(
      Array.from(usersByItem.entries()).map(([productId, itemUsers]) => [
        productId,
        itemUsers.size,
      ])
    ),
    totalUsers: users.size,
  };
}

export function generateRecommendationsForEvaluation(
  trainRows: DatasetRow[],
  similarItemsByProduct: Record<string, Array<{ productId: number; score: number }>>,
  topK: number
): RecommendationCandidate[] {
  const seenProducts = new Set(trainRows.map((row) => row.productId));
  const candidateScores = new Map<number, number>();

  for (const row of trainRows) {
    const similarItems = similarItemsByProduct[String(row.productId)] || [];

    for (const similarItem of similarItems) {
      if (seenProducts.has(similarItem.productId)) {
        continue;
      }

      const accumulatedScore =
        (candidateScores.get(similarItem.productId) || 0) +
        similarItem.score * row.interactionScore;
      candidateScores.set(similarItem.productId, accumulatedScore);
    }
  }

  return Array.from(candidateScores.entries())
    .map(([productId, score]) => ({ productId, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

const calculateDiscountedCumulativeGain = (
  recommendations: RecommendationCandidate[],
  holdoutSet: Set<number>
): number =>
  recommendations.reduce((sum, recommendation, index) => {
    if (!holdoutSet.has(recommendation.productId)) {
      return sum;
    }

    return sum + 1 / Math.log2(index + 2);
  }, 0);

const calculateAveragePrecision = (
  recommendations: RecommendationCandidate[],
  holdoutSet: Set<number>,
  topK: number
): number => {
  let hits = 0;
  let precisionAtHits = 0;

  recommendations.forEach((recommendation, index) => {
    if (!holdoutSet.has(recommendation.productId)) {
      return;
    }

    hits += 1;
    precisionAtHits += hits / (index + 1);
  });

  const idealHits = Math.min(holdoutSet.size, topK);
  return idealHits > 0 ? precisionAtHits / idealHits : 0;
};

const calculateRecommendationNovelty = (
  recommendations: RecommendationCandidate[],
  context: EvaluationContext
): number => {
  if (recommendations.length === 0 || context.totalUsers === 0) {
    return 0;
  }

  const noveltySum = recommendations.reduce((sum, recommendation) => {
    const itemUserCount = context.itemUserCounts.get(recommendation.productId) ?? 1;
    const popularity = Math.max(itemUserCount, 1) / context.totalUsers;
    return sum + -Math.log2(popularity);
  }, 0);

  return noveltySum / recommendations.length;
};

const calculateIntraListDiversity = (
  recommendations: RecommendationCandidate[],
  productAttributesById: Map<number, ProductAttributes>
): number => {
  if (recommendations.length < 2) {
    return 0;
  }

  let pairCount = 0;
  let diversitySum = 0;

  for (let leftIndex = 0; leftIndex < recommendations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < recommendations.length; rightIndex += 1) {
      const leftAttributes = productAttributesById.get(recommendations[leftIndex].productId);
      const rightAttributes = productAttributesById.get(recommendations[rightIndex].productId);

      if (!leftAttributes || !rightAttributes) {
        continue;
      }

      const categoryDiversity =
        leftAttributes.categoryId !== null &&
        rightAttributes.categoryId !== null &&
        leftAttributes.categoryId !== rightAttributes.categoryId
          ? 0.7
          : 0;
      const brandDiversity =
        leftAttributes.brandId !== null &&
        rightAttributes.brandId !== null &&
        leftAttributes.brandId !== rightAttributes.brandId
          ? 0.3
          : 0;

      diversitySum += categoryDiversity + brandDiversity;
      pairCount += 1;
    }
  }

  return pairCount > 0 ? diversitySum / pairCount : 0;
};

const emptySliceSummary = (): EvaluationSliceSummary => ({
  evaluatedUsers: 0,
  holdoutItems: 0,
  hitRateAtK: 0,
  recallAtK: 0,
});

const calculateDatasetWindow = (
  dataset: DatasetRow[]
): EvaluationSummary['datasetWindow'] => {
  const timestamps = dataset
    .map((row) => new Date(row.lastInteractionAt).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => left - right);

  if (timestamps.length === 0) {
    return {
      earliestInteractionAt: null,
      latestInteractionAt: null,
      spanDays: 0,
    };
  }

  const earliest = timestamps[0];
  const latest = timestamps[timestamps.length - 1];

  return {
    earliestInteractionAt: new Date(earliest).toISOString(),
    latestInteractionAt: new Date(latest).toISOString(),
    spanDays: roundMetric((latest - earliest) / (24 * 60 * 60 * 1000)),
  };
};

export function evaluateRecommendations(
  split: EvaluationSplit,
  similarItemsByProduct: Record<string, Array<{ productId: number; score: number }>>,
  topK: number,
  context: EvaluationContext = buildEvaluationContext([
    ...Array.from(split.trainRowsByUser.values()).flat(),
    ...Array.from(split.holdoutRowsByUser.values()).flat(),
  ])
): Omit<
  EvaluationSummary,
  | 'generatedAt'
  | 'inputDataset'
  | 'inputModel'
  | 'algorithmTag'
  | 'modelMetadata'
  | 'datasetWindow'
  | 'topK'
  | 'topN'
  | 'lookbackDays'
  | 'holdoutCount'
> {
  let totalHits = 0;
  let totalRecommended = 0;
  let totalHoldoutItems = 0;
  let hitUsers = 0;
  let reciprocalRankSum = 0;
  let ndcgSum = 0;
  let averagePrecisionSum = 0;
  let noveltySum = 0;
  let diversitySum = 0;
  let usersWithRecommendations = 0;
  const recommendedCatalog = new Set<number>();
  const catalog = new Set<number>();
  const recommendedCategories = new Set<number>();
  const recommendedBrands = new Set<number>();
  const catalogCategories = new Set<number>();
  const catalogBrands = new Set<number>();
  const coldStartUserSlice = emptySliceSummary();
  const coldStartProductSlice = emptySliceSummary();

  for (const trainRows of split.trainRowsByUser.values()) {
    for (const row of trainRows) {
      catalog.add(row.productId);
      if (row.categoryId !== null) {
        catalogCategories.add(row.categoryId);
      }
      if (row.brandId !== null) {
        catalogBrands.add(row.brandId);
      }
    }
  }
  for (const holdoutRows of split.holdoutRowsByUser.values()) {
    for (const row of holdoutRows) {
      catalog.add(row.productId);
      if (row.categoryId !== null) {
        catalogCategories.add(row.categoryId);
      }
      if (row.brandId !== null) {
        catalogBrands.add(row.brandId);
      }
    }
  }

  for (const [userId, holdoutRows] of split.holdoutRowsByUser.entries()) {
    const trainRows = split.trainRowsByUser.get(userId) || [];
    const recommendations = generateRecommendationsForEvaluation(
      trainRows,
      similarItemsByProduct,
      topK
    );

    const holdoutSet = new Set(holdoutRows.map((row) => row.productId));
    let firstHitRank = 0;
    let userHits = 0;
    const isColdStartUser = trainRows.length <= COLD_START_USER_MAX_TRAIN_INTERACTIONS;
    const coldStartProductHoldoutCount = holdoutRows.filter(
      (row) =>
        (context.itemUserCounts.get(row.productId) ?? 0) <= COLD_START_PRODUCT_MAX_USERS
    ).length;
    let coldStartProductHits = 0;

    for (let index = 0; index < recommendations.length; index += 1) {
      const recommendation = recommendations[index];
      recommendedCatalog.add(recommendation.productId);

      const attributes = context.productAttributesById.get(recommendation.productId);
      if (attributes?.categoryId !== null && attributes?.categoryId !== undefined) {
        recommendedCategories.add(attributes.categoryId);
      }
      if (attributes?.brandId !== null && attributes?.brandId !== undefined) {
        recommendedBrands.add(attributes.brandId);
      }

      if (holdoutSet.has(recommendation.productId)) {
        userHits += 1;
        if (firstHitRank === 0) {
          firstHitRank = index + 1;
        }

        const holdoutRow = holdoutRows.find((row) => row.productId === recommendation.productId);
        if (
          holdoutRow &&
          (context.itemUserCounts.get(holdoutRow.productId) ?? 0) <=
            COLD_START_PRODUCT_MAX_USERS
        ) {
          coldStartProductHits += 1;
        }
      }
    }

    totalHits += userHits;
    totalRecommended += recommendations.length;
    totalHoldoutItems += holdoutRows.length;
    ndcgSum +=
      calculateDiscountedCumulativeGain(recommendations, holdoutSet) /
      calculateDiscountedCumulativeGain(
        Array.from({ length: Math.min(holdoutSet.size, topK) }, (_, index) => ({
          productId: holdoutRows[index]?.productId ?? -1,
          score: 1,
        })),
        holdoutSet
      );
    averagePrecisionSum += calculateAveragePrecision(recommendations, holdoutSet, topK);

    if (recommendations.length > 0) {
      usersWithRecommendations += 1;
      noveltySum += calculateRecommendationNovelty(recommendations, context);
      diversitySum += calculateIntraListDiversity(
        recommendations,
        context.productAttributesById
      );
    }

    if (userHits > 0) {
      hitUsers += 1;
    }

    if (firstHitRank > 0) {
      reciprocalRankSum += 1 / firstHitRank;
    }

    if (isColdStartUser) {
      coldStartUserSlice.evaluatedUsers += 1;
      coldStartUserSlice.holdoutItems += holdoutRows.length;
      coldStartUserSlice.recallAtK += userHits;
      if (userHits > 0) {
        coldStartUserSlice.hitRateAtK += 1;
      }
    }

    if (coldStartProductHoldoutCount > 0) {
      coldStartProductSlice.evaluatedUsers += 1;
      coldStartProductSlice.holdoutItems += coldStartProductHoldoutCount;
      coldStartProductSlice.recallAtK += coldStartProductHits;
      if (coldStartProductHits > 0) {
        coldStartProductSlice.hitRateAtK += 1;
      }
    }
  }

  const evaluatedUsers = split.holdoutRowsByUser.size;
  const finalizeSlice = (slice: EvaluationSliceSummary): EvaluationSliceSummary => ({
    evaluatedUsers: slice.evaluatedUsers,
    holdoutItems: slice.holdoutItems,
    hitRateAtK:
      slice.evaluatedUsers > 0 ? roundMetric(slice.hitRateAtK / slice.evaluatedUsers) : 0,
    recallAtK: slice.holdoutItems > 0 ? roundMetric(slice.recallAtK / slice.holdoutItems) : 0,
  });

  return {
    evaluatedUsers,
    skippedUsers: split.skippedUsers,
    catalogSize: catalog.size,
    recommendedCatalogSize: recommendedCatalog.size,
    precisionAtK: totalRecommended > 0 ? roundMetric(totalHits / totalRecommended) : 0,
    recallAtK: totalHoldoutItems > 0 ? roundMetric(totalHits / totalHoldoutItems) : 0,
    hitRateAtK: evaluatedUsers > 0 ? roundMetric(hitUsers / evaluatedUsers) : 0,
    mrrAtK: evaluatedUsers > 0 ? roundMetric(reciprocalRankSum / evaluatedUsers) : 0,
    coverageAtK: catalog.size > 0 ? roundMetric(recommendedCatalog.size / catalog.size) : 0,
    ndcgAtK: evaluatedUsers > 0 ? roundMetric(ndcgSum / evaluatedUsers) : 0,
    mapAtK: evaluatedUsers > 0 ? roundMetric(averagePrecisionSum / evaluatedUsers) : 0,
    categoryCoverageAtK:
      catalogCategories.size > 0
        ? roundMetric(recommendedCategories.size / catalogCategories.size)
        : 0,
    brandCoverageAtK:
      catalogBrands.size > 0 ? roundMetric(recommendedBrands.size / catalogBrands.size) : 0,
    noveltyAtK:
      usersWithRecommendations > 0 ? roundMetric(noveltySum / usersWithRecommendations) : 0,
    intraListDiversityAtK:
      usersWithRecommendations > 0 ? roundMetric(diversitySum / usersWithRecommendations) : 0,
    coldStartUserSlice: finalizeSlice(coldStartUserSlice),
    coldStartProductSlice: finalizeSlice(coldStartProductSlice),
  };
}

export async function appendEvaluationHistory(
  historyPath: string,
  summary: EvaluationSummary
): Promise<void> {
  let history: EvaluationSummary[] = [];

  try {
    const rawHistory = await readFile(historyPath, 'utf8');
    const parsedHistory = JSON.parse(rawHistory);
    history = Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      throw error;
    }
  }

  history.push(summary);
  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
}

async function runEvaluation(): Promise<void> {
  const inputDataset = parseFlag('--input') ?? DEFAULT_INPUT_PATH;
  const inputModel = parseFlag('--model') ?? DEFAULT_MODEL_PATH;
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;
  const historyPath = parseFlag('--history-out') ?? DEFAULT_HISTORY_PATH;
  const algorithmTag = parseFlag('--algorithm') ?? DEFAULT_ALGORITHM_TAG;
  const lookbackDays = parseFlag('--lookback-days')
    ? toNumber(parseFlag('--lookback-days'), 0)
    : null;
  const topK = toNumber(parseFlag('--top-k'), DEFAULT_TOP_K);
  const holdoutCount = Math.max(1, toNumber(parseFlag('--holdout-count'), DEFAULT_HOLDOUT_COUNT));

  const [dataset, model] = await Promise.all([
    loadDataset(inputDataset),
    loadModel(inputModel),
  ]);

  if (dataset.length === 0) {
    throw new Error(`Dataset is empty or missing rows: ${inputDataset}`);
  }

  const split = buildEvaluationSplit(dataset, holdoutCount);
  const context = buildEvaluationContext(dataset);
  const metrics = evaluateRecommendations(
    split,
    model.similarItemsByProduct || {},
    topK,
    context
  );
  const topN =
    typeof model.metadata?.topNRecommendations === 'number'
      ? model.metadata.topNRecommendations
      : null;

  const summary: EvaluationSummary = {
    generatedAt: new Date().toISOString(),
    inputDataset,
    inputModel,
    algorithmTag,
    modelMetadata: model.metadata || {},
    datasetWindow: calculateDatasetWindow(dataset),
    topK,
    topN,
    lookbackDays,
    holdoutCount,
    ...metrics,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await appendEvaluationHistory(historyPath, summary);

  console.log('Recommendation baseline evaluation completed successfully.');
  console.log(`- Dataset: ${inputDataset}`);
  console.log(`- Model: ${inputModel}`);
  console.log(`- Output: ${outputPath}`);
  console.log(`- History: ${historyPath}`);
  console.log(`- Evaluated users: ${summary.evaluatedUsers}`);
  console.log(`- Precision@${topK}: ${summary.precisionAtK}`);
  console.log(`- Recall@${topK}: ${summary.recallAtK}`);
  console.log(`- HitRate@${topK}: ${summary.hitRateAtK}`);
  console.log(`- MRR@${topK}: ${summary.mrrAtK}`);
  console.log(`- nDCG@${topK}: ${summary.ndcgAtK}`);
  console.log(`- MAP@${topK}: ${summary.mapAtK}`);
  console.log(`- Coverage@${topK}: ${summary.coverageAtK}`);
  console.log(`- Category coverage@${topK}: ${summary.categoryCoverageAtK}`);
  console.log(`- Brand coverage@${topK}: ${summary.brandCoverageAtK}`);
  console.log(`- Novelty@${topK}: ${summary.noveltyAtK}`);
  console.log(`- Intra-list diversity@${topK}: ${summary.intraListDiversityAtK}`);
}

if (require.main === module) {
  void runEvaluation().catch((error) => {
    console.error('Failed to evaluate recommendation baseline:', error);
    process.exit(1);
  });
}
