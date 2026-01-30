import { Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Review } from "@/modules/reviews/entity/review";
import { ReviewHelpful } from "@/modules/reviews/entity/review-helpful";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { Order } from "@/modules/orders/entity/order";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";

export interface CreateReviewDto {
  order_item_id: number;
  rating: number;
  title: string;
  content: string;
}

export interface ReviewFilterOptions {
  product_id?: number;
  is_approved?: boolean;
  page?: number;
  limit?: number;
}

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private reviewHelpfulRepository: Repository<ReviewHelpful>;
  private orderItemRepository: Repository<OrderItem>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.reviewHelpfulRepository = AppDataSource.getRepository(ReviewHelpful);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  async createReview(userId: number, data: CreateReviewDto) {
    const { order_item_id, rating, title, content } = data;

    if (rating < 1 || rating > 5) {
      throw new AppError(
        'Rating must be between 1 and 5',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const orderItem = await this.orderItemRepository.findOne({
      where: { id: order_item_id },
      relations: ['order', 'variant', 'variant.product']
    });

    if (!orderItem) {
      throw new AppError(
        'Order item not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.ORDER_NOT_FOUND
      );
    }

    if (orderItem.order.user_id !== userId) {
      throw new AppError(
        'You can only review items from your own orders',
        HttpStatusCode.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { order_item_id, user_id: userId }
    });

    if (existingReview) {
      throw new AppError(
        'You have already reviewed this item',
        HttpStatusCode.CONFLICT,
        ErrorCode.REVIEW_ALREADY_EXISTS
      );
    }

    const review = this.reviewRepository.create({
      product_id: orderItem.variant.product_id,
      user_id: userId,
      order_item_id: order_item_id,
      rating: rating,
      title: title,
      content: content,
      is_verified_purchase: true,
      is_approved: false,
      helpful_count: 0,
      not_helpful_count: 0
    });

    await this.reviewRepository.save(review);

    return this.formatReviewResponse(review);
  }

  async getProductReviews(productId: number, options: ReviewFilterOptions = {}) {
    const { is_approved = true, page = 1, limit = 10 } = options;

    let queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .where('review.product_id = :productId', { productId })
      .leftJoinAndSelect('review.user', 'user')
      .orderBy('review.created_at', 'DESC');

    if (is_approved !== undefined) {
      queryBuilder = queryBuilder.andWhere('review.is_approved = :is_approved', { is_approved });
    }

    const total = await queryBuilder.getCount();

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    const ratingDistribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.is_approved = :is_approved', { is_approved: true })
      .groupBy('review.rating')
      .getRawMany();

    const averageRating = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.is_approved = :is_approved', { is_approved: true })
      .getRawOne();

    return {
      data: reviews.map(review => this.formatReviewResponse(review)),
      summary: {
        total_reviews: total,
        average_rating: Number(averageRating?.average || 0).toFixed(1),
        rating_distribution: ratingDistribution
      },
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async markReviewHelpful(userId: number, reviewId: number, isHelpful: boolean) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId }
    });

    if (!review) {
      throw new AppError(
        'Review not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.REVIEW_NOT_FOUND
      );
    }

    const existingVote = await this.reviewHelpfulRepository.findOne({
      where: { review_id: reviewId, user_id: userId }
    });

    if (existingVote) {
      if (existingVote.is_helpful === isHelpful) {
        throw new AppError(
          'You have already marked this review',
          HttpStatusCode.CONFLICT,
          ErrorCode.CONFLICT
        );
      }

      existingVote.is_helpful = isHelpful;
      await this.reviewHelpfulRepository.save(existingVote);
    } else {
      const vote = this.reviewHelpfulRepository.create({
        review_id: reviewId,
        user_id: userId,
        is_helpful: isHelpful
      });
      await this.reviewHelpfulRepository.save(vote);
    }

    const helpfulCount = await this.reviewHelpfulRepository.count({
      where: { review_id: reviewId, is_helpful: true }
    });

    const notHelpfulCount = await this.reviewHelpfulRepository.count({
      where: { review_id: reviewId, is_helpful: false }
    });

    review.helpful_count = helpfulCount;
    review.not_helpful_count = notHelpfulCount;
    await this.reviewRepository.save(review);

    return {
      message: 'Review marked successfully',
      helpful_count: helpfulCount,
      not_helpful_count: notHelpfulCount
    };
  }

  async getUserReviews(userId: number, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;

    let queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .leftJoinAndSelect('review.product', 'product')
      .orderBy('review.created_at', 'DESC');

    const total = await queryBuilder.getCount();

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

  private formatReviewResponse(review: Review) {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      is_verified_purchase: review.is_verified_purchase,
      is_approved: review.is_approved,
      helpful_count: review.helpful_count,
      not_helpful_count: review.not_helpful_count,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user: review.user ? {
        id: review.user.id,
        fullname: review.user.fullname,
        avatar: review.user.avatar
      } : null,
      product: review.product ? {
        id: review.product.id,
        name: review.product.name,
        slug: review.product.slug
      } : null
    };
  }
}

export default new ReviewService();
