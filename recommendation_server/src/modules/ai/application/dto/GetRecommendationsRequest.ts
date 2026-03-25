/**
 * DTO: Get Recommendations Request
 */
export interface GetRecommendationsRequestDTO {
  userId: number;
  strategy?: 'collaborative' | 'content' | 'hybrid' | 'popularity';
  limit?: number;
  excludeProductIds?: number[];
  categoryFilter?: number;
}
