import apiClient from './apiClient';
import { Category } from '@/types';

export const categoryApi = {
  async getAllCategories(): Promise<Category[]> {
    return await apiClient.get<Category[]>('/categories');
  },

  async getCategoryById(id: number): Promise<Category> {
    return await apiClient.get<Category>(`/categories/${id}`);
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    return await apiClient.get<Category>(`/categories/slug/${slug}`);
  },

  async getRootCategories(): Promise<Category[]> {
    return await apiClient.get<Category[]>('/categories/root');
  },

  async getCategoryTree(): Promise<Category[]> {
    return await apiClient.get<Category[]>('/categories/tree');
  },
};
