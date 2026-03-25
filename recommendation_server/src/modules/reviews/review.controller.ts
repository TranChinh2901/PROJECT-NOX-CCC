import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import reviewService, { CreateReviewDto } from './review.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

class ReviewController {
  async getProductReviews(req: Request, res: Response) {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return new AppResponse({
        message: 'Invalid product ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const options = {
      is_approved: req.query.is_approved !== 'false',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const reviews = await reviewService.getProductReviews(productId, options);

    return new AppResponse({
      message: 'Reviews retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: reviews
    }).sendResponse(res);
  }

  async createReview(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const { order_item_id, rating, title, content } = req.body;

    if (!order_item_id || !rating || !title || !content) {
      return new AppResponse({
        message: 'Order item ID, rating, title, and content are required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const reviewData: CreateReviewDto = {
      order_item_id: parseInt(order_item_id),
      rating: parseInt(rating),
      title,
      content
    };

    const review = await reviewService.createReview(userId, reviewData);

    return new AppResponse({
      message: 'Review created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: review
    }).sendResponse(res);
  }

  async markReviewHelpful(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const reviewId = parseInt(req.params.reviewId);
    const { is_helpful } = req.body;

    if (isNaN(reviewId)) {
      return new AppResponse({
        message: 'Invalid review ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const result = await reviewService.markReviewHelpful(userId, reviewId, is_helpful !== false);

    return new AppResponse({
      message: result.message,
      statusCode: HttpStatusCode.OK,
      data: {
        helpful_count: result.helpful_count,
        not_helpful_count: result.not_helpful_count
      }
    }).sendResponse(res);
  }

  async getUserReviews(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const options = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const reviews = await reviewService.getUserReviews(userId, options);

    return new AppResponse({
      message: 'User reviews retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: reviews
    }).sendResponse(res);
  }
}

export default new ReviewController();
