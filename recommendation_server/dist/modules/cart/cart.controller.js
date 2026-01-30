"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const cart_service_1 = __importDefault(require("./cart.service"));
class CartController {
    async getCart(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const cart = await cart_service_1.default.getOrCreateCart(userId);
        return new success_response_1.AppResponse({
            message: 'Cart retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: cart
        }).sendResponse(res);
    }
    async addToCart(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const { variant_id, quantity } = req.body;
        if (!variant_id || !quantity) {
            return new success_response_1.AppResponse({
                message: 'Variant ID and quantity are required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const cart = await cart_service_1.default.addToCart(userId, {
            variant_id: parseInt(variant_id),
            quantity: parseInt(quantity)
        });
        return new success_response_1.AppResponse({
            message: 'Item added to cart successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: cart
        }).sendResponse(res);
    }
    async updateCartItem(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const itemId = parseInt(req.params.itemId);
        const { quantity } = req.body;
        if (isNaN(itemId) || !quantity) {
            return new success_response_1.AppResponse({
                message: 'Valid item ID and quantity are required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const cart = await cart_service_1.default.updateCartItem(userId, itemId, {
            quantity: parseInt(quantity)
        });
        return new success_response_1.AppResponse({
            message: 'Cart item updated successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: cart
        }).sendResponse(res);
    }
    async removeCartItem(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const itemId = parseInt(req.params.itemId);
        if (isNaN(itemId)) {
            return new success_response_1.AppResponse({
                message: 'Valid item ID is required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const cart = await cart_service_1.default.removeCartItem(userId, itemId);
        return new success_response_1.AppResponse({
            message: 'Item removed from cart successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: cart
        }).sendResponse(res);
    }
    async clearCart(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const result = await cart_service_1.default.clearCart(userId);
        return new success_response_1.AppResponse({
            message: result.message,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: null
        }).sendResponse(res);
    }
}
exports.default = new CartController();
