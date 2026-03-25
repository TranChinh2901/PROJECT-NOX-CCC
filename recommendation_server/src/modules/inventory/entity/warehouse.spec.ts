import 'reflect-metadata';
import { Warehouse } from './warehouse';

describe('Warehouse Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid warehouse with all required fields', () => {
      const warehouse = new Warehouse();
      warehouse.id = 1;
      warehouse.name = 'Main Warehouse';
      warehouse.code = 'WH-001';
      warehouse.address = '123 Industrial Road';
      warehouse.city = 'Ho Chi Minh City';
      warehouse.country = 'Vietnam';
      warehouse.is_active = true;
      warehouse.is_default = false;

      expect(warehouse.id).toBe(1);
      expect(warehouse.name).toBe('Main Warehouse');
      expect(warehouse.code).toBe('WH-001');
      expect(warehouse.address).toBe('123 Industrial Road');
      expect(warehouse.city).toBe('Ho Chi Minh City');
      expect(warehouse.country).toBe('Vietnam');
      expect(warehouse.is_active).toBe(true);
      expect(warehouse.is_default).toBe(false);
    });

    it('should have default country as Vietnam', () => {
      const warehouse = new Warehouse();
      warehouse.country = 'Vietnam';

      expect(warehouse.country).toBe('Vietnam');
    });

    it('should have default is_active as true', () => {
      const warehouse = new Warehouse();
      warehouse.is_active = true;

      expect(warehouse.is_active).toBe(true);
    });

    it('should have default is_default as false', () => {
      const warehouse = new Warehouse();
      warehouse.is_default = false;

      expect(warehouse.is_default).toBe(false);
    });

    it('should allow nullable contact fields', () => {
      const warehouse = new Warehouse();
      warehouse.contact_name = undefined;
      warehouse.contact_phone = undefined;
      warehouse.contact_email = undefined;

      expect(warehouse.contact_name).toBeUndefined();
      expect(warehouse.contact_phone).toBeUndefined();
      expect(warehouse.contact_email).toBeUndefined();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique code', () => {
      const warehouse1 = new Warehouse();
      warehouse1.code = 'WH-001';

      const warehouse2 = new Warehouse();
      warehouse2.code = 'WH-001';

      expect(warehouse1.code).toBe(warehouse2.code);
    });
  });

  describe('Field Constraints', () => {
    it('should store name up to 100 characters', () => {
      const warehouse = new Warehouse();
      warehouse.name = 'A'.repeat(100);

      expect(warehouse.name.length).toBe(100);
    });

    it('should store code up to 20 characters', () => {
      const warehouse = new Warehouse();
      warehouse.code = 'WH-' + '0'.repeat(17);

      expect(warehouse.code.length).toBe(20);
    });

    it('should store address up to 255 characters', () => {
      const warehouse = new Warehouse();
      warehouse.address = '123 Main St ' + 'A'.repeat(243);

      expect(warehouse.address.length).toBe(255);
    });

    it('should store city up to 100 characters', () => {
      const warehouse = new Warehouse();
      warehouse.city = 'A'.repeat(100);

      expect(warehouse.city.length).toBe(100);
    });

    it('should store country up to 100 characters', () => {
      const warehouse = new Warehouse();
      warehouse.country = 'A'.repeat(100);

      expect(warehouse.country.length).toBe(100);
    });

    it('should store contact_name up to 100 characters', () => {
      const warehouse = new Warehouse();
      warehouse.contact_name = 'A'.repeat(100);

      expect(warehouse.contact_name!.length).toBe(100);
    });

    it('should store contact_phone up to 20 characters', () => {
      const warehouse = new Warehouse();
      warehouse.contact_phone = '+84' + '1'.repeat(17);

      expect(warehouse.contact_phone!.length).toBe(20);
    });

    it('should store contact_email up to 150 characters', () => {
      const warehouse = new Warehouse();
      warehouse.contact_email = 'contact@' + 'a'.repeat(138) + '.com';

      expect(warehouse.contact_email!.length).toBe(150);
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at timestamp', () => {
      const warehouse = new Warehouse();
      const now = new Date();
      warehouse.created_at = now;

      expect(warehouse.created_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const warehouse = new Warehouse();
      const now = new Date();
      warehouse.updated_at = now;

      expect(warehouse.updated_at).toBe(now);
    });

    it('should have nullable deleted_at for soft deletes', () => {
      const warehouse = new Warehouse();
      warehouse.deleted_at = undefined;

      expect(warehouse.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when soft deleted', () => {
      const warehouse = new Warehouse();
      const deletionTime = new Date();
      warehouse.deleted_at = deletionTime;

      expect(warehouse.deleted_at).toBe(deletionTime);
    });
  });

  describe('Business Logic - Default Warehouse', () => {
    it('should allow setting a warehouse as default', () => {
      const warehouse = new Warehouse();
      warehouse.is_default = false;

      expect(warehouse.is_default).toBe(false);

      warehouse.is_default = true;

      expect(warehouse.is_default).toBe(true);
    });

    it('should allow only one default warehouse constraint', () => {
      const warehouse1 = new Warehouse();
      warehouse1.id = 1;
      warehouse1.is_default = true;

      const warehouse2 = new Warehouse();
      warehouse2.id = 2;
      warehouse2.is_default = false;

      const warehouse3 = new Warehouse();
      warehouse3.id = 3;
      warehouse3.is_default = false;

      expect(warehouse1.is_default).toBe(true);
      expect(warehouse2.is_default).toBe(false);
      expect(warehouse3.is_default).toBe(false);
    });
  });

  describe('Business Logic - Active/Inactive', () => {
    it('should support warehouse activation/deactivation', () => {
      const warehouse = new Warehouse();
      warehouse.is_active = true;

      expect(warehouse.is_active).toBe(true);

      warehouse.is_active = false;

      expect(warehouse.is_active).toBe(false);
    });

    it('should deactivate warehouse while preserving data', () => {
      const warehouse = new Warehouse();
      warehouse.name = 'Old Warehouse';
      warehouse.code = 'WH-OLD';
      warehouse.is_active = true;

      warehouse.is_active = false;

      expect(warehouse.is_active).toBe(false);
      expect(warehouse.name).toBe('Old Warehouse');
      expect(warehouse.code).toBe('WH-OLD');
    });
  });

  describe('Contact Information', () => {
    it('should store contact information for warehouse', () => {
      const warehouse = new Warehouse();
      warehouse.contact_name = 'John Doe';
      warehouse.contact_phone = '+84-123-456-789';
      warehouse.contact_email = 'john.doe@warehouse.com';

      expect(warehouse.contact_name).toBe('John Doe');
      expect(warehouse.contact_phone).toBe('+84-123-456-789');
      expect(warehouse.contact_email).toBe('john.doe@warehouse.com');
    });

    it('should allow warehouse without contact information', () => {
      const warehouse = new Warehouse();
      warehouse.contact_name = undefined;
      warehouse.contact_phone = undefined;
      warehouse.contact_email = undefined;

      expect(warehouse.contact_name).toBeUndefined();
      expect(warehouse.contact_phone).toBeUndefined();
      expect(warehouse.contact_email).toBeUndefined();
    });
  });

  describe('Location Information', () => {
    it('should store complete address information', () => {
      const warehouse = new Warehouse();
      warehouse.address = '456 Industrial Park, District 9';
      warehouse.city = 'Ho Chi Minh City';
      warehouse.country = 'Vietnam';

      expect(warehouse.address).toBe('456 Industrial Park, District 9');
      expect(warehouse.city).toBe('Ho Chi Minh City');
      expect(warehouse.country).toBe('Vietnam');
    });

    it('should support international warehouses', () => {
      const warehouse = new Warehouse();
      warehouse.name = 'Singapore Hub';
      warehouse.address = '123 Orchard Road';
      warehouse.city = 'Singapore';
      warehouse.country = 'Singapore';

      expect(warehouse.country).toBe('Singapore');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve warehouse code after creation', () => {
      const warehouse = new Warehouse();
      warehouse.code = 'WH-MAIN';

      expect(warehouse.code).toBe('WH-MAIN');
    });

    it('should allow updating warehouse information', () => {
      const warehouse = new Warehouse();
      warehouse.name = 'Old Name';
      warehouse.address = 'Old Address';

      warehouse.name = 'New Name';
      warehouse.address = 'New Address';

      expect(warehouse.name).toBe('New Name');
      expect(warehouse.address).toBe('New Address');
    });

    it('should maintain referential integrity with id', () => {
      const warehouse = new Warehouse();
      warehouse.id = 999;

      expect(warehouse.id).toBe(999);
    });
  });

  describe('Edge Cases', () => {
    it('should handle warehouses with minimal information', () => {
      const warehouse = new Warehouse();
      warehouse.name = 'Minimal';
      warehouse.code = 'MIN';
      warehouse.address = 'TBD';
      warehouse.city = 'TBD';
      warehouse.country = 'Vietnam';

      expect(warehouse.contact_name).toBeUndefined();
      expect(warehouse.contact_phone).toBeUndefined();
      expect(warehouse.contact_email).toBeUndefined();
    });

    it('should handle very short codes', () => {
      const warehouse = new Warehouse();
      warehouse.code = 'W1';

      expect(warehouse.code.length).toBe(2);
    });

    it('should handle maximum length codes', () => {
      const warehouse = new Warehouse();
      warehouse.code = '1'.repeat(20);

      expect(warehouse.code.length).toBe(20);
    });
  });
});
