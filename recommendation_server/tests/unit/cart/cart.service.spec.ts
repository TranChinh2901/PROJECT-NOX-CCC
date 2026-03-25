import 'reflect-metadata';
import { CartService } from '../../../src/modules/cart/cart.service';
import { AppDataSource } from '../../../src/config/database.config';
import { Cart } from '../../../src/modules/cart/entity/cart';
import { CartItem } from '../../../src/modules/cart/entity/cart-item';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';
import { CartStatus } from '../../../src/modules/cart/enum/cart.enum';
import { AppError } from '../../../src/common/error.response';
import { HttpStatusCode } from '../../../src/constants/status-code';
import { ErrorCode } from '../../../src/constants/error-code';
import {
  createMockCart,
  createMockCartItem,
  createMockProduct,
  createMockProductVariant,
} from '../../helpers/mock-factory';
import { createMockRepository } from '../../setup/repository.mock';

type CartServicePrivates = {
  recalculateCartTotals: (cartId: number) => Promise<void>;
  validateAndClaimCartAccess: (cart: Cart, userId: number) => Promise<void>;
  formatCartResponse: (cart: Cart) => CartResponse;
};

type CartResponse = Awaited<ReturnType<CartService['getCart']>>;

const setCartUserId = (cart: Cart, userId: number | null | undefined) => {
  (cart as unknown as { user_id: number | null | undefined }).user_id = userId;
  return cart;
};

const createAnonymousCart = (overrides?: Partial<Cart>) =>
  setCartUserId(createMockCart({ ...overrides }), null);

const createCartResponse = (cart: Cart, items: CartResponse['items'] = []): CartResponse => ({
  id: cart.id,
  status: cart.status,
  total_amount: cart.total_amount,
  item_count: cart.item_count,
  currency: cart.currency,
  items,
});

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('CartService', () => {
  let service: CartService;
  let servicePrivates: CartServicePrivates;
  let cartRepository: ReturnType<typeof createMockRepository>;
  let cartItemRepository: ReturnType<typeof createMockRepository>;
  let variantRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    cartRepository = createMockRepository<Cart>();
    cartItemRepository = createMockRepository<CartItem>();
    variantRepository = createMockRepository<ProductVariant>();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: unknown) => {
      if (entity === Cart) return cartRepository;
      if (entity === CartItem) return cartItemRepository;
      if (entity === ProductVariant) return variantRepository;
      return null;
    });

    service = new CartService();
    servicePrivates = service as unknown as CartServicePrivates;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should create new cart when none exists', async () => {
      const userId = 10;
      const newCart = createMockCart({ id: 100, user_id: userId, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(null);
      cartRepository.create.mockReturnValueOnce(newCart);
      cartRepository.save.mockResolvedValueOnce(newCart);

      const result = await service.getOrCreateCart(userId);

      expect(cartRepository.create).toHaveBeenCalledTimes(1);
      expect(cartRepository.save).toHaveBeenCalledWith(newCart);
      expect(result).toMatchObject({
        id: newCart.id,
        status: CartStatus.ACTIVE,
      });
    });

    it('should return existing cart when cart found by user_id', async () => {
      const userId = 11;
      const existingCart = createMockCart({ id: 101, user_id: userId, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(existingCart);

      const result = await service.getOrCreateCart(userId);

      expect(cartRepository.create).not.toHaveBeenCalled();
      expect(result.id).toBe(existingCart.id);
    });

    it('should return existing cart when cart found by guest_token', async () => {
      const userId = 12;
      const guestToken = 'guest-token-222';
      const existingCart = createMockCart({
        id: 102,
        user_id: userId,
        guest_token: guestToken,
        items: [],
      });

      cartRepository.findOne.mockResolvedValueOnce(existingCart);

      const result = await service.getOrCreateCart(userId, guestToken);
      const whereConditions = cartRepository.findOne.mock.calls[0][0].where;

      expect(whereConditions).toEqual(
        expect.arrayContaining([
          { user_id: userId, status: CartStatus.ACTIVE },
          { guest_token: guestToken, status: CartStatus.ACTIVE },
        ])
      );
      expect(result.id).toBe(existingCart.id);
    });

    it('should claim anonymous cart when user_id is null', async () => {
      const userId = 13;
      const anonymousCart = createAnonymousCart({ id: 103, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(anonymousCart);
      cartRepository.save.mockResolvedValueOnce(anonymousCart);

      await service.getOrCreateCart(userId);

      expect(anonymousCart.user_id).toBe(userId);
      expect(cartRepository.save).toHaveBeenCalledWith(anonymousCart);
    });

    it('should throw FORBIDDEN when cart belongs to another user', async () => {
      const userId = 14;
      const otherCart = createMockCart({ id: 104, user_id: userId + 1, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(otherCart);

      await expect(service.getOrCreateCart(userId)).rejects.toMatchObject({
        statusCode: HttpStatusCode.FORBIDDEN,
        errorCode: ErrorCode.FORBIDDEN,
      });
    });

    it('should load items relation when fetching cart', async () => {
      const userId = 15;
      const existingCart = createMockCart({ id: 105, user_id: userId, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(existingCart);

      await service.getOrCreateCart(userId);

      expect(cartRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images'],
        })
      );
    });

    it('should initialize cart with defaults when creating a new cart', async () => {
      const userId = 16;

      cartRepository.findOne.mockResolvedValueOnce(null);
      cartRepository.create.mockImplementation((data: Cart) => ({
        ...createMockCart({ id: 106, items: [] }),
        ...data,
      }));

      await service.getOrCreateCart(userId);

      expect(cartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          status: CartStatus.ACTIVE,
          total_amount: 0,
          item_count: 0,
          currency: 'VND',
        })
      );
    });

    it('should ignore guestToken when guestToken is undefined', async () => {
      const userId = 17;
      const existingCart = createMockCart({ id: 107, user_id: userId, items: [] });

      cartRepository.findOne.mockResolvedValueOnce(existingCart);

      await service.getOrCreateCart(userId, undefined);

      const whereConditions = cartRepository.findOne.mock.calls[0][0].where;
      expect(whereConditions).toHaveLength(1);
      expect(whereConditions[0]).toEqual({ user_id: userId, status: CartStatus.ACTIVE });
    });
  });

  describe('addToCart', () => {
    it('should reject quantity <= 0 when adding to cart', async () => {
      const userId = 20;

      await expect(
        service.addToCart(userId, { variant_id: 1, quantity: 0 })
      ).rejects.toMatchObject({
        statusCode: HttpStatusCode.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('should throw NOT_FOUND when variant is inactive', async () => {
      const userId = 21;

      variantRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.addToCart(userId, { variant_id: 2, quantity: 1 })
      ).rejects.toMatchObject({
        statusCode: HttpStatusCode.NOT_FOUND,
        errorCode: ErrorCode.PRODUCT_NOT_FOUND,
      });
    });

    it('should create new cart when no active cart exists', async () => {
      const userId = 22;
      const variant = createMockProductVariant({ id: 201, final_price: 199.5 });
      const newCart = createMockCart({ id: 301, user_id: userId, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(null);
      cartRepository.create.mockReturnValueOnce(newCart);
      cartRepository.save.mockResolvedValueOnce(newCart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: newCart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(newCart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 2 });

      expect(cartRepository.create).toHaveBeenCalledTimes(1);
      expect(cartRepository.save).toHaveBeenCalledWith(newCart);
    });

    it('should increment existing item quantity when item already exists', async () => {
      const userId = 23;
      const variant = createMockProductVariant({ id: 202, final_price: 25 });
      const existingItem = createMockCartItem({
        id: 401,
        variant_id: variant.id,
        quantity: 1,
        unit_price: 25,
        total_price: 25,
      });
      const cart = createMockCart({ id: 302, user_id: userId, items: [existingItem] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 2 });

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingItem.id,
          quantity: 3,
          total_price: 75,
        })
      );
    });

    it('should add new item to cart when item does not exist', async () => {
      const userId = 24;
      const variant = createMockProductVariant({ id: 203, final_price: 40 });
      const cart = createMockCart({ id: 303, user_id: userId, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: cart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 2 });

      expect(cartItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cart_id: cart.id,
          variant_id: variant.id,
          quantity: 2,
          unit_price: variant.final_price,
          total_price: variant.final_price * 2,
        })
      );
    });

    it('should calculate total_price as unit_price times quantity when adding to cart', async () => {
      const userId = 25;
      const variant = createMockProductVariant({ id: 204, final_price: 55 });
      const cart = createMockCart({ id: 304, user_id: userId, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: cart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 3 });

      const createdPayload = cartItemRepository.create.mock.calls[0][0];
      expect(createdPayload.total_price).toBe(variant.final_price * 3);
    });

    it('should maintain decimal precision when adding to cart', async () => {
      const userId = 26;
      const variant = createMockProductVariant({ id: 205, final_price: 19.99 });
      const cart = createMockCart({ id: 305, user_id: userId, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: cart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 3 });

      const createdPayload = cartItemRepository.create.mock.calls[0][0];
      expect(createdPayload.total_price).toBeCloseTo(59.97, 2);
    });

    it('should call recalculateCartTotals when cart changes', async () => {
      const userId = 27;
      const variant = createMockProductVariant({ id: 206, final_price: 30 });
      const cart = createMockCart({ id: 306, user_id: userId, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: cart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      const recalcSpy = jest
        .spyOn(servicePrivates, 'recalculateCartTotals')
        .mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 1 });

      expect(recalcSpy).toHaveBeenCalledWith(cart.id);
    });

    it('should claim anonymous cart when adding to cart', async () => {
      const userId = 28;
      const variant = createMockProductVariant({ id: 207, final_price: 75 });
      const cart = createAnonymousCart({ id: 307, items: [] });

      variantRepository.findOne.mockResolvedValueOnce(variant);
      cartRepository.findOne.mockResolvedValueOnce(cart);
      cartRepository.save.mockResolvedValueOnce(cart);
      cartItemRepository.create.mockReturnValueOnce(
        createMockCartItem({ cart_id: cart.id, variant_id: variant.id })
      );

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.addToCart(userId, { variant_id: variant.id, quantity: 1 });

      expect(cart.user_id).toBe(userId);
      expect(cartRepository.save).toHaveBeenCalledWith(cart);
    });

    it.skip('should validate inventory stock when adding to cart', async () => {
      const userId = 29;
      const variant = createMockProductVariant({ id: 208, final_price: 100 });

      variantRepository.findOne.mockResolvedValueOnce(variant);

      await expect(
        service.addToCart(userId, { variant_id: variant.id, quantity: 999 })
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('updateCartItem', () => {
    it('should reject quantity <= 0 when updating cart item', async () => {
      const userId = 30;

      await expect(
        service.updateCartItem(userId, 1, { quantity: 0 })
      ).rejects.toMatchObject({
        statusCode: HttpStatusCode.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('should throw NOT_FOUND when cart item does not exist', async () => {
      const userId = 31;

      cartItemRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateCartItem(userId, 999, { quantity: 2 })
      ).rejects.toMatchObject({
        statusCode: HttpStatusCode.NOT_FOUND,
        errorCode: ErrorCode.CART_ITEM_NOT_FOUND,
      });
    });

    it('should call validateAndClaimCartAccess when updating cart item', async () => {
      const userId = 32;
      const cart = createMockCart({ id: 401, user_id: userId, items: [] });
      const cartItem = createMockCartItem({
        id: 501,
        cart_id: cart.id,
        variant_id: 1,
        quantity: 1,
        unit_price: 10,
        total_price: 10,
        cart,
      });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      const accessSpy = jest
        .spyOn(servicePrivates, 'validateAndClaimCartAccess')
        .mockResolvedValueOnce(undefined);
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.updateCartItem(userId, cartItem.id, { quantity: 2 });

      expect(accessSpy).toHaveBeenCalledWith(cart, userId);
    });

    it('should update quantity and total_price when updating cart item', async () => {
      const userId = 33;
      const cart = createMockCart({ id: 402, user_id: userId, items: [] });
      const cartItem = createMockCartItem({
        id: 502,
        cart_id: cart.id,
        quantity: 2,
        unit_price: 12.5,
        total_price: 25,
        cart,
      });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'validateAndClaimCartAccess').mockResolvedValueOnce(undefined);
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.updateCartItem(userId, cartItem.id, { quantity: 4 });

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: cartItem.id,
          quantity: 4,
          total_price: 50,
        })
      );
    });

    it('should call recalculateCartTotals when updating cart item', async () => {
      const userId = 34;
      const cart = createMockCart({ id: 403, user_id: userId, items: [] });
      const cartItem = createMockCartItem({
        id: 503,
        cart_id: cart.id,
        quantity: 2,
        unit_price: 15,
        total_price: 30,
        cart,
      });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'validateAndClaimCartAccess').mockResolvedValueOnce(undefined);
      const recalcSpy = jest
        .spyOn(servicePrivates, 'recalculateCartTotals')
        .mockResolvedValueOnce(undefined);

      await service.updateCartItem(userId, cartItem.id, { quantity: 3 });

      expect(recalcSpy).toHaveBeenCalledWith(cart.id);
    });

    it.skip('should validate inventory when updating cart item', async () => {
      const userId = 35;

      await expect(
        service.updateCartItem(userId, 1, { quantity: 999 })
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('removeCartItem', () => {
    it('should throw NOT_FOUND when cart item does not exist', async () => {
      const userId = 40;

      cartItemRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.removeCartItem(userId, 1)).rejects.toMatchObject({
        statusCode: HttpStatusCode.NOT_FOUND,
        errorCode: ErrorCode.CART_ITEM_NOT_FOUND,
      });
    });

    it('should call validateAndClaimCartAccess when removing item', async () => {
      const userId = 41;
      const cart = createMockCart({ id: 501, user_id: userId, items: [] });
      const cartItem = createMockCartItem({ id: 601, cart_id: cart.id, cart });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      const accessSpy = jest
        .spyOn(servicePrivates, 'validateAndClaimCartAccess')
        .mockResolvedValueOnce(undefined);
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.removeCartItem(userId, cartItem.id);

      expect(accessSpy).toHaveBeenCalledWith(cart, userId);
    });

    it('should remove the item when requested', async () => {
      const userId = 42;
      const cart = createMockCart({ id: 502, user_id: userId, items: [] });
      const cartItem = createMockCartItem({ id: 602, cart_id: cart.id, cart });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'validateAndClaimCartAccess').mockResolvedValueOnce(undefined);
      jest.spyOn(servicePrivates, 'recalculateCartTotals').mockResolvedValueOnce(undefined);

      await service.removeCartItem(userId, cartItem.id);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(cartItem);
    });

    it('should recalculate totals when removing item', async () => {
      const userId = 43;
      const cart = createMockCart({ id: 503, user_id: userId, items: [] });
      const cartItem = createMockCartItem({ id: 603, cart_id: cart.id, cart });

      cartItemRepository.findOne.mockResolvedValueOnce(cartItem);

      jest.spyOn(service, 'getCart').mockResolvedValue(createCartResponse(cart));
      jest.spyOn(servicePrivates, 'validateAndClaimCartAccess').mockResolvedValueOnce(undefined);
      const recalcSpy = jest
        .spyOn(servicePrivates, 'recalculateCartTotals')
        .mockResolvedValueOnce(undefined);

      await service.removeCartItem(userId, cartItem.id);

      expect(recalcSpy).toHaveBeenCalledWith(cart.id);
    });
  });

  describe('clearCart', () => {
    it('should return message when cart does not exist', async () => {
      const userId = 50;

      cartRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.clearCart(userId);

      expect(result).toEqual({ message: 'Cart is already empty' });
    });

    it('should remove all items when cart has items', async () => {
      const userId = 51;
      const cartItems = [createMockCartItem({ id: 701 }), createMockCartItem({ id: 702 })];
      const cart = createMockCart({ id: 601, user_id: userId, items: cartItems });

      cartRepository.findOne.mockResolvedValueOnce(cart);

      await service.clearCart(userId);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(cartItems);
    });

    it('should set totals to 0 when clearing cart', async () => {
      const userId = 52;
      const cart = createMockCart({
        id: 602,
        user_id: userId,
        total_amount: 999,
        item_count: 5,
        items: [],
      });

      cartRepository.findOne.mockResolvedValueOnce(cart);

      await service.clearCart(userId);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amount: 0,
          item_count: 0,
        })
      );
    });
  });

  describe('recalculateCartTotals', () => {
    it('should sum total_prices correctly when recalculating totals', async () => {
      const cartId = 700;
      const items = [
        createMockCartItem({ cart_id: cartId, total_price: 19.5, quantity: 1 }),
        createMockCartItem({ cart_id: cartId, total_price: 30.25, quantity: 2 }),
      ];

      cartItemRepository.find.mockResolvedValueOnce(items);

      await servicePrivates.recalculateCartTotals(cartId);

      expect(cartRepository.update).toHaveBeenCalledWith(cartId, {
        total_amount: 49.75,
        item_count: 3,
      });
    });

    it('should count quantities correctly when recalculating totals', async () => {
      const cartId = 701;
      const items = [
        createMockCartItem({ cart_id: cartId, total_price: 10, quantity: 4 }),
        createMockCartItem({ cart_id: cartId, total_price: 15, quantity: 1 }),
      ];

      cartItemRepository.find.mockResolvedValueOnce(items);

      await servicePrivates.recalculateCartTotals(cartId);

      expect(cartRepository.update).toHaveBeenCalledWith(cartId, {
        total_amount: 25,
        item_count: 5,
      });
    });

    it('should handle empty cart when recalculating totals', async () => {
      const cartId = 702;

      cartItemRepository.find.mockResolvedValueOnce([]);

      await servicePrivates.recalculateCartTotals(cartId);

      expect(cartRepository.update).toHaveBeenCalledWith(cartId, {
        total_amount: 0,
        item_count: 0,
      });
    });

    it('should maintain decimal precision when recalculating totals', async () => {
      const cartId = 703;
      const items = [
        createMockCartItem({ cart_id: cartId, total_price: 19.99, quantity: 1 }),
        createMockCartItem({ cart_id: cartId, total_price: 9.98, quantity: 2 }),
      ];

      cartItemRepository.find.mockResolvedValueOnce(items);

      await servicePrivates.recalculateCartTotals(cartId);

      const updatePayload = cartRepository.update.mock.calls[0][1];
      expect(updatePayload.total_amount).toBeCloseTo(29.97, 2);
    });
  });

  describe('validateAndClaimCartAccess', () => {
    it('should claim cart when user_id is null', async () => {
      const userId = 60;
      const cart = createAnonymousCart({ id: 801 }) as Cart;

      cartRepository.save.mockResolvedValueOnce(cart);

      await servicePrivates.validateAndClaimCartAccess(cart, userId);

      expect(cart.user_id).toBe(userId);
    });

    it('should save cart after claiming anonymous cart', async () => {
      const userId = 61;
      const cart = createMockCart({ id: 802, user_id: undefined });

      cartRepository.save.mockResolvedValueOnce(cart);

      await servicePrivates.validateAndClaimCartAccess(cart, userId);

      expect(cartRepository.save).toHaveBeenCalledWith(cart);
    });

    it('should allow access when user_id matches', async () => {
      const userId = 62;
      const cart = createMockCart({ id: 803, user_id: userId });

      await expect(
        servicePrivates.validateAndClaimCartAccess(cart, userId)
      ).resolves.toBeUndefined();
    });

    it('should throw FORBIDDEN when user_id mismatch', async () => {
      const cart = createMockCart({ id: 804, user_id: 999 });

      await expect(
        servicePrivates.validateAndClaimCartAccess(cart, 63)
      ).rejects.toMatchObject({
        statusCode: HttpStatusCode.FORBIDDEN,
        errorCode: ErrorCode.FORBIDDEN,
      });
    });

    it('should not save when cart already owned by user', async () => {
      const userId = 64;
      const cart = createMockCart({ id: 805, user_id: userId });

      await servicePrivates.validateAndClaimCartAccess(cart, userId);

      expect(cartRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('formatCartResponse', () => {
    it('should format cart with items when items exist', () => {
      const product = createMockProduct({ id: 901, name: 'Test Product' });
      product.images = [
        { image_url: 'secondary.jpg', is_primary: false } as never,
        { image_url: 'primary.jpg', is_primary: true } as never,
      ];
      const variant = createMockProductVariant({ id: 901, product });
      const cartItem = createMockCartItem({ id: 1001, variant_id: variant.id, variant });
      const cart = createMockCart({ id: 901, items: [cartItem] });

      const result = servicePrivates.formatCartResponse(cart);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: cartItem.id,
        variant: { id: variant.id },
        product: { id: product.id },
      });
    });

    it('should extract primary image when available', () => {
      const product = createMockProduct({ id: 902, name: 'Image Product' });
      product.images = [
        { image_url: 'fallback.jpg', is_primary: false } as never,
        { image_url: 'primary.jpg', is_primary: true } as never,
      ];
      const variant = createMockProductVariant({ id: 902, product });
      const cartItem = createMockCartItem({ id: 1002, variant_id: variant.id, variant });
      const cart = createMockCart({ id: 902, items: [cartItem] });

      const result = servicePrivates.formatCartResponse(cart);

      expect(result.items[0].product?.primary_image).toBe('primary.jpg');
    });

    it('should handle cart without items when items are undefined', () => {
      const cart = createMockCart({ id: 903, items: undefined });

      const result = servicePrivates.formatCartResponse(cart);

      expect(result.items).toEqual([]);
    });
  });
});
