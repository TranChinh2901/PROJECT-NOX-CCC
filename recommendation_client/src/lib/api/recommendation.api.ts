import apiClient from './apiClient';

export interface ProductRecommendation {
  productId: number;
  score: number;
  reason: string;
  createdAt: string;
}

export const recommendationApi = {
  async getSimilarProducts(
    productId: number,
    limit?: number
  ): Promise<{ productId: number; recommendations: ProductRecommendation[] }> {
    return await apiClient.get<{ productId: number; recommendations: ProductRecommendation[] }>(
      `/recommendations/similar/${productId}`,
      {
        params: { limit },
      }
    );
  },
};
