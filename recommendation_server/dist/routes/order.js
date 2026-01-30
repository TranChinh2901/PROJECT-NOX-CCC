"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = __importDefault(require("@/modules/orders/order.controller"));
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authMiddleware, order_controller_1.default.createOrder);
router.get('/', auth_middleware_1.authMiddleware, order_controller_1.default.getUserOrders);
router.get('/:id', auth_middleware_1.authMiddleware, order_controller_1.default.getOrderById);
router.post('/:id/cancel', auth_middleware_1.authMiddleware, order_controller_1.default.cancelOrder);
exports.default = router;
