import apiClient from './apiClient';
import { 
  Order,
  OrderDetail,
  CreateOrderDto 
} from '@/types';

export interface UserOrdersResponse {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const orderApi = {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return await apiClient.post<Order>('/orders', data);
  },

  async getUserOrders(): Promise<UserOrdersResponse> {
    return await apiClient.get<UserOrdersResponse>('/orders');
  },

  async getOrderById(orderId: number): Promise<OrderDetail> {
    return await apiClient.get<OrderDetail>(`/orders/${orderId}`);
  },

  async cancelOrder(orderId: number): Promise<Order> {
    return await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  },
};
