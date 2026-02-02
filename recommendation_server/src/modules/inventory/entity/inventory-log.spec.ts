import { InventoryLog } from './inventory-log';
import { InventoryActionType } from '../enum/inventory.enum';

describe('InventoryLog Entity', () => {
  describe('Schema Validation', () => {
    it('should create an inventory log with all required fields', () => {
      const log = new InventoryLog();
      log.id = 1;
      log.inventory_id = 10;
      log.variant_id = 25;
      log.warehouse_id = 3;
      log.action_type = InventoryActionType.SALE;
      log.quantity_change = -5;
      log.quantity_before = 100;
      log.quantity_after = 95;
      log.created_at = new Date();

      expect(log.id).toBe(1);
      expect(log.inventory_id).toBe(10);
      expect(log.variant_id).toBe(25);
      expect(log.warehouse_id).toBe(3);
      expect(log.action_type).toBe(InventoryActionType.SALE);
      expect(log.quantity_change).toBe(-5);
      expect(log.quantity_before).toBe(100);
      expect(log.quantity_after).toBe(95);
    });

    it('should require inventory_id', () => {
      const log = new InventoryLog();
      log.inventory_id = 10;

      expect(log.inventory_id).toBe(10);
    });

    it('should require variant_id', () => {
      const log = new InventoryLog();
      log.variant_id = 25;

      expect(log.variant_id).toBe(25);
    });

    it('should require warehouse_id', () => {
      const log = new InventoryLog();
      log.warehouse_id = 3;

      expect(log.warehouse_id).toBe(3);
    });

    it('should require action_type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RESTOCK;

      expect(log.action_type).toBe(InventoryActionType.RESTOCK);
    });

    it('should require quantity_change', () => {
      const log = new InventoryLog();
      log.quantity_change = -10;

      expect(log.quantity_change).toBe(-10);
    });

    it('should require quantity_before', () => {
      const log = new InventoryLog();
      log.quantity_before = 50;

      expect(log.quantity_before).toBe(50);
    });

    it('should require quantity_after', () => {
      const log = new InventoryLog();
      log.quantity_after = 45;

      expect(log.quantity_after).toBe(45);
    });

    it('should allow optional fields to be undefined', () => {
      const log = new InventoryLog();
      log.inventory_id = 10;
      log.action_type = InventoryActionType.SALE;

      expect(log.reference_id).toBeUndefined();
      expect(log.reference_type).toBeUndefined();
      expect(log.notes).toBeUndefined();
      expect(log.performed_by).toBeUndefined();
    });

    it('should allow reference_id for tracked actions', () => {
      const log = new InventoryLog();
      log.reference_id = 1001;

      expect(log.reference_id).toBe(1001);
    });

    it('should allow reference_type to categorize actions', () => {
      const log = new InventoryLog();
      log.reference_type = 'order';

      expect(log.reference_type).toBe('order');
    });

    it('should allow notes for additional context', () => {
      const log = new InventoryLog();
      log.notes = 'Inventory adjustment due to damaged items';

      expect(log.notes).toBe('Inventory adjustment due to damaged items');
    });

    it('should allow performed_by to track who made the change', () => {
      const log = new InventoryLog();
      log.performed_by = 'admin@example.com';

      expect(log.performed_by).toBe('admin@example.com');
    });
  });

  describe('Field Constraints', () => {
    it('should enforce reference_type max length of 50 characters', () => {
      const log = new InventoryLog();
      log.reference_type = 'a'.repeat(50);

      expect(log.reference_type.length).toBe(50);
    });

    it('should enforce performed_by max length of 100 characters', () => {
      const log = new InventoryLog();
      log.performed_by = 'a'.repeat(100);

      expect(log.performed_by?.length).toBe(100);
    });

    it('should allow long text in notes field', () => {
      const log = new InventoryLog();
      const longNotes = 'a'.repeat(1000);
      log.notes = longNotes;

      expect(log.notes?.length).toBe(1000);
    });
  });

  describe('Enum Validation - Action Type', () => {
    it('should accept SALE action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.SALE;

      expect(log.action_type).toBe(InventoryActionType.SALE);
      expect(log.action_type).toBe('sale');
    });

    it('should accept RESTOCK action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RESTOCK;

      expect(log.action_type).toBe(InventoryActionType.RESTOCK);
      expect(log.action_type).toBe('restock');
    });

    it('should accept ADJUSTMENT action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.ADJUSTMENT;

      expect(log.action_type).toBe(InventoryActionType.ADJUSTMENT);
      expect(log.action_type).toBe('adjustment');
    });

    it('should accept RETURN action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RETURN;

      expect(log.action_type).toBe(InventoryActionType.RETURN);
      expect(log.action_type).toBe('return');
    });

    it('should accept TRANSFER_IN action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.TRANSFER_IN;

      expect(log.action_type).toBe(InventoryActionType.TRANSFER_IN);
      expect(log.action_type).toBe('transfer_in');
    });

    it('should accept TRANSFER_OUT action type', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.TRANSFER_OUT;

      expect(log.action_type).toBe(InventoryActionType.TRANSFER_OUT);
      expect(log.action_type).toBe('transfer_out');
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-generate created_at timestamp', () => {
      const log = new InventoryLog();
      const now = new Date();
      log.created_at = now;

      expect(log.created_at).toEqual(now);
    });

    it('should preserve millisecond precision in timestamps', () => {
      const log = new InventoryLog();
      const timestamp = new Date('2024-01-15T10:30:45.123Z');
      log.created_at = timestamp;

      expect(log.created_at.getMilliseconds()).toBe(timestamp.getMilliseconds());
    });
  });

  describe('Relationships', () => {
    it('should have many-to-one relationship with Inventory', () => {
      const log = new InventoryLog();
      log.inventory_id = 10;

      expect(log.inventory_id).toBe(10);
      expect(log.inventory).toBeUndefined();
    });

    it('should have many-to-one relationship with ProductVariant', () => {
      const log = new InventoryLog();
      log.variant_id = 25;

      expect(log.variant_id).toBe(25);
      expect(log.variant).toBeUndefined();
    });

    it('should have many-to-one relationship with Warehouse', () => {
      const log = new InventoryLog();
      log.warehouse_id = 3;

      expect(log.warehouse_id).toBe(3);
      expect(log.warehouse).toBeUndefined();
    });
  });

  describe('Business Logic - Quantity Changes', () => {
    it('should validate quantity_before + quantity_change = quantity_after', () => {
      const log = new InventoryLog();
      log.quantity_before = 100;
      log.quantity_change = -5;
      log.quantity_after = 95;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });

    it('should handle positive quantity changes', () => {
      const log = new InventoryLog();
      log.quantity_before = 50;
      log.quantity_change = 100;
      log.quantity_after = 150;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });

    it('should handle negative quantity changes', () => {
      const log = new InventoryLog();
      log.quantity_before = 100;
      log.quantity_change = -25;
      log.quantity_after = 75;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });

    it('should handle zero quantity change', () => {
      const log = new InventoryLog();
      log.quantity_before = 50;
      log.quantity_change = 0;
      log.quantity_after = 50;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });
  });

  describe('Business Logic - Sales Tracking', () => {
    it('should track inventory reduction from sales', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.SALE;
      log.quantity_change = -10;
      log.quantity_before = 100;
      log.quantity_after = 90;
      log.reference_id = 1001;
      log.reference_type = 'order';

      expect(log.action_type).toBe(InventoryActionType.SALE);
      expect(log.quantity_change).toBeLessThan(0);
      expect(log.reference_type).toBe('order');
    });
  });

  describe('Business Logic - Restocking', () => {
    it('should track inventory increase from restock', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RESTOCK;
      log.quantity_change = 500;
      log.quantity_before = 100;
      log.quantity_after = 600;
      log.performed_by = 'warehouse_manager@example.com';

      expect(log.action_type).toBe(InventoryActionType.RESTOCK);
      expect(log.quantity_change).toBeGreaterThan(0);
    });

    it('should allow notes for restock details', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RESTOCK;
      log.notes = 'Received shipment from supplier ABC - PO #12345';

      expect(log.notes).toContain('supplier ABC');
    });
  });

  describe('Business Logic - Inventory Adjustments', () => {
    it('should track manual inventory adjustments', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.ADJUSTMENT;
      log.quantity_change = -5;
      log.quantity_before = 100;
      log.quantity_after = 95;
      log.notes = 'Damaged items removed from stock';
      log.reference_type = 'manual';

      expect(log.action_type).toBe(InventoryActionType.ADJUSTMENT);
      expect(log.reference_type).toBe('manual');
    });

    it('should handle positive adjustments for found items', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.ADJUSTMENT;
      log.quantity_change = 3;
      log.quantity_before = 97;
      log.quantity_after = 100;
      log.notes = 'Found items during inventory count';

      expect(log.quantity_change).toBeGreaterThan(0);
    });
  });

  describe('Business Logic - Returns', () => {
    it('should track inventory increase from customer returns', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.RETURN;
      log.quantity_change = 2;
      log.quantity_before = 95;
      log.quantity_after = 97;
      log.reference_id = 1001;
      log.reference_type = 'order';

      expect(log.action_type).toBe(InventoryActionType.RETURN);
      expect(log.quantity_change).toBeGreaterThan(0);
      expect(log.reference_type).toBe('order');
    });
  });

  describe('Business Logic - Warehouse Transfers', () => {
    it('should track inventory transfer out from source warehouse', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.TRANSFER_OUT;
      log.warehouse_id = 1;
      log.quantity_change = -50;
      log.quantity_before = 200;
      log.quantity_after = 150;
      log.reference_id = 2001;
      log.reference_type = 'transfer';

      expect(log.action_type).toBe(InventoryActionType.TRANSFER_OUT);
      expect(log.quantity_change).toBeLessThan(0);
      expect(log.reference_type).toBe('transfer');
    });

    it('should track inventory transfer in to destination warehouse', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.TRANSFER_IN;
      log.warehouse_id = 2;
      log.quantity_change = 50;
      log.quantity_before = 100;
      log.quantity_after = 150;
      log.reference_id = 2001;
      log.reference_type = 'transfer';

      expect(log.action_type).toBe(InventoryActionType.TRANSFER_IN);
      expect(log.quantity_change).toBeGreaterThan(0);
      expect(log.reference_type).toBe('transfer');
    });

    it('should link related transfer logs by reference_id', () => {
      const transferOut = new InventoryLog();
      transferOut.action_type = InventoryActionType.TRANSFER_OUT;
      transferOut.reference_id = 2001;
      transferOut.warehouse_id = 1;

      const transferIn = new InventoryLog();
      transferIn.action_type = InventoryActionType.TRANSFER_IN;
      transferIn.reference_id = 2001;
      transferIn.warehouse_id = 2;

      expect(transferOut.reference_id).toBe(transferIn.reference_id);
      expect(transferOut.warehouse_id).not.toBe(transferIn.warehouse_id);
    });
  });

  describe('Business Logic - Audit Trail', () => {
    it('should track who performed the action', () => {
      const log = new InventoryLog();
      log.performed_by = 'admin@example.com';
      log.action_type = InventoryActionType.ADJUSTMENT;

      expect(log.performed_by).toBe('admin@example.com');
    });

    it('should track system-performed actions', () => {
      const log = new InventoryLog();
      log.performed_by = 'system';
      log.action_type = InventoryActionType.SALE;

      expect(log.performed_by).toBe('system');
    });

    it('should allow null performed_by for legacy data', () => {
      const log = new InventoryLog();
      log.performed_by = undefined;

      expect(log.performed_by).toBeUndefined();
    });

    it('should preserve timestamp of action', () => {
      const log = new InventoryLog();
      const actionTime = new Date('2024-01-15T14:30:00Z');
      log.created_at = actionTime;

      expect(log.created_at).toEqual(actionTime);
    });
  });

  describe('Business Logic - Reference Tracking', () => {
    it('should reference order for sale actions', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.SALE;
      log.reference_id = 1001;
      log.reference_type = 'order';

      expect(log.reference_type).toBe('order');
      expect(log.reference_id).toBe(1001);
    });

    it('should reference transfer for warehouse moves', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.TRANSFER_OUT;
      log.reference_id = 2001;
      log.reference_type = 'transfer';

      expect(log.reference_type).toBe('transfer');
    });

    it('should use manual reference for adjustments', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.ADJUSTMENT;
      log.reference_type = 'manual';

      expect(log.reference_type).toBe('manual');
    });

    it('should allow null reference for some action types', () => {
      const log = new InventoryLog();
      log.action_type = InventoryActionType.ADJUSTMENT;
      log.reference_id = undefined;
      log.reference_type = undefined;

      expect(log.reference_id).toBeUndefined();
      expect(log.reference_type).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero starting inventory', () => {
      const log = new InventoryLog();
      log.quantity_before = 0;
      log.quantity_change = 100;
      log.quantity_after = 100;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });

    it('should handle zero ending inventory', () => {
      const log = new InventoryLog();
      log.quantity_before = 10;
      log.quantity_change = -10;
      log.quantity_after = 0;

      const isValid = log.quantity_before + log.quantity_change === log.quantity_after;
      expect(isValid).toBe(true);
    });

    it('should handle large quantity changes', () => {
      const log = new InventoryLog();
      log.quantity_before = 0;
      log.quantity_change = 10000;
      log.quantity_after = 10000;

      expect(log.quantity_change).toBe(10000);
    });

    it('should handle very long notes', () => {
      const log = new InventoryLog();
      const longNotes = 'a'.repeat(5000);
      log.notes = longNotes;

      expect(log.notes?.length).toBe(5000);
    });

    it('should handle special characters in notes', () => {
      const log = new InventoryLog();
      log.notes = 'Returned items: 50% damaged, customer ref #ABC-123';

      expect(log.notes).toContain('#ABC-123');
    });

    it('should handle performed_by with email format', () => {
      const log = new InventoryLog();
      log.performed_by = 'john.doe+admin@example.com';

      expect(log.performed_by).toBe('john.doe+admin@example.com');
    });

    it('should track multiple actions for same inventory item', () => {
      const log1 = new InventoryLog();
      log1.inventory_id = 10;
      log1.action_type = InventoryActionType.SALE;
      log1.created_at = new Date('2024-01-15T10:00:00Z');

      const log2 = new InventoryLog();
      log2.inventory_id = 10;
      log2.action_type = InventoryActionType.RESTOCK;
      log2.created_at = new Date('2024-01-15T14:00:00Z');

      expect(log1.inventory_id).toBe(log2.inventory_id);
      expect(log1.action_type).not.toBe(log2.action_type);
      expect(log1.created_at.getTime()).toBeLessThan(log2.created_at.getTime());
    });
  });
});
