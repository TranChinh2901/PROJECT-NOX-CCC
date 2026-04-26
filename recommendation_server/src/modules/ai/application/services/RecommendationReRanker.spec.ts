import { Recommendation } from '../../domain/entities/Recommendation';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';
import { ScoredRecommendationCandidate } from './RecommendationCandidate';
import { RecommendationReRanker } from './RecommendationReRanker';

describe('RecommendationReRanker', () => {
  const makeFeature = (productId: number, overrides: Partial<ProductFeature> = {}): ProductFeature => ({
    productId,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4.5,
    reviewCount: 10,
    purchaseCount: 50,
    ...overrides,
  });

  const makeCandidate = (
    productId: number,
    finalScore: number,
    overrides: Partial<ScoredRecommendationCandidate> = {}
  ): ScoredRecommendationCandidate => ({
    productId,
    source: 'content',
    sourceScore: finalScore,
    normalizedSourceScore: finalScore,
    finalScore,
    reason: `candidate ${productId}`,
    feature: makeFeature(productId),
    ...overrides,
  });

  it('dedupes, enforces exclusions, and rewards candidates found by multiple sources', () => {
    const reRanker = new RecommendationReRanker();

    const ranked = reRanker.reRank(
      [
        makeCandidate(10, 0.7, { source: 'content', normalizedSourceScore: 0.7 }),
        makeCandidate(10, 0.68, { source: 'offline', normalizedSourceScore: 0.9 }),
        makeCandidate(11, 0.75, { source: 'content', normalizedSourceScore: 0.75 }),
        makeCandidate(12, 0.99, { source: 'offline', normalizedSourceScore: 0.99 }),
      ],
      {
        excludedProductIds: [12],
        limit: 3,
      }
    );

    expect(ranked.map((recommendation) => recommendation.productId)).toEqual([10, 11]);
    expect(ranked[0].reason).toContain('candidate 10');
  });

  it('breaks exact ties deterministically by product id', () => {
    const reRanker = new RecommendationReRanker();

    const ranked = reRanker.reRank(
      [
        makeCandidate(302, 0.5),
        makeCandidate(301, 0.5),
      ],
      {
        limit: 2,
      }
    );

    expect(ranked.map((recommendation) => recommendation.productId)).toEqual([301, 302]);
  });

  it('reorders the homepage visible set to reduce category and brand repetition', () => {
    const reRanker = new RecommendationReRanker();
    const recommendations = [
      Recommendation.create(1101, 0.95, 'anchor'),
      Recommendation.create(1102, 0.9, 'same brand follow-up'),
      Recommendation.create(1103, 0.85, 'different category'),
      Recommendation.create(1104, 0.8, 'second different category'),
    ];
    const featureByProductId = new Map<number, ProductFeature>([
      [1101, makeFeature(1101, { categoryId: 10, brandId: 100 })],
      [1102, makeFeature(1102, { categoryId: 10, brandId: 100 })],
      [1103, makeFeature(1103, { categoryId: 20, brandId: 200 })],
      [1104, makeFeature(1104, { categoryId: 30, brandId: 300 })],
    ]);

    const diversified = reRanker.diversifyRecommendations(
      recommendations,
      featureByProductId,
      4,
      4
    );

    expect(diversified.map((recommendation) => recommendation.productId)).toEqual([
      1101,
      1103,
      1104,
      1102,
    ]);
  });
});
