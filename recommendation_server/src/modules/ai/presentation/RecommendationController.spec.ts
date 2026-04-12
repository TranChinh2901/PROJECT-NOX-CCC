import { RecommendationController } from './RecommendationController';
import { container } from '../di/container';
import { createMockRequest, createMockResponse } from '../../../../tests/helpers/express.mock';
import { HttpStatusCode } from '@/constants/status-code';

jest.mock('../di/container', () => ({
  container: {
    getRecommendationsUseCase: jest.fn(),
    getTrackUserBehaviorUseCase: jest.fn(),
  },
}));

describe('RecommendationController', () => {
  const controller = new RecommendationController();

  beforeEach(() => {
    jest.clearAllMocks();
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
});
