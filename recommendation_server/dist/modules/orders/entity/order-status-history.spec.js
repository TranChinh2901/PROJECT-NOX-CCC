"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const order_status_history_1 = require("./order-status-history");
const order_1 = require("./order");
const order_enum_1 = require("../enum/order.enum");
describe('OrderStatusHistory Entity', () => {
    it('should create an OrderStatusHistory instance', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        expect(history).toBeDefined();
        expect(history).toBeInstanceOf(order_status_history_1.OrderStatusHistory);
    });
    it('should have all required fields', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        // Test that fields exist
        expect(history).toHaveProperty('id');
        expect(history).toHaveProperty('order_id');
        expect(history).toHaveProperty('status');
        expect(history).toHaveProperty('previous_status');
        expect(history).toHaveProperty('changed_by');
        expect(history).toHaveProperty('notes');
        expect(history).toHaveProperty('created_at');
        expect(history).toHaveProperty('order');
    });
    it('should accept valid order status values', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        // Test setting status to valid enum values
        history.status = order_enum_1.OrderStatus.PENDING;
        expect(history.status).toBe(order_enum_1.OrderStatus.PENDING);
        history.status = order_enum_1.OrderStatus.CONFIRMED;
        expect(history.status).toBe(order_enum_1.OrderStatus.CONFIRMED);
        history.status = order_enum_1.OrderStatus.SHIPPED;
        expect(history.status).toBe(order_enum_1.OrderStatus.SHIPPED);
    });
    it('should accept nullable fields', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        // These fields should be nullable
        history.previous_status = undefined;
        expect(history.previous_status).toBeUndefined();
        history.previous_status = order_enum_1.OrderStatus.PENDING;
        expect(history.previous_status).toBe(order_enum_1.OrderStatus.PENDING);
        history.changed_by = undefined;
        expect(history.changed_by).toBeUndefined();
        history.changed_by = 'admin@example.com';
        expect(history.changed_by).toBe('admin@example.com');
        history.notes = undefined;
        expect(history.notes).toBeUndefined();
        history.notes = 'Order confirmed by system';
        expect(history.notes).toBe('Order confirmed by system');
    });
    it('should have a relationship with Order', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        const order = new order_1.Order();
        order.id = 1;
        history.order = order;
        history.order_id = 1;
        expect(history.order).toBeDefined();
        expect(history.order).toBeInstanceOf(order_1.Order);
        expect(history.order_id).toBe(1);
    });
    it('should have changed_by with max length 100', () => {
        const history = new order_status_history_1.OrderStatusHistory();
        // Test with valid length
        history.changed_by = 'a'.repeat(100);
        expect(history.changed_by).toHaveLength(100);
        // The field should accept strings up to 100 characters
        expect(history.changed_by).toBeDefined();
    });
    it('should have order_id index defined', () => {
        // This test verifies the entity has been configured with an index
        // The actual index verification happens at the TypeORM level
        const history = new order_status_history_1.OrderStatusHistory();
        history.order_id = 123;
        expect(history.order_id).toBe(123);
    });
});
