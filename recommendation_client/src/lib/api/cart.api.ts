import apiClient from './apiClient';
import { 
  Cart, 
  AddToCartDto,
  UpdateCartItemDto 
} from '@/types';

export const cartApi = {
  async getCart(): Promise<Cart> {
    return await apiClient.get<Cart>('/cart');
  },

  async addToCart(data: AddToCartDto): Promise<Cart> {
    return await apiClient.post<Cart>('/cart/add', data);
  },

  async updateCartItem(itemId: number, data: UpdateCartItemDto): Promise<Cart> {
    return await apiClient.put<Cart>(`/cart/items/${itemId}`, data);
  },

  async removeCartItem(itemId: number): Promise<Cart> {
    return await apiClient.delete<Cart>(`/cart/items/${itemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart/clear');
  },
};
