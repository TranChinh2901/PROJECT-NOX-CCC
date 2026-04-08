import apiClient from './apiClient';

export interface ProductRecommendation {
  productId: number;
  score: number;
  reason: string;
  createdAt: string;
}

export interface TrackRecommendationBehaviorPayload {
  userId: number;
  behaviorType: 'view' | 'add_to_cart' | 'purchase' | 'review' | 'wishlist' | 'search';
  productId?: number;
  categoryId?: number;
  metadata?: Record<string, unknown>;
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

  async trackBehavior(payload: TrackRecommendationBehaviorPayload): Promise<void> {
    await apiClient.post<void>('/recommendations/track', payload);
  },
};
