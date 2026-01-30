import { Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Order } from "@/modules/orders/entity/order";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { OrderStatusHistory } from "@/modules/orders/entity/order-status-history";
import { Cart } from "@/modules/cart/entity/cart";
import { CartItem } from "@/modules/cart/entity/cart-item";
import { CartStatus } from "@/modules/cart/enum/cart.enum";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/modules/orders/enum/order.enum";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { Inventory } from "@/modules/inventory/entity/inventory";

export interface CreateOrderDto {
  cart_id: number;
  shipping_address: {
    street: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  billing_address?: {
    street: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  payment_method: PaymentMethod;
  notes?: string;
}

export interface OrderFilterOptions {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private orderStatusHistoryRepository: Repository<OrderStatusHistory>;
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private inventoryRepository: Repository<Inventory>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.orderStatusHistoryRepository = AppDataSource.getRepository(OrderStatusHistory);
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
  }

  async createOrder(userId: number, data: CreateOrderDto) {
    const { cart_id, shipping_address, billing_address, payment_method, notes } = data;

    const cart = await this.cartRepository.findOne({
      where: { id: cart_id, user_id: userId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.variant', 'items.variant.product']
    });

    if (!cart) {
      throw new AppError(
        'Cart not found or already converted',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CART_NOT_FOUND
      );
    }

    if (!cart.items || cart.items.length === 0) {
      throw new AppError(
        'Cart is empty',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const orderNumber = this.generateOrderNumber();
    const subtotal = Number(cart.total_amount);
    const shippingAmount = 30000;
    const taxAmount = subtotal * 0.1;
    const discountAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

    const order = this.orderRepository.create({
      order_number: orderNumber,
      user_id: userId,
      cart_id: cart_id,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      payment_method: payment_method,
      shipping_address: shipping_address,
      billing_address: billing_address || shipping_address,
      subtotal: subtotal,
      shipping_amount: shippingAmount,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency: 'VND',
      notes: notes
    });

    await this.orderRepository.save(order);

    const orderItems = cart.items.map(cartItem => {
      return this.orderItemRepository.create({
        order_id: order.id,
        variant_id: cartItem.variant_id,
        product_snapshot: {
          product_name: cartItem.variant?.product?.name || '',
          variant_sku: cartItem.variant?.sku || '',
          product_description: cartItem.variant?.product?.description || ''
        },
        quantity: cartItem.quantity,
        unit_price: cartItem.unit_price,
        total_price: cartItem.total_price,
        discount_amount: 0
      });
    });

    await this.orderItemRepository.save(orderItems);

    const statusHistory = this.orderStatusHistoryRepository.create({
      order_id: order.id,
      status: OrderStatus.PENDING,
      notes: 'Order created'
    });
    await this.orderStatusHistoryRepository.save(statusHistory);

    cart.status = CartStatus.CONVERTED;
    await this.cartRepository.save(cart);

    return this.getOrderById(order.id);
  }

  async getOrderById(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
    });

    if (!order) {
      throw new AppError(
        'Order not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.ORDER_NOT_FOUND
      );
    }

    const statusHistory = await this.orderStatusHistoryRepository.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' }
    });

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      subtotal: order.subtotal,
      shipping_amount: order.shipping_amount,
      tax_amount: order.tax_amount,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      currency: order.currency,
      notes: order.notes,
      tracking_number: order.tracking_number,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      created_at: order.created_at,
      items: order.items?.map(item => {
        const variant = item.variant;
        const product = variant?.product;
        const primaryImage = product?.images?.find(img => img.is_primary)?.image_url ||
                            product?.images?.[0]?.image_url || null;

        return {
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_amount: item.discount_amount,
          product_snapshot: item.product_snapshot,
          variant: variant ? {
            id: variant.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            material: variant.material
          } : null,
          product: product ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: primaryImage
          } : null
        };
      }) || [],
      status_history: statusHistory.map(h => ({
        status: h.status,
        previous_status: h.previous_status,
        notes: h.notes,
        changed_by: h.changed_by,
        created_at: h.created_at
      }))
    };
  }

  async getUserOrders(userId: number, options: OrderFilterOptions = {}) {
    const { status, payment_status, page = 1, limit = 10 } = options;

    let queryBuilder = this.orderRepository.createQueryBuilder('order')
      .where('order.user_id = :userId', { userId })
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('order.created_at', 'DESC');

    if (status) {
      queryBuilder = queryBuilder.andWhere('order.status = :status', { status });
    }

    if (payment_status) {
      queryBuilder = queryBuilder.andWhere('order.payment_status = :payment_status', { payment_status });
    }

    const total = await queryBuilder.getCount();

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const orders = await queryBuilder.getMany();

    return {
      data: orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        currency: order.currency,
        created_at: order.created_at,
        item_count: order.items?.length || 0
      })),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async cancelOrder(userId: number, orderId: number, reason?: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId }
    });

    if (!order) {
      throw new AppError(
        'Order not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.ORDER_NOT_FOUND
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError(
        'Order is already cancelled',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new AppError(
        'Cannot cancel order that has been shipped or delivered',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const previousStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    const statusHistory = this.orderStatusHistoryRepository.create({
      order_id: order.id,
      status: OrderStatus.CANCELLED,
      previous_status: previousStatus,
      notes: reason || 'Order cancelled by customer'
    });
    await this.orderStatusHistoryRepository.save(statusHistory);

    return {
      message: 'Order cancelled successfully',
      order_id: order.id
    };
  }

  private generateOrderNumber(): string {
    const prefix = 'ORD';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${year}-${random}`;
  }
}

export default new OrderService();
