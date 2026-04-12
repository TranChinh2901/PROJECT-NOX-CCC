import {
  buildEvaluationSplit,
  evaluateRecommendations,
  generateRecommendationsForEvaluation,
  DatasetRow,
} from './evaluate-recommendation-baseline';

describe('evaluate-recommendation-baseline', () => {
  const row = (
    userId: number,
    productId: number,
    interactionScore: number,
    lastInteractionAt: string
  ): DatasetRow => ({
    userId,
    productId,
    interactionScore,
    categoryId: null,
    brandId: null,
    purchaseCount: 0,
    addToCartCount: 0,
    wishlistCount: 0,
    viewCount: 1,
    lastInteractionAt,
  });

  it('holds out the most recent interactions per user', () => {
    const split = buildEvaluationSplit(
      [
        row(1, 10, 1, '2026-04-01T10:00:00.000Z'),
        row(1, 20, 2, '2026-04-02T10:00:00.000Z'),
        row(1, 30, 3, '2026-04-03T10:00:00.000Z'),
      ],
      1
    );

    expect(split.trainRowsByUser.get(1)?.map((item) => item.productId)).toEqual([10, 20]);
    expect(split.holdoutRowsByUser.get(1)?.map((item) => item.productId)).toEqual([30]);
    expect(split.skippedUsers).toBe(0);
  });

  it('scores unseen candidates using training interactions and item similarity', () => {
    const recommendations = generateRecommendationsForEvaluation(
      [
        row(1, 10, 2, '2026-04-01T10:00:00.000Z'),
        row(1, 20, 1, '2026-04-02T10:00:00.000Z'),
      ],
      {
        '10': [{ productId: 30, score: 0.5 }],
        '20': [
          { productId: 30, score: 0.4 },
          { productId: 40, score: 0.6 },
        ],
      },
      5
    );

    expect(recommendations).toEqual([
      { productId: 30, score: 1.4 },
      { productId: 40, score: 0.6 },
    ]);
  });

  it('computes ranking metrics from holdout hits', () => {
    const split = buildEvaluationSplit(
      [
        row(1, 10, 1, '2026-04-01T10:00:00.000Z'),
        row(1, 20, 1, '2026-04-02T10:00:00.000Z'),
        row(2, 10, 1, '2026-04-01T10:00:00.000Z'),
        row(2, 30, 1, '2026-04-02T10:00:00.000Z'),
      ],
      1
    );

    const metrics = evaluateRecommendations(
      split,
      {
        '10': [
          { productId: 20, score: 0.9 },
          { productId: 30, score: 0.8 },
        ],
      },
      2
    );

    expect(metrics.evaluatedUsers).toBe(2);
    expect(metrics.precisionAtK).toBe(0.5);
    expect(metrics.recallAtK).toBe(1);
    expect(metrics.hitRateAtK).toBe(1);
    expect(metrics.mrrAtK).toBe(0.75);
    expect(metrics.coverageAtK).toBe(0.666667);
  });
});
