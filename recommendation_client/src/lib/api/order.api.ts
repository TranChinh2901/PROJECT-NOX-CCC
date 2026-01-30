import apiClient from './apiClient';
import { 
  Order,
  CreateOrderDto 
} from '@/types';

export const orderApi = {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return await apiClient.post<Order>('/orders', data);
  },

  async getUserOrders(): Promise<Order[]> {
    return await apiClient.get<Order[]>('/orders');
  },

  async getOrderById(orderId: number): Promise<Order> {
    return await apiClient.get<Order>(`/orders/${orderId}`);
  },

  async cancelOrder(orderId: number): Promise<Order> {
    return await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  },
};
