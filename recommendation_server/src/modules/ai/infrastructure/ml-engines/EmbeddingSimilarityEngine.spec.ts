import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { EmbeddingSimilarityEngine } from './EmbeddingSimilarityEngine';

describe('EmbeddingSimilarityEngine', () => {
  const makeProduct = (overrides: Partial<ProductFeature>): ProductFeature => ({
    productId: 1,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4.5,
    reviewCount: 20,
    purchaseCount: 0,
    featureVector: [1, 0],
    ...overrides,
  });

  const createRepository = (): jest.Mocked<IProductFeatureRepository> => ({
    getById: jest.fn(),
    getByIds: jest.fn(),
    getByCategory: jest.fn(),
    getFallbackProducts: jest.fn(),
    findSimilar: jest.fn(),
    updateStatistics: jest.fn(),
  });

  it('returns embedding-similar PDP candidates sorted by cosine similarity', async () => {
    const repository = createRepository();
    repository.getById.mockResolvedValue(makeProduct({ productId: 10, featureVector: [1, 0] }));
    repository.getFallbackProducts.mockResolvedValue([
      makeProduct({ productId: 10, featureVector: [1, 0] }),
      makeProduct({ productId: 11, featureVector: [0.95, 0.05], price: 1100 }),
      makeProduct({ productId: 12, featureVector: [0.5, 0.5], price: 1050 }),
      makeProduct({ productId: 13, featureVector: [0, 1], price: 1000 }),
    ]);

    const engine = new EmbeddingSimilarityEngine(repository, { candidatePoolSize: 20 });

    const result = await engine.getSimilarProducts(10, 2);

    expect(repository.getFallbackProducts).toHaveBeenCalledWith(40, 10);
    expect(result.map((recommendation) => recommendation.productId)).toEqual([11, 12]);
    expect(result[0].score.toNumber()).toBeGreaterThan(result[1].score.toNumber());
    expect(result[0].reason).toContain('semantically similar');
  });

  it('filters candidates without embeddings, category compatibility, or price-band eligibility', async () => {
    const repository = createRepository();
    repository.getById.mockResolvedValue(makeProduct({ productId: 10, featureVector: [1, 0] }));
    repository.getFallbackProducts.mockResolvedValue([
      makeProduct({ productId: 11, featureVector: undefined }),
      makeProduct({ productId: 12, categoryId: 20, featureVector: [1, 0] }),
      makeProduct({ productId: 13, price: 2000, featureVector: [1, 0] }),
      makeProduct({ productId: 14, price: 900, featureVector: [1, 0] }),
    ]);

    const engine = new EmbeddingSimilarityEngine(repository, {
      candidatePoolSize: 20,
      priceBandTolerance: 0.3,
    });

    const result = await engine.getSimilarProducts(10, 5);

    expect(result.map((recommendation) => recommendation.productId)).toEqual([14]);
  });

  it('returns no candidates when the target product has no usable embedding', async () => {
    const repository = createRepository();
    repository.getById.mockResolvedValue(makeProduct({ productId: 10, featureVector: [] }));

    const engine = new EmbeddingSimilarityEngine(repository);

    await expect(engine.getSimilarProducts(10, 5)).resolves.toEqual([]);
    expect(repository.getFallbackProducts).not.toHaveBeenCalled();
  });
});
