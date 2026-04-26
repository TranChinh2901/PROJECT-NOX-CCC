import express from 'express';
import recommendationRouter from './recommendation';
import recommendationController from '../modules/ai/presentation/RecommendationController';

jest.mock('../modules/ai/presentation/RecommendationController', () => ({
  __esModule: true,
  default: {
    getStatus: jest.fn(),
    trackBehavior: jest.fn(),
    getSimilarProducts: jest.fn(),
    getRecommendations: jest.fn(),
  },
}));

jest.mock('@/middlewares/auth.middleware', () => ({
  requireAuth: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

describe('recommendation routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes public similar-product requests to the recommendation controller', async () => {
    (recommendationController.getSimilarProducts as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({
        productId: Number(req.params.productId),
        limit: Number(req.query.limit),
        decision: {
          source: 'embedding',
          branch: 'embedding_only',
          hidden: false,
        },
      })
    );

    const similarRoute = (recommendationRouter as any).stack.find(
      (layer: any) => layer.route?.path === '/similar/:productId' && layer.route?.methods?.get
    );
    const handler = similarRoute.route.stack[0].handle;
    const req = ({
      params: { productId: '901' },
      query: { limit: '4' },
    } as unknown) as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    await handler(req, res, jest.fn());

    expect(recommendationController.getSimilarProducts).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      productId: 901,
      limit: 4,
      decision: {
        source: 'embedding',
        branch: 'embedding_only',
        hidden: false,
      },
    });
  });
});
