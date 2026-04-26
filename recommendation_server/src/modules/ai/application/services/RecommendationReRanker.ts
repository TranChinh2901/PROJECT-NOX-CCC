import { Recommendation } from '../../domain/entities/Recommendation';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';
import {
  RecommendationCandidateSource,
  RecommendationSourceScores,
  ScoredRecommendationCandidate,
} from './RecommendationCandidate';

export interface RecommendationReRankOptions {
  excludedProductIds?: number[];
  limit: number;
  diversifyVisibleSetSize?: number;
  requireFeature?: boolean;
}

type RankedRecommendation = {
  recommendation: Recommendation;
  feature?: ProductFeature;
  sourceCount: number;
  strongestSourceScore: number;
  sourceScores: RecommendationSourceScores;
};

export class RecommendationReRanker {
  diversifyRecommendations(
    recommendations: Recommendation[],
    featureByProductId: Map<number, ProductFeature>,
    visibleSetSize: number,
    limit: number
  ): Recommendation[] {
    if (limit <= 0 || recommendations.length <= 1 || visibleSetSize <= 1) {
      return recommendations.slice(0, limit);
    }

    const rankedRecommendations = recommendations.map((recommendation) => ({
      recommendation,
      feature: featureByProductId.get(recommendation.productId),
      sourceCount: 1,
      strongestSourceScore: recommendation.score.toNumber(),
      sourceScores: {},
    }));
    const visibleLimit = Math.min(visibleSetSize, limit, rankedRecommendations.length);
    const diversifiedVisibleSet = this.selectDiversifiedVisibleSet(
      rankedRecommendations,
      visibleLimit
    );
    const selectedProductIds = new Set(
      diversifiedVisibleSet.map((ranked) => ranked.recommendation.productId)
    );
    const remainingRecommendations = rankedRecommendations.filter(
      (ranked) => !selectedProductIds.has(ranked.recommendation.productId)
    );

    return [...diversifiedVisibleSet, ...remainingRecommendations]
      .slice(0, limit)
      .map((ranked) => ranked.recommendation);
  }

  reRank(
    candidates: ScoredRecommendationCandidate[],
    options: RecommendationReRankOptions
  ): Recommendation[] {
    if (options.limit <= 0 || candidates.length === 0) {
      return [];
    }

    const excludedProductIds = new Set(options.excludedProductIds ?? []);
    const rankedRecommendations = this.buildRankedRecommendations(candidates)
      .filter((ranked) => !excludedProductIds.has(ranked.recommendation.productId))
      .filter((ranked) => !options.requireFeature || Boolean(ranked.feature))
      .sort((left, right) => this.compareRankedRecommendations(left, right));

    if (!options.diversifyVisibleSetSize || options.diversifyVisibleSetSize <= 1) {
      return rankedRecommendations
        .slice(0, options.limit)
        .map((ranked) => ranked.recommendation);
    }

    const visibleSetSize = Math.min(
      options.diversifyVisibleSetSize,
      options.limit,
      rankedRecommendations.length
    );
    const diversifiedVisibleSet = this.selectDiversifiedVisibleSet(
      rankedRecommendations,
      visibleSetSize
    );
    const selectedProductIds = new Set(
      diversifiedVisibleSet.map((ranked) => ranked.recommendation.productId)
    );
    const remainingRecommendations = rankedRecommendations.filter(
      (ranked) => !selectedProductIds.has(ranked.recommendation.productId)
    );

    return [...diversifiedVisibleSet, ...remainingRecommendations]
      .slice(0, options.limit)
      .map((ranked) => ranked.recommendation);
  }

  private buildRankedRecommendations(
    candidates: ScoredRecommendationCandidate[]
  ): RankedRecommendation[] {
    const candidatesByProductId = new Map<number, ScoredRecommendationCandidate[]>();

    for (const candidate of candidates) {
      if (!Number.isInteger(candidate.productId) || candidate.productId <= 0) {
        continue;
      }

      if (!candidatesByProductId.has(candidate.productId)) {
        candidatesByProductId.set(candidate.productId, []);
      }

      candidatesByProductId.get(candidate.productId)!.push(candidate);
    }

    return Array.from(candidatesByProductId.entries()).map(([productId, grouped]) => {
      const sourceScores = this.getBestSourceScores(grouped);
      const sourceCount = Object.keys(sourceScores).length;
      const strongestSourceScore = Math.max(
        ...Object.values(sourceScores).filter(
          (score): score is number => typeof score === 'number'
        ),
        0
      );
      const finalScore = this.calculateGroupedScore(grouped, sourceCount);
      const reason = this.combineReasons(grouped.map((candidate) => candidate.reason));
      const feature = grouped.find((candidate) => candidate.feature)?.feature;

      return {
        recommendation: Recommendation.create(productId, finalScore, reason),
        feature,
        sourceCount,
        strongestSourceScore,
        sourceScores,
      };
    });
  }

  private getBestSourceScores(
    candidates: ScoredRecommendationCandidate[]
  ): RecommendationSourceScores {
    const sourceScores: RecommendationSourceScores = {};

    for (const candidate of candidates) {
      const currentScore = sourceScores[candidate.source];
      if (currentScore === undefined || candidate.normalizedSourceScore > currentScore) {
        sourceScores[candidate.source] = candidate.normalizedSourceScore;
      }
    }

    return sourceScores;
  }

  private calculateGroupedScore(
    candidates: ScoredRecommendationCandidate[],
    sourceCount: number
  ): number {
    const sortedScores = candidates
      .map((candidate) => candidate.finalScore)
      .sort((left, right) => right - left);
    const strongestScore = sortedScores[0] ?? 0;
    const averageScore =
      sortedScores.reduce((sum, score) => sum + score, 0) / Math.max(sortedScores.length, 1);
    const sourceCoverageBoost = Math.min(Math.max(sourceCount - 1, 0) * 0.08, 0.16);

    return Number(
      Math.min(strongestScore * 0.82 + averageScore * 0.18 + sourceCoverageBoost, 1).toFixed(6)
    );
  }

  private compareRankedRecommendations(
    left: RankedRecommendation,
    right: RankedRecommendation
  ): number {
    const scoreDelta =
      right.recommendation.score.toNumber() - left.recommendation.score.toNumber();
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const sourceCountDelta = right.sourceCount - left.sourceCount;
    if (sourceCountDelta !== 0) {
      return sourceCountDelta;
    }

    const strongestSourceDelta = right.strongestSourceScore - left.strongestSourceScore;
    if (strongestSourceDelta !== 0) {
      return strongestSourceDelta;
    }

    const sourcePriorityDelta =
      this.getBestSourcePriority(right.sourceScores) -
      this.getBestSourcePriority(left.sourceScores);
    if (sourcePriorityDelta !== 0) {
      return sourcePriorityDelta;
    }

    return left.recommendation.productId - right.recommendation.productId;
  }

  private getBestSourcePriority(sourceScores: RecommendationSourceScores): number {
    const priority: Record<RecommendationCandidateSource, number> = {
      offline: 4,
      embedding: 3,
      content: 2,
      fallback: 1,
    };

    return Object.keys(sourceScores).reduce((bestPriority, source) => {
      return Math.max(bestPriority, priority[source as RecommendationCandidateSource] ?? 0);
    }, 0);
  }

  private selectDiversifiedVisibleSet(
    rankedRecommendations: RankedRecommendation[],
    visibleSetSize: number
  ): RankedRecommendation[] {
    const selected: RankedRecommendation[] = [];
    const remaining = [...rankedRecommendations];

    while (selected.length < visibleSetSize && remaining.length > 0) {
      let bestIndex = 0;
      let bestPenalty = this.getDiversityPenalty(selected, remaining[0]);

      for (let index = 1; index < remaining.length; index += 1) {
        const candidatePenalty = this.getDiversityPenalty(selected, remaining[index]);

        if (this.comparePenaltyTuples(candidatePenalty, bestPenalty) < 0) {
          bestIndex = index;
          bestPenalty = candidatePenalty;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected;
  }

  private getDiversityPenalty(
    selected: RankedRecommendation[],
    candidate: RankedRecommendation
  ): [number, number, number, number] {
    const candidateFeature = candidate.feature;
    const previousFeature = selected.length ? selected[selected.length - 1].feature : undefined;
    const selectedCategoryIds = new Set<number>();
    const selectedBrandIds = new Set<number>();

    for (const recommendation of selected) {
      const feature = recommendation.feature;
      if (!feature) {
        continue;
      }

      if (feature.categoryId > 0) {
        selectedCategoryIds.add(feature.categoryId);
      }

      if (feature.brandId !== null && feature.brandId > 0) {
        selectedBrandIds.add(feature.brandId);
      }
    }

    const candidateCategoryId = candidateFeature?.categoryId ?? 0;
    const candidateBrandId = candidateFeature?.brandId ?? null;

    return [
      Number(
        Boolean(
          previousFeature &&
            candidateBrandId !== null &&
            previousFeature.brandId !== null &&
            previousFeature.brandId === candidateBrandId
        )
      ),
      Number(Boolean(previousFeature && previousFeature.categoryId === candidateCategoryId)),
      Number(Boolean(candidateBrandId !== null && selectedBrandIds.has(candidateBrandId))),
      Number(Boolean(candidateCategoryId > 0 && selectedCategoryIds.has(candidateCategoryId))),
    ];
  }

  private comparePenaltyTuples(
    left: [number, number, number, number],
    right: [number, number, number, number]
  ): number {
    for (let index = 0; index < left.length; index += 1) {
      const delta = left[index] - right[index];
      if (delta !== 0) {
        return delta;
      }
    }

    return 0;
  }

  private combineReasons(reasons: string[]): string {
    const uniqueReasons = Array.from(
      new Set(reasons.filter((reason) => Boolean(reason.trim())))
    );

    return uniqueReasons.length > 0
      ? uniqueReasons.join('; ')
      : 'ranked recommendation';
  }
}
