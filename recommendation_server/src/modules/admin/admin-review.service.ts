import { Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Review } from "@/modules/reviews/entity/review";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { ReviewFilterQueryDto, BulkApproveDto } from "@/modules/admin/dto/admin-review.dto";

export class AdminReviewService {
  private reviewRepository: Repository<Review>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
  }

  async listReviews(query: ReviewFilterQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = '',
      is_approved,
      product_id,
      user_id,
      rating
    } = query;

    let queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .withDeleted();

    if (is_approved !== undefined) {
      queryBuilder = queryBuilder.andWhere('review.is_approved = :is_approved', { is_approved });
    }

    if (product_id) {
      queryBuilder = queryBuilder.andWhere('review.product_id = :product_id', { product_id });
    }

    if (user_id) {
      queryBuilder = queryBuilder.andWhere('review.user_id = :user_id', { user_id });
    }

    if (rating) {
      queryBuilder = queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(review.title LIKE :search OR review.content LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();
    const validSortColumns = ['created_at', 'updated_at', 'rating', 'helpful_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder = queryBuilder.orderBy(`review.${sortColumn}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    return {
      data: reviews.map(review => this.formatReviewResponse(review)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getReview(id: number) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
      withDeleted: true
    });

    if (!review) {
      throw new AppError(
        'Review not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    return this.formatReviewResponse(review);
  }

  async approveReview(id: number) {
    const review = await this.reviewRepository.findOne({ 
      where: { id },
      relations: ['user', 'product']
    });

    if (!review) {
      throw new AppError(
        'Review not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    review.is_approved = true;
    await this.reviewRepository.save(review);

    return this.formatReviewResponse(review);
  }

  async rejectReview(id: number) {
    const review = await this.reviewRepository.findOne({ 
      where: { id },
      relations: ['user', 'product']
    });

    if (!review) {
      throw new AppError(
        'Review not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    review.is_approved = false;
    await this.reviewRepository.save(review);

    return this.formatReviewResponse(review);
  }

  async deleteReview(id: number): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new AppError(
        'Review not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    await this.reviewRepository.softDelete({ id });
  }

  async bulkApprove(data: BulkApproveDto): Promise<{ approved: number }> {
    const { ids } = data;

    if (!ids || ids.length === 0) {
      throw new AppError(
        'No IDs provided',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (ids.length > 100) {
      throw new AppError(
        'Cannot approve more than 100 items at once',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const reviews = await this.reviewRepository.find({
      where: ids.map(id => ({ id })),
      select: ['id']
    });

    if (reviews.length !== ids.length) {
      throw new AppError(
        'One or more reviews not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    await this.reviewRepository
      .createQueryBuilder()
      .update(Review)
      .set({ is_approved: true })
      .where('id IN (:...ids)', { ids })
      .execute();

    return { approved: ids.length };
  }

  private formatReviewResponse(review: Review) {
    return {
      id: review.id,
      product_id: review.product_id,
      product: review.product ? {
        id: review.product.id,
        name: review.product.name,
        slug: review.product.slug
      } : null,
      user_id: review.user_id,
      user: review.user ? {
        id: review.user.id,
        fullname: review.user.fullname,
        email: review.user.email
      } : null,
      order_item_id: review.order_item_id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      is_verified_purchase: review.is_verified_purchase,
      is_approved: review.is_approved,
      helpful_count: review.helpful_count,
      not_helpful_count: review.not_helpful_count,
      deleted_at: review.deleted_at,
      created_at: review.created_at,
      updated_at: review.updated_at
    };
  }
}

export default new AdminReviewService();
