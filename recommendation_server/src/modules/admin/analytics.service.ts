import { Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Order } from "@/modules/orders/entity/order";
import { User } from "@/modules/users/entity/user.entity";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { Product } from "@/modules/products/entity/product";
import { OrderStatus } from "@/modules/orders/enum/order.enum";
import { 
  SalesStatsDto, 
  OrderStatsDto, 
  OrderStatsByStatusDto, 
  TopProductDto, 
  UserStatsDto 
} from "./dto/analytics.dto";

class AnalyticsService {
  private orderRepository: Repository<Order>;
  private userRepository: Repository<User>;
  private orderItemRepository: Repository<OrderItem>;
  private productRepository: Repository<Product>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.userRepository = AppDataSource.getRepository(User);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async getSalesStats(startDate: Date, endDate: Date): Promise<SalesStatsDto> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total_amount)', 'total_revenue')
      .addSelect('COUNT(order.id)', 'total_orders')
      .addSelect('AVG(order.total_amount)', 'average_order_value')
      .where('order.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('order.deleted_at IS NULL')
      .getRawOne();

    return {
      total_revenue: parseFloat(result?.total_revenue || '0') || 0,
      total_orders: parseInt(result?.total_orders || '0') || 0,
      average_order_value: parseFloat(result?.average_order_value || '0') || 0,
    };
  }

  async getOrderStats(startDate: Date, endDate: Date): Promise<OrderStatsDto> {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.total_amount)', 'total_revenue')
      .where('order.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('order.deleted_at IS NULL')
      .groupBy('order.status')
      .getRawMany();

    const orders_by_status: OrderStatsByStatusDto[] = results.map((row) => ({
      status: row.status,
      count: parseInt(row.count || '0') || 0,
      total_revenue: parseFloat(row.total_revenue || '0') || 0,
    }));

    return { orders_by_status };
  }

  async getTopProducts(limit: number = 10): Promise<TopProductDto[]> {
    const results = await this.orderItemRepository
      .createQueryBuilder('order_item')
      .innerJoin('order_item.order', 'order')
      .innerJoin('order_item.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .select('product.id', 'product_id')
      .addSelect('product.name', 'product_name')
      .addSelect('SUM(order_item.quantity)', 'total_quantity')
      .addSelect('SUM(order_item.total_price)', 'total_revenue')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('order.deleted_at IS NULL')
      .andWhere('product.deleted_at IS NULL')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('total_revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      total_quantity: parseInt(row.total_quantity || '0') || 0,
      total_revenue: parseFloat(row.total_revenue || '0') || 0,
    }));
  }

  async getUserStats(startDate: Date, endDate: Date): Promise<UserStatsDto> {
    const totalUsersResult = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(user.id)', 'total')
      .getRawOne();

    const newRegistrationsResult = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(user.id)', 'new_count')
      .where('user.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return {
      total_users: parseInt(totalUsersResult?.total || '0') || 0,
      new_registrations: parseInt(newRegistrationsResult?.new_count || '0') || 0,
    };
  }
}

export default new AnalyticsService();
