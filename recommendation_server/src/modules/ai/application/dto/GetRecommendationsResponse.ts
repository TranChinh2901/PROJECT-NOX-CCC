export type RecommendationDecisionSource =
  | 'offline'
  | 'hybrid'
  | 'embedding'
  | 'content'
  | 'fallback'
  | 'hidden';

export interface RecommendationDecisionMetadata {
  source: RecommendationDecisionSource;
  branch: string;
  fallbackReason?: string;
  hidden: boolean;
}

/**
 * DTO: Get Recommendations Response
 */
export interface GetRecommendationsResponseDTO {
  userId: number;
  recommendations: {
    productId: number;
    score: number;
    reason: string;
    createdAt: string;
  }[];
  strategy: string;
  fromCache: boolean;
  generatedAt: string;
  decision: RecommendationDecisionMetadata;
}
