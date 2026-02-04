/**
 * Dependency Injection Container for AI/Recommendation Module
 *
 * This container wires up all dependencies following Clean Architecture principles:
 * - Domain layer (entities, interfaces) has NO dependencies
 * - Application layer (use cases) depends ONLY on domain interfaces
 * - Infrastructure layer (repositories, engines) implements domain interfaces
 * - This container is the ONLY place that knows about concrete implementations
 *
 * Benefits:
 * - Easy to swap implementations (e.g., different ML models)
 * - Easy to test (inject mocks)
 * - Clear dependency graph
 */

import { IRecommendationRepository } from '../domain/repositories/IRecommendationRepository';
import { IUserBehaviorRepository } from '../domain/repositories/IUserBehaviorRepository';
import { IProductFeatureRepository } from '../domain/repositories/IProductFeatureRepository';
import { IRecommendationEngine } from '../domain/services/IRecommendationEngine';

import { TypeORMRecommendationRepository } from '../infrastructure/repositories/TypeORMRecommendationRepository';
import { TypeORMUserBehaviorRepository } from '../infrastructure/repositories/TypeORMUserBehaviorRepository';
import { TypeORMProductFeatureRepository } from '../infrastructure/repositories/TypeORMProductFeatureRepository';
import { ContentBasedEngine } from '../infrastructure/ml-engines/ContentBasedEngine';

import { GetRecommendationsUseCase } from '../application/use-cases/GetRecommendationsUseCase';
import { TrackUserBehaviorUseCase } from '../application/use-cases/TrackUserBehaviorUseCase';

/**
 * AI Module Container
 *
 * Singleton pattern for dependency injection.
 * In production, consider using a DI framework like Inversify or Awilix.
 */
class AIModuleContainer {
  private static instance: AIModuleContainer;

  // Repositories (infrastructure)
  private _recommendationRepository?: IRecommendationRepository;
  private _userBehaviorRepository?: IUserBehaviorRepository;
  private _productFeatureRepository?: IProductFeatureRepository;

  // Services (domain)
  private _recommendationEngine?: IRecommendationEngine;

  // Use Cases (application)
  private _getRecommendationsUseCase?: GetRecommendationsUseCase;
  private _trackUserBehaviorUseCase?: TrackUserBehaviorUseCase;

  private constructor() {}

  static getInstance(): AIModuleContainer {
    if (!AIModuleContainer.instance) {
      AIModuleContainer.instance = new AIModuleContainer();
    }
    return AIModuleContainer.instance;
  }

  /**
   * Get or create RecommendationRepository
   */
  getRecommendationRepository(): IRecommendationRepository {
    if (!this._recommendationRepository) {
      this._recommendationRepository = new TypeORMRecommendationRepository();
    }
    return this._recommendationRepository;
  }

  /**
   * Get or create UserBehaviorRepository
   */
  getUserBehaviorRepository(): IUserBehaviorRepository {
    if (!this._userBehaviorRepository) {
      this._userBehaviorRepository = new TypeORMUserBehaviorRepository();
    }
    return this._userBehaviorRepository;
  }

  /**
   * Get or create ProductFeatureRepository
   */
  getProductFeatureRepository(): IProductFeatureRepository {
    if (!this._productFeatureRepository) {
      this._productFeatureRepository = new TypeORMProductFeatureRepository();
    }
    return this._productFeatureRepository;
  }

  /**
   * Get or create RecommendationEngine
   *
   * In production, this could:
   * - Select engine based on configuration
   * - Use a hybrid approach combining multiple engines
   * - Load ML models from external services
   */
  getRecommendationEngine(): IRecommendationEngine {
    if (!this._recommendationEngine) {
      // Default to content-based engine
      // TODO: Make this configurable via environment variables
      this._recommendationEngine = new ContentBasedEngine();
    }
    return this._recommendationEngine;
  }

  /**
   * Get or create GetRecommendationsUseCase
   */
  getRecommendationsUseCase(): GetRecommendationsUseCase {
    if (!this._getRecommendationsUseCase) {
      this._getRecommendationsUseCase = new GetRecommendationsUseCase(
        this.getRecommendationRepository(),
        this.getUserBehaviorRepository(),
        this.getProductFeatureRepository(),
        this.getRecommendationEngine()
      );
    }
    return this._getRecommendationsUseCase;
  }

  /**
   * Get or create TrackUserBehaviorUseCase
   */
  getTrackUserBehaviorUseCase(): TrackUserBehaviorUseCase {
    if (!this._trackUserBehaviorUseCase) {
      this._trackUserBehaviorUseCase = new TrackUserBehaviorUseCase(
        this.getUserBehaviorRepository()
      );
    }
    return this._trackUserBehaviorUseCase;
  }

  /**
   * Reset all instances (useful for testing)
   */
  reset(): void {
    this._recommendationRepository = undefined;
    this._userBehaviorRepository = undefined;
    this._productFeatureRepository = undefined;
    this._recommendationEngine = undefined;
    this._getRecommendationsUseCase = undefined;
    this._trackUserBehaviorUseCase = undefined;
  }
}

// Export singleton instance
export const container = AIModuleContainer.getInstance();
