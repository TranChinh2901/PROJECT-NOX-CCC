import { UserPreference } from '../../domain/entities/UserPreference';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';
import {
  buildSessionIntentProfile,
  createEmptySessionIntent,
} from '../../domain/recommendation-session-intent';
import { BehaviorType } from '../../domain/repositories/IUserBehaviorRepository';
import { RecommendationCandidate } from './RecommendationCandidate';
import { RecommendationCandidateScorer } from './RecommendationCandidateScorer';

describe('RecommendationCandidateScorer', () => {
  const makeFeature = (productId: number, overrides: Partial<ProductFeature> = {}): ProductFeature => ({
    productId,
    categoryId: 10,
    brandId: 100,
    price: 1000,
    avgRating: 4.5,
    reviewCount: 25,
    purchaseCount: 40,
    ...overrides,
  });

  it('normalizes source scores independently so raw score ranges are comparable', () => {
    const scorer = new RecommendationCandidateScorer();
    const candidates: RecommendationCandidate[] = [
      {
        productId: 1,
        source: 'offline',
        sourceScore: 0.91,
        reason: 'offline high raw range',
        feature: makeFeature(1),
      },
      {
        productId: 2,
        source: 'offline',
        sourceScore: 0.9,
        reason: 'offline low raw range',
        feature: makeFeature(2),
      },
      {
        productId: 3,
        source: 'content',
        sourceScore: 0.41,
        reason: 'content high raw range',
        feature: makeFeature(3),
      },
      {
        productId: 4,
        source: 'content',
        sourceScore: 0.4,
        reason: 'content low raw range',
        feature: makeFeature(4),
      },
    ];

    const scored = scorer.scoreCandidates(candidates, {
      userPreference: UserPreference.create(1, [10], [100], 0, 2000),
      sessionIntent: createEmptySessionIntent(),
    });

    expect(scored.map((candidate) => candidate.normalizedSourceScore)).toEqual([
      1,
      0,
      1,
      0,
    ]);
    expect(scored.every((candidate) => candidate.finalScore >= 0 && candidate.finalScore <= 1)).toBe(true);
    expect(scored[0].finalScore).toBeGreaterThan(scored[1].finalScore);
    expect(scored[2].finalScore).toBeGreaterThan(scored[3].finalScore);
  });

  it('adds bounded session intent signal and explanation when a candidate matches recent intent', () => {
    const scorer = new RecommendationCandidateScorer();
    const feature = makeFeature(20, {
      categoryId: 42,
      brandId: 420,
      price: 1500,
    });
    const sessionIntent = buildSessionIntentProfile(
      [
        {
          userId: 1,
          productId: 20,
          behaviorType: BehaviorType.VIEW,
          timestamp: new Date(),
        },
      ],
      [feature]
    );

    const [scored] = scorer.scoreCandidates(
      [
        {
          productId: 20,
          source: 'content',
          sourceScore: 0.5,
          reason: 'content candidate',
          feature,
        },
      ],
      {
        userPreference: UserPreference.create(1, [], [], 0, Number.MAX_SAFE_INTEGER),
        sessionIntent,
      }
    );

    expect(scored.finalScore).toBeGreaterThan(0.5);
    expect(scored.finalScore).toBeLessThanOrEqual(1);
    expect(scored.reason).toContain('matches recent session intent');
  });

  it('handles missing product metadata as neutral feature evidence', () => {
    const scorer = new RecommendationCandidateScorer();

    const [scored] = scorer.scoreCandidates([
      {
        productId: 30,
        source: 'offline',
        sourceScore: 0.8,
        reason: 'metadata missing',
      },
    ]);

    expect(scored.normalizedSourceScore).toBe(1);
    expect(scored.finalScore).toBeGreaterThan(0);
    expect(scored.finalScore).toBeLessThanOrEqual(1);
  });
});
