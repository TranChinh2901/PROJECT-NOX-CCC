import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminReviewService from './admin-review.service';
import { ReviewFilterQueryDto, BulkApproveDto } from './dto/admin-review.dto';

class AdminReviewController {
  async listReviews(req: Request, res: Response) {
    const query: ReviewFilterQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
      is_approved: req.query.is_approved !== undefined ? req.query.is_approved === 'true' : undefined,
      product_id: req.query.product_id ? parseInt(req.query.product_id as string) : undefined,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
    };

    const result = await adminReviewService.listReviews(query);

    return new AppResponse({
      message: 'Reviews retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getReview(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const review = await adminReviewService.getReview(id);

    return new AppResponse({
      message: 'Review retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: review
    }).sendResponse(res);
  }

  async approveReview(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const review = await adminReviewService.approveReview(id);

    return new AppResponse({
      message: 'Review approved successfully',
      statusCode: HttpStatusCode.OK,
      data: review
    }).sendResponse(res);
  }

  async rejectReview(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const review = await adminReviewService.rejectReview(id);

    return new AppResponse({
      message: 'Review rejected successfully',
      statusCode: HttpStatusCode.OK,
      data: review
    }).sendResponse(res);
  }

  async deleteReview(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminReviewService.deleteReview(id);

    return new AppResponse({
      message: 'Review deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async bulkApprove(req: Request, res: Response) {
    const { ids }: BulkApproveDto = req.body;

    const result = await adminReviewService.bulkApprove({ ids });

    return new AppResponse({
      message: `${result.approved} reviews approved successfully`,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }
}

export default new AdminReviewController();
