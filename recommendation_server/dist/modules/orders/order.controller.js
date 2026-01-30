"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const order_service_1 = __importDefault(require("./order.service"));
const order_enum_1 = require("./enum/order.enum");
class OrderController {
    async createOrder(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const { cart_id, shipping_address, billing_address, payment_method, notes } = req.body;
        if (!cart_id || !shipping_address || !payment_method) {
            return new success_response_1.AppResponse({
                message: 'Cart ID, shipping address, and payment method are required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const validPaymentMethods = Object.values(order_enum_1.PaymentMethod);
        if (!validPaymentMethods.includes(payment_method)) {
            return new success_response_1.AppResponse({
                message: `Invalid payment method. Valid options: ${validPaymentMethods.join(', ')}`,
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const orderData = {
            cart_id: parseInt(cart_id),
            shipping_address,
            billing_address,
            payment_method: payment_method,
            notes
        };
        const order = await order_service_1.default.createOrder(userId, orderData);
        return new success_response_1.AppResponse({
            message: 'Order created successfully',
            statusCode: status_code_1.HttpStatusCode.CREATED,
            data: order
        }).sendResponse(res);
    }
    async getOrderById(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const orderId = parseInt(req.params.id);
        if (isNaN(orderId)) {
            return new success_response_1.AppResponse({
                message: 'Invalid order ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const order = await order_service_1.default.getOrderById(orderId);
        if (order.id !== orderId) {
            return new success_response_1.AppResponse({
                message: 'Unauthorized access to order',
                statusCode: status_code_1.HttpStatusCode.FORBIDDEN,
                data: null
            }).sendResponse(res);
        }
        return new success_response_1.AppResponse({
            message: 'Order retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: order
        }).sendResponse(res);
    }
    async getUserOrders(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const options = {
            status: req.query.status,
            payment_status: req.query.payment_status,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        };
        const orders = await order_service_1.default.getUserOrders(userId, options);
        return new success_response_1.AppResponse({
            message: 'Orders retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: orders
        }).sendResponse(res);
    }
    async cancelOrder(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return new success_response_1.AppResponse({
                message: 'Authentication required',
                statusCode: status_code_1.HttpStatusCode.UNAUTHORIZED,
                data: null
            }).sendResponse(res);
        }
        const orderId = parseInt(req.params.id);
        const { reason } = req.body;
        if (isNaN(orderId)) {
            return new success_response_1.AppResponse({
                message: 'Invalid order ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const result = await order_service_1.default.cancelOrder(userId, orderId, reason);
        return new success_response_1.AppResponse({
            message: result.message,
            statusCode: status_code_1.HttpStatusCode.OK,
            data: { order_id: result.order_id }
        }).sendResponse(res);
    }
}
exports.default = new OrderController();
