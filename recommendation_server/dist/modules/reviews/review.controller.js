"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const review_service_1 = __importDefault(require("./review.service"));
class ReviewController {
    async getProductReviews(req, res) {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) {
            return new success_response_1.AppResponse({
                message: 'Invalid product ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const options = {
            is_approved: req.query.is_approved !== 'false',
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        };
        const reviews = await review_service_1.default.getProductReviews(productId, options);
        return new success_response_1.AppResponse({
            message: 'Reviews retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: reviews
        }).sendResponse(res);
    }
    async createReview(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const { order_item_id, rating, title, content } = req.body;
        if (!order_item_id || !rating || !title || !content) {
            return new success_response_1.AppResponse({
                message: 'Order item ID, rating, title, and content are required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const reviewData = {
            order_item_id: parseInt(order_item_id),
            rating: parseInt(rating),
            title,
            content
        };
        const review = await review_service_1.default.createReview(userId, reviewData);
        return new success_response_1.AppResponse({
            message: 'Review created successfully',
            statusCode: status_code_1.HttpStatusCode.CREATED,
            data: review
        }).sendResponse(res);
    }
    async markReviewHelpful(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const reviewId = parseInt(req.params.reviewId);
        const { is_helpful } = req.body;
        if (isNaN(reviewId)) {
            return new success_response_1.AppResponse({
                message: 'Invalid review ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const result = await review_service_1.default.markReviewHelpful(userId, reviewId, is_helpful !== false);
        return new success_response_1.AppResponse({
            message: result.message,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: {
                helpful_count: result.helpful_count,
                not_helpful_count: result.not_helpful_count
            }
        }).sendResponse(res);
    }
    async getUserReviews(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const options = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        };
        const reviews = await review_service_1.default.getUserReviews(userId, options);
        return new success_response_1.AppResponse({
            message: 'User reviews retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: reviews
        }).sendResponse(res);
    }
}
exports.default = new ReviewController();
