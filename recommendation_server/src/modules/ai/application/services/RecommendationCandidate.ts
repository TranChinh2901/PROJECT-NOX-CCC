import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';

export type RecommendationCandidateSource =
  | 'offline'
  | 'embedding'
  | 'content'
  | 'fallback';

export type RecommendationSourceScores = Partial<
  Record<RecommendationCandidateSource, number>
>;

export interface RecommendationCandidate {
  productId: number;
  source: RecommendationCandidateSource;
  sourceScore: number;
  reason: string;
  feature?: ProductFeature;
}

export interface ScoredRecommendationCandidate extends RecommendationCandidate {
  normalizedSourceScore: number;
  finalScore: number;
}
