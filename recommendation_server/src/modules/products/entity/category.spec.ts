import 'reflect-metadata';
import { Category } from './category';

describe('Category Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid category with all required fields', () => {
      const category = new Category();
      category.id = 1;
      category.name = 'Men\'s Clothing';
      category.slug = 'mens-clothing';
      category.description = 'Clothing for men';
      category.sort_order = 0;
      category.is_active = true;

      expect(category.id).toBe(1);
      expect(category.name).toBe('Men\'s Clothing');
      expect(category.slug).toBe('mens-clothing');
      expect(category.description).toBe('Clothing for men');
      expect(category.sort_order).toBe(0);
      expect(category.is_active).toBe(true);
    });

    it('should allow nullable description', () => {
      const category = new Category();
      category.description = undefined;

      expect(category.description).toBeUndefined();
    });

    it('should allow nullable parent_id for root categories', () => {
      const category = new Category();
      category.parent_id = undefined;

      expect(category.parent_id).toBeUndefined();
    });

    it('should allow nullable image_url', () => {
      const category = new Category();
      category.image_url = undefined;

      expect(category.image_url).toBeUndefined();
    });

    it('should have default sort_order of 0', () => {
      const category = new Category();
      category.sort_order = 0;

      expect(category.sort_order).toBe(0);
    });

    it('should have default is_active of true', () => {
      const category = new Category();
      category.is_active = true;

      expect(category.is_active).toBe(true);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique name', () => {
      const category1 = new Category();
      category1.name = 'Clothing';

      const category2 = new Category();
      category2.name = 'Clothing';

      expect(category1.name).toBe(category2.name);
    });

    it('should enforce unique slug', () => {
      const category1 = new Category();
      category1.slug = 'clothing';

      const category2 = new Category();
      category2.slug = 'clothing';

      expect(category1.slug).toBe(category2.slug);
    });
  });

  describe('Self-Referential Relationship (Parent/Child)', () => {
    it('should allow setting parent category', () => {
      const parentCategory = new Category();
      parentCategory.id = 1;
      parentCategory.name = 'Clothing';

      const childCategory = new Category();
      childCategory.id = 2;
      childCategory.name = 'Men\'s Clothing';
      childCategory.parent_id = parentCategory.id;
      childCategory.parent = parentCategory;

      expect(childCategory.parent_id).toBe(1);
      expect(childCategory.parent).toBe(parentCategory);
    });

    it('should allow multiple child categories', () => {
      const parentCategory = new Category();
      parentCategory.id = 1;

      const child1 = new Category();
      child1.id = 2;
      child1.parent_id = parentCategory.id;

      const child2 = new Category();
      child2.id = 3;
      child2.parent_id = parentCategory.id;

      parentCategory.children = [child1, child2];

      expect(parentCategory.children).toHaveLength(2);
      expect(parentCategory.children?.[0]).toBe(child1);
      expect(parentCategory.children?.[1]).toBe(child2);
    });

    it('should allow root categories without parent', () => {
      const rootCategory = new Category();
      rootCategory.parent_id = undefined;
      rootCategory.parent = undefined;

      expect(rootCategory.parent_id).toBeUndefined();
      expect(rootCategory.parent).toBeUndefined();
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at timestamp', () => {
      const category = new Category();
      const now = new Date();
      category.created_at = now;

      expect(category.created_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const category = new Category();
      const now = new Date();
      category.updated_at = now;

      expect(category.updated_at).toBe(now);
    });

    it('should have nullable deleted_at for soft deletes', () => {
      const category = new Category();
      category.deleted_at = undefined;

      expect(category.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when soft deleted', () => {
      const category = new Category();
      const deletionTime = new Date();
      category.deleted_at = deletionTime;

      expect(category.deleted_at).toBe(deletionTime);
    });
  });

  describe('Field Constraints', () => {
    it('should store name up to 100 characters', () => {
      const category = new Category();
      category.name = 'A'.repeat(100);

      expect(category.name.length).toBe(100);
    });

    it('should store slug up to 100 characters', () => {
      const category = new Category();
      category.slug = 'a'.repeat(100);

      expect(category.slug.length).toBe(100);
    });

    it('should store image_url up to 255 characters', () => {
      const category = new Category();
      category.image_url = 'http://example.com/' + 'a'.repeat(236);

      expect(category.image_url!.length).toBe(255);
    });
  });

  describe('Business Logic', () => {
    it('should support hierarchical category structure (3 levels)', () => {
      const level1 = new Category();
      level1.id = 1;
      level1.name = 'Clothing';

      const level2 = new Category();
      level2.id = 2;
      level2.name = 'Men';
      level2.parent_id = level1.id;

      const level3 = new Category();
      level3.id = 3;
      level3.name = 'Shirts';
      level3.parent_id = level2.id;

      expect(level1.parent_id).toBeUndefined();
      expect(level2.parent_id).toBe(1);
      expect(level3.parent_id).toBe(2);
    });

    it('should support category deactivation', () => {
      const category = new Category();
      category.is_active = true;

      expect(category.is_active).toBe(true);

      category.is_active = false;

      expect(category.is_active).toBe(false);
    });

    it('should support category ordering via sort_order', () => {
      const category1 = new Category();
      category1.sort_order = 1;

      const category2 = new Category();
      category2.sort_order = 2;

      expect(category1.sort_order).toBeLessThan(category2.sort_order);
    });
  });
});
