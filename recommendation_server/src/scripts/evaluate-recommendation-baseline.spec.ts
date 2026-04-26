import {
  appendEvaluationHistory,
  buildEvaluationSplit,
  buildEvaluationContext,
  evaluateRecommendations,
  generateRecommendationsForEvaluation,
  DatasetRow,
} from './evaluate-recommendation-baseline';
import { mkdtemp, readFile, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

describe('evaluate-recommendation-baseline', () => {
  const row = (
    userId: number,
    productId: number,
    interactionScore: number,
    lastInteractionAt: string,
    categoryId: number | null = null,
    brandId: number | null = null
  ): DatasetRow => ({
    userId,
    productId,
    interactionScore,
    categoryId,
    brandId,
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
    const dataset = [
      row(1, 10, 1, '2026-04-01T10:00:00.000Z', 1, 1),
      row(1, 20, 1, '2026-04-02T10:00:00.000Z', 2, 2),
      row(2, 10, 1, '2026-04-01T10:00:00.000Z', 1, 1),
      row(2, 30, 1, '2026-04-02T10:00:00.000Z', 3, 3),
    ];
    const split = buildEvaluationSplit(dataset, 1);

    const metrics = evaluateRecommendations(
      split,
      {
        '10': [
          { productId: 20, score: 0.9 },
          { productId: 30, score: 0.8 },
        ],
      },
      2,
      buildEvaluationContext(dataset)
    );

    expect(metrics.evaluatedUsers).toBe(2);
    expect(metrics.precisionAtK).toBe(0.5);
    expect(metrics.recallAtK).toBe(1);
    expect(metrics.hitRateAtK).toBe(1);
    expect(metrics.mrrAtK).toBe(0.75);
    expect(metrics.coverageAtK).toBe(0.666667);
    expect(metrics.ndcgAtK).toBe(0.815465);
    expect(metrics.mapAtK).toBe(0.75);
    expect(metrics.categoryCoverageAtK).toBe(0.666667);
    expect(metrics.brandCoverageAtK).toBe(0.666667);
    expect(metrics.noveltyAtK).toBe(1);
    expect(metrics.intraListDiversityAtK).toBe(1);
    expect(metrics.coldStartUserSlice).toEqual({
      evaluatedUsers: 2,
      holdoutItems: 2,
      hitRateAtK: 1,
      recallAtK: 1,
    });
    expect(metrics.coldStartProductSlice).toEqual({
      evaluatedUsers: 2,
      holdoutItems: 2,
      hitRateAtK: 1,
      recallAtK: 1,
    });
  });

  it('appends evaluation history records instead of replacing prior runs', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'recommendation-eval-'));
    const historyPath = path.join(tempDirectory, 'history.json');

    try {
      const summary = {
        generatedAt: '2026-04-26T00:00:00.000Z',
        inputDataset: 'dataset.csv',
        inputModel: 'model.json',
        algorithmTag: 'item-item-baseline',
        modelMetadata: { topNRecommendations: 10 },
        datasetWindow: {
          earliestInteractionAt: '2026-04-01T00:00:00.000Z',
          latestInteractionAt: '2026-04-02T00:00:00.000Z',
          spanDays: 1,
        },
        topK: 10,
        topN: 10,
        lookbackDays: 180,
        holdoutCount: 1,
        evaluatedUsers: 1,
        skippedUsers: 0,
        catalogSize: 2,
        recommendedCatalogSize: 1,
        precisionAtK: 1,
        recallAtK: 1,
        hitRateAtK: 1,
        mrrAtK: 1,
        coverageAtK: 0.5,
        ndcgAtK: 1,
        mapAtK: 1,
        categoryCoverageAtK: 1,
        brandCoverageAtK: 1,
        noveltyAtK: 0,
        intraListDiversityAtK: 0,
        coldStartUserSlice: {
          evaluatedUsers: 1,
          holdoutItems: 1,
          hitRateAtK: 1,
          recallAtK: 1,
        },
        coldStartProductSlice: {
          evaluatedUsers: 1,
          holdoutItems: 1,
          hitRateAtK: 1,
          recallAtK: 1,
        },
      };

      await appendEvaluationHistory(historyPath, summary);
      await appendEvaluationHistory(historyPath, {
        ...summary,
        generatedAt: '2026-04-27T00:00:00.000Z',
      });

      const history = JSON.parse(await readFile(historyPath, 'utf8'));
      expect(history).toHaveLength(2);
      expect(history.map((record: { generatedAt: string }) => record.generatedAt)).toEqual([
        '2026-04-26T00:00:00.000Z',
        '2026-04-27T00:00:00.000Z',
      ]);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });
});
