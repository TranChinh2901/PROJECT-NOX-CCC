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
  topK: number;
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
};

type EvaluationSplit = {
  trainRowsByUser: Map<number, DatasetRow[]>;
  holdoutRowsByUser: Map<number, DatasetRow[]>;
  skippedUsers: number;
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
const DEFAULT_TOP_K = 10;
const DEFAULT_HOLDOUT_COUNT = 1;

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

export function evaluateRecommendations(
  split: EvaluationSplit,
  similarItemsByProduct: Record<string, Array<{ productId: number; score: number }>>,
  topK: number
): Omit<EvaluationSummary, 'generatedAt' | 'inputDataset' | 'inputModel' | 'topK' | 'holdoutCount'> {
  let totalHits = 0;
  let totalRecommended = 0;
  let totalHoldoutItems = 0;
  let hitUsers = 0;
  let reciprocalRankSum = 0;
  const recommendedCatalog = new Set<number>();
  const catalog = new Set<number>();

  for (const trainRows of split.trainRowsByUser.values()) {
    for (const row of trainRows) {
      catalog.add(row.productId);
    }
  }
  for (const holdoutRows of split.holdoutRowsByUser.values()) {
    for (const row of holdoutRows) {
      catalog.add(row.productId);
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

    for (let index = 0; index < recommendations.length; index += 1) {
      const recommendation = recommendations[index];
      recommendedCatalog.add(recommendation.productId);

      if (holdoutSet.has(recommendation.productId)) {
        userHits += 1;
        if (firstHitRank === 0) {
          firstHitRank = index + 1;
        }
      }
    }

    totalHits += userHits;
    totalRecommended += recommendations.length;
    totalHoldoutItems += holdoutRows.length;

    if (userHits > 0) {
      hitUsers += 1;
    }

    if (firstHitRank > 0) {
      reciprocalRankSum += 1 / firstHitRank;
    }
  }

  const evaluatedUsers = split.holdoutRowsByUser.size;

  return {
    evaluatedUsers,
    skippedUsers: split.skippedUsers,
    catalogSize: catalog.size,
    recommendedCatalogSize: recommendedCatalog.size,
    precisionAtK: totalRecommended > 0 ? Number((totalHits / totalRecommended).toFixed(6)) : 0,
    recallAtK: totalHoldoutItems > 0 ? Number((totalHits / totalHoldoutItems).toFixed(6)) : 0,
    hitRateAtK: evaluatedUsers > 0 ? Number((hitUsers / evaluatedUsers).toFixed(6)) : 0,
    mrrAtK: evaluatedUsers > 0 ? Number((reciprocalRankSum / evaluatedUsers).toFixed(6)) : 0,
    coverageAtK: catalog.size > 0 ? Number((recommendedCatalog.size / catalog.size).toFixed(6)) : 0,
  };
}

async function runEvaluation(): Promise<void> {
  const inputDataset = parseFlag('--input') ?? DEFAULT_INPUT_PATH;
  const inputModel = parseFlag('--model') ?? DEFAULT_MODEL_PATH;
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;
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
  const metrics = evaluateRecommendations(
    split,
    model.similarItemsByProduct || {},
    topK
  );

  const summary: EvaluationSummary = {
    generatedAt: new Date().toISOString(),
    inputDataset,
    inputModel,
    topK,
    holdoutCount,
    ...metrics,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log('Recommendation baseline evaluation completed successfully.');
  console.log(`- Dataset: ${inputDataset}`);
  console.log(`- Model: ${inputModel}`);
  console.log(`- Output: ${outputPath}`);
  console.log(`- Evaluated users: ${summary.evaluatedUsers}`);
  console.log(`- Precision@${topK}: ${summary.precisionAtK}`);
  console.log(`- Recall@${topK}: ${summary.recallAtK}`);
  console.log(`- HitRate@${topK}: ${summary.hitRateAtK}`);
  console.log(`- MRR@${topK}: ${summary.mrrAtK}`);
  console.log(`- Coverage@${topK}: ${summary.coverageAtK}`);
}

if (require.main === module) {
  void runEvaluation().catch((error) => {
    console.error('Failed to evaluate recommendation baseline:', error);
    process.exit(1);
  });
}
