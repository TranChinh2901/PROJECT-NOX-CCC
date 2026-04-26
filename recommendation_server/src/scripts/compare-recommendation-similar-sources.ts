import 'reflect-metadata';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { AppDataSource } from '@/config/database.config';
import { Product } from '@/modules/products/entity/product';
import { TypeORMProductFeatureRepository } from '@/modules/ai/infrastructure/repositories/TypeORMProductFeatureRepository';
import { ContentBasedEngine } from '@/modules/ai/infrastructure/ml-engines/ContentBasedEngine';
import { EmbeddingSimilarityEngine } from '@/modules/ai/infrastructure/ml-engines/EmbeddingSimilarityEngine';
import { Recommendation } from '@/modules/ai/domain/entities/Recommendation';

type SimilarSourcePair = {
  contentRecommendations: Recommendation[];
  embeddingRecommendations: Recommendation[];
};

export type SimilarSourceShadowEvidence = {
  generatedAt: string;
  sampleSize: number;
  requestedSampleSize: number;
  limit: number;
  contentNonEmptyCount: number;
  embeddingNonEmptyCount: number;
  bothNonEmptyCount: number;
  contentOnlyCount: number;
  embeddingOnlyCount: number;
  averageOverlapAtK: number;
  averageContentTopScore: number;
  averageEmbeddingTopScore: number;
  safety: {
    containsProductIds: false;
  };
};

const DEFAULT_OUTPUT_PATH = path.join(
  process.cwd(),
  'exports',
  'recommendation-similar-source-shadow.json'
);
const DEFAULT_SAMPLE_SIZE = 25;
const DEFAULT_LIMIT = 10;

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
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const roundMetric = (value: number): number => Number(value.toFixed(6));

const calculateOverlapAtK = (
  contentRecommendations: Recommendation[],
  embeddingRecommendations: Recommendation[]
): number => {
  if (contentRecommendations.length === 0 && embeddingRecommendations.length === 0) {
    return 0;
  }

  const contentProductIds = new Set(
    contentRecommendations.map((recommendation) => recommendation.productId)
  );
  const embeddingProductIds = new Set(
    embeddingRecommendations.map((recommendation) => recommendation.productId)
  );
  const overlapCount = Array.from(contentProductIds).filter((productId) =>
    embeddingProductIds.has(productId)
  ).length;
  const denominator = Math.max(contentProductIds.size, embeddingProductIds.size, 1);

  return overlapCount / denominator;
};

export const buildSimilarSourceShadowEvidence = (
  pairs: SimilarSourcePair[],
  requestedSampleSize: number,
  limit: number,
  generatedAt = new Date().toISOString()
): SimilarSourceShadowEvidence => {
  let contentNonEmptyCount = 0;
  let embeddingNonEmptyCount = 0;
  let bothNonEmptyCount = 0;
  let contentOnlyCount = 0;
  let embeddingOnlyCount = 0;
  let overlapSum = 0;
  let contentTopScoreSum = 0;
  let embeddingTopScoreSum = 0;

  for (const pair of pairs) {
    const hasContent = pair.contentRecommendations.length > 0;
    const hasEmbedding = pair.embeddingRecommendations.length > 0;

    if (hasContent) {
      contentNonEmptyCount += 1;
      contentTopScoreSum += pair.contentRecommendations[0].score.toNumber();
    }

    if (hasEmbedding) {
      embeddingNonEmptyCount += 1;
      embeddingTopScoreSum += pair.embeddingRecommendations[0].score.toNumber();
    }

    if (hasContent && hasEmbedding) {
      bothNonEmptyCount += 1;
    } else if (hasContent) {
      contentOnlyCount += 1;
    } else if (hasEmbedding) {
      embeddingOnlyCount += 1;
    }

    overlapSum += calculateOverlapAtK(
      pair.contentRecommendations,
      pair.embeddingRecommendations
    );
  }

  return {
    generatedAt,
    sampleSize: pairs.length,
    requestedSampleSize,
    limit,
    contentNonEmptyCount,
    embeddingNonEmptyCount,
    bothNonEmptyCount,
    contentOnlyCount,
    embeddingOnlyCount,
    averageOverlapAtK: pairs.length > 0 ? roundMetric(overlapSum / pairs.length) : 0,
    averageContentTopScore:
      contentNonEmptyCount > 0 ? roundMetric(contentTopScoreSum / contentNonEmptyCount) : 0,
    averageEmbeddingTopScore:
      embeddingNonEmptyCount > 0
        ? roundMetric(embeddingTopScoreSum / embeddingNonEmptyCount)
        : 0,
    safety: {
      containsProductIds: false,
    },
  };
};

const loadEmbeddedProductIds = async (sampleSize: number): Promise<number[]> => {
  const rows = await AppDataSource.getRepository(Product)
    .createQueryBuilder('product')
    .addSelect('product.embedding')
    .select('product.id', 'productId')
    .where('product.is_active = :isActive', { isActive: true })
    .andWhere('product.deleted_at IS NULL')
    .andWhere('product.embedding IS NOT NULL')
    .orderBy('product.updated_at', 'DESC')
    .limit(sampleSize)
    .getRawMany<{ productId: number | string }>();

  return rows.map((row) => Number(row.productId)).filter(Number.isFinite);
};

export async function compareRecommendationSimilarSources(): Promise<void> {
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;
  const sampleSize = toNumber(parseFlag('--sample-size'), DEFAULT_SAMPLE_SIZE);
  const limit = toNumber(parseFlag('--limit'), DEFAULT_LIMIT);

  await AppDataSource.initialize();

  try {
    const productIds = await loadEmbeddedProductIds(sampleSize);
    const productFeatureRepository = new TypeORMProductFeatureRepository();
    const contentEngine = new ContentBasedEngine(productFeatureRepository);
    const embeddingEngine = new EmbeddingSimilarityEngine(productFeatureRepository);

    const pairs = await Promise.all(
      productIds.map(async (productId) => ({
        contentRecommendations: await contentEngine.getSimilarProducts(productId, limit),
        embeddingRecommendations: await embeddingEngine.getSimilarProducts(productId, limit),
      }))
    );
    const evidence = buildSimilarSourceShadowEvidence(pairs, sampleSize, limit);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

    console.log('Recommendation similar-source shadow comparison generated successfully.');
    console.log(`- Output: ${outputPath}`);
    console.log(`- Sample size: ${evidence.sampleSize}`);
    console.log(`- Content non-empty: ${evidence.contentNonEmptyCount}`);
    console.log(`- Embedding non-empty: ${evidence.embeddingNonEmptyCount}`);
    console.log(`- Average overlap@${limit}: ${evidence.averageOverlapAtK}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  void compareRecommendationSimilarSources().catch((error) => {
    console.error('Failed to compare recommendation similar sources:', error);
    process.exit(1);
  });
}
