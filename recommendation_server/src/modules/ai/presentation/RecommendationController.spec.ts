import { RecommendationController } from './RecommendationController';
import { container } from '../di/container';
import { createMockRequest, createMockResponse } from '../../../../tests/helpers/express.mock';
import { HttpStatusCode } from '../../../constants/status-code';
import { AppDataSource } from '../../../config/database.config';
import { inspectOfflineRecommendationArtifacts } from '../infrastructure/runtime/RecommendationArtifactHealth';

jest.mock('../di/container', () => ({
  container: {
    getRecommendationsUseCase: jest.fn(),
    getTrackUserBehaviorUseCase: jest.fn(),
  },
}));

jest.mock('@/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../infrastructure/runtime/RecommendationArtifactHealth', () => ({
  getConfiguredRecommendationEngineMode: jest.fn(() => 'offline_model'),
  inspectOfflineRecommendationArtifacts: jest.fn(),
}));

describe('RecommendationController', () => {
  const controller = new RecommendationController();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes explicit degraded artifact freshness, coverage, and rollback status', async () => {
    const activeCacheQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ algorithm: 'offline_model', count: '4' }]),
    };
    const staleCacheQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ algorithm: 'offline_model', count: '2' }]),
    };
    const impressionQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(8),
    };
    const userViewQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(5),
    };
    const recommendationCacheRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(activeCacheQueryBuilder)
        .mockReturnValueOnce(staleCacheQueryBuilder),
      findOne: jest.fn().mockResolvedValue({
        id: 77,
        algorithm: 'offline_model',
        recommendation_type: 'personalized',
        user_id: 22,
        generated_at: new Date('2026-04-20T00:00:00.000Z'),
        expires_at: new Date('2026-04-20T12:00:00.000Z'),
        is_active: true,
      }),
    };
    const behaviorLogRepository = {
      count: jest.fn().mockResolvedValue(13),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(impressionQueryBuilder)
        .mockReturnValueOnce(userViewQueryBuilder),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(recommendationCacheRepository)
      .mockReturnValueOnce(behaviorLogRepository);
    (inspectOfflineRecommendationArtifacts as jest.Mock).mockResolvedValue({
      configuredPath: 'exports/recommendation-baseline-model.json',
      resolvedPath: '/tmp/recommendation-baseline-model.json',
      exists: true,
      sizeBytes: 2048,
      updatedAt: '2026-04-20T00:00:00.000Z',
      metadataGeneratedAt: '2026-04-20T00:00:00.000Z',
      freshnessWindowMinutes: 360,
      ageMinutes: 420,
      state: 'stale',
      isFresh: false,
      coverage: {
        usersInArtifact: 20,
        usersWithRecommendations: 18,
        userCoverageRatio: 0.9,
        itemsInArtifact: 100,
        itemsWithSimilarItems: 80,
        similarItemCoverageRatio: 0.8,
        topNRecommendations: 12,
        topKSimilarItems: 30,
      },
      cacheSummary: {
        configuredPath: 'exports/recommendation-cache-summary.json',
        resolvedPath: '/tmp/recommendation-cache-summary.json',
        exists: true,
        generatedAt: '2026-04-20T00:00:00.000Z',
        ageMinutes: 15,
        algorithm: 'offline_model',
        ttlHours: 12,
        userCount: 20,
        insertedEntries: 18,
        userCoverageRatio: 0.9,
        productsWithSimilarItems: 80,
        similarItemCoverageRatio: 0.8,
        parseError: null,
      },
      rollback: {
        forced: true,
        active: true,
        preferredMode: 'content_based',
        reason: 'forced-content-fallback',
      },
      reasons: ['offline-artifact-stale'],
    });

    const req = createMockRequest();
    const res = createMockResponse();

    await controller.getStatus(req, res);

    const data = (res as any).jsonData.data;

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(data).toEqual(
      expect.objectContaining({
        engine: expect.objectContaining({
          configuredMode: 'offline_model',
          effectiveMode: 'content_based',
          rollback: expect.objectContaining({
            active: true,
            forced: true,
          }),
        }),
        modelFile: expect.objectContaining({
          state: 'stale',
          isFresh: false,
        }),
        artifactCoverage: expect.objectContaining({
          userCoverageRatio: 0.9,
          similarItemCoverageRatio: 0.8,
        }),
        cacheSummary: expect.objectContaining({
          exists: true,
          algorithm: 'offline_model',
        }),
        cache: expect.objectContaining({
          activeByAlgorithm: [{ algorithm: 'offline_model', count: 4 }],
          staleByAlgorithm: [{ algorithm: 'offline_model', count: 2 }],
        }),
      })
    );

    expect(data.modelFile).not.toHaveProperty('configuredPath');
    expect(data.modelFile).not.toHaveProperty('resolvedPath');
    expect(data.cacheSummary).not.toHaveProperty('configuredPath');
    expect(data.cacheSummary).not.toHaveProperty('resolvedPath');
    expect(data.cacheSummary).not.toHaveProperty('parseError');
  });

  it('rejects invalid recommendation strategies', async () => {
    const req = createMockRequest({
      params: { userId: '15' },
      query: { strategy: 'matrix_factorization' },
    });
    const res = createMockResponse();

    await controller.getRecommendations(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect((res as any).jsonData).toEqual({
      success: false,
      message: 'Invalid strategy. Must be one of: collaborative, content, hybrid, popularity',
    });
    expect(container.getRecommendationsUseCase).not.toHaveBeenCalled();
  });

  it('rejects recommendation requests for a different authenticated user', async () => {
    const req = createMockRequest({
      params: { userId: '15' },
      query: { strategy: 'hybrid' },
    }) as any;
    req.user = { id: 16, email: 'other@example.com', role: 'user' };
    const res = createMockResponse();

    await controller.getRecommendations(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.FORBIDDEN);
    expect((res as any).jsonData).toEqual({
      success: false,
      message: 'You can only access recommendations for your own account',
    });
    expect(container.getRecommendationsUseCase).not.toHaveBeenCalled();
  });

  it('waits for behavior tracking persistence before returning success', async () => {
    let completed = false;
    const execute = jest.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      completed = true;
    });
    (container.getTrackUserBehaviorUseCase as jest.Mock).mockReturnValue({ execute });

    const req = createMockRequest({
      method: 'POST',
      body: {
        userId: 22,
        behaviorType: 'view',
        productId: 90,
      },
    });
    const res = createMockResponse();

    await controller.trackBehavior(req, res);

    expect(execute).toHaveBeenCalledWith({
      userId: 22,
      behaviorType: 'view',
      productId: 90,
      categoryId: undefined,
      metadata: undefined,
    });
    expect(completed).toBe(true);
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect((res as any).jsonData).toEqual({
      success: true,
      message: 'Behavior tracked successfully',
      data: {},
    });
  });

  it('uses the authenticated user id when tracking behavior', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    (container.getTrackUserBehaviorUseCase as jest.Mock).mockReturnValue({ execute });

    const req = createMockRequest({
      method: 'POST',
      body: {
        behaviorType: 'view',
        productId: 90,
      },
    }) as any;
    req.user = { id: 23, email: 'user@example.com', role: 'user' };
    const res = createMockResponse();

    await controller.trackBehavior(req, res);

    expect(execute).toHaveBeenCalledWith({
      userId: 23,
      behaviorType: 'view',
      productId: 90,
      categoryId: undefined,
      metadata: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
  });

  it('rejects tracking behavior for a different authenticated user', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        userId: 22,
        behaviorType: 'view',
        productId: 90,
      },
    }) as any;
    req.user = { id: 23, email: 'user@example.com', role: 'user' };
    const res = createMockResponse();

    await controller.trackBehavior(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.FORBIDDEN);
    expect((res as any).jsonData).toEqual({
      success: false,
      message: 'You can only track behavior for your own account',
    });
    expect(container.getTrackUserBehaviorUseCase).not.toHaveBeenCalled();
  });

  it('returns 500 when tracking behavior persistence fails', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('db unavailable'));
    (container.getTrackUserBehaviorUseCase as jest.Mock).mockReturnValue({ execute });

    const req = createMockRequest({
      method: 'POST',
      body: {
        userId: 22,
        behaviorType: 'view',
        productId: 90,
      },
    });
    const res = createMockResponse();

    await controller.trackBehavior(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect((res as any).jsonData).toEqual({
      success: false,
      message: 'db unavailable',
    });
  });

  it('delegates similar product requests to the shared recommendation use case', async () => {
    const executeSimilarProducts = jest.fn().mockResolvedValue({
      productId: 90,
      recommendations: [{ productId: 91, score: 0.77, reason: 'similar', createdAt: new Date().toISOString() }],
      strategy: 'content_based',
      generatedAt: new Date().toISOString(),
      decision: {
        source: 'content',
        branch: 'content_only',
        fallbackReason: 'offline-artifact-unavailable',
        hidden: false,
      },
    });
    (container.getRecommendationsUseCase as jest.Mock).mockReturnValue({ executeSimilarProducts });

    const req = createMockRequest({
      params: { productId: '90' },
      query: { limit: '5' },
    });
    const res = createMockResponse();

    await controller.getSimilarProducts(req, res);

    expect(executeSimilarProducts).toHaveBeenCalledWith(90, 5);
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect((res as any).jsonData).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Similar products retrieved successfully',
        data: expect.objectContaining({
          productId: 90,
          decision: expect.objectContaining({
            source: 'content',
          }),
        }),
      })
    );
  });
});
