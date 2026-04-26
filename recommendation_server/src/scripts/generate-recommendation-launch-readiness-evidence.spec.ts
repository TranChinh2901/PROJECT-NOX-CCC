import { AppDataSource } from '../config/database.config';
import { RecommendationCache } from '../modules/ai/entity/recommendation-cache';
import { RecommendationType } from '../modules/ai/enum/recommendation.enum';
import { inspectOfflineRecommendationArtifacts } from '../modules/ai/infrastructure/runtime/RecommendationArtifactHealth';
import {
  DEFAULT_OUTPUT_PATH,
  buildLaunchReadinessEvidence,
} from './generate-recommendation-launch-readiness-evidence';

jest.mock('@/config/database.config', () => ({
  AppDataSource: {
    initialize: jest.fn(),
    destroy: jest.fn(),
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

jest.mock('@/modules/ai/infrastructure/runtime/RecommendationArtifactHealth', () => ({
  inspectOfflineRecommendationArtifacts: jest.fn(),
}));

describe('generate-recommendation-launch-readiness-evidence', () => {
  it('defaults to the planned evidence path under .sisyphus/evidence', () => {
    expect(DEFAULT_OUTPUT_PATH).toContain('.sisyphus/evidence/task-7-readiness.json');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      state: 'stale',
      isFresh: false,
      ageMinutes: 420,
      rollback: {
        active: true,
        forced: true,
      },
    });
  });

  it('builds PII-safe launch readiness evidence with branch usage and result counts', async () => {
    const createQueryBuilder = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ algorithm: 'offline_model', count: '4' }]),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ algorithm: 'fallback', count: '1' }]),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { recommendationType: 'personalized', count: '3' },
          { recommendationType: 'similar', count: '2' },
        ]),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '17' }),
      });

    const repository = {
      createQueryBuilder,
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          recommendation_type: RecommendationType.PERSONALIZED,
          algorithm: 'offline_model',
          recommended_products: [{ product_id: 11 }, { product_id: 12 }, { product_id: 13 }],
          generated_at: new Date('2026-04-20T00:00:00.000Z'),
          expires_at: new Date('2026-04-20T12:00:00.000Z'),
          cache_hit_count: 7,
        })
        .mockResolvedValueOnce({
          recommendation_type: RecommendationType.SIMILAR,
          algorithm: 'offline_model',
          recommended_products: [{ product_id: 21 }, { product_id: 22 }],
          generated_at: new Date('2026-04-20T00:00:00.000Z'),
          expires_at: new Date('2026-04-20T12:00:00.000Z'),
          cache_hit_count: 5,
        }),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repository);

    const evidence = await buildLaunchReadinessEvidence();

    expect(evidence).toEqual(
      expect.objectContaining({
        artifact: expect.objectContaining({
          state: 'stale',
          rollbackActive: true,
          rollbackForced: true,
        }),
        branchUsage: expect.objectContaining({
          activeByAlgorithm: [{ algorithm: 'offline_model', count: 4 }],
          staleByAlgorithm: [{ algorithm: 'fallback', count: 1 }],
        }),
        resultCounts: {
          homepage: 3,
          pdp: 2,
        },
        cacheHealth: expect.objectContaining({
          activeCacheHitCount: 17,
        }),
        safety: {
          containsIdentifiers: false,
          containsSecrets: false,
        },
      })
    );

    expect(evidence.cacheHealth.latestHomepage).not.toHaveProperty('recommended_products');
    expect(evidence.cacheHealth.latestPdp).not.toHaveProperty('recommended_products');
    expect(JSON.stringify(evidence)).not.toContain('product_id');
    expect(AppDataSource.getRepository).toHaveBeenCalledWith(RecommendationCache);
  });
});
