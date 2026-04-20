import 'reflect-metadata';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { AppDataSource } from '@/config/database.config';
import { RecommendationCache } from '@/modules/ai/entity/recommendation-cache';
import { RecommendationType } from '@/modules/ai/enum/recommendation.enum';

type OfflineModelRecommendation = {
  productId: number;
  score: number;
  reason: string;
};

type OfflineModelPayload = {
  metadata?: Record<string, unknown>;
  recommendationsByUser?: Record<string, OfflineModelRecommendation[]>;
  similarItemsByProduct?: Record<string, Array<{ productId: number; score: number }>>;
};

type PrecomputeSummary = {
  generatedAt: string;
  inputPath: string;
  algorithm: string;
  ttlHours: number;
  userCount: number;
  insertedEntries: number;
  modelGeneratedAt: string | null;
  modelUserCount: number;
  usersWithRecommendations: number;
  userCoverageRatio: number;
  modelItemCount: number;
  productsWithSimilarItems: number;
  similarItemCoverageRatio: number;
};

const DEFAULT_INPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-baseline-model.json'
);
const DEFAULT_SUMMARY_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-cache-summary.json'
);
const DEFAULT_ALGORITHM = 'offline_model';
const DEFAULT_TTL_HOURS = 24;

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

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundRatio = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(6));
};

async function loadModel(inputPath: string): Promise<OfflineModelPayload> {
  const resolvedPath = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);
  const rawModel = await readFile(resolvedPath, 'utf8');
  return JSON.parse(rawModel) as OfflineModelPayload;
}

async function precomputeRecommendationCache(): Promise<void> {
  const inputPath = parseFlag('--input') ?? DEFAULT_INPUT_PATH;
  const summaryPath = parseFlag('--summary-out') ?? DEFAULT_SUMMARY_PATH;
  const algorithm = parseFlag('--algorithm') ?? DEFAULT_ALGORITHM;
  const ttlHours = toNumber(parseFlag('--ttl-hours'), DEFAULT_TTL_HOURS);
  const model = await loadModel(inputPath);
  const recommendationsByUser = model.recommendationsByUser || {};
  const similarItemsByProduct = model.similarItemsByProduct || {};

  await AppDataSource.initialize();

  try {
    const repository = AppDataSource.getRepository(RecommendationCache);
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + ttlHours * 60 * 60 * 1000);
    const userIds = Object.keys(recommendationsByUser)
      .map((userId) => Number(userId))
      .filter((userId) => Number.isInteger(userId) && userId > 0);
    const usersWithRecommendations = Object.values(recommendationsByUser).filter(
      (recommendations) => Array.isArray(recommendations) && recommendations.length > 0
    ).length;
    const modelUserCount = parseFiniteNumber(model.metadata?.userCount, userIds.length);
    const productsWithSimilarItems = Object.values(similarItemsByProduct).filter(
      (recommendations) => Array.isArray(recommendations) && recommendations.length > 0
    ).length;
    const modelItemCount = parseFiniteNumber(
      model.metadata?.itemCount,
      Object.keys(similarItemsByProduct).length
    );
    const modelGeneratedAt =
      typeof model.metadata?.generatedAt === 'string' ? model.metadata.generatedAt : null;

    if (userIds.length === 0) {
      throw new Error('Model does not contain any recommendationsByUser entries.');
    }

    await repository
      .createQueryBuilder()
      .update(RecommendationCache)
      .set({ is_active: false })
      .where('recommendation_type = :recommendationType', {
        recommendationType: RecommendationType.PERSONALIZED,
      })
      .andWhere('algorithm = :algorithm', { algorithm })
      .andWhere('user_id IN (:...userIds)', { userIds })
      .execute();

    const cacheEntries = userIds
      .map((userId) => {
        const recommendations = recommendationsByUser[String(userId)] || [];
        if (recommendations.length === 0) {
          return null;
        }

        return repository.create({
          cache_key: `user:${userId}:type:personalized:algo:${algorithm}`,
          user_id: userId,
          recommendation_type: RecommendationType.PERSONALIZED,
          algorithm,
          recommended_products: recommendations as unknown as object[],
          context_data: {
            source: 'offline_model_precompute',
            modelMetadata: model.metadata || null,
          },
          generated_at: generatedAt,
          expires_at: expiresAt,
          cache_hit_count: 0,
          is_active: true,
        });
      })
      .filter((entry): entry is RecommendationCache => Boolean(entry));

    if (cacheEntries.length > 0) {
      await repository.upsert(cacheEntries, ['cache_key']);
    }

    const summary: PrecomputeSummary = {
      generatedAt: generatedAt.toISOString(),
      inputPath,
      algorithm,
      ttlHours,
      userCount: userIds.length,
      insertedEntries: cacheEntries.length,
      modelGeneratedAt,
      modelUserCount,
      usersWithRecommendations,
      userCoverageRatio: roundRatio(usersWithRecommendations, modelUserCount),
      modelItemCount,
      productsWithSimilarItems,
      similarItemCoverageRatio: roundRatio(productsWithSimilarItems, modelItemCount),
    };

    await mkdir(path.dirname(summaryPath), { recursive: true });
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    console.log('Recommendation cache precomputed successfully.');
    console.log(`- Input model: ${inputPath}`);
    console.log(`- Algorithm tag: ${algorithm}`);
    console.log(`- TTL hours: ${ttlHours}`);
    console.log(`- Users processed: ${userIds.length}`);
    console.log(`- Cache entries inserted: ${cacheEntries.length}`);
    console.log(`- Summary output: ${summaryPath}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void precomputeRecommendationCache().catch((error) => {
  console.error('Failed to precompute recommendation cache:', error);
  process.exit(1);
});
