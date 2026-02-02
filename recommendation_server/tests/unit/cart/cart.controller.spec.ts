import 'reflect-metadata';
import cartController from '../../../src/modules/cart/cart.controller';
import cartService from '../../../src/modules/cart/cart.service';
import { HttpStatusCode } from '../../../src/constants/status-code';
import { createMockRequest, createMockResponse } from '../../helpers/express.mock';
import { createMockCart } from '../../helpers/mock-factory';
import { RoleType } from '../../../src/modules/auth/enum/auth.enum';

jest.mock('../../../src/modules/cart/cart.service');

describe('CartController', () => {
  let mockCartService: jest.Mocked<typeof cartService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartService = cartService as jest.Mocked<typeof cartService>;
  });

  describe('getCart', () => {
    it('should return UNAUTHORIZED when user is not authenticated', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required',
        data: null
      }));
    });

    it('should retrieve cart successfully when user is authenticated', async () => {
      const userId = 1;
      const mockCart = createMockCart({ id: 100, user_id: userId });
      const req = createMockRequest({ user: { id: userId, email: 'test@test.com', role: RoleType.USER } });
      const res = createMockResponse();

      mockCartService.getOrCreateCart.mockResolvedValueOnce(mockCart as never);

      await cartController.getCart(req, res);

      expect(mockCartService.getOrCreateCart).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cart retrieved successfully',
        data: mockCart
      }));
    });
  });

  describe('addToCart', () => {
    it('should return UNAUTHORIZED when user is not authenticated', async () => {
      const req = createMockRequest({ user: undefined, body: { variant_id: 1, quantity: 2 } });
      const res = createMockResponse();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST when variant_id is missing', async () => {
      const req = createMockRequest({
        user: { id: 1, email: 'test@test.com', role: RoleType.USER },
        body: { quantity: 2 }
      });
      const res = createMockResponse();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Variant ID and quantity are required'
      }));
    });

    it('should return BAD_REQUEST when quantity is missing', async () => {
      const req = createMockRequest({
        user: { id: 1, email: 'test@test.com', role: RoleType.USER },
        body: { variant_id: 1 }
      });
      const res = createMockResponse();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    });

    it('should add item to cart successfully when request is valid', async () => {
      const userId = 1;
      const mockCart = createMockCart({ id: 100, user_id: userId });
      const req = createMockRequest({
        user: { id: userId, email: 'test@test.com', role: RoleType.USER },
        body: { variant_id: '10', quantity: '2' }
      });
      const res = createMockResponse();

      mockCartService.addToCart.mockResolvedValueOnce(mockCart as never);

      await cartController.addToCart(req, res);

      expect(mockCartService.addToCart).toHaveBeenCalledWith(userId, {
        variant_id: 10,
        quantity: 2
      });
      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Item added to cart successfully'
      }));
    });
  });

  describe('updateCartItem', () => {
    it('should return UNAUTHORIZED when user is not authenticated', async () => {
      const req = createMockRequest({
        user: undefined,
        params: { itemId: '1' },
        body: { quantity: 3 }
      });
      const res = createMockResponse();

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST when itemId is invalid', async () => {
      const req = createMockRequest({
        user: { id: 1, email: 'test@test.com', role: RoleType.USER },
        params: { itemId: 'invalid' },
        body: { quantity: 3 }
      });
      const res = createMockResponse();

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    });

    it('should return BAD_REQUEST when quantity is missing', async () => {
      const req = createMockRequest({
        user: { id: 1, email: 'test@test.com', role: RoleType.USER },
        params: { itemId: '1' },
        body: {}
      });
      const res = createMockResponse();

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    });

    it('should update cart item successfully when request is valid', async () => {
      const userId = 1;
      const mockCart = createMockCart({ id: 100, user_id: userId });
      const req = createMockRequest({
        user: { id: userId, email: 'test@test.com', role: RoleType.USER },
        params: { itemId: '5' },
        body: { quantity: '3' }
      });
      const res = createMockResponse();

      mockCartService.updateCartItem.mockResolvedValueOnce(mockCart as never);

      await cartController.updateCartItem(req, res);

      expect(mockCartService.updateCartItem).toHaveBeenCalledWith(userId, 5, { quantity: 3 });
      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    });
  });

  describe('removeCartItem', () => {
    it('should return UNAUTHORIZED when user is not authenticated', async () => {
      const req = createMockRequest({
        user: undefined,
        params: { itemId: '1' }
      });
      const res = createMockResponse();

      await cartController.removeCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST when itemId is invalid', async () => {
      const req = createMockRequest({
        user: { id: 1, email: 'test@test.com', role: RoleType.USER },
        params: { itemId: 'invalid' }
      });
      const res = createMockResponse();

      await cartController.removeCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    });

    it('should remove cart item successfully when request is valid', async () => {
      const userId = 1;
      const mockCart = createMockCart({ id: 100, user_id: userId });
      const req = createMockRequest({
        user: { id: userId, email: 'test@test.com', role: RoleType.USER },
        params: { itemId: '7' }
      });
      const res = createMockResponse();

      mockCartService.removeCartItem.mockResolvedValueOnce(mockCart as never);

      await cartController.removeCartItem(req, res);

      expect(mockCartService.removeCartItem).toHaveBeenCalledWith(userId, 7);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    });
  });

  describe('clearCart', () => {
    it('should return UNAUTHORIZED when user is not authenticated', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      await cartController.clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    });

    it('should clear cart successfully when user is authenticated', async () => {
      const userId = 1;
      const req = createMockRequest({
        user: { id: userId, email: 'test@test.com', role: RoleType.USER }
      });
      const res = createMockResponse();

      mockCartService.clearCart.mockResolvedValueOnce({ message: 'Cart cleared successfully' });

      await cartController.clearCart(req, res);

      expect(mockCartService.clearCart).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cart cleared successfully'
      }));
    });
  });
});
