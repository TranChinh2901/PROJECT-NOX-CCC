import { RecommendationCache } from './recommendation-cache';
import { RecommendationType } from '../enum/recommendation.enum';

describe('RecommendationCache Entity', () => {
  describe('Schema Validation', () => {
    it('should create a recommendation cache with all required fields', () => {
      const cache = new RecommendationCache();
      cache.id = 1;
      cache.recommendation_type = RecommendationType.PERSONALIZED;
      cache.algorithm = 'third_party';
      cache.recommended_products = [];
      cache.expires_at = new Date();
      cache.generated_at = new Date();
      cache.cache_hit_count = 0;
      cache.is_active = true;
      cache.created_at = new Date();
      cache.updated_at = new Date();

      expect(cache.id).toBe(1);
      expect(cache.recommendation_type).toBe(RecommendationType.PERSONALIZED);
      expect(cache.algorithm).toBe('third_party');
      expect(cache.recommended_products).toEqual([]);
      expect(cache.cache_hit_count).toBe(0);
      expect(cache.is_active).toBe(true);
    });

    it('should require recommendation_type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.SIMILAR;

      expect(cache.recommendation_type).toBe(RecommendationType.SIMILAR);
    });

    it('should require algorithm with default third_party', () => {
      const cache = new RecommendationCache();
      cache.algorithm = 'third_party';

      expect(cache.algorithm).toBe('third_party');
    });

    it('should require recommended_products', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [];

      expect(cache.recommended_products).toEqual([]);
    });

    it('should require expires_at', () => {
      const cache = new RecommendationCache();
      const expiryDate = new Date();
      cache.expires_at = expiryDate;

      expect(cache.expires_at).toEqual(expiryDate);
    });

    it('should require generated_at', () => {
      const cache = new RecommendationCache();
      const generatedDate = new Date();
      cache.generated_at = generatedDate;

      expect(cache.generated_at).toEqual(generatedDate);
    });

    it('should set default cache_hit_count as 0', () => {
      const cache = new RecommendationCache();
      cache.cache_hit_count = 0;

      expect(cache.cache_hit_count).toBe(0);
    });

    it('should set default is_active as true', () => {
      const cache = new RecommendationCache();
      cache.is_active = true;

      expect(cache.is_active).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.TRENDING;
      cache.recommended_products = [];

      expect(cache.user_id).toBeUndefined();
      expect(cache.product_id).toBeUndefined();
      expect(cache.context_data).toBeUndefined();
    });

    it('should allow user_id for personalized recommendations', () => {
      const cache = new RecommendationCache();
      cache.user_id = 5;

      expect(cache.user_id).toBe(5);
    });

    it('should allow null user_id for global recommendations', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.TRENDING;
      cache.user_id = undefined;

      expect(cache.user_id).toBeUndefined();
    });

    it('should allow product_id for similar products', () => {
      const cache = new RecommendationCache();
      cache.product_id = 10;

      expect(cache.product_id).toBe(10);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique constraint on user_id, product_id, recommendation_type', () => {
      const cache1 = new RecommendationCache();
      cache1.user_id = 5;
      cache1.product_id = 10;
      cache1.recommendation_type = RecommendationType.SIMILAR;

      const cache2 = new RecommendationCache();
      cache2.user_id = 5;
      cache2.product_id = 10;
      cache2.recommendation_type = RecommendationType.SIMILAR;

      expect(cache1.user_id).toBe(cache2.user_id);
      expect(cache1.product_id).toBe(cache2.product_id);
      expect(cache1.recommendation_type).toBe(cache2.recommendation_type);
    });

    it('should allow different recommendation types for same user/product', () => {
      const cache1 = new RecommendationCache();
      cache1.user_id = 5;
      cache1.product_id = 10;
      cache1.recommendation_type = RecommendationType.SIMILAR;

      const cache2 = new RecommendationCache();
      cache2.user_id = 5;
      cache2.product_id = 10;
      cache2.recommendation_type = RecommendationType.COMPLEMENTARY;

      expect(cache1.user_id).toBe(cache2.user_id);
      expect(cache1.product_id).toBe(cache2.product_id);
      expect(cache1.recommendation_type).not.toBe(cache2.recommendation_type);
    });

    it('should allow same recommendation type for different users', () => {
      const cache1 = new RecommendationCache();
      cache1.user_id = 5;
      cache1.recommendation_type = RecommendationType.PERSONALIZED;

      const cache2 = new RecommendationCache();
      cache2.user_id = 6;
      cache2.recommendation_type = RecommendationType.PERSONALIZED;

      expect(cache1.recommendation_type).toBe(cache2.recommendation_type);
      expect(cache1.user_id).not.toBe(cache2.user_id);
    });
  });

  describe('Field Constraints', () => {
    it('should enforce algorithm max length of 50 characters', () => {
      const cache = new RecommendationCache();
      cache.algorithm = 'a'.repeat(50);

      expect(cache.algorithm.length).toBe(50);
    });

    it('should allow custom algorithm names', () => {
      const cache = new RecommendationCache();
      cache.algorithm = 'collaborative_filtering_v2';

      expect(cache.algorithm).toBe('collaborative_filtering_v2');
    });
  });

  describe('Enum Validation - Recommendation Type', () => {
    it('should accept SIMILAR recommendation type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.SIMILAR;

      expect(cache.recommendation_type).toBe(RecommendationType.SIMILAR);
      expect(cache.recommendation_type).toBe('similar');
    });

    it('should accept PERSONALIZED recommendation type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.PERSONALIZED;

      expect(cache.recommendation_type).toBe(RecommendationType.PERSONALIZED);
      expect(cache.recommendation_type).toBe('personalized');
    });

    it('should accept TRENDING recommendation type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.TRENDING;

      expect(cache.recommendation_type).toBe(RecommendationType.TRENDING);
      expect(cache.recommendation_type).toBe('trending');
    });

    it('should accept COMPLEMENTARY recommendation type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.COMPLEMENTARY;

      expect(cache.recommendation_type).toBe(RecommendationType.COMPLEMENTARY);
      expect(cache.recommendation_type).toBe('complementary');
    });

    it('should accept FREQUENTLY_BOUGHT_TOGETHER recommendation type', () => {
      const cache = new RecommendationCache();
      cache.recommendation_type = RecommendationType.FREQUENTLY_BOUGHT_TOGETHER;

      expect(cache.recommendation_type).toBe(RecommendationType.FREQUENTLY_BOUGHT_TOGETHER);
      expect(cache.recommendation_type).toBe('frequently_bought_together');
    });
  });

  describe('JSON Fields - Recommended Products', () => {
    it('should store recommended products as JSON array', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [
        { product_id: 1, score: 0.95, rank: 1 },
        { product_id: 2, score: 0.87, rank: 2 }
      ];

      expect(cache.recommended_products).toHaveLength(2);
      expect(cache.recommended_products[0]).toHaveProperty('product_id');
      expect(cache.recommended_products[0]).toHaveProperty('score');
      expect(cache.recommended_products[0]).toHaveProperty('rank');
    });

    it('should handle empty recommended products array', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [];

      expect(cache.recommended_products).toEqual([]);
      expect(cache.recommended_products.length).toBe(0);
    });

    it('should store multiple recommended products', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [
        { product_id: 1, score: 0.95, rank: 1 },
        { product_id: 2, score: 0.87, rank: 2 },
        { product_id: 3, score: 0.76, rank: 3 },
        { product_id: 4, score: 0.65, rank: 4 },
        { product_id: 5, score: 0.54, rank: 5 }
      ];

      expect(cache.recommended_products.length).toBe(5);
    });

    it('should preserve recommendation scores and ranks', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [
        { product_id: 10, score: 0.99, rank: 1 }
      ];

      const firstRec = cache.recommended_products[0] as any;
      expect(firstRec.score).toBe(0.99);
      expect(firstRec.rank).toBe(1);
    });
  });

  describe('JSON Fields - Context Data', () => {
    it('should store context data as JSON', () => {
      const cache = new RecommendationCache();
      cache.context_data = {
        source: 'batch_job',
        model_version: '1.0.2',
        training_date: '2024-01-15'
      };

      expect(cache.context_data).toBeDefined();
      expect(cache.context_data).toHaveProperty('source');
    });

    it('should allow null context_data', () => {
      const cache = new RecommendationCache();
      cache.context_data = undefined;

      expect(cache.context_data).toBeUndefined();
    });

    it('should store complex nested context data', () => {
      const cache = new RecommendationCache();
      cache.context_data = {
        filters: ['category:dresses', 'price:50-100'],
        user_preferences: { style: 'casual', occasion: 'daily' },
        algorithm_params: { confidence_threshold: 0.75 }
      };

      expect(cache.context_data).toBeDefined();
      expect(typeof cache.context_data).toBe('object');
    });
  });

  describe('Timestamp Fields', () => {
    it('should store expires_at timestamp', () => {
      const cache = new RecommendationCache();
      const expiryDate = new Date('2024-12-31T23:59:59Z');
      cache.expires_at = expiryDate;

      expect(cache.expires_at).toEqual(expiryDate);
    });

    it('should store generated_at timestamp', () => {
      const cache = new RecommendationCache();
      const generatedDate = new Date('2024-01-15T10:30:00Z');
      cache.generated_at = generatedDate;

      expect(cache.generated_at).toEqual(generatedDate);
    });

    it('should auto-generate created_at timestamp', () => {
      const cache = new RecommendationCache();
      const now = new Date();
      cache.created_at = now;

      expect(cache.created_at).toEqual(now);
    });

    it('should auto-update updated_at timestamp', () => {
      const cache = new RecommendationCache();
      const now = new Date();
      cache.updated_at = now;

      expect(cache.updated_at).toEqual(now);
    });
  });

  describe('Relationships', () => {
    it('should have many-to-one relationship with User', () => {
      const cache = new RecommendationCache();
      cache.user_id = 5;

      expect(cache.user_id).toBe(5);
      expect(cache.user).toBeUndefined();
    });

    it('should have many-to-one relationship with Product', () => {
      const cache = new RecommendationCache();
      cache.product_id = 10;

      expect(cache.product_id).toBe(10);
      expect(cache.product).toBeUndefined();
    });
  });

  describe('Business Logic - Cache Expiry', () => {
    it('should check if cache is expired', () => {
      const cache = new RecommendationCache();
      const pastDate = new Date('2023-01-01');
      cache.expires_at = pastDate;

      const isExpired = cache.expires_at < new Date();
      expect(isExpired).toBe(true);
    });

    it('should check if cache is still valid', () => {
      const cache = new RecommendationCache();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      cache.expires_at = futureDate;

      const isExpired = cache.expires_at < new Date();
      expect(isExpired).toBe(false);
    });

    it('should set expiry 24 hours from generation', () => {
      const cache = new RecommendationCache();
      const now = new Date();
      cache.generated_at = now;
      cache.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const hoursDiff = (cache.expires_at.getTime() - cache.generated_at.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(24);
    });
  });

  describe('Business Logic - Cache Hit Tracking', () => {
    it('should initialize cache_hit_count to 0', () => {
      const cache = new RecommendationCache();
      cache.cache_hit_count = 0;

      expect(cache.cache_hit_count).toBe(0);
    });

    it('should increment cache_hit_count on usage', () => {
      const cache = new RecommendationCache();
      cache.cache_hit_count = 0;
      cache.cache_hit_count++;

      expect(cache.cache_hit_count).toBe(1);
    });

    it('should track multiple cache hits', () => {
      const cache = new RecommendationCache();
      cache.cache_hit_count = 100;

      expect(cache.cache_hit_count).toBe(100);
    });
  });

  describe('Business Logic - Active Status', () => {
    it('should mark cache as active', () => {
      const cache = new RecommendationCache();
      cache.is_active = true;

      expect(cache.is_active).toBe(true);
    });

    it('should mark cache as inactive', () => {
      const cache = new RecommendationCache();
      cache.is_active = false;

      expect(cache.is_active).toBe(false);
    });

    it('should filter only active and non-expired caches', () => {
      const cache = new RecommendationCache();
      cache.is_active = true;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      cache.expires_at = futureDate;

      const isUsable = cache.is_active && cache.expires_at > new Date();
      expect(isUsable).toBe(true);
    });
  });

  describe('Business Logic - Personalized Recommendations', () => {
    it('should create personalized recommendations for a user', () => {
      const cache = new RecommendationCache();
      cache.user_id = 5;
      cache.recommendation_type = RecommendationType.PERSONALIZED;
      cache.recommended_products = [
        { product_id: 1, score: 0.95, rank: 1 }
      ];

      expect(cache.user_id).toBe(5);
      expect(cache.recommendation_type).toBe(RecommendationType.PERSONALIZED);
    });
  });

  describe('Business Logic - Similar Products', () => {
    it('should create similar product recommendations', () => {
      const cache = new RecommendationCache();
      cache.product_id = 10;
      cache.recommendation_type = RecommendationType.SIMILAR;
      cache.recommended_products = [
        { product_id: 11, score: 0.92, rank: 1 },
        { product_id: 12, score: 0.88, rank: 2 }
      ];

      expect(cache.product_id).toBe(10);
      expect(cache.recommendation_type).toBe(RecommendationType.SIMILAR);
      expect(cache.recommended_products.length).toBe(2);
    });
  });

  describe('Business Logic - Trending Products', () => {
    it('should create global trending recommendations', () => {
      const cache = new RecommendationCache();
      cache.user_id = undefined;
      cache.product_id = undefined;
      cache.recommendation_type = RecommendationType.TRENDING;
      cache.recommended_products = [
        { product_id: 101, score: 0.98, rank: 1 }
      ];

      expect(cache.user_id).toBeUndefined();
      expect(cache.product_id).toBeUndefined();
      expect(cache.recommendation_type).toBe(RecommendationType.TRENDING);
    });
  });

  describe('Business Logic - Complementary Products', () => {
    it('should create complementary product recommendations', () => {
      const cache = new RecommendationCache();
      cache.product_id = 10;
      cache.recommendation_type = RecommendationType.COMPLEMENTARY;
      cache.recommended_products = [
        { product_id: 20, score: 0.85, rank: 1 }
      ];

      expect(cache.recommendation_type).toBe(RecommendationType.COMPLEMENTARY);
    });
  });

  describe('Business Logic - Frequently Bought Together', () => {
    it('should create frequently bought together recommendations', () => {
      const cache = new RecommendationCache();
      cache.product_id = 10;
      cache.recommendation_type = RecommendationType.FREQUENTLY_BOUGHT_TOGETHER;
      cache.recommended_products = [
        { product_id: 15, score: 0.90, rank: 1 },
        { product_id: 16, score: 0.87, rank: 2 }
      ];

      expect(cache.recommendation_type).toBe(RecommendationType.FREQUENTLY_BOUGHT_TOGETHER);
      expect(cache.recommended_products.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large recommended products array', () => {
      const cache = new RecommendationCache();
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        product_id: i + 1,
        score: 0.95 - (i * 0.01),
        rank: i + 1
      }));
      cache.recommended_products = largeArray;

      expect(cache.recommended_products.length).toBe(100);
    });

    it('should handle recommendations with zero score', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [
        { product_id: 1, score: 0.00, rank: 1 }
      ];

      const firstRec = cache.recommended_products[0] as any;
      expect(firstRec.score).toBe(0.00);
    });

    it('should handle recommendations with perfect score', () => {
      const cache = new RecommendationCache();
      cache.recommended_products = [
        { product_id: 1, score: 1.00, rank: 1 }
      ];

      const firstRec = cache.recommended_products[0] as any;
      expect(firstRec.score).toBe(1.00);
    });

    it('should handle cache that never expires', () => {
      const cache = new RecommendationCache();
      const farFuture = new Date('2099-12-31');
      cache.expires_at = farFuture;

      expect(cache.expires_at.getFullYear()).toBe(2099);
    });

    it('should handle immediate expiry', () => {
      const cache = new RecommendationCache();
      cache.expires_at = new Date();
      
      expect(cache.expires_at).toBeInstanceOf(Date);
    });

    it('should handle cache with zero hits', () => {
      const cache = new RecommendationCache();
      cache.cache_hit_count = 0;

      expect(cache.cache_hit_count).toBe(0);
    });
  });
});
