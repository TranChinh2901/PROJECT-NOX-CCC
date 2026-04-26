import { GetRecommendationsUseCase } from './GetRecommendationsUseCase';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import {
  IRecommendationArtifactMetadataProvider,
  RecommendationStrategy,
} from '../../domain/services/IRecommendationEngine';
import {
  BehaviorType,
  IUserBehaviorRepository,
  UserBehaviorLog,
} from '../../domain/repositories/IUserBehaviorRepository';
import { IRecommendationRepository } from '../../domain/repositories/IRecommendationRepository';
import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { IRecommendationEngine } from '../../domain/services/IRecommendationEngine';
import { inspectOfflineRecommendationArtifacts } from '../../infrastructure/runtime/RecommendationArtifactHealth';

jest.mock('../../infrastructure/runtime/RecommendationArtifactHealth', () => ({
  inspectOfflineRecommendationArtifacts: jest.fn(),
}));

describe('GetRecommendationsUseCase', () => {
  const createRecommendationRepository = (): jest.Mocked<IRecommendationRepository> => ({
    findByUserId: jest.fn(),
    save: jest.fn(),
    deleteExpired: jest.fn(),
    hasFreshRecommendations: jest.fn(),
  });

  const createBehaviorRepository = (): jest.Mocked<IUserBehaviorRepository> => ({
    logBehavior: jest.fn(),
    getBehaviorHistory: jest.fn(),
    deriveUserPreferences: jest.fn(),
    getPopularProducts: jest.fn(),
    findSimilarUsers: jest.fn(),
  });

  const createProductFeatureRepository = (): jest.Mocked<IProductFeatureRepository> => ({
    getById: jest.fn(),
    getByIds: jest.fn(),
    getByCategory: jest.fn(),
    getFallbackProducts: jest.fn(),
    findSimilar: jest.fn(),
    updateStatistics: jest.fn(),
  });

  const createRecommendationEngine = (): jest.Mocked<IRecommendationEngine> => ({
    generateRecommendations: jest.fn(),
    getSimilarProducts: jest.fn(),
    getStrategy: jest.fn(),
  });

  const createOfflineRecommendationEngine = (): jest.Mocked<IRecommendationEngine> &
    jest.Mocked<Partial<IRecommendationArtifactMetadataProvider>> => ({
      generateRecommendations: jest.fn(),
      getSimilarProducts: jest.fn(),
      getStrategy: jest.fn(),
      isArtifactFresh: jest.fn(),
    });

  const makeLog = (
    productId: number,
    behaviorType: BehaviorType,
    timestamp: Date = new Date()
  ): UserBehaviorLog => ({
    userId: 1,
    productId,
    behaviorType,
    timestamp,
  });

  const makeProductFeature = (productId: number): ProductFeature => ({
    productId,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4.5,
    reviewCount: 10,
    purchaseCount: 50,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      freshnessWindowMinutes: 360,
      state: 'healthy',
      rollback: {
        forced: false,
      },
    });
  });

  it('normalizes source scores before unified scoring so neither source dominates by raw range', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [10], [100], 0, 5000)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([101, 102, 103, 201, 202, 203]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        makeLog(101, BehaviorType.VIEW),
        makeLog(102, BehaviorType.VIEW),
      ]);
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(101),
      makeProductFeature(102),
      makeProductFeature(103),
      makeProductFeature(201),
      makeProductFeature(202),
      makeProductFeature(203),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(101),
      makeProductFeature(102),
      makeProductFeature(103),
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(101, 0.91, 'offline top pick'),
      Recommendation.create(102, 0.905, 'offline second pick'),
      Recommendation.create(103, 0.9, 'offline third pick'),
    ]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(201, 0.41, 'content top pick'),
      Recommendation.create(202, 0.405, 'content second pick'),
      Recommendation.create(203, 0.4, 'content third pick'),
    ]);

    const result = await useCase.execute({
      userId: 1,
      limit: 4,
      strategy: 'hybrid',
    });

    expect(recommendationRepository.hasFreshRecommendations).toHaveBeenCalledWith(1, 360, 'offline_model');
    expect(contentRecommendationEngine.generateRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({ excludeProductIds: [] }),
      expect.any(UserPreference),
      expect.any(Array)
    );
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      101,
      201,
      102,
      202,
    ]);
    expect(result.recommendations.map((recommendation) => recommendation.score)).toEqual([
      0.5955,
      0.5799,
      0.5055,
      0.4899,
    ]);
    expect(result.recommendations.every((recommendation) => recommendation.score >= 0 && recommendation.score <= 1)).toBe(true);
    expect(result.strategy).toBe(RecommendationStrategy.HYBRID);
    expect(result.decision).toEqual({
      source: 'hybrid',
      branch: 'blend_offline_and_content',
      fallbackReason: 'offline-cache-missing-or-stale',
      hidden: false,
    });
    expect(recommendationRepository.save).toHaveBeenCalledWith(
      1,
      expect.any(Array),
      'hybrid'
    );
  });

  it('returns offline-only recommendations when content candidates are unavailable', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([701, 702]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(701),
      makeProductFeature(702),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(701),
      makeProductFeature(702),
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(701, 0.9, 'offline primary candidate'),
      Recommendation.create(702, 0.4, 'offline secondary candidate'),
    ]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 1, limit: 2 });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      701,
      702,
    ]);
    expect(result.strategy).toBe(RecommendationStrategy.COLLABORATIVE_FILTERING);
    expect(result.decision).toEqual({
      source: 'offline',
      branch: 'offline_only',
      fallbackReason: 'offline-cache-missing-or-stale; content-engine-unavailable',
      hidden: false,
    });
    expect(recommendationRepository.save).toHaveBeenCalledWith(
      1,
      expect.any(Array),
      'offline_model'
    );
  });

  it('boosts homepage candidates that match recent session intent without exceeding the cap', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([2001, 2002]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeLog(1001, BehaviorType.VIEW)]);
    productFeatureRepository.getByIds
      .mockResolvedValueOnce([
        { ...makeProductFeature(2001), categoryId: 42, brandId: 420, price: 1000 },
        { ...makeProductFeature(2002), categoryId: 50, brandId: 500, price: 4000 },
      ])
      .mockResolvedValueOnce([
        { ...makeProductFeature(1001), categoryId: 42, brandId: 420, price: 1000 },
      ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      { ...makeProductFeature(2001), categoryId: 42, brandId: 420, price: 1000 },
      { ...makeProductFeature(2002), categoryId: 50, brandId: 500, price: 4000 },
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(2001, 0.5, 'content session match'),
      Recommendation.create(2002, 0.62, 'content generic match'),
    ]);

    const result = await useCase.execute({ userId: 1, limit: 2 });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      2001,
      2002,
    ]);
    expect(result.recommendations[0].score).toBeGreaterThan(result.recommendations[1].score);
    expect(result.recommendations[0].reason).toContain('matches recent session intent');
    expect(result.decision).toEqual({
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'offline-artifact-unavailable',
      hidden: false,
    });
  });

  it('keeps excluded products out even when they match recent session intent', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([2001, 2002]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeLog(1001, BehaviorType.VIEW)]);
    productFeatureRepository.getByIds
      .mockResolvedValueOnce([
        { ...makeProductFeature(2001), categoryId: 42, brandId: 420, price: 1000 },
        { ...makeProductFeature(2002), categoryId: 50, brandId: 500, price: 4000 },
      ])
      .mockResolvedValueOnce([
        { ...makeProductFeature(1001), categoryId: 42, brandId: 420, price: 1000 },
      ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      { ...makeProductFeature(2001), categoryId: 42, brandId: 420, price: 1000 },
      { ...makeProductFeature(2002), categoryId: 50, brandId: 500, price: 4000 },
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(2001, 0.95, 'excluded session match'),
      Recommendation.create(2002, 0.5, 'eligible generic match'),
    ]);

    const result = await useCase.execute({
      userId: 1,
      limit: 2,
      excludeProductIds: [2001],
    });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      2002,
    ]);
    expect(result.recommendations[0].reason).not.toContain('matches recent session intent');
  });

  it('returns active offline cache without duplicates or excluded ids', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(true);
    recommendationRepository.findByUserId.mockResolvedValue([
      Recommendation.create(301, 0.9, 'already purchased'),
      Recommendation.create(302, 0.8, 'keep this'),
      Recommendation.create(302, 0.7, 'duplicate keep this'),
      Recommendation.create(399, 0.65, 'missing product should be filtered'),
      Recommendation.create(303, 0.6, 'explicitly excluded'),
    ]);
    productFeatureRepository.getByIds.mockResolvedValue([makeProductFeature(302)]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([makeLog(301, BehaviorType.PURCHASE)])
      .mockResolvedValueOnce([]);

    const result = await useCase.execute({
      userId: 1,
      limit: 5,
      strategy: 'hybrid',
      excludeProductIds: [303],
    });

    expect(result.fromCache).toBe(true);
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([302]);
    expect(productFeatureRepository.getByIds).toHaveBeenCalledWith([302, 399]);
    expect(result.decision).toEqual({
      source: 'offline',
      branch: 'active_cached_offline',
      hidden: false,
    });
    expect(infoSpy).toHaveBeenCalledWith(
      '[recommendation] request-resolved',
      expect.stringContaining('"source":"offline"')
    );
    expect(infoSpy).toHaveBeenCalledWith(
      '[recommendation] request-resolved',
      expect.stringContaining('"cacheStatus":"hit"')
    );
    expect(infoSpy).toHaveBeenCalledWith(
      '[recommendation] request-resolved',
      expect.stringContaining('"resultCount":1')
    );
    infoSpy.mockRestore();
    expect(contentRecommendationEngine.generateRecommendations).not.toHaveBeenCalled();
    expect(offlineRecommendationEngine.generateRecommendations).not.toHaveBeenCalled();
  });

  it('falls back to content-only when the offline artifact is unavailable', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([makeProductFeature(401), makeProductFeature(402)]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(401),
      { ...makeProductFeature(402), avgRating: 3.5, reviewCount: 3, purchaseCount: 0 },
    ]);
    offlineRecommendationEngine.generateRecommendations.mockRejectedValue(new Error('missing artifact'));
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(401, 0.7, 'content saved the request'),
      Recommendation.create(402, 0.4, 'content backup candidate'),
    ]);

    const result = await useCase.execute({
      userId: 1,
      limit: 2,
    });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      401,
      402,
    ]);
    expect(result.decision).toEqual({
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'offline-artifact-unavailable',
      hidden: false,
    });
    expect(recommendationRepository.save).toHaveBeenCalledWith(
      1,
      expect.any(Array),
      'content_based'
    );
  });

  it('returns deterministic fallback metadata when both engines fail', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(501),
      { ...makeProductFeature(502), avgRating: 3.2, reviewCount: 1, purchaseCount: 1 },
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 1, limit: 2 });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([501, 502]);
    expect(result.decision).toEqual({
      source: 'fallback',
      branch: 'deterministic_popularity_fallback',
      fallbackReason: 'offline-artifact-unavailable; content-engine-unavailable',
      hidden: false,
    });
  });

  it('breaks hybrid score ties deterministically by product id after source-aware tie checks', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([301, 302]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(301),
      makeProductFeature(302),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(301),
      makeProductFeature(302),
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(302, 0.5, 'offline tie candidate B'),
      Recommendation.create(301, 0.5, 'offline tie candidate A'),
    ]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(301, 0.5, 'content tie candidate A'),
      Recommendation.create(302, 0.5, 'content tie candidate B'),
    ]);

    const result = await useCase.execute({ userId: 1, limit: 2, strategy: 'hybrid' });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      301,
      302,
    ]);
    expect(result.recommendations.map((recommendation) => recommendation.score)).toEqual([
      0.570096,
      0.570096,
    ]);
    expect(result.decision).toEqual({
      source: 'hybrid',
      branch: 'blend_offline_and_content',
      fallbackReason: 'offline-cache-missing-or-stale',
      hidden: false,
    });
  });

  it('reorders the first homepage set to reduce obvious category and brand repetition when alternatives exist', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([1101, 1102, 1103, 1104]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([
      { ...makeProductFeature(1101), categoryId: 10, brandId: 100 },
      { ...makeProductFeature(1102), categoryId: 10, brandId: 100 },
      { ...makeProductFeature(1103), categoryId: 20, brandId: 200 },
      { ...makeProductFeature(1104), categoryId: 30, brandId: 300 },
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      { ...makeProductFeature(1101), categoryId: 10, brandId: 100 },
      { ...makeProductFeature(1102), categoryId: 10, brandId: 100 },
      { ...makeProductFeature(1103), categoryId: 20, brandId: 200 },
      { ...makeProductFeature(1104), categoryId: 30, brandId: 300 },
    ]);
    offlineRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(1101, 0.95, 'offline anchor'),
      Recommendation.create(1102, 0.9, 'offline same brand follow-up'),
      Recommendation.create(1103, 0.85, 'offline different category'),
      Recommendation.create(1104, 0.8, 'offline second different category'),
    ]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 1, limit: 4, strategy: 'hybrid' });

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      1101,
      1103,
      1104,
      1102,
    ]);
    expect(result.decision).toEqual({
      source: 'offline',
      branch: 'offline_only',
      fallbackReason: 'offline-cache-missing-or-stale; content-engine-unavailable',
      hidden: false,
    });
  });

  it('skips stale offline homepage artifacts and prefers the safer content path', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      freshnessWindowMinutes: 60,
      state: 'stale',
      rollback: {
        forced: false,
      },
    });
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([801, 802]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(801),
      makeProductFeature(802),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(801),
      makeProductFeature(802),
    ]);
    contentRecommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(801, 0.8, 'fresh content fallback'),
      Recommendation.create(802, 0.5, 'content backup'),
    ]);

    const result = await useCase.execute({ userId: 1, limit: 2 });

    expect(recommendationRepository.hasFreshRecommendations).not.toHaveBeenCalled();
    expect(offlineRecommendationEngine.generateRecommendations).not.toHaveBeenCalled();
    expect(result.decision).toEqual({
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'offline-artifact-stale',
      hidden: false,
    });
  });

  it('activates env-driven rollback without code changes and avoids offline similar items', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      freshnessWindowMinutes: 360,
      state: 'healthy',
      rollback: {
        forced: true,
      },
    });
    productFeatureRepository.getById.mockResolvedValue(makeProductFeature(901));
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(902),
      makeProductFeature(903),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(902),
      makeProductFeature(903),
    ]);
    contentRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(902, 0.7, 'content similar item'),
      Recommendation.create(903, 0.4, 'content backup similar item'),
    ]);

    const result = await useCase.executeSimilarProducts(901, 2);

    expect(offlineRecommendationEngine.getSimilarProducts).not.toHaveBeenCalled();
    expect(result.decision).toEqual({
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'offline-rollback-forced',
      hidden: false,
    });
  });

  it('uses embedding similar products for PDP when offline serving is unavailable', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const embeddingRecommendationEngine = createRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine,
      embeddingRecommendationEngine
    );

    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      freshnessWindowMinutes: 60,
      state: 'stale',
      rollback: {
        forced: false,
      },
    });
    productFeatureRepository.getById.mockResolvedValue(makeProductFeature(901));
    productFeatureRepository.getByIds.mockResolvedValue([makeProductFeature(904)]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(902),
      makeProductFeature(904),
    ]);
    embeddingRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(904, 0.88, 'semantically similar'),
    ]);
    contentRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(902, 0.7, 'content similar item'),
    ]);

    const result = await useCase.executeSimilarProducts(901, 2);

    expect(offlineRecommendationEngine.getSimilarProducts).not.toHaveBeenCalled();
    expect(embeddingRecommendationEngine.getSimilarProducts).toHaveBeenCalledWith(901, 2);
    expect(contentRecommendationEngine.getSimilarProducts).toHaveBeenCalledWith(901, 2);
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([904]);
    expect(result.decision).toEqual({
      source: 'embedding',
      branch: 'embedding_only',
      fallbackReason: 'offline-artifact-stale',
      hidden: false,
    });
    expect(result.strategy).toBe(RecommendationStrategy.CONTENT_BASED);
  });

  it('prefers healthy precomputed similar items when they resolve to eligible products', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (offlineRecommendationEngine.isArtifactFresh as jest.Mock).mockResolvedValue(true);
    productFeatureRepository.getById
      .mockResolvedValueOnce(makeProductFeature(501))
      .mockResolvedValueOnce(makeProductFeature(502))
      .mockResolvedValueOnce(makeProductFeature(503));
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(502),
      makeProductFeature(503),
    ]);
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(504),
      makeProductFeature(505),
    ]);
    offlineRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(502, 0.92, 'precomputed primary similar'),
      Recommendation.create(503, 0.87, 'precomputed secondary similar'),
    ]);

    const result = await useCase.executeSimilarProducts(501, 2);

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([502, 503]);
    expect(contentRecommendationEngine.getSimilarProducts).not.toHaveBeenCalled();
    expect(result.decision).toEqual({
      source: 'offline',
      branch: 'active_precomputed_offline',
      hidden: false,
    });
  });

  it('falls back to content similars when precomputed similar ids are stale or invalid', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (offlineRecommendationEngine.isArtifactFresh as jest.Mock).mockResolvedValue(true);
    productFeatureRepository.getById
      .mockResolvedValueOnce(makeProductFeature(701))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeProductFeature(702))
      .mockResolvedValueOnce(makeProductFeature(703));
    productFeatureRepository.getByIds.mockImplementation(async (productIds: number[]) =>
      productIds
        .map((productId) => {
          if (productId === 702) {
            return makeProductFeature(702);
          }

          if (productId === 703) {
            return makeProductFeature(703);
          }

          return null;
        })
        .filter((product): product is ProductFeature => product !== null)
    );
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(704),
      makeProductFeature(705),
    ]);
    offlineRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(9999, 0.95, 'stale offline similar'),
    ]);
    contentRecommendationEngine.getSimilarProducts.mockResolvedValue([
      Recommendation.create(702, 0.71, 'content similar item'),
      Recommendation.create(703, 0.62, 'content backup similar item'),
    ]);

    const result = await useCase.executeSimilarProducts(701, 2);

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([702, 703]);
    expect(result.decision).toEqual({
      source: 'content',
      branch: 'content_only',
      fallbackReason: 'offline-precomputed-invalid-similar-output',
      hidden: false,
    });
  });

  it('returns an empty hidden response when the source product cannot be resolved', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    productFeatureRepository.getById.mockResolvedValue(null);

    const result = await useCase.executeSimilarProducts(999, 3);

    expect(result.recommendations).toEqual([]);
    expect(result.decision).toEqual({
      source: 'hidden',
      branch: 'similar_product_source_unavailable',
      fallbackReason: 'source-product-unavailable',
      hidden: true,
    });
    expect(result.strategy).toBe(RecommendationStrategy.POPULARITY);
    expect(productFeatureRepository.getFallbackProducts).not.toHaveBeenCalled();
    expect(contentRecommendationEngine.getSimilarProducts).not.toHaveBeenCalled();
    expect(offlineRecommendationEngine.getSimilarProducts).not.toHaveBeenCalled();
    expect(inspectOfflineRecommendationArtifacts).not.toHaveBeenCalled();
  });

  it('hides similar-items module when offline, content, and fallback all fail', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (offlineRecommendationEngine.isArtifactFresh as jest.Mock).mockResolvedValue(false);
    productFeatureRepository.getById.mockResolvedValue(makeProductFeature(601));
    productFeatureRepository.getFallbackProducts.mockResolvedValue([]);
    offlineRecommendationEngine.getSimilarProducts.mockResolvedValue([]);
    contentRecommendationEngine.getSimilarProducts.mockResolvedValue([]);

    const result = await useCase.executeSimilarProducts(601, 3);

    expect(result.recommendations).toEqual([]);
    expect(result.decision).toEqual({
      source: 'hidden',
      branch: 'hide_module',
      fallbackReason:
        'offline-artifact-unavailable; content-engine-unavailable; fallback-unavailable',
      hidden: true,
    });
  });

  it('excludes the current PDP product and deduplicates fallback similar items', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const contentRecommendationEngine = createRecommendationEngine();
    const offlineRecommendationEngine = createOfflineRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      contentRecommendationEngine,
      offlineRecommendationEngine
    );

    (offlineRecommendationEngine.isArtifactFresh as jest.Mock).mockResolvedValue(false);
    productFeatureRepository.getById.mockResolvedValue(makeProductFeature(601));
    productFeatureRepository.getFallbackProducts.mockResolvedValue([
      makeProductFeature(601),
      { ...makeProductFeature(602), avgRating: 4.1, reviewCount: 18, purchaseCount: 40 },
      { ...makeProductFeature(602), avgRating: 4.1, reviewCount: 18, purchaseCount: 40 },
      { ...makeProductFeature(603), avgRating: 4.8, reviewCount: 30, purchaseCount: 70 },
    ]);
    offlineRecommendationEngine.getSimilarProducts.mockResolvedValue([]);
    contentRecommendationEngine.getSimilarProducts.mockResolvedValue([]);

    const result = await useCase.executeSimilarProducts(601, 5);

    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      603,
      602,
    ]);
    expect(result.recommendations.some((recommendation) => recommendation.productId === 601)).toBe(false);
    expect(result.decision).toEqual({
      source: 'fallback',
      branch: 'deterministic_popularity_fallback',
      fallbackReason: 'offline-artifact-unavailable; content-engine-unavailable',
      hidden: false,
    });
  });
});
