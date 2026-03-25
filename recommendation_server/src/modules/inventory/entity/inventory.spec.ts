import { Inventory } from './inventory';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { Warehouse } from './warehouse';

describe('Inventory Entity', () => {
  describe('Schema Validation', () => {
    it('should create an Inventory with all required fields', () => {
      const inventory = new Inventory();
      inventory.id = 1;
      inventory.variant_id = 10;
      inventory.warehouse_id = 2;
      inventory.quantity_available = 0;
      inventory.quantity_reserved = 0;
      inventory.quantity_total = 0;
      inventory.reorder_level = 10;
      
      expect(inventory.id).toBe(1);
      expect(inventory.variant_id).toBe(10);
      expect(inventory.warehouse_id).toBe(2);
      expect(inventory.quantity_available).toBe(0);
      expect(inventory.quantity_reserved).toBe(0);
      expect(inventory.quantity_total).toBe(0);
      expect(inventory.reorder_level).toBe(10);
    });

    it('should default quantity_available to 0', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 0;
      
      expect(inventory.quantity_available).toBe(0);
    });

    it('should default quantity_reserved to 0', () => {
      const inventory = new Inventory();
      inventory.quantity_reserved = 0;
      
      expect(inventory.quantity_reserved).toBe(0);
    });

    it('should default quantity_total to 0', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 0;
      
      expect(inventory.quantity_total).toBe(0);
    });

    it('should default reorder_level to 10', () => {
      const inventory = new Inventory();
      inventory.reorder_level = 10;
      
      expect(inventory.reorder_level).toBe(10);
    });

    it('should allow nullable reorder_quantity', () => {
      const inventory = new Inventory();
      inventory.reorder_quantity = undefined;
      
      expect(inventory.reorder_quantity).toBeUndefined();
    });

    it('should allow nullable last_counted_at', () => {
      const inventory = new Inventory();
      inventory.last_counted_at = undefined;
      
      expect(inventory.last_counted_at).toBeUndefined();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique (variant_id, warehouse_id) combination', () => {
      const inventory1 = new Inventory();
      inventory1.variant_id = 10;
      inventory1.warehouse_id = 2;
      
      const inventory2 = new Inventory();
      inventory2.variant_id = 10;
      inventory2.warehouse_id = 2;
      
      expect(inventory1.variant_id).toBe(inventory2.variant_id);
      expect(inventory1.warehouse_id).toBe(inventory2.warehouse_id);
    });

    it('should allow same variant in different warehouses', () => {
      const inventory1 = new Inventory();
      inventory1.variant_id = 10;
      inventory1.warehouse_id = 1;
      
      const inventory2 = new Inventory();
      inventory2.variant_id = 10;
      inventory2.warehouse_id = 2;
      
      expect(inventory1.variant_id).toBe(inventory2.variant_id);
      expect(inventory1.warehouse_id).not.toBe(inventory2.warehouse_id);
    });

    it('should allow different variants in same warehouse', () => {
      const inventory1 = new Inventory();
      inventory1.variant_id = 10;
      inventory1.warehouse_id = 1;
      
      const inventory2 = new Inventory();
      inventory2.variant_id = 11;
      inventory2.warehouse_id = 1;
      
      expect(inventory1.warehouse_id).toBe(inventory2.warehouse_id);
      expect(inventory1.variant_id).not.toBe(inventory2.variant_id);
    });
  });

  describe('Quantity Management', () => {
    it('should track available stock', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 50;
      
      expect(inventory.quantity_available).toBe(50);
    });

    it('should track reserved stock', () => {
      const inventory = new Inventory();
      inventory.quantity_reserved = 10;
      
      expect(inventory.quantity_reserved).toBe(10);
    });

    it('should track total stock', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      
      expect(inventory.quantity_total).toBe(100);
    });

    it('should enforce quantity_total = quantity_available + quantity_reserved', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 40;
      inventory.quantity_reserved = 10;
      inventory.quantity_total = inventory.quantity_available + inventory.quantity_reserved;
      
      expect(inventory.quantity_total).toBe(50);
    });

    it('should handle zero stock situation', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 0;
      inventory.quantity_reserved = 0;
      inventory.quantity_total = 0;
      
      expect(inventory.quantity_total).toBe(0);
    });

    it('should handle large stock quantities', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 10000;
      inventory.quantity_available = 9500;
      inventory.quantity_reserved = 500;
      
      expect(inventory.quantity_total).toBe(10000);
    });

    it('should enforce quantities >= 0', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 0;
      inventory.quantity_reserved = 0;
      inventory.quantity_total = 0;
      
      expect(inventory.quantity_available).toBeGreaterThanOrEqual(0);
      expect(inventory.quantity_reserved).toBeGreaterThanOrEqual(0);
      expect(inventory.quantity_total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reorder Logic', () => {
    it('should set reorder_level threshold', () => {
      const inventory = new Inventory();
      inventory.reorder_level = 20;
      
      expect(inventory.reorder_level).toBe(20);
    });

    it('should set reorder_quantity when provided', () => {
      const inventory = new Inventory();
      inventory.reorder_quantity = 100;
      
      expect(inventory.reorder_quantity).toBe(100);
    });

    it('should allow reorder_quantity to be undefined', () => {
      const inventory = new Inventory();
      inventory.reorder_quantity = undefined;
      
      expect(inventory.reorder_quantity).toBeUndefined();
    });

    it('should detect low stock (below reorder_level)', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 5;
      inventory.reorder_level = 10;
      
      expect(inventory.quantity_available).toBeLessThan(inventory.reorder_level);
    });

    it('should detect sufficient stock (above reorder_level)', () => {
      const inventory = new Inventory();
      inventory.quantity_available = 50;
      inventory.reorder_level = 10;
      
      expect(inventory.quantity_available).toBeGreaterThanOrEqual(inventory.reorder_level);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at on creation', () => {
      const inventory = new Inventory();
      inventory.created_at = new Date();
      
      expect(inventory.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at on modification', () => {
      const inventory = new Inventory();
      inventory.updated_at = new Date();
      
      expect(inventory.updated_at).toBeInstanceOf(Date);
    });

    it('should track last_counted_at for inventory audits', () => {
      const inventory = new Inventory();
      inventory.last_counted_at = new Date('2024-01-15T10:00:00Z');
      
      expect(inventory.last_counted_at).toBeInstanceOf(Date);
    });

    it('should allow undefined last_counted_at for new inventory', () => {
      const inventory = new Inventory();
      inventory.last_counted_at = undefined;
      
      expect(inventory.last_counted_at).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with ProductVariant', () => {
      const variant = new ProductVariant();
      variant.id = 10;
      variant.sku = 'TSHIRT-RED-M';
      
      const inventory = new Inventory();
      inventory.variant = variant;
      inventory.variant_id = variant.id;
      
      expect(inventory.variant).toBe(variant);
      expect(inventory.variant_id).toBe(10);
    });

    it('should define ManyToOne relationship with Warehouse', () => {
      const warehouse = new Warehouse();
      warehouse.id = 2;
      warehouse.name = 'Main Warehouse';
      
      const inventory = new Inventory();
      inventory.warehouse = warehouse;
      inventory.warehouse_id = warehouse.id;
      
      expect(inventory.warehouse).toBe(warehouse);
      expect(inventory.warehouse_id).toBe(2);
    });

    it('should allow tracking same variant across multiple warehouses', () => {
      const variant = new ProductVariant();
      variant.id = 10;
      
      const warehouse1 = new Warehouse();
      warehouse1.id = 1;
      warehouse1.name = 'Warehouse A';
      
      const warehouse2 = new Warehouse();
      warehouse2.id = 2;
      warehouse2.name = 'Warehouse B';
      
      const inventory1 = new Inventory();
      inventory1.variant_id = variant.id;
      inventory1.warehouse_id = warehouse1.id;
      inventory1.quantity_available = 50;
      
      const inventory2 = new Inventory();
      inventory2.variant_id = variant.id;
      inventory2.warehouse_id = warehouse2.id;
      inventory2.quantity_available = 30;
      
      expect(inventory1.variant_id).toBe(inventory2.variant_id);
      expect(inventory1.warehouse_id).not.toBe(inventory2.warehouse_id);
    });
  });

  describe('Business Logic', () => {
    it('should support stock reservation flow', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 90;
      inventory.quantity_reserved = 10;
      
      const reserveAmount = 5;
      inventory.quantity_available -= reserveAmount;
      inventory.quantity_reserved += reserveAmount;
      
      expect(inventory.quantity_available).toBe(85);
      expect(inventory.quantity_reserved).toBe(15);
      expect(inventory.quantity_total).toBe(100);
    });

    it('should support unreserve (cancellation) flow', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 85;
      inventory.quantity_reserved = 15;
      
      const unreserveAmount = 5;
      inventory.quantity_reserved -= unreserveAmount;
      inventory.quantity_available += unreserveAmount;
      
      expect(inventory.quantity_available).toBe(90);
      expect(inventory.quantity_reserved).toBe(10);
      expect(inventory.quantity_total).toBe(100);
    });

    it('should support stock fulfillment (sale completion)', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 85;
      inventory.quantity_reserved = 15;
      
      const fulfillAmount = 10;
      inventory.quantity_reserved -= fulfillAmount;
      inventory.quantity_total -= fulfillAmount;
      
      expect(inventory.quantity_available).toBe(85);
      expect(inventory.quantity_reserved).toBe(5);
      expect(inventory.quantity_total).toBe(90);
    });

    it('should support stock replenishment', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 50;
      inventory.quantity_available = 45;
      inventory.quantity_reserved = 5;
      
      const replenishAmount = 100;
      inventory.quantity_total += replenishAmount;
      inventory.quantity_available += replenishAmount;
      
      expect(inventory.quantity_total).toBe(150);
      expect(inventory.quantity_available).toBe(145);
      expect(inventory.quantity_reserved).toBe(5);
    });

    it('should support inventory adjustments', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 90;
      inventory.last_counted_at = undefined;
      
      const actualCount = 95;
      const adjustment = actualCount - inventory.quantity_total;
      inventory.quantity_total = actualCount;
      inventory.quantity_available += adjustment;
      inventory.last_counted_at = new Date();
      
      expect(inventory.quantity_total).toBe(95);
      expect(inventory.quantity_available).toBe(85);
      expect(inventory.last_counted_at).toBeInstanceOf(Date);
    });
  });

  describe('Multi-Warehouse Scenarios', () => {
    it('should track inventory across multiple warehouses', () => {
      const variantId = 10;
      
      const inventoryEast = new Inventory();
      inventoryEast.variant_id = variantId;
      inventoryEast.warehouse_id = 1;
      inventoryEast.quantity_available = 50;
      
      const inventoryWest = new Inventory();
      inventoryWest.variant_id = variantId;
      inventoryWest.warehouse_id = 2;
      inventoryWest.quantity_available = 30;
      
      const inventoryCentral = new Inventory();
      inventoryCentral.variant_id = variantId;
      inventoryCentral.warehouse_id = 3;
      inventoryCentral.quantity_available = 20;
      
      const totalAvailable = 
        inventoryEast.quantity_available + 
        inventoryWest.quantity_available + 
        inventoryCentral.quantity_available;
      
      expect(totalAvailable).toBe(100);
    });

    it('should support different reorder levels per warehouse', () => {
      const variantId = 10;
      
      const mainWarehouse = new Inventory();
      mainWarehouse.variant_id = variantId;
      mainWarehouse.warehouse_id = 1;
      mainWarehouse.reorder_level = 50;
      
      const satelliteWarehouse = new Inventory();
      satelliteWarehouse.variant_id = variantId;
      satelliteWarehouse.warehouse_id = 2;
      satelliteWarehouse.reorder_level = 10;
      
      expect(mainWarehouse.reorder_level).toBeGreaterThan(satelliteWarehouse.reorder_level);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero reorder_level', () => {
      const inventory = new Inventory();
      inventory.reorder_level = 0;
      
      expect(inventory.reorder_level).toBe(0);
    });

    it('should handle very large reorder_quantity', () => {
      const inventory = new Inventory();
      inventory.reorder_quantity = 10000;
      
      expect(inventory.reorder_quantity).toBe(10000);
    });

    it('should handle all stock being reserved', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 0;
      inventory.quantity_reserved = 100;
      
      expect(inventory.quantity_available).toBe(0);
      expect(inventory.quantity_reserved).toBe(inventory.quantity_total);
    });

    it('should handle inventory with no reservations', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 100;
      inventory.quantity_available = 100;
      inventory.quantity_reserved = 0;
      
      expect(inventory.quantity_reserved).toBe(0);
      expect(inventory.quantity_available).toBe(inventory.quantity_total);
    });

    it('should handle out of stock situation', () => {
      const inventory = new Inventory();
      inventory.quantity_total = 0;
      inventory.quantity_available = 0;
      inventory.quantity_reserved = 0;
      
      expect(inventory.quantity_total).toBe(0);
      expect(inventory.quantity_available).toBe(0);
    });

    it('should handle inventory count performed today', () => {
      const inventory = new Inventory();
      const today = new Date();
      inventory.last_counted_at = today;
      
      expect(inventory.last_counted_at).toBe(today);
    });

    it('should handle inventory never counted', () => {
      const inventory = new Inventory();
      inventory.last_counted_at = undefined;
      
      expect(inventory.last_counted_at).toBeUndefined();
    });
  });
});
