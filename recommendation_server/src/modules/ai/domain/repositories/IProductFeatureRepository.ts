/**
 * Product Feature Vector for ML models
 */
export interface ProductFeature {
  productId: number;
  categoryId: number;
  brandId: number | null;
  price: number;
  avgRating: number;
  reviewCount: number;
  purchaseCount: number;
  featureVector?: number[]; // Embedding vector for content-based filtering
}

/**
 * Repository Interface (Port): IProductFeatureRepository
 * Provides product features for recommendation algorithms.
 */
export interface IProductFeatureRepository {
  /**
   * Get product features by ID
   */
  getById(productId: number): Promise<ProductFeature | null>;

  /**
   * Get multiple product features
   */
  getByIds(productIds: number[]): Promise<ProductFeature[]>;

  /**
   * Get products by category
   */
  getByCategory(categoryId: number, limit: number): Promise<ProductFeature[]>;

  /**
   * Get active products for cold-start/fallback recommendations.
   */
  getFallbackProducts(limit: number, categoryId?: number): Promise<ProductFeature[]>;

  /**
   * Get similar products based on features
   */
  findSimilar(productId: number, limit: number): Promise<ProductFeature[]>;

  /**
   * Update product statistics (ratings, purchase count, etc.)
   */
  updateStatistics(productId: number, updates: Partial<ProductFeature>): Promise<void>;
}
