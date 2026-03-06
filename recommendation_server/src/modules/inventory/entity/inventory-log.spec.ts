import { InventoryLog } from './inventory-log';
import { InventoryActionType } from '../enum/inventory.enum';

describe('InventoryLog Entity', () => {
  it('should create a valid inventory log with the persisted fields', () => {
    const log = new InventoryLog();
    const createdAt = new Date();

    log.id = 1;
    log.inventory_id = 10;
    log.action_type = InventoryActionType.SALE;
    log.quantity_change = -5;
    log.quantity_before = 100;
    log.quantity_after = 95;
    log.reference_id = 1001;
    log.reference_type = 'order';
    log.notes = 'Reserved for checkout';
    log.performed_by_user_id = 7;
    log.created_at = createdAt;

    expect(log.id).toBe(1);
    expect(log.inventory_id).toBe(10);
    expect(log.action_type).toBe(InventoryActionType.SALE);
    expect(log.quantity_change).toBe(-5);
    expect(log.quantity_before).toBe(100);
    expect(log.quantity_after).toBe(95);
    expect(log.reference_id).toBe(1001);
    expect(log.reference_type).toBe('order');
    expect(log.notes).toBe('Reserved for checkout');
    expect(log.performed_by_user_id).toBe(7);
    expect(log.created_at).toBe(createdAt);
  });

  it('should allow optional audit fields to be omitted', () => {
    const log = new InventoryLog();

    log.inventory_id = 11;
    log.action_type = InventoryActionType.ADJUSTMENT;
    log.quantity_change = 2;
    log.quantity_before = 20;
    log.quantity_after = 22;
    log.performed_by_user_id = null;

    expect(log.reference_id).toBeUndefined();
    expect(log.reference_type).toBeUndefined();
    expect(log.notes).toBeUndefined();
    expect(log.performed_by_user_id).toBeNull();
  });

  it('should accept all supported inventory action types', () => {
    const actionTypes = [
      InventoryActionType.SALE,
      InventoryActionType.RESTOCK,
      InventoryActionType.ADJUSTMENT,
      InventoryActionType.RETURN,
      InventoryActionType.TRANSFER_IN,
      InventoryActionType.TRANSFER_OUT,
    ];

    for (const actionType of actionTypes) {
      const log = new InventoryLog();
      log.action_type = actionType;
      expect(log.action_type).toBe(actionType);
    }
  });
});
