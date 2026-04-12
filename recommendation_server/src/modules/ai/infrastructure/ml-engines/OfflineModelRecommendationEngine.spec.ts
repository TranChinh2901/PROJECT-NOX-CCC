import path from 'path';
import os from 'os';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { OfflineModelRecommendationEngine } from './OfflineModelRecommendationEngine';
import { RecommendationStrategy } from '../../domain/services/IRecommendationEngine';
import { UserPreference } from '../../domain/entities/UserPreference';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';

describe('OfflineModelRecommendationEngine', () => {
  let tempDir: string;
  let modelPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'offline-model-engine-'));
    modelPath = path.join(tempDir, 'model.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns offline recommendations even when they are outside the content candidate set', async () => {
    await writeFile(
      modelPath,
      JSON.stringify({
        recommendationsByUser: {
          '10': [
            { productId: 101, score: 0.92, reason: 'offline candidate A' },
            { productId: 202, score: 0.71, reason: 'offline candidate B' },
          ],
        },
      }),
      'utf8'
    );

    const engine = new OfflineModelRecommendationEngine(modelPath);
    const userPreference = UserPreference.create(10, [1], [1], 0, Number.MAX_SAFE_INTEGER);
    const productFeatures: ProductFeature[] = [
      {
        productId: 999,
        categoryId: 1,
        brandId: 1,
        price: 1000,
        avgRating: 4.5,
        reviewCount: 10,
        purchaseCount: 5,
      },
    ];

    const recommendations = await engine.generateRecommendations(
      {
        userId: 10,
        strategy: RecommendationStrategy.COLLABORATIVE_FILTERING,
        limit: 5,
      },
      userPreference,
      productFeatures
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations.map((recommendation) => recommendation.productId)).toEqual([101, 202]);
  });

  it('still applies categoryFilter when product features are available', async () => {
    await writeFile(
      modelPath,
      JSON.stringify({
        recommendationsByUser: {
          '10': [
            { productId: 101, score: 0.92, reason: 'same category' },
            { productId: 202, score: 0.71, reason: 'other category' },
          ],
        },
      }),
      'utf8'
    );

    const engine = new OfflineModelRecommendationEngine(modelPath);
    const userPreference = UserPreference.create(10, [1], [1], 0, Number.MAX_SAFE_INTEGER);
    const productFeatures: ProductFeature[] = [
      {
        productId: 101,
        categoryId: 8,
        brandId: 1,
        price: 1000,
        avgRating: 4.5,
        reviewCount: 10,
        purchaseCount: 5,
      },
      {
        productId: 202,
        categoryId: 5,
        brandId: 2,
        price: 1500,
        avgRating: 4.1,
        reviewCount: 7,
        purchaseCount: 3,
      },
    ];

    const recommendations = await engine.generateRecommendations(
      {
        userId: 10,
        strategy: RecommendationStrategy.COLLABORATIVE_FILTERING,
        limit: 5,
        categoryFilter: 8,
      },
      userPreference,
      productFeatures
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].productId).toBe(101);
  });

  it('normalizes overscored offline recommendations into the domain score range', async () => {
    await writeFile(
      modelPath,
      JSON.stringify({
        recommendationsByUser: {
          '10': [
            { productId: 101, score: 2.5, reason: 'overscored recommendation' },
          ],
        },
      }),
      'utf8'
    );

    const engine = new OfflineModelRecommendationEngine(modelPath);
    const userPreference = UserPreference.create(10, [1], [1], 0, Number.MAX_SAFE_INTEGER);

    const recommendations = await engine.generateRecommendations(
      {
        userId: 10,
        strategy: RecommendationStrategy.COLLABORATIVE_FILTERING,
        limit: 5,
      },
      userPreference,
      []
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].toJSON()).toEqual(
      expect.objectContaining({
        productId: 101,
        score: 1,
        reason: 'overscored recommendation',
      })
    );
  });
});
