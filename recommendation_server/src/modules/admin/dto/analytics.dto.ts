export interface DateRangeQueryDto {
  start_date: string;
  end_date: string;
}

export interface TopProductsQueryDto {
  limit?: number;
}

export interface SalesStatsDto {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
}

export interface OrderStatsByStatusDto {
  status: string;
  count: number;
  total_revenue: number;
}

export interface OrderStatsDto {
  orders_by_status: OrderStatsByStatusDto[];
}

export interface TopProductDto {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface UserStatsDto {
  total_users: number;
  new_registrations: number;
}
