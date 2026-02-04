import { Recommendation } from '../entities/Recommendation';

/**
 * Repository Interface (Port): IRecommendationRepository
 * Defines the contract for recommendation persistence.
 * No implementation details - can be swapped for different storage backends.
 */
export interface IRecommendationRepository {
  /**
   * Find cached recommendations for a user
   */
  findByUserId(userId: number): Promise<Recommendation[]>;

  /**
   * Save recommendations to cache
   */
  save(userId: number, recommendations: Recommendation[]): Promise<void>;

  /**
   * Delete expired recommendations
   */
  deleteExpired(maxAgeMinutes: number): Promise<number>;

  /**
   * Check if user has fresh cached recommendations
   */
  hasFreshRecommendations(userId: number, maxAgeMinutes: number): Promise<boolean>;
}
