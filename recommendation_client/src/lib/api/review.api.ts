import apiClient from './apiClient';
import { 
  Review,
  CreateReviewDto 
} from '@/types';

export const reviewApi = {
  async getProductReviews(productId: number): Promise<Review[]> {
    return await apiClient.get<Review[]>(`/reviews/product/${productId}`);
  },

  async createReview(data: CreateReviewDto): Promise<Review> {
    return await apiClient.post<Review>('/reviews', data);
  },

  async getUserReviews(): Promise<Review[]> {
    return await apiClient.get<Review[]>('/reviews/my-reviews');
  },

  async markReviewHelpful(productId: number, reviewId: number): Promise<void> {
    await apiClient.post(`/reviews/product/${productId}/helpful/${reviewId}`);
  },
};
