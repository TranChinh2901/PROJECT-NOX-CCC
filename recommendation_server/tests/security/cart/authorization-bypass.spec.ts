import 'reflect-metadata';
import { CartService } from '../../../src/modules/cart/cart.service';
import { AppDataSource } from '../../../src/config/database.config';
import { Cart } from '../../../src/modules/cart/entity/cart';
import { CartStatus } from '../../../src/modules/cart/enum/cart.enum';
import { AppError } from '../../../src/common/error.response';
import { HttpStatusCode } from '../../../src/constants/status-code';

describe('Cart Authorization Bypass Security Tests', () => {
  let cartService: CartService;
  let cartRepository: any;

  beforeEach(() => {
    cartService = new CartService();
    cartRepository = AppDataSource.getRepository(Cart);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Prevent unauthorized cart access', () => {
    it('should prevent user from accessing another user\'s cart', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const existingCart = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        total_amount: 50.00,
        item_count: 2,
        currency: 'VND',
        items: []
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(existingCart);

      await expect(cartService.getOrCreateCart(userIdB)).rejects.toThrow(AppError);
      await expect(cartService.getOrCreateCart(userIdB)).rejects.toThrow('Unauthorized access to cart');
    });

    it('should prevent user from adding items to another user\'s cart', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const existingCart = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        total_amount: 50.00,
        item_count: 1,
        currency: 'VND',
        items: []
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(existingCart);

      await expect(
        cartService.addToCart(userIdB, { variant_id: 10, quantity: 2 })
      ).rejects.toThrow(AppError);
    });

    it('should prevent user from updating items in another user\'s cart', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const cartWithItems = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        items: [
          { id: 1, cart_id: 100, variant_id: 5, quantity: 2, unit_price: 25.00, total_price: 50.00 }
        ]
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(cartWithItems);

      await expect(
        cartService.updateCartItem(userIdB, 1, { quantity: 5 })
      ).rejects.toThrow(AppError);
      await expect(
        cartService.updateCartItem(userIdB, 1, { quantity: 5 })
      ).rejects.toThrow('Unauthorized access to cart');
    });

    it('should prevent user from removing items from another user\'s cart', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const cartWithItems = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        items: [
          { id: 1, cart_id: 100, variant_id: 5, quantity: 2 }
        ]
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(cartWithItems);

      await expect(
        cartService.removeCartItem(userIdB, 1)
      ).rejects.toThrow(AppError);
    });

    it('should prevent user from clearing another user\'s cart', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const existingCart = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        total_amount: 100.00,
        item_count: 3,
        items: [
          { id: 1, cart_id: 100, variant_id: 5, quantity: 2 },
          { id: 2, cart_id: 100, variant_id: 7, quantity: 1 }
        ]
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(existingCart);

      await expect(cartService.clearCart(userIdB)).rejects.toThrow(AppError);
      await expect(cartService.clearCart(userIdB)).rejects.toThrow('Unauthorized access to cart');
    });
  });

  describe('Cart ownership validation', () => {
    it('should verify cart belongs to requesting user before any operation', async () => {
      const userId = 1;
      const cart = {
        id: 100,
        user_id: userId,
        status: CartStatus.ACTIVE,
        items: []
      };

      const findOneSpy = jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(cart);

      await cartService.getOrCreateCart(userId);

      expect(findOneSpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything()
      }));
    });

    it('should return 403 FORBIDDEN status when authorization fails', async () => {
      const userIdA = 1;
      const userIdB = 2;
      const existingCart = {
        id: 100,
        user_id: userIdA,
        status: CartStatus.ACTIVE,
        items: []
      };

      jest.spyOn(cartRepository, 'findOne').mockResolvedValueOnce(existingCart);

      try {
        await cartService.getOrCreateCart(userIdB);
        fail('Should have thrown AppError');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.statusCode).toBe(HttpStatusCode.FORBIDDEN);
        }
      }
    });
  });
});
