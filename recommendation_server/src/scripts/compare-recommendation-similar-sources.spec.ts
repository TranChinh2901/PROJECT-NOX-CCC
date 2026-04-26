import { Recommendation } from '../modules/ai/domain/entities/Recommendation';
import { buildSimilarSourceShadowEvidence } from './compare-recommendation-similar-sources';

describe('compare-recommendation-similar-sources', () => {
  it('summarizes shadow comparison evidence without exposing product IDs', () => {
    const evidence = buildSimilarSourceShadowEvidence(
      [
        {
          contentRecommendations: [
            Recommendation.create(10, 0.8, 'content'),
            Recommendation.create(11, 0.6, 'content'),
          ],
          embeddingRecommendations: [
            Recommendation.create(10, 0.9, 'embedding'),
            Recommendation.create(12, 0.7, 'embedding'),
          ],
        },
        {
          contentRecommendations: [],
          embeddingRecommendations: [Recommendation.create(13, 0.5, 'embedding')],
        },
      ],
      10,
      2,
      '2026-04-26T00:00:00.000Z'
    );

    expect(evidence).toEqual({
      generatedAt: '2026-04-26T00:00:00.000Z',
      sampleSize: 2,
      requestedSampleSize: 10,
      limit: 2,
      contentNonEmptyCount: 1,
      embeddingNonEmptyCount: 2,
      bothNonEmptyCount: 1,
      contentOnlyCount: 0,
      embeddingOnlyCount: 1,
      averageOverlapAtK: 0.25,
      averageContentTopScore: 0.8,
      averageEmbeddingTopScore: 0.7,
      safety: {
        containsProductIds: false,
      },
    });
    expect(JSON.stringify(evidence)).not.toContain('"productId"');
  });
});
