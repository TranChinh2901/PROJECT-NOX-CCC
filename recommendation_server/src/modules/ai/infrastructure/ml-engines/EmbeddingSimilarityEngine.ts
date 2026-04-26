import {
  IRecommendationEngine,
  RecommendationRequest,
  RecommendationStrategy,
} from '../../domain/services/IRecommendationEngine';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import {
  calculateCosineSimilarity,
  isUsableEmbeddingVector,
} from '../../domain/recommendation-embedding-similarity';

type EmbeddingSimilarityEngineOptions = {
  candidatePoolSize?: number;
  enforceCategoryCompatibility?: boolean;
  priceBandTolerance?: number;
};

const DEFAULT_CANDIDATE_POOL_SIZE = 200;
const DEFAULT_PRICE_BAND_TOLERANCE = 0.3;

export class EmbeddingSimilarityEngine implements IRecommendationEngine {
  private readonly candidatePoolSize: number;
  private readonly enforceCategoryCompatibility: boolean;
  private readonly priceBandTolerance: number;

  constructor(
    private readonly productFeatureRepository: IProductFeatureRepository,
    options: EmbeddingSimilarityEngineOptions = {}
  ) {
    this.candidatePoolSize = options.candidatePoolSize ?? DEFAULT_CANDIDATE_POOL_SIZE;
    this.enforceCategoryCompatibility = options.enforceCategoryCompatibility ?? true;
    this.priceBandTolerance = options.priceBandTolerance ?? DEFAULT_PRICE_BAND_TOLERANCE;
  }

  getStrategy(): RecommendationStrategy {
    return RecommendationStrategy.CONTENT_BASED;
  }

  async generateRecommendations(
    request: RecommendationRequest,
    userPreference: UserPreference,
    productFeatures: ProductFeature[]
  ): Promise<Recommendation[]> {
    void request;
    void userPreference;
    void productFeatures;
    return [];
  }

  async getSimilarProducts(productId: number, limit: number): Promise<Recommendation[]> {
    const targetProduct = await this.productFeatureRepository.getById(productId);

    if (!targetProduct || !isUsableEmbeddingVector(targetProduct.featureVector)) {
      return [];
    }

    const candidateLimit = Math.max(this.candidatePoolSize, limit * 20);
    const candidates = await this.productFeatureRepository.getFallbackProducts(
      candidateLimit,
      this.enforceCategoryCompatibility ? targetProduct.categoryId : undefined
    );

    return candidates
      .filter((candidate) => this.isEligibleCandidate(targetProduct, candidate))
      .map((candidate) => ({
        recommendation: Recommendation.create(
          candidate.productId,
          this.roundScore(
            calculateCosineSimilarity(targetProduct.featureVector!, candidate.featureVector!)
          ),
          this.generateReason(targetProduct, candidate)
        ),
      }))
      .filter(({ recommendation }) => recommendation.score.toNumber() > 0)
      .sort((left, right) => {
        const scoreDifference =
          right.recommendation.score.toNumber() - left.recommendation.score.toNumber();

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.recommendation.productId - right.recommendation.productId;
      })
      .slice(0, limit)
      .map(({ recommendation }) => recommendation);
  }

  private isEligibleCandidate(targetProduct: ProductFeature, candidate: ProductFeature): boolean {
    if (candidate.productId === targetProduct.productId) {
      return false;
    }

    if (!isUsableEmbeddingVector(candidate.featureVector)) {
      return false;
    }

    if (
      this.enforceCategoryCompatibility &&
      candidate.categoryId !== targetProduct.categoryId
    ) {
      return false;
    }

    return this.isInsidePriceBand(targetProduct.price, candidate.price);
  }

  private isInsidePriceBand(targetPrice: number, candidatePrice: number): boolean {
    if (targetPrice <= 0 || candidatePrice <= 0) {
      return true;
    }

    const minPrice = targetPrice * (1 - this.priceBandTolerance);
    const maxPrice = targetPrice * (1 + this.priceBandTolerance);

    return candidatePrice >= minPrice && candidatePrice <= maxPrice;
  }

  private generateReason(targetProduct: ProductFeature, candidate: ProductFeature): string {
    const reasons = ['semantically similar'];

    if (candidate.categoryId === targetProduct.categoryId) {
      reasons.push('same category');
    }

    if (
      targetProduct.brandId &&
      candidate.brandId &&
      targetProduct.brandId === candidate.brandId
    ) {
      reasons.push('same brand');
    }

    if (this.isInsidePriceBand(targetProduct.price, candidate.price)) {
      reasons.push('compatible price range');
    }

    return reasons.join(', ');
  }

  private roundScore(score: number): number {
    return Number(Math.max(0, Math.min(score, 1)).toFixed(6));
  }
}
