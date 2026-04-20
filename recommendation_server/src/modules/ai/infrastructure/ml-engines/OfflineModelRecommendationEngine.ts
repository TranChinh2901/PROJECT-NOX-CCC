import { readFile } from 'fs/promises';
import path from 'path';
import {
  IRecommendationArtifactMetadataProvider,
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

export class OfflineModelRecommendationEngine
  implements IRecommendationEngine, IRecommendationArtifactMetadataProvider {
  private cachedModel?: OfflineModelPayload;
  private cachedModelPath?: string;

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
        if (request.categoryFilter) {
          if (!productFeature) {
            return false;
          }

          if (productFeature.categoryId !== request.categoryFilter) {
            return false;
          }
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

  async isArtifactFresh(maxAgeMinutes: number): Promise<boolean> {
    const model = await this.loadModel();
    const metadataGeneratedAt = model.metadata?.generatedAt;

    if (typeof metadataGeneratedAt === 'string') {
      const generatedAt = new Date(metadataGeneratedAt);
      if (!Number.isNaN(generatedAt.getTime())) {
        return Date.now() - generatedAt.getTime() <= maxAgeMinutes * 60 * 1000;
      }
    }

    const { stat } = await import('fs/promises');
    const fileStats = await stat(this.resolveModelPath());
    return Date.now() - fileStats.mtime.getTime() <= maxAgeMinutes * 60 * 1000;
  }

  private async loadModel(): Promise<OfflineModelPayload> {
    if (this.cachedModel) {
      return this.cachedModel;
    }

    const resolvedModelPath = this.resolveModelPath();

    const rawModel = await readFile(resolvedModelPath, 'utf8');
    this.cachedModel = JSON.parse(rawModel) as OfflineModelPayload;
    return this.cachedModel;
  }

  private resolveModelPath(): string {
    if (!this.cachedModelPath) {
      this.cachedModelPath = path.isAbsolute(this.modelPath)
        ? this.modelPath
        : path.resolve(process.cwd(), this.modelPath);
    }

    return this.cachedModelPath;
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
