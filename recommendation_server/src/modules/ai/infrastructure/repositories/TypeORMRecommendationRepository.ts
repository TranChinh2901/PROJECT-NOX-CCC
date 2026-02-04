import { Repository } from 'typeorm';
import { IRecommendationRepository } from '../../domain/repositories/IRecommendationRepository';
import { Recommendation } from '../../domain/entities/Recommendation';
import { RecommendationCache } from '../../../ai/entity/recommendation-cache';
import { AppDataSource } from '@/config/database.config';

/**
 * Adapter: TypeORM Recommendation Repository
 *
 * This adapter implements the IRecommendationRepository port using TypeORM.
 *
 * Hexagonal Architecture principle:
 * - The domain layer defines the interface (port)
 * - This infrastructure layer provides the implementation (adapter)
 * - Business logic depends on the interface, not this implementation
 */
export class TypeORMRecommendationRepository implements IRecommendationRepository {
  private repository: Repository<RecommendationCache>;

  constructor() {
    this.repository = AppDataSource.getRepository(RecommendationCache);
  }

  async findByUserId(userId: number): Promise<Recommendation[]> {
    const cacheEntries = await this.repository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: {
        generated_at: 'DESC',
      },
    });

    if (cacheEntries.length === 0) {
      return [];
    }

    // Get the most recent cache entry
    const latestCache = cacheEntries[0];

    // Parse recommended_products JSON to domain entities
    const recommendations = (latestCache.recommended_products as any[]).map((item) =>
      Recommendation.create(
        item.productId,
        item.score,
        item.reason
      )
    );

    return recommendations;
  }

  async save(userId: number, recommendations: Recommendation[]): Promise<void> {
    // Deactivate old cache entries
    await this.repository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );

    // Create new cache entry
    const cacheEntry = this.repository.create({
      user_id: userId,
      recommendation_type: 'personalized' as any,
      algorithm: 'content_based',
      recommended_products: recommendations.map((r) => r.toJSON()) as any[],
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      is_active: true,
      cache_hit_count: 0,
    });

    await this.repository.save(cacheEntry);
  }

  async deleteExpired(maxAgeMinutes: number): Promise<number> {
    const expiryDate = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('generated_at < :expiryDate', { expiryDate })
      .execute();

    return result.affected || 0;
  }

  async hasFreshRecommendations(userId: number, maxAgeMinutes: number): Promise<boolean> {
    const freshSince = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const count = await this.repository.count({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    if (count === 0) return false;

    const latestCache = await this.repository.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: {
        generated_at: 'DESC',
      },
    });

    return latestCache ? latestCache.generated_at >= freshSince : false;
  }
}
