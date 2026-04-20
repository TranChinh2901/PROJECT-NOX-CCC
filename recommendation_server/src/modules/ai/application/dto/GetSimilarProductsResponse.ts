import { RecommendationDecisionMetadata } from './GetRecommendationsResponse';

export interface GetSimilarProductsResponseDTO {
  productId: number;
  recommendations: {
    productId: number;
    score: number;
    reason: string;
    createdAt: string;
  }[];
  strategy: string;
  generatedAt: string;
  decision: RecommendationDecisionMetadata;
}
