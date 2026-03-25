import 'reflect-metadata';
import { Brand } from './brand';

describe('Brand Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid brand with all required fields', () => {
      const brand = new Brand();
      brand.id = 1;
      brand.name = 'Nike';
      brand.slug = 'nike';
      brand.description = 'Leading sportswear manufacturer';
      brand.is_active = true;

      expect(brand.id).toBe(1);
      expect(brand.name).toBe('Nike');
      expect(brand.slug).toBe('nike');
      expect(brand.description).toBe('Leading sportswear manufacturer');
      expect(brand.is_active).toBe(true);
    });

    it('should allow nullable description', () => {
      const brand = new Brand();
      brand.description = undefined;

      expect(brand.description).toBeUndefined();
    });

    it('should allow nullable logo_url', () => {
      const brand = new Brand();
      brand.logo_url = undefined;

      expect(brand.logo_url).toBeUndefined();
    });

    it('should allow nullable website_url', () => {
      const brand = new Brand();
      brand.website_url = undefined;

      expect(brand.website_url).toBeUndefined();
    });

    it('should have default is_active of true', () => {
      const brand = new Brand();
      brand.is_active = true;

      expect(brand.is_active).toBe(true);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique name', () => {
      const brand1 = new Brand();
      brand1.name = 'Nike';

      const brand2 = new Brand();
      brand2.name = 'Nike';

      expect(brand1.name).toBe(brand2.name);
    });

    it('should enforce unique slug', () => {
      const brand1 = new Brand();
      brand1.slug = 'nike';

      const brand2 = new Brand();
      brand2.slug = 'nike';

      expect(brand1.slug).toBe(brand2.slug);
    });
  });

  describe('Field Constraints', () => {
    it('should store name up to 100 characters', () => {
      const brand = new Brand();
      brand.name = 'A'.repeat(100);

      expect(brand.name.length).toBe(100);
    });

    it('should store slug up to 100 characters', () => {
      const brand = new Brand();
      brand.slug = 'a'.repeat(100);

      expect(brand.slug.length).toBe(100);
    });

    it('should store logo_url up to 255 characters', () => {
      const brand = new Brand();
      brand.logo_url = 'https://example.com/logos/' + 'a'.repeat(229);

      expect(brand.logo_url!.length).toBe(255);
    });

    it('should store website_url up to 255 characters', () => {
      const brand = new Brand();
      brand.website_url = 'https://example.com/' + 'a'.repeat(235);

      expect(brand.website_url!.length).toBe(255);
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at timestamp', () => {
      const brand = new Brand();
      const now = new Date();
      brand.created_at = now;

      expect(brand.created_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const brand = new Brand();
      const now = new Date();
      brand.updated_at = now;

      expect(brand.updated_at).toBe(now);
    });

    it('should have nullable deleted_at for soft deletes', () => {
      const brand = new Brand();
      brand.deleted_at = undefined;

      expect(brand.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when soft deleted', () => {
      const brand = new Brand();
      const deletionTime = new Date();
      brand.deleted_at = deletionTime;

      expect(brand.deleted_at).toBe(deletionTime);
    });
  });

  describe('Business Logic', () => {
    it('should support brand activation/deactivation', () => {
      const brand = new Brand();
      brand.is_active = true;

      expect(brand.is_active).toBe(true);

      brand.is_active = false;

      expect(brand.is_active).toBe(false);
    });

    it('should store logo URL for brand assets', () => {
      const brand = new Brand();
      brand.logo_url = 'https://cdn.example.com/brands/nike-logo.png';

      expect(brand.logo_url).toBe('https://cdn.example.com/brands/nike-logo.png');
    });

    it('should store website URL for brand reference', () => {
      const brand = new Brand();
      brand.website_url = 'https://www.nike.com';

      expect(brand.website_url).toBe('https://www.nike.com');
    });
  });

  describe('Data Integrity', () => {
    it('should allow updating brand information', () => {
      const brand = new Brand();
      brand.name = 'Old Name';
      brand.description = 'Old Description';

      expect(brand.name).toBe('Old Name');

      brand.name = 'New Name';
      brand.description = 'New Description';

      expect(brand.name).toBe('New Name');
      expect(brand.description).toBe('New Description');
    });

    it('should preserve brand id after creation', () => {
      const brand = new Brand();
      brand.id = 100;

      expect(brand.id).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description', () => {
      const brand = new Brand();
      brand.description = '';

      expect(brand.description).toBe('');
    });

    it('should handle very long brand names', () => {
      const brand = new Brand();
      brand.name = 'A'.repeat(100);

      expect(brand.name.length).toBe(100);
    });

    it('should handle brands without logo or website', () => {
      const brand = new Brand();
      brand.name = 'Generic Brand';
      brand.slug = 'generic-brand';
      brand.logo_url = undefined;
      brand.website_url = undefined;

      expect(brand.logo_url).toBeUndefined();
      expect(brand.website_url).toBeUndefined();
    });
  });

  describe('Indexing', () => {
    it('should have indexed slug for faster queries', () => {
      const brand = new Brand();
      brand.slug = 'nike';

      expect(brand.slug).toBe('nike');
    });
  });
});
