import { readFile } from 'fs/promises';
import path from 'path';
import {
  IRecommendationEngine,
  RecommendationRequest,
  RecommendationStrategy,
} from '../../domain/services/IRecommendationEngine';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';

type OfflineRecommendationEntry = {
  productId: number;
  score: number;
  reason: string;
};

type OfflineSimilarEntry = {
  productId: number;
  score: number;
};

type OfflineModelPayload = {
  metadata?: Record<string, unknown>;
  recommendationsByUser?: Record<string, OfflineRecommendationEntry[]>;
  similarItemsByProduct?: Record<string, OfflineSimilarEntry[]>;
};

export class OfflineModelRecommendationEngine implements IRecommendationEngine {
  private cachedModel?: OfflineModelPayload;

  constructor(
    private readonly modelPath: string
  ) {}

  getStrategy(): RecommendationStrategy {
    return RecommendationStrategy.COLLABORATIVE_FILTERING;
  }

  async generateRecommendations(
    request: RecommendationRequest,
    _userPreference: UserPreference,
    productFeatures: ProductFeature[]
  ): Promise<Recommendation[]> {
    const model = await this.loadModel();
    const productFeatureById = new Map(
      productFeatures.map((productFeature) => [productFeature.productId, productFeature])
    );
    const rawRecommendations = model.recommendationsByUser?.[String(request.userId)] || [];

    return rawRecommendations
      .filter((recommendation) => {
        if (request.excludeProductIds?.includes(recommendation.productId)) {
          return false;
        }

        const productFeature = productFeatureById.get(recommendation.productId);
        if (!productFeature) {
          return false;
        }

        if (request.categoryFilter && productFeature.categoryId !== request.categoryFilter) {
          return false;
        }

        return true;
      })
      .slice(0, request.limit)
      .map((recommendation) =>
        Recommendation.create(
          recommendation.productId,
          this.normalizeScore(recommendation.score),
          recommendation.reason || 'recommended from offline collaborative model'
        )
      );
  }

  async getSimilarProducts(
    productId: number,
    limit: number
  ): Promise<Recommendation[]> {
    const model = await this.loadModel();
    const similarItems = model.similarItemsByProduct?.[String(productId)] || [];

    return similarItems
      .slice(0, limit)
      .map((similarItem) =>
        Recommendation.create(
          similarItem.productId,
          this.normalizeScore(similarItem.score),
          'similar based on offline collaborative model'
        )
      );
  }

  private async loadModel(): Promise<OfflineModelPayload> {
    if (this.cachedModel) {
      return this.cachedModel;
    }

    const resolvedModelPath = path.isAbsolute(this.modelPath)
      ? this.modelPath
      : path.resolve(process.cwd(), this.modelPath);

    const rawModel = await readFile(resolvedModelPath, 'utf8');
    this.cachedModel = JSON.parse(rawModel) as OfflineModelPayload;
    return this.cachedModel;
  }

  private normalizeScore(score: number): number {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    if (score >= 1) {
      return 1;
    }

    return score;
  }
}
