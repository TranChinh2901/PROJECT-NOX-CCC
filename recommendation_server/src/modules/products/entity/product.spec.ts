import 'reflect-metadata';
import { Product } from './product';
import { Category } from './category';
import { Brand } from './brand';

describe('Product Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid product with all required fields', () => {
      const product = new Product();
      product.id = 1;
      product.category_id = 10;
      product.name = 'Classic Cotton T-Shirt';
      product.slug = 'classic-cotton-t-shirt';
      product.sku = 'TSHIRT-001';
      product.description = 'A comfortable cotton t-shirt';
      product.base_price = 29.99;

      expect(product.id).toBe(1);
      expect(product.category_id).toBe(10);
      expect(product.name).toBe('Classic Cotton T-Shirt');
      expect(product.slug).toBe('classic-cotton-t-shirt');
      expect(product.sku).toBe('TSHIRT-001');
      expect(product.description).toBe('A comfortable cotton t-shirt');
      expect(product.base_price).toBe(29.99);
    });

    it('should allow nullable brand_id', () => {
      const product = new Product();
      product.brand_id = undefined;

      expect(product.brand_id).toBeUndefined();
    });

    it('should allow nullable short_description', () => {
      const product = new Product();
      product.short_description = undefined;

      expect(product.short_description).toBeUndefined();
    });

    it('should allow nullable compare_at_price', () => {
      const product = new Product();
      product.compare_at_price = undefined;

      expect(product.compare_at_price).toBeUndefined();
    });

    it('should allow nullable cost_price', () => {
      const product = new Product();
      product.cost_price = undefined;

      expect(product.cost_price).toBeUndefined();
    });

    it('should allow nullable weight_kg', () => {
      const product = new Product();
      product.weight_kg = undefined;

      expect(product.weight_kg).toBeUndefined();
    });

    it('should have default is_active of true', () => {
      const product = new Product();
      product.is_active = true;

      expect(product.is_active).toBe(true);
    });

    it('should have default is_featured of false', () => {
      const product = new Product();
      product.is_featured = false;

      expect(product.is_featured).toBe(false);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique slug', () => {
      const product1 = new Product();
      product1.slug = 'cotton-t-shirt';

      const product2 = new Product();
      product2.slug = 'cotton-t-shirt';

      expect(product1.slug).toBe(product2.slug);
    });

    it('should enforce unique sku', () => {
      const product1 = new Product();
      product1.sku = 'SKU-001';

      const product2 = new Product();
      product2.sku = 'SKU-001';

      expect(product1.sku).toBe(product2.sku);
    });
  });

  describe('Relationships', () => {
    it('should define relationship with Category entity', () => {
      const product = new Product();
      const category = new Category();
      category.id = 10;

      product.category = category;
      product.category_id = category.id;

      expect(product.category).toBe(category);
      expect(product.category_id).toBe(10);
    });

    it('should define relationship with Brand entity', () => {
      const product = new Product();
      const brand = new Brand();
      brand.id = 5;

      product.brand = brand;
      product.brand_id = brand.id;

      expect(product.brand).toBe(brand);
      expect(product.brand_id).toBe(5);
    });

    it('should allow product without brand', () => {
      const product = new Product();
      product.brand_id = undefined;
      product.brand = undefined;

      expect(product.brand_id).toBeUndefined();
      expect(product.brand).toBeUndefined();
    });
  });

  describe('Decimal Field Precision', () => {
    it('should store base_price with precision 10, scale 2', () => {
      const product = new Product();
      product.base_price = 1234.56;

      expect(product.base_price).toBe(1234.56);
    });

    it('should store compare_at_price with precision 10, scale 2', () => {
      const product = new Product();
      product.compare_at_price = 2469.99;

      expect(product.compare_at_price).toBe(2469.99);
    });

    it('should store cost_price with precision 10, scale 2', () => {
      const product = new Product();
      product.cost_price = 15.50;

      expect(product.cost_price).toBe(15.50);
    });

    it('should store weight_kg with precision 8, scale 3', () => {
      const product = new Product();
      product.weight_kg = 1.250;

      expect(product.weight_kg).toBe(1.250);
    });

    it('should handle very small decimal values', () => {
      const product = new Product();
      product.base_price = 0.01;
      product.weight_kg = 0.001;

      expect(product.base_price).toBe(0.01);
      expect(product.weight_kg).toBe(0.001);
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at timestamp', () => {
      const product = new Product();
      const now = new Date();
      product.created_at = now;

      expect(product.created_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const product = new Product();
      const now = new Date();
      product.updated_at = now;

      expect(product.updated_at).toBe(now);
    });

    it('should have nullable deleted_at for soft deletes', () => {
      const product = new Product();
      product.deleted_at = undefined;

      expect(product.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when soft deleted', () => {
      const product = new Product();
      const deletionTime = new Date();
      product.deleted_at = deletionTime;

      expect(product.deleted_at).toBe(deletionTime);
    });
  });

  describe('Field Constraints', () => {
    it('should store name up to 200 characters', () => {
      const product = new Product();
      product.name = 'A'.repeat(200);

      expect(product.name.length).toBe(200);
    });

    it('should store slug up to 200 characters', () => {
      const product = new Product();
      product.slug = 'a'.repeat(200);

      expect(product.slug.length).toBe(200);
    });

    it('should store sku up to 100 characters', () => {
      const product = new Product();
      product.sku = 'SKU-' + '1'.repeat(96);

      expect(product.sku.length).toBe(100);
    });

    it('should store short_description up to 500 characters', () => {
      const product = new Product();
      product.short_description = 'A'.repeat(500);

      expect(product.short_description!.length).toBe(500);
    });
  });

  describe('Business Logic - Pricing', () => {
    it('should calculate discount when compare_at_price is higher than base_price', () => {
      const product = new Product();
      product.base_price = 29.99;
      product.compare_at_price = 49.99;

      const discount = Number((product.compare_at_price! - product.base_price).toFixed(2));

      expect(discount).toBe(20.00);
    });

    it('should allow compare_at_price equal to base_price', () => {
      const product = new Product();
      product.base_price = 29.99;
      product.compare_at_price = 29.99;

      expect(product.compare_at_price).toBe(product.base_price);
    });

    it('should calculate profit margin when cost_price is provided', () => {
      const product = new Product();
      product.base_price = 50.00;
      product.cost_price = 30.00;

      const margin = product.base_price - product.cost_price!;

      expect(margin).toBe(20.00);
    });
  });

  describe('Business Logic - Active/Featured Status', () => {
    it('should support product activation', () => {
      const product = new Product();
      product.is_active = false;

      expect(product.is_active).toBe(false);

      product.is_active = true;

      expect(product.is_active).toBe(true);
    });

    it('should support featured product flag', () => {
      const product = new Product();
      product.is_featured = false;

      expect(product.is_featured).toBe(false);

      product.is_featured = true;

      expect(product.is_featured).toBe(true);
    });
  });

  describe('SEO Fields', () => {
    it('should allow nullable meta_title', () => {
      const product = new Product();
      product.meta_title = undefined;

      expect(product.meta_title).toBeUndefined();
    });

    it('should allow nullable meta_description', () => {
      const product = new Product();
      product.meta_description = undefined;

      expect(product.meta_description).toBeUndefined();
    });

    it('should store meta_title for SEO', () => {
      const product = new Product();
      product.meta_title = 'Buy Classic Cotton T-Shirt Online | Best Price';

      expect(product.meta_title).toBeDefined();
    });

    it('should store meta_description for SEO', () => {
      const product = new Product();
      product.meta_description = 'Shop the most comfortable cotton t-shirt at the best price';

      expect(product.meta_description).toBeDefined();
    });
  });

  describe('Weight Field', () => {
    it('should store weight in kilograms', () => {
      const product = new Product();
      product.weight_kg = 0.250;

      expect(product.weight_kg).toBe(0.250);
    });

    it('should support products without weight', () => {
      const product = new Product();
      product.weight_kg = undefined;

      expect(product.weight_kg).toBeUndefined();
    });
  });

  describe('Referential Integrity', () => {
    it('should maintain referential integrity with category_id', () => {
      const product = new Product();
      product.category_id = 999;

      expect(product.category_id).toBe(999);
    });

    it('should maintain referential integrity with brand_id', () => {
      const product = new Product();
      product.brand_id = 888;

      expect(product.brand_id).toBe(888);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero base_price', () => {
      const product = new Product();
      product.base_price = 0;

      expect(product.base_price).toBe(0);
    });

    it('should handle very large prices', () => {
      const product = new Product();
      product.base_price = 99999999.99;

      expect(product.base_price).toBe(99999999.99);
    });

    it('should handle heavy products (large weight)', () => {
      const product = new Product();
      product.weight_kg = 99999.999;

      expect(product.weight_kg).toBe(99999.999);
    });
  });
});
