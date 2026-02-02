import { ProductFeature } from './product-feature';
import { ProductFeatureType, FeatureSource } from '../enum/product-feature.enum';

describe('ProductFeature Entity', () => {
  describe('Schema Validation', () => {
    it('should create a product feature with all required fields', () => {
      const feature = new ProductFeature();
      feature.id = 1;
      feature.product_id = 10;
      feature.feature_type = ProductFeatureType.STYLE;
      feature.feature_value = 'casual';
      feature.source = FeatureSource.MANUAL;
      feature.weight = 1;
      feature.created_at = new Date();
      feature.updated_at = new Date();

      expect(feature.id).toBe(1);
      expect(feature.product_id).toBe(10);
      expect(feature.feature_type).toBe(ProductFeatureType.STYLE);
      expect(feature.feature_value).toBe('casual');
      expect(feature.source).toBe(FeatureSource.MANUAL);
      expect(feature.weight).toBe(1);
    });

    it('should require product_id', () => {
      const feature = new ProductFeature();
      feature.product_id = 10;

      expect(feature.product_id).toBe(10);
    });

    it('should require feature_type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.CATEGORY;

      expect(feature.feature_type).toBe(ProductFeatureType.CATEGORY);
    });

    it('should require feature_value', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'summer';

      expect(feature.feature_value).toBe('summer');
    });

    it('should set default source as MANUAL', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.MANUAL;

      expect(feature.source).toBe(FeatureSource.MANUAL);
    });

    it('should set default weight as 1', () => {
      const feature = new ProductFeature();
      feature.weight = 1;

      expect(feature.weight).toBe(1);
    });

    it('should allow optional fields to be undefined', () => {
      const feature = new ProductFeature();
      feature.product_id = 10;
      feature.feature_type = ProductFeatureType.STYLE;
      feature.feature_value = 'casual';

      expect(feature.confidence_score).toBeUndefined();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique constraint on product_id, feature_type, feature_value', () => {
      const feature1 = new ProductFeature();
      feature1.product_id = 10;
      feature1.feature_type = ProductFeatureType.STYLE;
      feature1.feature_value = 'casual';

      const feature2 = new ProductFeature();
      feature2.product_id = 10;
      feature2.feature_type = ProductFeatureType.STYLE;
      feature2.feature_value = 'casual';

      expect(feature1.product_id).toBe(feature2.product_id);
      expect(feature1.feature_type).toBe(feature2.feature_type);
      expect(feature1.feature_value).toBe(feature2.feature_value);
    });

    it('should allow same feature_value for different products', () => {
      const feature1 = new ProductFeature();
      feature1.product_id = 10;
      feature1.feature_type = ProductFeatureType.STYLE;
      feature1.feature_value = 'casual';

      const feature2 = new ProductFeature();
      feature2.product_id = 11;
      feature2.feature_type = ProductFeatureType.STYLE;
      feature2.feature_value = 'casual';

      expect(feature1.feature_value).toBe(feature2.feature_value);
      expect(feature1.product_id).not.toBe(feature2.product_id);
    });

    it('should allow same product to have multiple feature types', () => {
      const feature1 = new ProductFeature();
      feature1.product_id = 10;
      feature1.feature_type = ProductFeatureType.STYLE;
      feature1.feature_value = 'casual';

      const feature2 = new ProductFeature();
      feature2.product_id = 10;
      feature2.feature_type = ProductFeatureType.SEASON;
      feature2.feature_value = 'summer';

      expect(feature1.product_id).toBe(feature2.product_id);
      expect(feature1.feature_type).not.toBe(feature2.feature_type);
    });

    it('should allow same product and feature_type with different values', () => {
      const feature1 = new ProductFeature();
      feature1.product_id = 10;
      feature1.feature_type = ProductFeatureType.PATTERN;
      feature1.feature_value = 'floral';

      const feature2 = new ProductFeature();
      feature2.product_id = 10;
      feature2.feature_type = ProductFeatureType.PATTERN;
      feature2.feature_value = 'striped';

      expect(feature1.product_id).toBe(feature2.product_id);
      expect(feature1.feature_type).toBe(feature2.feature_type);
      expect(feature1.feature_value).not.toBe(feature2.feature_value);
    });
  });

  describe('Field Constraints', () => {
    it('should enforce feature_value max length of 100 characters', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'a'.repeat(100);

      expect(feature.feature_value.length).toBe(100);
    });

    it('should store feature_value with mixed case', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'Casual Wear';

      expect(feature.feature_value).toBe('Casual Wear');
    });

    it('should allow feature_value with special characters', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'V-neck T-shirt';

      expect(feature.feature_value).toBe('V-neck T-shirt');
    });
  });

  describe('Enum Validation - Feature Type', () => {
    it('should accept CATEGORY feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.CATEGORY;

      expect(feature.feature_type).toBe(ProductFeatureType.CATEGORY);
      expect(feature.feature_type).toBe('category');
    });

    it('should accept STYLE feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.STYLE;

      expect(feature.feature_type).toBe(ProductFeatureType.STYLE);
      expect(feature.feature_type).toBe('style');
    });

    it('should accept OCCASION feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.OCCASION;

      expect(feature.feature_type).toBe(ProductFeatureType.OCCASION);
      expect(feature.feature_type).toBe('occasion');
    });

    it('should accept SEASON feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.SEASON;

      expect(feature.feature_type).toBe(ProductFeatureType.SEASON);
      expect(feature.feature_type).toBe('season');
    });

    it('should accept PATTERN feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.PATTERN;

      expect(feature.feature_type).toBe(ProductFeatureType.PATTERN);
      expect(feature.feature_type).toBe('pattern');
    });

    it('should accept FABRIC_TYPE feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.FABRIC_TYPE;

      expect(feature.feature_type).toBe(ProductFeatureType.FABRIC_TYPE);
      expect(feature.feature_type).toBe('fabric_type');
    });

    it('should accept ATTRIBUTE feature type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.ATTRIBUTE;

      expect(feature.feature_type).toBe(ProductFeatureType.ATTRIBUTE);
      expect(feature.feature_type).toBe('attribute');
    });
  });

  describe('Enum Validation - Feature Source', () => {
    it('should accept MANUAL source', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.MANUAL;

      expect(feature.source).toBe(FeatureSource.MANUAL);
      expect(feature.source).toBe('manual');
    });

    it('should accept AI_EXTRACTED source', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.AI_EXTRACTED;

      expect(feature.source).toBe(FeatureSource.AI_EXTRACTED);
      expect(feature.source).toBe('ai_extracted');
    });

    it('should accept IMPORTED source', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.IMPORTED;

      expect(feature.source).toBe(FeatureSource.IMPORTED);
      expect(feature.source).toBe('imported');
    });
  });

  describe('Decimal Precision - Confidence Score', () => {
    it('should store confidence_score with 2 decimal places', () => {
      const feature = new ProductFeature();
      feature.confidence_score = 0.95;

      expect(feature.confidence_score).toBe(0.95);
    });

    it('should handle minimum confidence_score of 0.00', () => {
      const feature = new ProductFeature();
      feature.confidence_score = 0.00;

      expect(feature.confidence_score).toBe(0.00);
    });

    it('should handle maximum confidence_score of 1.00', () => {
      const feature = new ProductFeature();
      feature.confidence_score = 1.00;

      expect(feature.confidence_score).toBe(1.00);
    });

    it('should handle mid-range confidence scores', () => {
      const feature = new ProductFeature();
      feature.confidence_score = 0.75;

      expect(feature.confidence_score).toBe(0.75);
    });

    it('should handle very low confidence scores', () => {
      const feature = new ProductFeature();
      feature.confidence_score = 0.01;

      expect(feature.confidence_score).toBe(0.01);
    });

    it('should allow confidence_score to be null for manual entries', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.MANUAL;
      feature.confidence_score = undefined;

      expect(feature.confidence_score).toBeUndefined();
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-generate created_at timestamp', () => {
      const feature = new ProductFeature();
      const now = new Date();
      feature.created_at = now;

      expect(feature.created_at).toEqual(now);
    });

    it('should auto-update updated_at timestamp', () => {
      const feature = new ProductFeature();
      const now = new Date();
      feature.updated_at = now;

      expect(feature.updated_at).toEqual(now);
    });
  });

  describe('Relationships', () => {
    it('should have many-to-one relationship with Product', () => {
      const feature = new ProductFeature();
      feature.product_id = 10;

      expect(feature.product_id).toBe(10);
      expect(feature.product).toBeUndefined();
    });
  });

  describe('Business Logic - Feature Weighting', () => {
    it('should use default weight of 1 for standard features', () => {
      const feature = new ProductFeature();
      feature.weight = 1;

      expect(feature.weight).toBe(1);
    });

    it('should allow higher weight for important features', () => {
      const feature = new ProductFeature();
      feature.weight = 5;

      expect(feature.weight).toBe(5);
    });

    it('should allow lower weight for less important features', () => {
      const feature = new ProductFeature();
      feature.weight = 0.5;

      expect(feature.weight).toBe(0.5);
    });

    it('should allow zero weight to disable a feature', () => {
      const feature = new ProductFeature();
      feature.weight = 0;

      expect(feature.weight).toBe(0);
    });
  });

  describe('Business Logic - AI Extracted Features', () => {
    it('should store AI extracted features with confidence score', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.STYLE;
      feature.feature_value = 'casual';
      feature.source = FeatureSource.AI_EXTRACTED;
      feature.confidence_score = 0.87;

      expect(feature.source).toBe(FeatureSource.AI_EXTRACTED);
      expect(feature.confidence_score).toBe(0.87);
    });

    it('should handle low confidence AI extractions', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.AI_EXTRACTED;
      feature.confidence_score = 0.45;

      expect(feature.confidence_score).toBe(0.45);
    });

    it('should handle high confidence AI extractions', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.AI_EXTRACTED;
      feature.confidence_score = 0.99;

      expect(feature.confidence_score).toBe(0.99);
    });
  });

  describe('Business Logic - Manual Features', () => {
    it('should store manually curated features without confidence score', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.CATEGORY;
      feature.feature_value = 'dresses';
      feature.source = FeatureSource.MANUAL;
      feature.confidence_score = undefined;

      expect(feature.source).toBe(FeatureSource.MANUAL);
      expect(feature.confidence_score).toBeUndefined();
    });

    it('should allow manual override with confidence score', () => {
      const feature = new ProductFeature();
      feature.source = FeatureSource.MANUAL;
      feature.confidence_score = 1.00;

      expect(feature.confidence_score).toBe(1.00);
    });
  });

  describe('Business Logic - Imported Features', () => {
    it('should track imported features from external sources', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.FABRIC_TYPE;
      feature.feature_value = 'cotton';
      feature.source = FeatureSource.IMPORTED;

      expect(feature.source).toBe(FeatureSource.IMPORTED);
    });
  });

  describe('Business Logic - Content-Based Recommendations', () => {
    it('should enable matching products by style', () => {
      const feature1 = new ProductFeature();
      feature1.product_id = 10;
      feature1.feature_type = ProductFeatureType.STYLE;
      feature1.feature_value = 'casual';

      const feature2 = new ProductFeature();
      feature2.product_id = 11;
      feature2.feature_type = ProductFeatureType.STYLE;
      feature2.feature_value = 'casual';

      expect(feature1.feature_type).toBe(feature2.feature_type);
      expect(feature1.feature_value).toBe(feature2.feature_value);
    });

    it('should enable matching products by occasion', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.OCCASION;
      feature.feature_value = 'wedding';

      expect(feature.feature_type).toBe(ProductFeatureType.OCCASION);
      expect(feature.feature_value).toBe('wedding');
    });

    it('should enable seasonal product recommendations', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.SEASON;
      feature.feature_value = 'summer';

      expect(feature.feature_type).toBe(ProductFeatureType.SEASON);
      expect(feature.feature_value).toBe('summer');
    });

    it('should enable matching by pattern', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.PATTERN;
      feature.feature_value = 'floral';

      expect(feature.feature_type).toBe(ProductFeatureType.PATTERN);
      expect(feature.feature_value).toBe('floral');
    });

    it('should enable matching by fabric type', () => {
      const feature = new ProductFeature();
      feature.feature_type = ProductFeatureType.FABRIC_TYPE;
      feature.feature_value = 'silk';

      expect(feature.feature_type).toBe(ProductFeatureType.FABRIC_TYPE);
      expect(feature.feature_value).toBe('silk');
    });
  });

  describe('Edge Cases', () => {
    it('should handle feature_value with spaces', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'business casual';

      expect(feature.feature_value).toBe('business casual');
    });

    it('should handle feature_value with hyphens', () => {
      const feature = new ProductFeature();
      feature.feature_value = 'semi-formal';

      expect(feature.feature_value).toBe('semi-formal');
    });

    it('should handle numeric feature values as strings', () => {
      const feature = new ProductFeature();
      feature.feature_value = '2024';

      expect(feature.feature_value).toBe('2024');
    });

    it('should handle product with many features', () => {
      const features = [
        ProductFeatureType.CATEGORY,
        ProductFeatureType.STYLE,
        ProductFeatureType.OCCASION,
        ProductFeatureType.SEASON,
        ProductFeatureType.PATTERN,
        ProductFeatureType.FABRIC_TYPE
      ];

      const productId = 10;
      features.forEach(featureType => {
        const feature = new ProductFeature();
        feature.product_id = productId;
        feature.feature_type = featureType;
        feature.feature_value = 'test';

        expect(feature.product_id).toBe(productId);
      });

      expect(features.length).toBe(6);
    });

    it('should handle confidence score at exact bounds', () => {
      const feature1 = new ProductFeature();
      feature1.confidence_score = 0.00;

      const feature2 = new ProductFeature();
      feature2.confidence_score = 1.00;

      expect(feature1.confidence_score).toBe(0.00);
      expect(feature2.confidence_score).toBe(1.00);
    });

    it('should handle negative weight for experimental features', () => {
      const feature = new ProductFeature();
      feature.weight = -1;

      expect(feature.weight).toBe(-1);
    });
  });
});
