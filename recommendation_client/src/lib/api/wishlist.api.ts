import apiClient from './apiClient';
import { WishlistItem, WishlistResponse } from '../../types/wishlist.types';

export const wishlistApi = {
  getWishlist: async (): Promise<WishlistResponse> => {
    return await apiClient.get<WishlistResponse>('/wishlists');
  },

  addItem: async (variantId: number, notes?: string, priority?: string): Promise<WishlistItem> => {
    return await apiClient.post<WishlistItem>('/wishlists/items', { variant_id: variantId, notes, priority });
  },

  removeItem: async (itemId: number): Promise<void> => {
    return await apiClient.delete<void>(`/wishlists/items/${itemId}`);
  },

  updateItem: async (itemId: number, data: Partial<WishlistItem>): Promise<WishlistItem> => {
    return await apiClient.put<WishlistItem>(`/wishlists/items/${itemId}`, data);
  },

  checkItem: async (variantId: number): Promise<{ inWishlist: boolean; item?: WishlistItem }> => {
    return await apiClient.get<{ inWishlist: boolean; item?: WishlistItem }>(`/wishlists/check/${variantId}`);
  }
};
