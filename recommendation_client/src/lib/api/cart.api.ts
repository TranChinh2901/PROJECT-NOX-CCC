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
    const quantity = data.quantity && data.quantity > 0 ? data.quantity : 1;
    return await apiClient.post<Cart>('/cart/add', {
      variant_id: data.variant_id,
      quantity,
    });
  },

  async updateCartItem(itemId: number, data: UpdateCartItemDto): Promise<Cart> {
    return await apiClient.put<Cart>(`/cart/items/${itemId}`, data);
  },

  async removeCartItem(itemId: number): Promise<Cart> {
    return await apiClient.delete<Cart>(`/cart/items/${itemId}`);
  },

  async bulkRemoveItems(itemIds: number[]): Promise<Cart> {
    return await apiClient.delete<Cart>('/cart/items/bulk', {
      data: { item_ids: itemIds }
    });
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart/clear');
  },
};
