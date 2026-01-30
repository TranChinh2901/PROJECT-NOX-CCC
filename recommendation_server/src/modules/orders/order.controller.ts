import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import orderService, { CreateOrderDto } from './order.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { PaymentMethod } from './enum/order.enum';

class OrderController {
  async createOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const { cart_id, shipping_address, billing_address, payment_method, notes } = req.body;

    if (!cart_id || !shipping_address || !payment_method) {
      return new AppResponse({
        message: 'Cart ID, shipping address, and payment method are required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const validPaymentMethods = Object.values(PaymentMethod);
    if (!validPaymentMethods.includes(payment_method)) {
      return new AppResponse({
        message: `Invalid payment method. Valid options: ${validPaymentMethods.join(', ')}`,
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const orderData: CreateOrderDto = {
      cart_id: parseInt(cart_id),
      shipping_address,
      billing_address,
      payment_method: payment_method as PaymentMethod,
      notes
    };

    const order = await orderService.createOrder(userId, orderData);

    return new AppResponse({
      message: 'Order created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: order
    }).sendResponse(res);
  }

  async getOrderById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return new AppResponse({
        message: 'Invalid order ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const order = await orderService.getOrderById(orderId);

    if (order.id !== orderId) {
      return new AppResponse({
        message: 'Unauthorized access to order',
        statusCode: HttpStatusCode.FORBIDDEN,
        data: null
      }).sendResponse(res);
    }

    return new AppResponse({
      message: 'Order retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: order
    }).sendResponse(res);
  }

  async getUserOrders(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const options = {
      status: req.query.status as any,
      payment_status: req.query.payment_status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const orders = await orderService.getUserOrders(userId, options);

    return new AppResponse({
      message: 'Orders retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: orders
    }).sendResponse(res);
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const orderId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(orderId)) {
      return new AppResponse({
        message: 'Invalid order ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const result = await orderService.cancelOrder(userId, orderId, reason);

    return new AppResponse({
      message: result.message,
      statusCode: HttpStatusCode.OK,
      data: { order_id: result.order_id }
    }).sendResponse(res);
  }
}

export default new OrderController();
