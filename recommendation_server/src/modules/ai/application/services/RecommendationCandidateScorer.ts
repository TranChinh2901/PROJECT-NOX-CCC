import { UserPreference } from '../../domain/entities/UserPreference';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';
import {
  calculateSessionIntentBoost,
  hasSessionIntent,
  SessionIntentProfile,
} from '../../domain/recommendation-session-intent';
import {
  RecommendationCandidate,
  RecommendationCandidateSource,
  ScoredRecommendationCandidate,
} from './RecommendationCandidate';

export interface RecommendationCandidateScoringContext {
  userPreference?: UserPreference;
  sessionIntent?: SessionIntentProfile;
  targetProduct?: ProductFeature;
}

const SOURCE_PRIOR: Record<RecommendationCandidateSource, number> = {
  offline: 0.95,
  embedding: 0.9,
  content: 0.82,
  fallback: 0.62,
};

const roundScore = (score: number): number =>
  Number(Math.min(Math.max(score, 0), 1).toFixed(6));

export class RecommendationCandidateScorer {
  scoreCandidates(
    candidates: RecommendationCandidate[],
    context: RecommendationCandidateScoringContext = {}
  ): ScoredRecommendationCandidate[] {
    const normalizedSourceScores = this.normalizeSourceScores(candidates);

    return candidates.map((candidate, index) => {
      const normalizedSourceScore = normalizedSourceScores[index] ?? 0;
      const featureScore = candidate.feature
        ? this.calculateFeatureScore(candidate.feature, context)
        : 0;
      const qualityScore = candidate.feature
        ? this.calculateQualityScore(candidate.feature)
        : 0;
      const popularityScore = candidate.feature
        ? this.calculatePopularityScore(candidate.feature)
        : 0;
      const sessionBoost =
        candidate.feature && context.sessionIntent && hasSessionIntent(context.sessionIntent)
          ? calculateSessionIntentBoost(context.sessionIntent, candidate.feature)
          : 0;
      const finalScore = roundScore(
        normalizedSourceScore * 0.18 +
          SOURCE_PRIOR[candidate.source] * 0.12 +
          featureScore * 0.16 +
          qualityScore * 0.14 +
          popularityScore * 0.08 +
          sessionBoost
      );

      return {
        ...candidate,
        reason:
          sessionBoost > 0
            ? `${candidate.reason}; matches recent session intent`
            : candidate.reason,
        normalizedSourceScore,
        finalScore,
      };
    });
  }

  private normalizeSourceScores(candidates: RecommendationCandidate[]): number[] {
    const scoresBySource = new Map<RecommendationCandidateSource, Array<{
      index: number;
      score: number;
    }>>();

    candidates.forEach((candidate, index) => {
      if (!scoresBySource.has(candidate.source)) {
        scoresBySource.set(candidate.source, []);
      }

      scoresBySource.get(candidate.source)!.push({
        index,
        score: this.clampScore(candidate.sourceScore),
      });
    });

    const normalizedScores = new Array<number>(candidates.length).fill(0);

    for (const sourceScores of scoresBySource.values()) {
      const minScore = sourceScores.reduce(
        (currentMin, item) => Math.min(currentMin, item.score),
        1
      );
      const maxScore = sourceScores.reduce(
        (currentMax, item) => Math.max(currentMax, item.score),
        0
      );

      for (const item of sourceScores) {
        normalizedScores[item.index] =
          maxScore === minScore
            ? item.score > 0
              ? 1
              : 0
            : roundScore((item.score - minScore) / (maxScore - minScore));
      }
    }

    return normalizedScores;
  }

  private calculateFeatureScore(
    feature: ProductFeature,
    context: RecommendationCandidateScoringContext
  ): number {
    if (context.targetProduct) {
      return this.calculateTargetProductScore(feature, context.targetProduct);
    }

    const userPreference = context.userPreference;
    if (!userPreference) {
      return 0;
    }

    let score = 0;

    if (userPreference.prefersCategory(feature.categoryId)) {
      score += 0.4;
    }

    if (feature.brandId && userPreference.prefersBrand(feature.brandId)) {
      score += 0.25;
    }

    if (userPreference.isInPriceRange(feature.price)) {
      score += 0.35;
    }

    return roundScore(score);
  }

  private calculateTargetProductScore(
    feature: ProductFeature,
    targetProduct: ProductFeature
  ): number {
    let score = 0;

    if (feature.categoryId === targetProduct.categoryId) {
      score += 0.45;
    }

    if (
      feature.brandId &&
      targetProduct.brandId &&
      feature.brandId === targetProduct.brandId
    ) {
      score += 0.25;
    }

    score += this.calculatePriceSimilarity(feature.price, targetProduct.price) * 0.3;

    return roundScore(score);
  }

  private calculateQualityScore(feature: ProductFeature): number {
    const ratingScore = feature.avgRating > 0 ? Math.min(feature.avgRating / 5, 1) : 0;
    const reviewScore = Math.min(Math.max(feature.reviewCount, 0) / 50, 1);

    return roundScore(ratingScore * 0.75 + reviewScore * 0.25);
  }

  private calculatePopularityScore(feature: ProductFeature): number {
    return roundScore(Math.min(Math.max(feature.purchaseCount, 0) / 100, 1));
  }

  private calculatePriceSimilarity(leftPrice: number, rightPrice: number): number {
    if (leftPrice <= 0 || rightPrice <= 0) {
      return 0;
    }

    const differenceRatio =
      Math.abs(leftPrice - rightPrice) / Math.max(leftPrice, rightPrice);
    return Math.max(0, 1 - differenceRatio);
  }

  private clampScore(score: number): number {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    if (score >= 1) {
      return 1;
    }

    return score;
  }
}
