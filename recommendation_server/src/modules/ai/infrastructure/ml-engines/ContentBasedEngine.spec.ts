import { UserPreference } from '../../domain/entities/UserPreference';
import { RecommendationStrategy } from '../../domain/services/IRecommendationEngine';
import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { ContentBasedEngine } from './ContentBasedEngine';

describe('ContentBasedEngine', () => {
  const makeProduct = (overrides: Partial<ProductFeature>): ProductFeature => ({
    productId: 1,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4.5,
    reviewCount: 20,
    purchaseCount: 0,
    ...overrides,
  });

  const createRepository = (): jest.Mocked<IProductFeatureRepository> => ({
    getById: jest.fn(),
    getByIds: jest.fn(),
    getByCategory: jest.fn(),
    findSimilar: jest.fn(),
    updateStatistics: jest.fn(),
  });

  it('returns similar products sorted by similarity score', async () => {
    const repository = createRepository();
    repository.getById.mockResolvedValue(makeProduct({ productId: 10, price: 1500 }));
    repository.findSimilar.mockResolvedValue([
      makeProduct({ productId: 11, price: 1520, avgRating: 4.8, reviewCount: 30 }),
      makeProduct({ productId: 12, brandId: 200, price: 1490, avgRating: 4.2, reviewCount: 10 }),
      makeProduct({ productId: 13, categoryId: 11, brandId: 200, price: 3000, avgRating: 3.5, reviewCount: 2 }),
    ]);

    const engine = new ContentBasedEngine(repository);

    const result = await engine.getSimilarProducts(10, 2);

    expect(result).toHaveLength(2);
    expect(result[0].productId).toBe(11);
    expect(result[0].reason).toContain('same category');
    expect(result[0].reason).toContain('same brand');
    expect(result[1].productId).toBe(12);
  });

  it('returns empty array when target product is missing', async () => {
    const repository = createRepository();
    repository.getById.mockResolvedValue(null);

    const engine = new ContentBasedEngine(repository);

    await expect(engine.getSimilarProducts(999, 4)).resolves.toEqual([]);
    expect(repository.findSimilar).not.toHaveBeenCalled();
  });

  it('still generates content-based recommendations for user preferences', async () => {
    const repository = createRepository();
    const engine = new ContentBasedEngine(repository);
    const userPreference = UserPreference.create(1, [10], [100], 900, 1600);

    const result = await engine.generateRecommendations(
      {
        userId: 1,
        strategy: RecommendationStrategy.CONTENT_BASED,
        limit: 2,
      },
      userPreference,
      [
        makeProduct({ productId: 21, categoryId: 10, brandId: 100, price: 1200, avgRating: 4.7 }),
        makeProduct({ productId: 22, categoryId: 11, brandId: 200, price: 4000, avgRating: 2.5 }),
      ]
    );

    expect(result).toHaveLength(2);
    expect(result[0].productId).toBe(21);
    expect(result[0].score.toNumber()).toBeGreaterThan(result[1].score.toNumber());
  });
});
