import apiClient from './apiClient';
import { 
  Product, 
  ProductFilterOptions,
  PaginatedResponse 
} from '@/types';

export const productApi = {
  async getAllProducts(options?: ProductFilterOptions): Promise<PaginatedResponse<Product>> {
    return await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: options
    });
  },

  async getProductById(id: number): Promise<Product> {
    return await apiClient.get<Product>(`/products/${id}`);
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return await apiClient.get<Product>(`/products/slug/${slug}`);
  },

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    return await apiClient.get<Product[]>('/products/featured', {
      params: { limit }
    });
  },

  async getRelatedProducts(productId: number, limit?: number): Promise<Product[]> {
    return await apiClient.get<Product[]>(`/products/${productId}/related`, {
      params: { limit }
    });
  },

  async searchProducts(query: string, limit?: number): Promise<{ data: Product[]; suggestions: string[] }> {
    return await apiClient.get<{ data: Product[]; suggestions: string[] }>('/products/search', {
      params: { q: query, limit }
    });
  },
};
