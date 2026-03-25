import { RecommendationScore } from '../value-objects/RecommendationScore';

/**
 * Domain Entity: Recommendation
 * Pure domain model without infrastructure dependencies.
 * Represents a product recommendation for a user.
 */
export class Recommendation {
  readonly productId: number;
  readonly score: RecommendationScore;
  readonly reason: string;
  readonly createdAt: Date;

  private constructor(
    productId: number,
    score: RecommendationScore,
    reason: string,
    createdAt: Date
  ) {
    this.productId = productId;
    this.score = score;
    this.reason = reason;
    this.createdAt = createdAt;
  }

  static create(
    productId: number,
    score: number,
    reason: string
  ): Recommendation {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Invalid productId: ${productId}`);
    }

    return new Recommendation(
      productId,
      RecommendationScore.create(score),
      reason,
      new Date()
    );
  }

  /**
   * Business rule: High confidence recommendations have score >= 0.7
   */
  isHighConfidence(): boolean {
    return this.score.isAboveThreshold(0.7);
  }

  /**
   * Business rule: Check if recommendation is still fresh
   */
  isFresh(maxAgeMinutes: number = 60): boolean {
    const ageMs = Date.now() - this.createdAt.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }

  toJSON() {
    return {
      productId: this.productId,
      score: this.score.toNumber(),
      reason: this.reason,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
