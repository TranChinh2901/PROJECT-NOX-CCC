"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const database_config_1 = require("@/config/database.config");
const review_1 = require("@/modules/reviews/entity/review");
const review_helpful_1 = require("@/modules/reviews/entity/review-helpful");
const order_item_1 = require("@/modules/orders/entity/order-item");
const order_1 = require("@/modules/orders/entity/order");
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
class ReviewService {
    reviewRepository;
    reviewHelpfulRepository;
    orderItemRepository;
    orderRepository;
    constructor() {
        this.reviewRepository = database_config_1.AppDataSource.getRepository(review_1.Review);
        this.reviewHelpfulRepository = database_config_1.AppDataSource.getRepository(review_helpful_1.ReviewHelpful);
        this.orderItemRepository = database_config_1.AppDataSource.getRepository(order_item_1.OrderItem);
        this.orderRepository = database_config_1.AppDataSource.getRepository(order_1.Order);
    }
    async createReview(userId, data) {
        const { order_item_id, rating, title, content } = data;
        if (rating < 1 || rating > 5) {
            throw new error_response_1.AppError('Rating must be between 1 and 5', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        const orderItem = await this.orderItemRepository.findOne({
            where: { id: order_item_id },
            relations: ['order', 'variant', 'variant.product']
        });
        if (!orderItem) {
            throw new error_response_1.AppError('Order item not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.ORDER_NOT_FOUND);
        }
        if (orderItem.order.user_id !== userId) {
            throw new error_response_1.AppError('You can only review items from your own orders', status_code_1.HttpStatusCode.FORBIDDEN, error_code_1.ErrorCode.FORBIDDEN);
        }
        const existingReview = await this.reviewRepository.findOne({
            where: { order_item_id, user_id: userId }
        });
        if (existingReview) {
            throw new error_response_1.AppError('You have already reviewed this item', status_code_1.HttpStatusCode.CONFLICT, error_code_1.ErrorCode.REVIEW_ALREADY_EXISTS);
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
    async getProductReviews(productId, options = {}) {
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
    async markReviewHelpful(userId, reviewId, isHelpful) {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId }
        });
        if (!review) {
            throw new error_response_1.AppError('Review not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.REVIEW_NOT_FOUND);
        }
        const existingVote = await this.reviewHelpfulRepository.findOne({
            where: { review_id: reviewId, user_id: userId }
        });
        if (existingVote) {
            if (existingVote.is_helpful === isHelpful) {
                throw new error_response_1.AppError('You have already marked this review', status_code_1.HttpStatusCode.CONFLICT, error_code_1.ErrorCode.CONFLICT);
            }
            existingVote.is_helpful = isHelpful;
            await this.reviewHelpfulRepository.save(existingVote);
        }
        else {
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
    async getUserReviews(userId, options = {}) {
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
    formatReviewResponse(review) {
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
exports.ReviewService = ReviewService;
exports.default = new ReviewService();
