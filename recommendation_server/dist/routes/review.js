"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = __importDefault(require("@/modules/reviews/review.controller"));
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/product/:productId', review_controller_1.default.getProductReviews);
router.post('/product/:productId/helpful/:reviewId', auth_middleware_1.authMiddleware, review_controller_1.default.markReviewHelpful);
router.get('/my-reviews', auth_middleware_1.authMiddleware, review_controller_1.default.getUserReviews);
router.post('/', auth_middleware_1.authMiddleware, review_controller_1.default.createReview);
exports.default = router;
