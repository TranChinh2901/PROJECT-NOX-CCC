import { Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Cart } from "@/modules/cart/entity/cart";
import { CartItem } from "@/modules/cart/entity/cart-item";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { CartStatus } from "@/modules/cart/enum/cart.enum";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";

export interface AddToCartDto {
  variant_id: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export class CartService {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private variantRepository: Repository<ProductVariant>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.variantRepository = AppDataSource.getRepository(ProductVariant);
  }

  async getOrCreateCart(userId: number, sessionId?: number) {
    let cart = await this.cartRepository.findOne({
      where: [
        { user_id: userId, status: CartStatus.ACTIVE },
        { session_id: sessionId, status: CartStatus.ACTIVE }
      ],
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user_id: userId,
        session_id: sessionId,
        status: CartStatus.ACTIVE,
        total_amount: 0,
        item_count: 0,
        currency: 'VND'
      });
      await this.cartRepository.save(cart);
    }

    return this.formatCartResponse(cart);
  }

  async addToCart(userId: number, data: AddToCartDto, sessionId?: number) {
    const { variant_id, quantity } = data;

    if (quantity <= 0) {
      throw new AppError(
        'Quantity must be greater than 0',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const variant = await this.variantRepository.findOne({
      where: { id: variant_id, is_active: true },
      relations: ['product']
    });

    if (!variant) {
      throw new AppError(
        'Product variant not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    let cart = await this.cartRepository.findOne({
      where: [
        { user_id: userId, status: CartStatus.ACTIVE },
        { session_id: sessionId, status: CartStatus.ACTIVE }
      ],
      relations: ['items', 'items.variant']
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user_id: userId,
        session_id: sessionId,
        status: CartStatus.ACTIVE,
        total_amount: 0,
        item_count: 0,
        currency: 'VND'
      });
      await this.cartRepository.save(cart);
    }

    const existingItem = cart.items?.find(item => item.variant_id === variant_id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total_price = Number(existingItem.unit_price) * existingItem.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart_id: cart.id,
        variant_id: variant_id,
        quantity: quantity,
        unit_price: variant.final_price,
        total_price: Number(variant.final_price) * quantity,
        added_at: new Date()
      });
      await this.cartItemRepository.save(cartItem);
    }

    await this.recalculateCartTotals(cart.id);

    return this.getCart(cart.id);
  }

  async updateCartItem(userId: number, itemId: number, data: UpdateCartItemDto) {
    const { quantity } = data;

    if (quantity <= 0) {
      throw new AppError(
        'Quantity must be greater than 0',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'variant']
    });

    if (!cartItem) {
      throw new AppError(
        'Cart item not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CART_ITEM_NOT_FOUND
      );
    }

    if (cartItem.cart.user_id !== userId) {
      throw new AppError(
        'Unauthorized access to cart item',
        HttpStatusCode.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }

    cartItem.quantity = quantity;
    cartItem.total_price = Number(cartItem.unit_price) * quantity;
    await this.cartItemRepository.save(cartItem);

    await this.recalculateCartTotals(cartItem.cart_id);

    return this.getCart(cartItem.cart_id);
  }

  async removeCartItem(userId: number, itemId: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart']
    });

    if (!cartItem) {
      throw new AppError(
        'Cart item not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CART_ITEM_NOT_FOUND
      );
    }

    if (cartItem.cart.user_id !== userId) {
      throw new AppError(
        'Unauthorized access to cart item',
        HttpStatusCode.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }

    await this.cartItemRepository.remove(cartItem);
    await this.recalculateCartTotals(cartItem.cart_id);

    return this.getCart(cartItem.cart_id);
  }

  async getCart(cartId: number) {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
    });

    if (!cart) {
      throw new AppError(
        'Cart not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CART_NOT_FOUND
      );
    }

    return this.formatCartResponse(cart);
  }

  async clearCart(userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId, status: CartStatus.ACTIVE },
      relations: ['items']
    });

    if (!cart) {
      return { message: 'Cart is already empty' };
    }

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    cart.total_amount = 0;
    cart.item_count = 0;
    await this.cartRepository.save(cart);

    return { message: 'Cart cleared successfully' };
  }

  private async recalculateCartTotals(cartId: number) {
    const cartItems = await this.cartItemRepository.find({
      where: { cart_id: cartId }
    });

    const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    await this.cartRepository.update(cartId, {
      total_amount: totalAmount,
      item_count: itemCount
    });
  }

  private formatCartResponse(cart: Cart) {
    return {
      id: cart.id,
      status: cart.status,
      total_amount: cart.total_amount,
      item_count: cart.item_count,
      currency: cart.currency,
      items: cart.items?.map(item => {
        const variant = item.variant;
        const product = variant?.product;
        const primaryImage = product?.images?.find(img => img.is_primary)?.image_url ||
                            product?.images?.[0]?.image_url || null;

        return {
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          added_at: item.added_at,
          variant: variant ? {
            id: variant.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            color_code: variant.color_code,
            material: variant.material,
            final_price: variant.final_price
          } : null,
          product: product ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: primaryImage
          } : null
        };
      }) || []
    };
  }
}

export default new CartService();
