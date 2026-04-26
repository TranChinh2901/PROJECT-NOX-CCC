import 'reflect-metadata';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { AppDataSource } from '@/config/database.config';
import { RecommendationCache } from '@/modules/ai/entity/recommendation-cache';
import { RecommendationType } from '@/modules/ai/enum/recommendation.enum';
import { inspectOfflineRecommendationArtifacts } from '@/modules/ai/infrastructure/runtime/RecommendationArtifactHealth';
import { EvaluationSummary } from './evaluate-recommendation-baseline';

type CacheBucket = {
  algorithm: string;
  count: number;
};

type RecommendationTypeBucket = {
  recommendationType: string;
  count: number;
};

type LatestCacheSnapshot = {
  recommendationType: string;
  algorithm: string;
  resultCount: number;
  generatedAt: string;
  expiresAt: string;
  cacheHitCount: number;
};

type EvaluationMetricSnapshot = {
  generatedAt: string;
  algorithmTag: string;
  topK: number;
  topN: number | null;
  evaluatedUsers: number;
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  ndcgAtK: number;
  mapAtK: number;
  categoryCoverageAtK: number;
  brandCoverageAtK: number;
  noveltyAtK: number;
  intraListDiversityAtK: number;
  coldStartUserHitRateAtK: number;
  coldStartProductHitRateAtK: number;
};

type EvaluationDeltaSnapshot = {
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  ndcgAtK: number;
  mapAtK: number;
};

export type RecommendationLaunchReadinessEvidence = {
  generatedAt: string;
  artifact: {
    state: string;
    isFresh: boolean;
    ageMinutes: number | null;
    rollbackActive: boolean;
    rollbackForced: boolean;
  };
  branchUsage: {
    activeByAlgorithm: CacheBucket[];
    staleByAlgorithm: CacheBucket[];
    activeByRecommendationType: RecommendationTypeBucket[];
  };
  resultCounts: {
    homepage: number;
    pdp: number;
  };
  cacheHealth: {
    activeCacheHitCount: number;
    latestHomepage: LatestCacheSnapshot | null;
    latestPdp: LatestCacheSnapshot | null;
  };
  evaluation: {
    current: EvaluationMetricSnapshot | null;
    previous: EvaluationMetricSnapshot | null;
    deltaFromPrevious: EvaluationDeltaSnapshot | null;
    historyCount: number;
  };
  safety: {
    containsIdentifiers: false;
    containsSecrets: false;
  };
};

export const DEFAULT_OUTPUT_PATH = path.resolve(
  process.cwd(),
  '..',
  '.sisyphus',
  'evidence',
  'task-7-readiness.json'
);
export const DEFAULT_EVALUATION_PATH = path.resolve(
  process.cwd(),
  'exports',
  'recommendation-evaluation.json'
);
export const DEFAULT_EVALUATION_HISTORY_PATH = path.resolve(
  process.cwd(),
  'exports',
  'recommendation-evaluation-history.json'
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

const toResultCount = (recommendedProducts: object[] | null | undefined): number =>
  Array.isArray(recommendedProducts) ? recommendedProducts.length : 0;

const roundMetric = (value: number): number => Number(value.toFixed(6));

const readJsonIfPresent = async <T>(filePath: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

const toEvaluationMetricSnapshot = (
  summary: EvaluationSummary | null
): EvaluationMetricSnapshot | null => {
  if (!summary) {
    return null;
  }

  return {
    generatedAt: summary.generatedAt,
    algorithmTag: summary.algorithmTag ?? 'unknown',
    topK: summary.topK,
    topN: summary.topN ?? null,
    evaluatedUsers: summary.evaluatedUsers,
    precisionAtK: summary.precisionAtK,
    recallAtK: summary.recallAtK,
    hitRateAtK: summary.hitRateAtK,
    ndcgAtK: summary.ndcgAtK ?? 0,
    mapAtK: summary.mapAtK ?? 0,
    categoryCoverageAtK: summary.categoryCoverageAtK ?? 0,
    brandCoverageAtK: summary.brandCoverageAtK ?? 0,
    noveltyAtK: summary.noveltyAtK ?? 0,
    intraListDiversityAtK: summary.intraListDiversityAtK ?? 0,
    coldStartUserHitRateAtK: summary.coldStartUserSlice?.hitRateAtK ?? 0,
    coldStartProductHitRateAtK: summary.coldStartProductSlice?.hitRateAtK ?? 0,
  };
};

const toEvaluationDeltaSnapshot = (
  current: EvaluationMetricSnapshot | null,
  previous: EvaluationMetricSnapshot | null
): EvaluationDeltaSnapshot | null => {
  if (!current || !previous) {
    return null;
  }

  return {
    precisionAtK: roundMetric(current.precisionAtK - previous.precisionAtK),
    recallAtK: roundMetric(current.recallAtK - previous.recallAtK),
    hitRateAtK: roundMetric(current.hitRateAtK - previous.hitRateAtK),
    ndcgAtK: roundMetric(current.ndcgAtK - previous.ndcgAtK),
    mapAtK: roundMetric(current.mapAtK - previous.mapAtK),
  };
};

const loadEvaluationEvidence = async (
  evaluationPath: string,
  evaluationHistoryPath: string
): Promise<RecommendationLaunchReadinessEvidence['evaluation']> => {
  const [currentSummary, rawHistory] = await Promise.all([
    readJsonIfPresent<EvaluationSummary>(evaluationPath),
    readJsonIfPresent<EvaluationSummary[]>(evaluationHistoryPath),
  ]);
  const history = Array.isArray(rawHistory) ? rawHistory : [];
  const previousSummary =
    history.length > 1 ? history[history.length - 2] : null;
  const current = toEvaluationMetricSnapshot(currentSummary);
  const previous = toEvaluationMetricSnapshot(previousSummary);

  return {
    current,
    previous,
    deltaFromPrevious: toEvaluationDeltaSnapshot(current, previous),
    historyCount: history.length,
  };
};

const loadLatestSnapshot = async (
  recommendationType: RecommendationType
): Promise<LatestCacheSnapshot | null> => {
  const repository = AppDataSource.getRepository(RecommendationCache);
  const entry = await repository.findOne({
    where: {
      recommendation_type: recommendationType,
      is_active: true,
    },
    order: { generated_at: 'DESC' },
  });

  if (!entry) {
    return null;
  }

  return {
    recommendationType: entry.recommendation_type,
    algorithm: entry.algorithm,
    resultCount: toResultCount(entry.recommended_products),
    generatedAt: entry.generated_at.toISOString(),
    expiresAt: entry.expires_at.toISOString(),
    cacheHitCount: entry.cache_hit_count,
  };
};

export async function buildLaunchReadinessEvidence(): Promise<RecommendationLaunchReadinessEvidence> {
  const artifactHealth = await inspectOfflineRecommendationArtifacts();
  const repository = AppDataSource.getRepository(RecommendationCache);
  const now = new Date();
  const evaluation = await loadEvaluationEvidence(
    DEFAULT_EVALUATION_PATH,
    DEFAULT_EVALUATION_HISTORY_PATH
  );

  const [activeByAlgorithm, staleByAlgorithm, activeByRecommendationType, homepageSnapshot, pdpSnapshot, activeCacheHitCount] =
    await Promise.all([
      repository
        .createQueryBuilder('cache')
        .select('cache.algorithm', 'algorithm')
        .addSelect('COUNT(*)', 'count')
        .where('cache.is_active = :isActive', { isActive: true })
        .andWhere('cache.expires_at >= :now', { now })
        .groupBy('cache.algorithm')
        .getRawMany<{ algorithm: string; count: string }>(),
      repository
        .createQueryBuilder('cache')
        .select('cache.algorithm', 'algorithm')
        .addSelect('COUNT(*)', 'count')
        .where('cache.is_active = :isActive', { isActive: true })
        .andWhere('cache.expires_at < :now', { now })
        .groupBy('cache.algorithm')
        .getRawMany<{ algorithm: string; count: string }>(),
      repository
        .createQueryBuilder('cache')
        .select('cache.recommendation_type', 'recommendationType')
        .addSelect('COUNT(*)', 'count')
        .where('cache.is_active = :isActive', { isActive: true })
        .groupBy('cache.recommendation_type')
        .getRawMany<{ recommendationType: string; count: string }>(),
      loadLatestSnapshot(RecommendationType.PERSONALIZED),
      loadLatestSnapshot(RecommendationType.SIMILAR),
      repository
        .createQueryBuilder('cache')
        .select('COALESCE(SUM(cache.cache_hit_count), 0)', 'count')
        .where('cache.is_active = :isActive', { isActive: true })
        .getRawOne<{ count: string }>(),
    ]);

  return {
    generatedAt: now.toISOString(),
    artifact: {
      state: artifactHealth.state,
      isFresh: artifactHealth.isFresh,
      ageMinutes: artifactHealth.ageMinutes,
      rollbackActive: artifactHealth.rollback.active,
      rollbackForced: artifactHealth.rollback.forced,
    },
    branchUsage: {
      activeByAlgorithm: activeByAlgorithm.map((row) => ({
        algorithm: row.algorithm,
        count: Number(row.count),
      })),
      staleByAlgorithm: staleByAlgorithm.map((row) => ({
        algorithm: row.algorithm,
        count: Number(row.count),
      })),
      activeByRecommendationType: activeByRecommendationType.map((row) => ({
        recommendationType: row.recommendationType,
        count: Number(row.count),
      })),
    },
    resultCounts: {
      homepage: homepageSnapshot?.resultCount ?? 0,
      pdp: pdpSnapshot?.resultCount ?? 0,
    },
    cacheHealth: {
      activeCacheHitCount: Number(activeCacheHitCount?.count ?? 0),
      latestHomepage: homepageSnapshot,
      latestPdp: pdpSnapshot,
    },
    evaluation,
    safety: {
      containsIdentifiers: false,
      containsSecrets: false,
    },
  };
}

export async function generateRecommendationLaunchReadinessEvidence(): Promise<void> {
  const outputPath = parseFlag('--out') ?? DEFAULT_OUTPUT_PATH;

  await AppDataSource.initialize();

  try {
    const evidence = await buildLaunchReadinessEvidence();

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

    console.log('Recommendation launch-readiness evidence generated successfully.');
    console.log(`- Output: ${outputPath}`);
    console.log(`- Artifact state: ${evidence.artifact.state}`);
    console.log(`- Homepage result count: ${evidence.resultCounts.homepage}`);
    console.log(`- PDP result count: ${evidence.resultCounts.pdp}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  void generateRecommendationLaunchReadinessEvidence().catch((error) => {
    console.error('Failed to generate recommendation launch-readiness evidence:', error);
    process.exit(1);
  });
}
