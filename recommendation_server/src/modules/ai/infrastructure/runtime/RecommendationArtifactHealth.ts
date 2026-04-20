import { access, readFile, stat } from 'fs/promises';
import path from 'path';

type OfflineModelRecommendation = {
  productId: number;
  score: number;
  reason: string;
};

type OfflineSimilarEntry = {
  productId: number;
  score: number;
};

type OfflineModelPayload = {
  metadata?: Record<string, unknown>;
  recommendationsByUser?: Record<string, OfflineModelRecommendation[]>;
  similarItemsByProduct?: Record<string, OfflineSimilarEntry[]>;
};

type PrecomputeSummary = {
  generatedAt?: string;
  algorithm?: string;
  ttlHours?: number;
  userCount?: number;
  insertedEntries?: number;
  modelGeneratedAt?: string | null;
  modelUserCount?: number;
  usersWithRecommendations?: number;
  userCoverageRatio?: number;
  modelItemCount?: number;
  productsWithSimilarItems?: number;
  similarItemCoverageRatio?: number;
};

export type RecommendationArtifactState = 'healthy' | 'stale' | 'missing' | 'invalid';

export type RecommendationCoverageSnapshot = {
  usersInArtifact: number;
  usersWithRecommendations: number;
  userCoverageRatio: number;
  itemsInArtifact: number;
  itemsWithSimilarItems: number;
  similarItemCoverageRatio: number;
  topNRecommendations: number | null;
  topKSimilarItems: number | null;
};

export type RecommendationCacheSummarySnapshot = {
  configuredPath: string;
  resolvedPath: string;
  exists: boolean;
  generatedAt: string | null;
  ageMinutes: number | null;
  algorithm: string | null;
  ttlHours: number | null;
  userCount: number | null;
  insertedEntries: number | null;
  userCoverageRatio: number | null;
  productsWithSimilarItems: number | null;
  similarItemCoverageRatio: number | null;
  parseError: string | null;
};

export type RecommendationRollbackSnapshot = {
  forced: boolean;
  active: boolean;
  preferredMode: 'content_based';
  reason: string | null;
};

export type OfflineRecommendationArtifactHealth = {
  configuredPath: string;
  resolvedPath: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string | null;
  metadataGeneratedAt: string | null;
  freshnessWindowMinutes: number;
  ageMinutes: number | null;
  state: RecommendationArtifactState;
  isFresh: boolean;
  coverage: RecommendationCoverageSnapshot;
  cacheSummary: RecommendationCacheSummarySnapshot;
  rollback: RecommendationRollbackSnapshot;
  reasons: string[];
};

const DEFAULT_MODEL_PATH = 'exports/recommendation-baseline-model.json';
const DEFAULT_SUMMARY_PATH = 'exports/recommendation-cache-summary.json';
const DEFAULT_REFRESH_INTERVAL_MINUTES = 360;

const resolvePathFromCwd = (targetPath: string): string =>
  path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);

const parseFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundRatio = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(6));
};

const toIsoStringIfValid = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const getObservedArtifactTimestamp = (
  metadataGeneratedAt: string | null,
  updatedAt: string | null
): string | null => metadataGeneratedAt || updatedAt;

export const getConfiguredRecommendationEngineMode = (): 'offline_model' | 'content_based' => {
  return process.env.RECOMMENDATION_ENGINE?.trim().toLowerCase() === 'offline_model'
    ? 'offline_model'
    : 'content_based';
};

export const getConfiguredRecommendationModelPath = (): string => {
  return process.env.RECOMMENDATION_MODEL_PATH || DEFAULT_MODEL_PATH;
};

export const getConfiguredRecommendationCacheSummaryPath = (): string => {
  return process.env.RECOMMENDATION_CACHE_SUMMARY_PATH || DEFAULT_SUMMARY_PATH;
};

export const getOfflineFreshnessWindowMinutes = (): number => {
  const explicitWindow = parseFiniteNumber(process.env.RECOMMENDATION_OFFLINE_FRESHNESS_MINUTES);
  if (explicitWindow && explicitWindow > 0) {
    return explicitWindow;
  }

  const ttlHours = parseFiniteNumber(process.env.RECOMMENDATION_PIPELINE_TTL_HOURS);
  if (ttlHours && ttlHours > 0) {
    return ttlHours * 60;
  }

  const refreshInterval = parseFiniteNumber(
    process.env.RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES
  );
  return refreshInterval && refreshInterval > 0
    ? refreshInterval
    : DEFAULT_REFRESH_INTERVAL_MINUTES;
};

const buildCoverageSnapshot = (model: OfflineModelPayload | null): RecommendationCoverageSnapshot => {
  const recommendationsByUser = model?.recommendationsByUser || {};
  const similarItemsByProduct = model?.similarItemsByProduct || {};
  const metadata = model?.metadata || {};

  const usersInArtifact =
    parseFiniteNumber(metadata.userCount) ?? Object.keys(recommendationsByUser).length;
  const usersWithRecommendations = Object.values(recommendationsByUser).filter(
    (entries) => Array.isArray(entries) && entries.length > 0
  ).length;
  const itemsInArtifact =
    parseFiniteNumber(metadata.itemCount) ?? Object.keys(similarItemsByProduct).length;
  const itemsWithSimilarItems = Object.values(similarItemsByProduct).filter(
    (entries) => Array.isArray(entries) && entries.length > 0
  ).length;

  return {
    usersInArtifact,
    usersWithRecommendations,
    userCoverageRatio: roundRatio(usersWithRecommendations, usersInArtifact),
    itemsInArtifact,
    itemsWithSimilarItems,
    similarItemCoverageRatio: roundRatio(itemsWithSimilarItems, itemsInArtifact),
    topNRecommendations: parseFiniteNumber(metadata.topNRecommendations),
    topKSimilarItems: parseFiniteNumber(metadata.topKSimilarItems),
  };
};

const readCacheSummarySnapshot = async (): Promise<RecommendationCacheSummarySnapshot> => {
  const configuredPath = getConfiguredRecommendationCacheSummaryPath();
  const resolvedPath = resolvePathFromCwd(configuredPath);

  try {
    await access(resolvedPath);
  } catch {
    return {
      configuredPath,
      resolvedPath,
      exists: false,
      generatedAt: null,
      ageMinutes: null,
      algorithm: null,
      ttlHours: null,
      userCount: null,
      insertedEntries: null,
      userCoverageRatio: null,
      productsWithSimilarItems: null,
      similarItemCoverageRatio: null,
      parseError: null,
    };
  }

  try {
    const rawSummary = await readFile(resolvedPath, 'utf8');
    const summary = JSON.parse(rawSummary) as PrecomputeSummary;
    const generatedAt = toIsoStringIfValid(summary.generatedAt);
    const ageMinutes = generatedAt
      ? Number(((Date.now() - new Date(generatedAt).getTime()) / 60000).toFixed(3))
      : null;

    return {
      configuredPath,
      resolvedPath,
      exists: true,
      generatedAt,
      ageMinutes,
      algorithm: typeof summary.algorithm === 'string' ? summary.algorithm : null,
      ttlHours: parseFiniteNumber(summary.ttlHours),
      userCount: parseFiniteNumber(summary.userCount),
      insertedEntries: parseFiniteNumber(summary.insertedEntries),
      userCoverageRatio: parseFiniteNumber(summary.userCoverageRatio),
      productsWithSimilarItems: parseFiniteNumber(summary.productsWithSimilarItems),
      similarItemCoverageRatio: parseFiniteNumber(summary.similarItemCoverageRatio),
      parseError: null,
    };
  } catch (error) {
    return {
      configuredPath,
      resolvedPath,
      exists: true,
      generatedAt: null,
      ageMinutes: null,
      algorithm: null,
      ttlHours: null,
      userCount: null,
      insertedEntries: null,
      userCoverageRatio: null,
      productsWithSimilarItems: null,
      similarItemCoverageRatio: null,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
};

export const inspectOfflineRecommendationArtifacts = async (): Promise<OfflineRecommendationArtifactHealth> => {
  const configuredPath = getConfiguredRecommendationModelPath();
  const resolvedPath = resolvePathFromCwd(configuredPath);
  const freshnessWindowMinutes = getOfflineFreshnessWindowMinutes();
  const reasons: string[] = [];
  let exists = false;
  let sizeBytes = 0;
  let updatedAt: string | null = null;
  let metadataGeneratedAt: string | null = null;
  let ageMinutes: number | null = null;
  let state: RecommendationArtifactState = 'missing';
  let isFresh = false;
  let model: OfflineModelPayload | null = null;

  try {
    await access(resolvedPath);
    exists = true;

    const fileStats = await stat(resolvedPath);
    sizeBytes = fileStats.size;
    updatedAt = fileStats.mtime.toISOString();

    const rawModel = await readFile(resolvedPath, 'utf8');
    model = JSON.parse(rawModel) as OfflineModelPayload;
    metadataGeneratedAt = toIsoStringIfValid(model.metadata?.generatedAt);

    const observedTimestamp = getObservedArtifactTimestamp(metadataGeneratedAt, updatedAt);
    if (observedTimestamp) {
      ageMinutes = Number(
        ((Date.now() - new Date(observedTimestamp).getTime()) / 60000).toFixed(3)
      );
      isFresh = ageMinutes <= freshnessWindowMinutes;
      state = isFresh ? 'healthy' : 'stale';
    } else {
      state = 'invalid';
      reasons.push('offline-artifact-missing-timestamp');
    }
  } catch (error) {
    if (exists) {
      state = 'invalid';
      reasons.push('offline-artifact-invalid');
      if (error instanceof Error) {
        reasons.push(error.message);
      }
    } else {
      state = 'missing';
      reasons.push('offline-artifact-missing');
    }
  }

  if (state === 'stale') {
    reasons.push('offline-artifact-stale');
  }

  const coverage = buildCoverageSnapshot(model);
  const cacheSummary = await readCacheSummarySnapshot();
  const rollbackForced = process.env.RECOMMENDATION_ENGINE_FORCE_CONTENT_FALLBACK === 'true';
  const rollbackReason = rollbackForced
    ? 'forced-content-fallback'
    : state === 'healthy'
      ? null
      : reasons[0] || 'offline-artifact-degraded';

  return {
    configuredPath,
    resolvedPath,
    exists,
    sizeBytes,
    updatedAt,
    metadataGeneratedAt,
    freshnessWindowMinutes,
    ageMinutes,
    state,
    isFresh,
    coverage,
    cacheSummary,
    rollback: {
      forced: rollbackForced,
      active: rollbackForced || state !== 'healthy',
      preferredMode: 'content_based',
      reason: rollbackReason,
    },
    reasons,
  };
};
