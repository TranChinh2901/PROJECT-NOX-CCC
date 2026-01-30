import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import cartService from './cart.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

class CartController {
  async getCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const cart = await cartService.getOrCreateCart(userId);

    return new AppResponse({
      message: 'Cart retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: cart
    }).sendResponse(res);
  }

  async addToCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const { variant_id, quantity } = req.body;

    if (!variant_id || !quantity) {
      return new AppResponse({
        message: 'Variant ID and quantity are required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const cart = await cartService.addToCart(userId, {
      variant_id: parseInt(variant_id),
      quantity: parseInt(quantity)
    });

    return new AppResponse({
      message: 'Item added to cart successfully',
      statusCode: HttpStatusCode.OK,
      data: cart
    }).sendResponse(res);
  }

  async updateCartItem(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    if (isNaN(itemId) || !quantity) {
      return new AppResponse({
        message: 'Valid item ID and quantity are required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const cart = await cartService.updateCartItem(userId, itemId, {
      quantity: parseInt(quantity)
    });

    return new AppResponse({
      message: 'Cart item updated successfully',
      statusCode: HttpStatusCode.OK,
      data: cart
    }).sendResponse(res);
  }

  async removeCartItem(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const itemId = parseInt(req.params.itemId);

    if (isNaN(itemId)) {
      return new AppResponse({
        message: 'Valid item ID is required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const cart = await cartService.removeCartItem(userId, itemId);

    return new AppResponse({
      message: 'Item removed from cart successfully',
      statusCode: HttpStatusCode.OK,
      data: cart
    }).sendResponse(res);
  }

  async clearCart(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const result = await cartService.clearCart(userId);

    return new AppResponse({
      message: result.message,
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }
}

export default new CartController();
