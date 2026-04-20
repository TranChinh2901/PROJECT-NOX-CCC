import { Repository } from 'typeorm';
import { IRecommendationRepository } from '../../domain/repositories/IRecommendationRepository';
import { Recommendation } from '../../domain/entities/Recommendation';
import { RecommendationCache } from '../../../ai/entity/recommendation-cache';
import { AppDataSource } from '@/config/database.config';
import { RecommendationType } from '../../enum/recommendation.enum';

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
  private readonly recommendationType = RecommendationType.PERSONALIZED;
  private readonly defaultAlgorithm: string;

  constructor() {
    this.repository = AppDataSource.getRepository(RecommendationCache);
    this.defaultAlgorithm = process.env.RECOMMENDATION_ENGINE?.trim().toLowerCase() === 'offline_model'
      ? 'offline_model'
      : 'content_based';
  }

  async findByUserId(userId: number, algorithm?: string): Promise<Recommendation[]> {
    const resolvedAlgorithm = this.resolveAlgorithm(algorithm);
    const cacheEntries = await this.repository.find({
      where: {
        user_id: userId,
        is_active: true,
        recommendation_type: this.recommendationType,
        algorithm: resolvedAlgorithm,
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
        this.normalizeScore(item.score),
        item.reason
      )
    );

    return recommendations;
  }

  async save(userId: number, recommendations: Recommendation[], algorithm?: string): Promise<void> {
    const resolvedAlgorithm = this.resolveAlgorithm(algorithm);
    const cacheKey = this.buildCacheKey(userId, resolvedAlgorithm);
    const generatedAt = new Date();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Deactivate old cache entries
    await this.repository.update(
      {
        user_id: userId,
        is_active: true,
        recommendation_type: this.recommendationType,
        algorithm: resolvedAlgorithm,
      },
      { is_active: false }
    );

    await this.repository.upsert({
      cache_key: cacheKey,
      user_id: userId,
      recommendation_type: this.recommendationType,
      algorithm: resolvedAlgorithm,
      recommended_products: recommendations.map((r) => r.toJSON()) as any[],
      generated_at: generatedAt,
      expires_at: expiresAt,
      is_active: true,
      cache_hit_count: 0,
    }, ['cache_key']);
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

  async hasFreshRecommendations(
    userId: number,
    maxAgeMinutes: number,
    algorithm?: string
  ): Promise<boolean> {
    const resolvedAlgorithm = this.resolveAlgorithm(algorithm);
    const freshSince = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const latestCache = await this.repository.findOne({
      where: {
        user_id: userId,
        is_active: true,
        recommendation_type: this.recommendationType,
        algorithm: resolvedAlgorithm,
      },
      order: {
        generated_at: 'DESC',
      },
    });

    return latestCache
      ? latestCache.generated_at >= freshSince && latestCache.expires_at >= new Date()
      : false;
  }

  private buildCacheKey(userId: number, algorithm: string): string {
    return `user:${userId}:type:personalized:algo:${algorithm}`;
  }

  private resolveAlgorithm(algorithm?: string): string {
    return algorithm || this.defaultAlgorithm;
  }

  private normalizeScore(score: unknown): number {
    const parsedScore = Number(score);

    if (!Number.isFinite(parsedScore) || parsedScore <= 0) {
      return 0;
    }

    if (parsedScore >= 1) {
      return 1;
    }

    return parsedScore;
  }
}
