"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = __importDefault(require("@/modules/cart/cart.controller"));
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, cart_controller_1.default.getCart);
router.post('/add', auth_middleware_1.authMiddleware, cart_controller_1.default.addToCart);
router.put('/items/:itemId', auth_middleware_1.authMiddleware, cart_controller_1.default.updateCartItem);
router.delete('/items/:itemId', auth_middleware_1.authMiddleware, cart_controller_1.default.removeCartItem);
router.delete('/clear', auth_middleware_1.authMiddleware, cart_controller_1.default.clearCart);
exports.default = router;
