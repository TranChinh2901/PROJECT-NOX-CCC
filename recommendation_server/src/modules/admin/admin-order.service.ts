import { Repository, DataSource, IsNull, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Order } from "@/modules/orders/entity/order";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { OrderStatusHistory } from "@/modules/orders/entity/order-status-history";
import { Inventory } from "@/modules/inventory/entity/inventory";
import { OrderStatus, PaymentStatus } from "@/modules/orders/enum/order.enum";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { OrderFilterQueryDto, UpdateOrderStatusDto, AddInternalNoteDto } from "@/modules/admin/dto/order.dto";

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class AdminOrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private orderStatusHistoryRepository: Repository<OrderStatusHistory>;
  private inventoryRepository: Repository<Inventory>;
  private dataSource: DataSource;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.orderStatusHistoryRepository = AppDataSource.getRepository(OrderStatusHistory);
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
    this.dataSource = AppDataSource;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  async listOrders(query: OrderFilterQueryDto) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      sortOrder = 'DESC', 
      search,
      status,
      payment_status,
      user_id,
      start_date,
      end_date
    } = query;

    const skip = (page - 1) * limit;
    const qb = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .withDeleted();

    if (search) {
      qb.andWhere('order.order_number LIKE :search', { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (payment_status) {
      qb.andWhere('order.payment_status = :payment_status', { payment_status });
    }

    if (user_id) {
      qb.andWhere('order.user_id = :user_id', { user_id });
    }

    if (start_date && end_date) {
      qb.andWhere('order.created_at BETWEEN :start_date AND :end_date', { start_date, end_date });
    } else if (start_date) {
      qb.andWhere('order.created_at >= :start_date', { start_date });
    } else if (end_date) {
      qb.andWhere('order.created_at <= :end_date', { end_date });
    }

    qb.orderBy(`order.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.variant', 'items.variant.product', 'status_histories'],
      withDeleted: true,
    });

    if (!order) {
      throw new AppError(
        'Order not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.ORDER_NOT_FOUND
      );
    }

    return order;
  }

  async updateOrderStatus(id: number, dto: UpdateOrderStatusDto, adminEmail: string) {
    return this.dataSource.transaction(async manager => {
      const order = await manager.findOne(Order, {
        where: { id },
      });

      if (!order) {
        throw new AppError(
          'Order not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.ORDER_NOT_FOUND
        );
      }

      this.validateStatusTransition(order.status, dto.status);

      const previousStatus = order.status;
      order.status = dto.status;

      if (dto.status === OrderStatus.SHIPPED) {
        order.shipped_at = new Date();
      } else if (dto.status === OrderStatus.DELIVERED) {
        order.delivered_at = new Date();
      }

      await manager.save(order);

      const statusHistory = manager.create(OrderStatusHistory, {
        order_id: id,
        status: dto.status,
        previous_status: previousStatus,
        changed_by: adminEmail,
        notes: dto.notes || `Status updated to ${dto.status}`,
      });

      await manager.save(statusHistory);

      return order;
    });
  }

  async cancelOrder(id: number, adminEmail: string): Promise<void> {
    return this.dataSource.transaction(async manager => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.variant'],
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
          'Order already cancelled',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.ORDER_CANNOT_BE_CANCELLED
        );
      }

      for (const item of order.items!) {
        await manager
          .createQueryBuilder()
          .update(Inventory)
          .set({
            quantity_available: () => 'quantity_available + :qty',
            quantity_reserved: () => 'quantity_reserved - :qty',
          })
          .setParameter('qty', item.quantity)
          .where('variant_id = :variantId', { variantId: item.variant_id })
          .execute();
      }

      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      const statusHistory = manager.create(OrderStatusHistory, {
        order_id: id,
        status: OrderStatus.CANCELLED,
        previous_status: previousStatus,
        changed_by: adminEmail,
        notes: 'Order cancelled by admin',
      });

      await manager.save(statusHistory);
    });
  }

  async addInternalNote(id: number, dto: AddInternalNoteDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new AppError(
        'Order not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.ORDER_NOT_FOUND
      );
    }

    const currentNotes = order.internal_notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${dto.note}`;
    
    order.internal_notes = currentNotes 
      ? `${currentNotes}\n${newNote}` 
      : newNote;

    return this.orderRepository.save(order);
  }
}

export default new AdminOrderService();
