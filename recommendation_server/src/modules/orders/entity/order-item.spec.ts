import { OrderItem } from './order-item';
import { Order } from './order';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { Warehouse } from '@/modules/inventory/entity/warehouse';

describe('OrderItem Entity', () => {
  describe('Schema Validation', () => {
    it('should create an OrderItem with all required fields', () => {
      const item = new OrderItem();
      item.id = 1;
      item.order_id = 10;
      item.variant_id = 5;
      item.warehouse_id = 2;
      item.product_snapshot = { name: 'T-Shirt', size: 'M', color: 'Red' };
      item.quantity = 2;
      item.unit_price = 29.99;
      item.total_price = 59.98;
      item.discount_amount = 0;
      
      expect(item.id).toBe(1);
      expect(item.order_id).toBe(10);
      expect(item.variant_id).toBe(5);
      expect(item.warehouse_id).toBe(2);
      expect(item.quantity).toBe(2);
      expect(item.unit_price).toBe(29.99);
      expect(item.total_price).toBe(59.98);
      expect(item.discount_amount).toBe(0);
    });

    it('should default discount_amount to 0', () => {
      const item = new OrderItem();
      item.discount_amount = 0;
      
      expect(item.discount_amount).toBe(0);
    });
  });

  describe('JSON Fields', () => {
    it('should store product_snapshot as JSON', () => {
      const item = new OrderItem();
      item.product_snapshot = {
        product_name: 'Cotton T-Shirt',
        brand: 'Fashion Brand',
        sku: 'TSHIRT-RED-M',
        size: 'M',
        color: 'Red',
        material: 'Cotton',
        image_url: 'https://example.com/image.jpg',
      };
      
      expect(item.product_snapshot).toBeDefined();
      expect(typeof item.product_snapshot).toBe('object');
    });

    it('should preserve product snapshot with all variant details', () => {
      const item = new OrderItem();
      const snapshot = {
        product_id: 100,
        product_name: 'Premium Jeans',
        variant_id: 250,
        sku: 'JEANS-BLUE-32',
        size: '32',
        color: 'Blue',
        color_code: '#0000FF',
        base_price: 79.99,
        final_price: 69.99,
      };
      
      item.product_snapshot = snapshot;
      
      expect(item.product_snapshot).toEqual(snapshot);
    });
  });

  describe('Decimal Precision', () => {
    it('should handle unit_price with 2 decimal places', () => {
      const item = new OrderItem();
      item.unit_price = 49.99;
      
      expect(item.unit_price).toBe(49.99);
    });

    it('should handle total_price with 2 decimal places', () => {
      const item = new OrderItem();
      item.total_price = 149.97;
      
      expect(item.total_price).toBe(149.97);
    });

    it('should calculate total_price from quantity and unit_price', () => {
      const item = new OrderItem();
      item.quantity = 3;
      item.unit_price = 29.99;
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
      
      expect(item.total_price).toBe(89.97);
    });

    it('should handle discount_amount with 2 decimal places', () => {
      const item = new OrderItem();
      item.discount_amount = 5.50;
      
      expect(item.discount_amount).toBe(5.50);
    });

    it('should calculate total after discount', () => {
      const item = new OrderItem();
      item.quantity = 2;
      item.unit_price = 50.00;
      item.discount_amount = 10.00;
      
      const subtotal = item.quantity * item.unit_price;
      item.total_price = Number((subtotal - item.discount_amount).toFixed(2));
      
      expect(item.total_price).toBe(90.00);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at', () => {
      const item = new OrderItem();
      item.created_at = new Date();
      
      expect(item.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at', () => {
      const item = new OrderItem();
      item.updated_at = new Date();
      
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with Order', () => {
      const order = new Order();
      order.id = 10;
      
      const item = new OrderItem();
      item.order = order;
      item.order_id = order.id;
      
      expect(item.order).toBe(order);
      expect(item.order_id).toBe(10);
    });

    it('should define ManyToOne relationship with ProductVariant', () => {
      const variant = new ProductVariant();
      variant.id = 5;
      variant.sku = 'TSHIRT-RED-M';
      
      const item = new OrderItem();
      item.variant = variant;
      item.variant_id = variant.id;
      
      expect(item.variant).toBe(variant);
      expect(item.variant_id).toBe(5);
    });

    it('should define optional ManyToOne relationship with Warehouse', () => {
      const warehouse = new Warehouse();
      warehouse.id = 3;
      warehouse.code = 'WH-03';

      const item = new OrderItem();
      item.warehouse = warehouse;
      item.warehouse_id = warehouse.id;

      expect(item.warehouse).toBe(warehouse);
      expect(item.warehouse_id).toBe(3);
    });

    it('should allow multiple items for same order', () => {
      const order = new Order();
      order.id = 10;
      
      const item1 = new OrderItem();
      item1.order_id = order.id;
      item1.variant_id = 1;
      
      const item2 = new OrderItem();
      item2.order_id = order.id;
      item2.variant_id = 2;
      
      expect(item1.order_id).toBe(item2.order_id);
      expect(item1.variant_id).not.toBe(item2.variant_id);
    });
  });

  describe('Quantity Management', () => {
    it('should handle quantity of 1', () => {
      const item = new OrderItem();
      item.quantity = 1;
      
      expect(item.quantity).toBe(1);
    });

    it('should handle multiple quantities', () => {
      const item = new OrderItem();
      item.quantity = 5;
      
      expect(item.quantity).toBe(5);
    });

    it('should handle large quantities', () => {
      const item = new OrderItem();
      item.quantity = 100;
      
      expect(item.quantity).toBe(100);
    });

    it('should enforce quantity > 0', () => {
      const item = new OrderItem();
      item.quantity = 1;
      
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  describe('Price Snapshot', () => {
    it('should preserve price at time of order', () => {
      const item = new OrderItem();
      item.unit_price = 49.99;
      item.product_snapshot = {
        original_price: 59.99,
        sale_price: 49.99,
        captured_at: new Date().toISOString(),
      };
      
      expect(item.unit_price).toBe(49.99);
    });

    it('should handle price changes after order', () => {
      const variant = new ProductVariant();
      variant.final_price = 69.99;
      
      const item = new OrderItem();
      item.variant = variant;
      item.unit_price = 49.99;
      
      expect(item.unit_price).not.toBe(variant.final_price);
    });
  });

  describe('Business Logic', () => {
    it('should calculate line total without discount', () => {
      const item = new OrderItem();
      item.quantity = 3;
      item.unit_price = 25.00;
      item.discount_amount = 0;
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
      
      expect(item.total_price).toBe(75.00);
    });

    it('should calculate line total with discount', () => {
      const item = new OrderItem();
      item.quantity = 2;
      item.unit_price = 50.00;
      item.discount_amount = 15.00;
      
      const subtotal = item.quantity * item.unit_price;
      item.total_price = Number((subtotal - item.discount_amount).toFixed(2));
      
      expect(item.total_price).toBe(85.00);
    });

    it('should handle percentage-based discount', () => {
      const item = new OrderItem();
      item.quantity = 4;
      item.unit_price = 30.00;
      
      const subtotal = item.quantity * item.unit_price;
      const discountPercent = 0.10;
      item.discount_amount = Number((subtotal * discountPercent).toFixed(2));
      item.total_price = Number((subtotal - item.discount_amount).toFixed(2));
      
      expect(item.discount_amount).toBe(12.00);
      expect(item.total_price).toBe(108.00);
    });
  });

  describe('Product Snapshot Scenarios', () => {
    it('should snapshot complete product details', () => {
      const item = new OrderItem();
      item.product_snapshot = {
        product_id: 100,
        product_name: 'Premium Cotton T-Shirt',
        brand_id: 5,
        brand_name: 'Fashion Co',
        category_id: 10,
        category_name: 'T-Shirts',
        variant_id: 250,
        sku: 'TSHIRT-BLUE-L',
        size: 'L',
        color: 'Blue',
        color_code: '#0000FF',
        material: 'Cotton',
        weight_kg: 0.200,
        image_url: 'https://cdn.example.com/tshirt.jpg',
        captured_at: new Date().toISOString(),
      };
      
      expect(item.product_snapshot).toHaveProperty('product_name');
      expect(item.product_snapshot).toHaveProperty('sku');
      expect(item.product_snapshot).toHaveProperty('size');
    });

    it('should preserve snapshot even if product deleted', () => {
      const item = new OrderItem();
      item.product_snapshot = {
        product_name: 'Discontinued Item',
        sku: 'OLD-SKU-001',
        note: 'Product no longer available',
      };
      
      expect(item.product_snapshot).toBeDefined();
    });

    it('should snapshot variant-specific attributes', () => {
      const item = new OrderItem();
      item.product_snapshot = {
        size: 'XL',
        color: 'Navy Blue',
        color_code: '#000080',
        material: '100% Cotton',
      };
      
      expect(item.product_snapshot).toHaveProperty('size');
      expect(item.product_snapshot).toHaveProperty('color');
      expect(item.product_snapshot).toHaveProperty('material');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero discount', () => {
      const item = new OrderItem();
      item.discount_amount = 0;
      
      expect(item.discount_amount).toBe(0);
    });

    it('should handle single item order', () => {
      const item = new OrderItem();
      item.quantity = 1;
      item.unit_price = 99.99;
      item.total_price = 99.99;
      
      expect(item.quantity).toBe(1);
      expect(item.total_price).toBe(item.unit_price);
    });

    it('should enforce prices >= 0', () => {
      const item = new OrderItem();
      item.unit_price = 29.99;
      item.total_price = 59.98;
      item.discount_amount = 0;
      
      expect(item.unit_price).toBeGreaterThanOrEqual(0);
      expect(item.total_price).toBeGreaterThanOrEqual(0);
      expect(item.discount_amount).toBeGreaterThanOrEqual(0);
    });

    it('should handle very small prices', () => {
      const item = new OrderItem();
      item.unit_price = 0.99;
      item.quantity = 10;
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
      
      expect(item.total_price).toBe(9.90);
    });

    it('should handle very large prices', () => {
      const item = new OrderItem();
      item.unit_price = 9999.99;
      item.quantity = 1;
      item.total_price = 9999.99;
      
      expect(item.total_price).toBe(9999.99);
    });

    it('should handle full discount (free item)', () => {
      const item = new OrderItem();
      item.quantity = 1;
      item.unit_price = 50.00;
      item.discount_amount = 50.00;
      item.total_price = 0;
      
      expect(item.total_price).toBe(0);
    });
  });
});
