import { Recommendation } from './entities/Recommendation';
import {
  applySessionIntentBoost,
  buildSessionIntentProfile,
  calculateSessionIntentBoost,
} from './recommendation-session-intent';
import { BehaviorType, UserBehaviorLog } from './repositories/IUserBehaviorRepository';
import { ProductFeature } from './repositories/IProductFeatureRepository';

describe('recommendation session intent', () => {
  const makeLog = (
    productId: number,
    behaviorType: BehaviorType = BehaviorType.VIEW
  ): UserBehaviorLog => ({
    userId: 1,
    productId,
    behaviorType,
    timestamp: new Date(),
  });

  const makeFeature = (overrides: Partial<ProductFeature>): ProductFeature => ({
    productId: 1,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4,
    reviewCount: 10,
    purchaseCount: 0,
    ...overrides,
  });

  it('builds recent category, brand, and price intent from view and search signals', () => {
    const intent = buildSessionIntentProfile(
      [
        makeLog(10, BehaviorType.VIEW),
        {
          ...makeLog(0, BehaviorType.SEARCH),
          productId: undefined,
          metadata: { categoryId: 20, brandId: 200, price: 1500 },
        },
      ],
      [makeFeature({ productId: 10, categoryId: 10, brandId: 100, price: 1000 })]
    );

    expect(intent.signalCount).toBe(2);
    expect(intent.categoryWeights.get(10)).toBeGreaterThan(0);
    expect(intent.categoryWeights.get(20)).toBeGreaterThan(0);
    expect(intent.brandWeights.get(100)).toBeGreaterThan(0);
    expect(intent.brandWeights.get(200)).toBeGreaterThan(0);
    expect(intent.priceRangeMin).toBe(850);
    expect(intent.priceRangeMax).toBe(1725);
  });

  it('caps candidate boosts so session intent cannot dominate ranking', () => {
    const intent = buildSessionIntentProfile(
      [makeLog(10), makeLog(11), makeLog(12)],
      [
        makeFeature({ productId: 10, categoryId: 10, brandId: 100, price: 1000 }),
        makeFeature({ productId: 11, categoryId: 10, brandId: 100, price: 1000 }),
        makeFeature({ productId: 12, categoryId: 10, brandId: 100, price: 1000 }),
      ]
    );

    expect(
      calculateSessionIntentBoost(
        intent,
        makeFeature({ productId: 99, categoryId: 10, brandId: 100, price: 1000 })
      )
    ).toBe(0.2);
  });

  it('boosts and reorders recommendations while preserving unmatched candidates', () => {
    const intent = buildSessionIntentProfile(
      [makeLog(10)],
      [makeFeature({ productId: 10, categoryId: 10, brandId: 100, price: 1000 })]
    );
    const boosted = applySessionIntentBoost(
      [
        Recommendation.create(20, 0.5, 'base candidate'),
        Recommendation.create(21, 0.58, 'other candidate'),
      ],
      new Map([
        [20, makeFeature({ productId: 20, categoryId: 10, brandId: 100, price: 1000 })],
        [21, makeFeature({ productId: 21, categoryId: 30, brandId: 300, price: 4000 })],
      ]),
      intent
    );

    expect(boosted.map((recommendation) => recommendation.productId)).toEqual([20, 21]);
    expect(boosted[0].score.toNumber()).toBe(0.7);
    expect(boosted[0].reason).toContain('matches recent session intent');
  });
});
