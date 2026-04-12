import { GetRecommendationsUseCase } from './GetRecommendationsUseCase';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import { RecommendationStrategy } from '../../domain/services/IRecommendationEngine';
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

  it('excludes purchased, wishlisted, carted, and repeatedly viewed products from generated recommendations', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const recommendationEngine = createRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      recommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(false);
    behaviorRepository.deriveUserPreferences.mockResolvedValue(
      UserPreference.create(1, [10], [100], 0, 5000)
    );
    behaviorRepository.getPopularProducts.mockResolvedValue([101, 102, 103, 104]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([
        makeLog(201, BehaviorType.PURCHASE),
        makeLog(202, BehaviorType.ADD_TO_CART),
        makeLog(203, BehaviorType.WISHLIST),
      ])
      .mockResolvedValueOnce([
        makeLog(204, BehaviorType.VIEW),
        makeLog(204, BehaviorType.VIEW),
        makeLog(205, BehaviorType.VIEW),
      ])
      .mockResolvedValueOnce([
        makeLog(101, BehaviorType.VIEW),
        makeLog(102, BehaviorType.VIEW),
      ]);
    productFeatureRepository.getByIds.mockResolvedValue([
      makeProductFeature(101),
      makeProductFeature(102),
      makeProductFeature(103),
      makeProductFeature(104),
    ]);
    recommendationEngine.generateRecommendations.mockResolvedValue([
      Recommendation.create(201, 0.95, 'purchased before'),
      Recommendation.create(202, 0.9, 'in cart'),
      Recommendation.create(204, 0.85, 'viewed repeatedly'),
      Recommendation.create(103, 0.8, 'valid recommendation'),
    ]);
    recommendationEngine.getStrategy.mockReturnValue(RecommendationStrategy.HYBRID);

    const result = await useCase.execute({
      userId: 1,
      limit: 4,
      strategy: 'hybrid',
    });

    expect(recommendationEngine.generateRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeProductIds: expect.arrayContaining([201, 202, 203, 204]),
      }),
      expect.any(UserPreference),
      expect.any(Array)
    );
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([103]);
    expect(recommendationRepository.save).toHaveBeenCalled();
  });

  it('filters excluded products out of cached recommendations before returning them', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const recommendationEngine = createRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      recommendationEngine
    );

    recommendationRepository.hasFreshRecommendations.mockResolvedValue(true);
    recommendationRepository.findByUserId.mockResolvedValue([
      Recommendation.create(301, 0.9, 'already purchased'),
      Recommendation.create(302, 0.8, 'keep this'),
    ]);
    behaviorRepository.getBehaviorHistory
      .mockResolvedValueOnce([makeLog(301, BehaviorType.PURCHASE)])
      .mockResolvedValueOnce([]);
    recommendationEngine.getStrategy.mockReturnValue(RecommendationStrategy.HYBRID);

    const result = await useCase.execute({
      userId: 1,
      limit: 5,
      strategy: 'hybrid',
    });

    expect(result.fromCache).toBe(true);
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([302]);
    expect(recommendationEngine.generateRecommendations).not.toHaveBeenCalled();
  });

  it('returns fallback products when the engine cannot generate recommendations', async () => {
    const recommendationRepository = createRecommendationRepository();
    const behaviorRepository = createBehaviorRepository();
    const productFeatureRepository = createProductFeatureRepository();
    const recommendationEngine = createRecommendationEngine();
    const useCase = new GetRecommendationsUseCase(
      recommendationRepository,
      behaviorRepository,
      productFeatureRepository,
      recommendationEngine
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
      makeProductFeature(401),
      { ...makeProductFeature(402), avgRating: 3.5, reviewCount: 3, purchaseCount: 0 },
    ]);
    recommendationEngine.generateRecommendations.mockResolvedValue([]);
    recommendationEngine.getStrategy.mockReturnValue(RecommendationStrategy.CONTENT_BASED);

    const result = await useCase.execute({
      userId: 1,
      limit: 2,
    });

    expect(productFeatureRepository.getFallbackProducts).toHaveBeenCalledWith(20, undefined);
    expect(result.recommendations.map((recommendation) => recommendation.productId)).toEqual([
      401,
      402,
    ]);
    expect(result.fromCache).toBe(false);
    expect(recommendationRepository.save).toHaveBeenCalled();
  });
});
