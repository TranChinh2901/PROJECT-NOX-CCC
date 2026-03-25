import { Recommendation } from '../entities/Recommendation';
import { UserPreference } from '../entities/UserPreference';
import { ProductFeature } from '../repositories/IProductFeatureRepository';

/**
 * Recommendation Algorithm Types
 */
export enum RecommendationStrategy {
  COLLABORATIVE_FILTERING = 'collaborative_filtering', // User-based or item-based
  CONTENT_BASED = 'content_based',                     // Feature similarity
  HYBRID = 'hybrid',                                   // Combination
  POPULARITY = 'popularity',                           // Trending items
}

/**
 * Recommendation Request
 */
export interface RecommendationRequest {
  userId: number;
  strategy: RecommendationStrategy;
  limit: number;
  excludeProductIds?: number[];
  categoryFilter?: number;
}

/**
 * Domain Service Interface (Port): IRecommendationEngine
 * Defines the contract for ML-based recommendation generation.
 * This is the hexagon's port for machine learning adapters.
 */
export interface IRecommendationEngine {
  /**
   * Generate recommendations for a user
   */
  generateRecommendations(
    request: RecommendationRequest,
    userPreference: UserPreference,
    productFeatures: ProductFeature[]
  ): Promise<Recommendation[]>;

  /**
   * Get similar items (used for "customers also viewed")
   */
  getSimilarProducts(
    productId: number,
    limit: number
  ): Promise<Recommendation[]>;

  /**
   * Get strategy name
   */
  getStrategy(): RecommendationStrategy;
}
