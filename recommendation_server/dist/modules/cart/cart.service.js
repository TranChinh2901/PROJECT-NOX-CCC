"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const database_config_1 = require("@/config/database.config");
const cart_1 = require("@/modules/cart/entity/cart");
const cart_item_1 = require("@/modules/cart/entity/cart-item");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const cart_enum_1 = require("@/modules/cart/enum/cart.enum");
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
class CartService {
    cartRepository;
    cartItemRepository;
    variantRepository;
    constructor() {
        this.cartRepository = database_config_1.AppDataSource.getRepository(cart_1.Cart);
        this.cartItemRepository = database_config_1.AppDataSource.getRepository(cart_item_1.CartItem);
        this.variantRepository = database_config_1.AppDataSource.getRepository(product_variant_1.ProductVariant);
    }
    async getOrCreateCart(userId, sessionId) {
        let cart = await this.cartRepository.findOne({
            where: [
                { user_id: userId, status: cart_enum_1.CartStatus.ACTIVE },
                { session_id: sessionId, status: cart_enum_1.CartStatus.ACTIVE }
            ],
            relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
        });
        if (!cart) {
            cart = this.cartRepository.create({
                user_id: userId,
                session_id: sessionId,
                status: cart_enum_1.CartStatus.ACTIVE,
                total_amount: 0,
                item_count: 0,
                currency: 'VND'
            });
            await this.cartRepository.save(cart);
        }
        return this.formatCartResponse(cart);
    }
    async addToCart(userId, data, sessionId) {
        const { variant_id, quantity } = data;
        if (quantity <= 0) {
            throw new error_response_1.AppError('Quantity must be greater than 0', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        const variant = await this.variantRepository.findOne({
            where: { id: variant_id, is_active: true },
            relations: ['product']
        });
        if (!variant) {
            throw new error_response_1.AppError('Product variant not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        let cart = await this.cartRepository.findOne({
            where: [
                { user_id: userId, status: cart_enum_1.CartStatus.ACTIVE },
                { session_id: sessionId, status: cart_enum_1.CartStatus.ACTIVE }
            ],
            relations: ['items', 'items.variant']
        });
        if (!cart) {
            cart = this.cartRepository.create({
                user_id: userId,
                session_id: sessionId,
                status: cart_enum_1.CartStatus.ACTIVE,
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
        }
        else {
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
    async updateCartItem(userId, itemId, data) {
        const { quantity } = data;
        if (quantity <= 0) {
            throw new error_response_1.AppError('Quantity must be greater than 0', status_code_1.HttpStatusCode.BAD_REQUEST, error_code_1.ErrorCode.VALIDATION_ERROR);
        }
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: itemId },
            relations: ['cart', 'variant']
        });
        if (!cartItem) {
            throw new error_response_1.AppError('Cart item not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        if (cartItem.cart.user_id !== userId) {
            throw new error_response_1.AppError('Unauthorized access to cart item', status_code_1.HttpStatusCode.FORBIDDEN, error_code_1.ErrorCode.FORBIDDEN);
        }
        cartItem.quantity = quantity;
        cartItem.total_price = Number(cartItem.unit_price) * quantity;
        await this.cartItemRepository.save(cartItem);
        await this.recalculateCartTotals(cartItem.cart_id);
        return this.getCart(cartItem.cart_id);
    }
    async removeCartItem(userId, itemId) {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: itemId },
            relations: ['cart']
        });
        if (!cartItem) {
            throw new error_response_1.AppError('Cart item not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        if (cartItem.cart.user_id !== userId) {
            throw new error_response_1.AppError('Unauthorized access to cart item', status_code_1.HttpStatusCode.FORBIDDEN, error_code_1.ErrorCode.FORBIDDEN);
        }
        await this.cartItemRepository.remove(cartItem);
        await this.recalculateCartTotals(cartItem.cart_id);
        return this.getCart(cartItem.cart_id);
    }
    async getCart(cartId) {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
        });
        if (!cart) {
            throw new error_response_1.AppError('Cart not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        return this.formatCartResponse(cart);
    }
    async clearCart(userId) {
        const cart = await this.cartRepository.findOne({
            where: { user_id: userId, status: cart_enum_1.CartStatus.ACTIVE },
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
    async recalculateCartTotals(cartId) {
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
    formatCartResponse(cart) {
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
exports.CartService = CartService;
exports.default = new CartService();
