import { EntityManager, Repository } from "typeorm";
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
    const orderId = await AppDataSource.transaction(async manager => {
      const cart = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .setLock('pessimistic_write')
        .where('cart.id = :cartId', { cartId: cart_id })
        .andWhere('cart.user_id = :userId', { userId })
        .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
        .getOne();

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

      const reservations: Array<{ cartItem: CartItem; inventory: Inventory }> = [];
      for (const cartItem of cart.items) {
        const inventory = await this.reserveInventory(manager, cartItem.variant_id, cartItem.quantity);
        reservations.push({ cartItem, inventory });
      }

      const order = manager.getRepository(Order).create({
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
        notes: notes,
      });

      await manager.save(order);

      const orderItems = reservations.map(({ cartItem, inventory }) =>
        manager.getRepository(OrderItem).create({
          order_id: order.id,
          variant_id: cartItem.variant_id,
          warehouse_id: inventory.warehouse_id,
          product_snapshot: {
            product_name: cartItem.variant?.product?.name || '',
            variant_sku: cartItem.variant?.sku || '',
            product_description: cartItem.variant?.product?.description || '',
            warehouse_id: inventory.warehouse_id,
          },
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price,
          total_price: cartItem.total_price,
          discount_amount: 0,
        })
      );

      await manager.save(orderItems);

      const statusHistory = manager.getRepository(OrderStatusHistory).create({
        order_id: order.id,
        status: OrderStatus.PENDING,
        notes: 'Order created',
      });
      await manager.save(statusHistory);

      cart.status = CartStatus.CONVERTED;
      await manager.save(cart);

      return order.id;
    });

    return this.getOrderById(orderId);
  }

  async getOrderById(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images', 'items.warehouse']
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
          warehouse_id: item.warehouse_id,
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
    return AppDataSource.transaction(async manager => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .setLock('pessimistic_write')
        .where('order.id = :orderId', { orderId })
        .andWhere('order.user_id = :userId', { userId })
        .getOne();

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

      for (const item of order.items || []) {
        await this.restoreInventoryForOrderItem(manager, item);
      }

      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      const statusHistory = manager.getRepository(OrderStatusHistory).create({
        order_id: order.id,
        status: OrderStatus.CANCELLED,
        previous_status: previousStatus,
        notes: reason || 'Order cancelled by customer',
      });
      await manager.save(statusHistory);

      return {
        message: 'Order cancelled successfully',
        order_id: order.id,
      };
    });
  }

  private generateOrderNumber(): string {
    const prefix = 'ORD';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${year}-${random}`;
  }

  private async reserveInventory(manager: EntityManager, variantId: number, quantity: number): Promise<Inventory> {
    const inventory = await manager
      .getRepository(Inventory)
      .createQueryBuilder('inventory')
      .leftJoin('inventory.warehouse', 'warehouse')
      .setLock('pessimistic_write')
      .where('inventory.variant_id = :variantId', { variantId })
      .andWhere('inventory.quantity_available >= :quantity', { quantity })
      .orderBy('warehouse.is_default', 'DESC')
      .addOrderBy('inventory.quantity_available', 'DESC')
      .addOrderBy('inventory.id', 'ASC')
      .getOne();

    if (!inventory) {
      throw new AppError(
        'Insufficient stock for one or more cart items',
        HttpStatusCode.CONFLICT,
        ErrorCode.INSUFFICIENT_STOCK
      );
    }

    const result = await manager
      .createQueryBuilder()
      .update(Inventory)
      .set({
        quantity_available: () => 'quantity_available - :quantity',
        quantity_reserved: () => 'quantity_reserved + :quantity',
      })
      .where('id = :inventoryId', { inventoryId: inventory.id })
      .andWhere('quantity_available >= :quantity')
      .setParameters({ quantity })
      .execute();

    if (result.affected !== 1) {
      throw new AppError(
        'Unable to reserve inventory for the requested cart items',
        HttpStatusCode.CONFLICT,
        ErrorCode.INSUFFICIENT_STOCK
      );
    }

    return inventory;
  }

  private async restoreInventoryForOrderItem(manager: EntityManager, orderItem: OrderItem): Promise<void> {
    const inventory = await this.resolveInventoryForOrderItem(manager, orderItem);

    const result = await manager
      .createQueryBuilder()
      .update(Inventory)
      .set({
        quantity_available: () => 'quantity_available + :quantity',
        quantity_reserved: () => 'quantity_reserved - :quantity',
      })
      .where('id = :inventoryId', { inventoryId: inventory.id })
      .andWhere('quantity_reserved >= :quantity')
      .setParameters({ quantity: orderItem.quantity })
      .execute();

    if (result.affected !== 1) {
      throw new AppError(
        'Inventory reservation state is inconsistent for this order item',
        HttpStatusCode.CONFLICT,
        ErrorCode.CONFLICT
      );
    }
  }

  private async resolveInventoryForOrderItem(manager: EntityManager, orderItem: OrderItem): Promise<Inventory> {
    if (orderItem.warehouse_id) {
      const inventory = await manager
        .getRepository(Inventory)
        .createQueryBuilder('inventory')
        .setLock('pessimistic_write')
        .where('inventory.variant_id = :variantId', { variantId: orderItem.variant_id })
        .andWhere('inventory.warehouse_id = :warehouseId', { warehouseId: orderItem.warehouse_id })
        .getOne();

      if (!inventory) {
        throw new AppError(
          'Inventory record not found for this order item',
          HttpStatusCode.CONFLICT,
          ErrorCode.CONFLICT
        );
      }

      return inventory;
    }

    const inventories = await manager
      .getRepository(Inventory)
      .createQueryBuilder('inventory')
      .setLock('pessimistic_write')
      .where('inventory.variant_id = :variantId', { variantId: orderItem.variant_id })
      .getMany();

    if (inventories.length === 1) {
      return inventories[0];
    }

    throw new AppError(
      'Order item is missing warehouse attribution and cannot be restored safely',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export default new OrderService();
