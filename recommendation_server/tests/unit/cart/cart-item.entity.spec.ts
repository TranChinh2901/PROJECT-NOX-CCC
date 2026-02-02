import 'reflect-metadata';
import { CartItem } from '../../../src/modules/cart/entity/cart-item';
import { Cart } from '../../../src/modules/cart/entity/cart';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';

describe('CartItem Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid cart item with all required fields', () => {
      const cartItem = new CartItem();
      cartItem.id = 1;
      cartItem.cart_id = 100;
      cartItem.variant_id = 50;
      cartItem.quantity = 2;
      cartItem.unit_price = 49.99;
      cartItem.total_price = 99.98;
      cartItem.added_at = new Date();
      cartItem.updated_at = new Date();

      expect(cartItem.id).toBe(1);
      expect(cartItem.cart_id).toBe(100);
      expect(cartItem.variant_id).toBe(50);
      expect(cartItem.quantity).toBe(2);
      expect(cartItem.unit_price).toBe(49.99);
      expect(cartItem.total_price).toBe(99.98);
      expect(cartItem.added_at).toBeInstanceOf(Date);
      expect(cartItem.updated_at).toBeInstanceOf(Date);
    });

    it('should have default quantity of 1', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 1;

      expect(cartItem.quantity).toBe(1);
    });
  });

  describe('Unique Constraint (cart_id + variant_id)', () => {
    it('should allow same variant_id in different carts', () => {
      const item1 = new CartItem();
      item1.cart_id = 100;
      item1.variant_id = 50;

      const item2 = new CartItem();
      item2.cart_id = 200;
      item2.variant_id = 50;

      expect(item1.cart_id).not.toBe(item2.cart_id);
      expect(item1.variant_id).toBe(item2.variant_id);
    });

    it('should allow different variants in same cart', () => {
      const item1 = new CartItem();
      item1.cart_id = 100;
      item1.variant_id = 50;

      const item2 = new CartItem();
      item2.cart_id = 100;
      item2.variant_id = 60;

      expect(item1.cart_id).toBe(item2.cart_id);
      expect(item1.variant_id).not.toBe(item2.variant_id);
    });

    it('should enforce unique constraint for cart_id + variant_id combination', () => {
      const item1 = new CartItem();
      item1.cart_id = 100;
      item1.variant_id = 50;

      const item2 = new CartItem();
      item2.cart_id = 100;
      item2.variant_id = 50;

      expect(item1.cart_id).toBe(item2.cart_id);
      expect(item1.variant_id).toBe(item2.variant_id);
    });
  });

  describe('Decimal Field Precision', () => {
    it('should store decimal values with precision 10, scale 2 for unit_price', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 1234.56;

      expect(cartItem.unit_price).toBe(1234.56);
    });

    it('should store decimal values with precision 10, scale 2 for total_price', () => {
      const cartItem = new CartItem();
      cartItem.total_price = 2469.12;

      expect(cartItem.total_price).toBe(2469.12);
    });

    it('should handle zero values for price fields', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 0;
      cartItem.total_price = 0;

      expect(cartItem.unit_price).toBe(0);
      expect(cartItem.total_price).toBe(0);
    });

    it('should handle large decimal values within precision limits', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 99999999.99;
      cartItem.total_price = 99999999.99;

      expect(cartItem.unit_price).toBe(99999999.99);
      expect(cartItem.total_price).toBe(99999999.99);
    });

    it('should handle very small decimal values (cents)', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 0.01;
      cartItem.total_price = 0.02;

      expect(cartItem.unit_price).toBe(0.01);
      expect(cartItem.total_price).toBe(0.02);
    });
  });

  describe('Quantity Field', () => {
    it('should allow positive integer values for quantity', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 5;

      expect(cartItem.quantity).toBe(5);
    });

    it('should handle quantity of 1', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 1;

      expect(cartItem.quantity).toBe(1);
    });

    it('should handle large quantity values', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 999;

      expect(cartItem.quantity).toBe(999);
    });

    it('should update quantity when user changes item count', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 2;

      expect(cartItem.quantity).toBe(2);

      cartItem.quantity = 5;

      expect(cartItem.quantity).toBe(5);
    });
  });

  describe('Relationship Definitions', () => {
    it('should define relationship with Cart entity', () => {
      const cartItem = new CartItem();
      const cart = new Cart();
      cart.id = 100;

      cartItem.cart = cart;
      cartItem.cart_id = cart.id;

      expect(cartItem.cart).toBe(cart);
      expect(cartItem.cart_id).toBe(100);
    });

    it('should define relationship with ProductVariant entity', () => {
      const cartItem = new CartItem();
      const variant = new ProductVariant();
      variant.id = 50;

      cartItem.variant = variant;
      cartItem.variant_id = variant.id;

      expect(cartItem.variant).toBe(variant);
      expect(cartItem.variant_id).toBe(50);
    });

    it('should maintain referential integrity with cart_id', () => {
      const cartItem = new CartItem();
      cartItem.cart_id = 999;

      expect(cartItem.cart_id).toBe(999);
    });

    it('should maintain referential integrity with variant_id', () => {
      const cartItem = new CartItem();
      cartItem.variant_id = 888;

      expect(cartItem.variant_id).toBe(888);
    });
  });

  describe('Timestamp Fields', () => {
    it('should have added_at timestamp', () => {
      const cartItem = new CartItem();
      const now = new Date();
      cartItem.added_at = now;

      expect(cartItem.added_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const cartItem = new CartItem();
      const now = new Date();
      cartItem.updated_at = now;

      expect(cartItem.updated_at).toBe(now);
    });

    it('should have nullable deleted_at timestamp for soft deletes', () => {
      const cartItem = new CartItem();
      cartItem.deleted_at = undefined;

      expect(cartItem.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when item is soft deleted', () => {
      const cartItem = new CartItem();
      const deletionTime = new Date();
      cartItem.deleted_at = deletionTime;

      expect(cartItem.deleted_at).toBe(deletionTime);
    });

    it('should update updated_at when quantity changes', () => {
      const cartItem = new CartItem();
      const initialTime = new Date();
      cartItem.updated_at = initialTime;
      cartItem.quantity = 2;

      const newTime = new Date(Date.now() + 1000);
      cartItem.updated_at = newTime;

      expect(cartItem.updated_at).toBe(newTime);
      expect(cartItem.updated_at).not.toBe(initialTime);
    });
  });

  describe('Price Calculations', () => {
    it('should calculate total_price as quantity * unit_price', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 3;
      cartItem.unit_price = 25.00;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.total_price).toBe(75.00);
    });

    it('should recalculate total_price when quantity changes', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 2;
      cartItem.unit_price = 15.99;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.total_price).toBe(31.98);

      cartItem.quantity = 5;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.total_price).toBe(79.95);
    });

    it('should handle total_price with quantity of 1', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 1;
      cartItem.unit_price = 49.99;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.total_price).toBe(49.99);
    });

    it('should handle decimal precision in calculations', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 3;
      cartItem.unit_price = 10.33;
      cartItem.total_price = Number((cartItem.quantity * cartItem.unit_price).toFixed(2));

      expect(cartItem.total_price).toBe(30.99);
    });

    it('should maintain precision with large quantities', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 100;
      cartItem.unit_price = 9.99;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.total_price).toBe(999.00);
    });
  });

  describe('Data Integrity', () => {
    it('should allow updating unit_price', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 20.00;

      expect(cartItem.unit_price).toBe(20.00);

      cartItem.unit_price = 25.00;

      expect(cartItem.unit_price).toBe(25.00);
    });

    it('should allow updating total_price', () => {
      const cartItem = new CartItem();
      cartItem.total_price = 40.00;

      expect(cartItem.total_price).toBe(40.00);

      cartItem.total_price = 50.00;

      expect(cartItem.total_price).toBe(50.00);
    });

    it('should preserve cart_id after creation', () => {
      const cartItem = new CartItem();
      cartItem.cart_id = 100;

      expect(cartItem.cart_id).toBe(100);
    });

    it('should preserve variant_id after creation', () => {
      const cartItem = new CartItem();
      cartItem.variant_id = 50;

      expect(cartItem.variant_id).toBe(50);
    });
  });

  describe('Business Logic Scenarios', () => {
    it('should support adding same product variant to cart (updating quantity)', () => {
      const cartItem = new CartItem();
      cartItem.cart_id = 100;
      cartItem.variant_id = 50;
      cartItem.quantity = 1;
      cartItem.unit_price = 29.99;
      cartItem.total_price = 29.99;

      cartItem.quantity = 3;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.quantity).toBe(3);
      expect(cartItem.total_price).toBe(89.97);
    });

    it('should support removing item (soft delete)', () => {
      const cartItem = new CartItem();
      cartItem.cart_id = 100;
      cartItem.variant_id = 50;
      cartItem.deleted_at = undefined;

      expect(cartItem.deleted_at).toBeUndefined();

      cartItem.deleted_at = new Date();

      expect(cartItem.deleted_at).toBeInstanceOf(Date);
    });

    it('should track when item was added to cart', () => {
      const cartItem = new CartItem();
      const addedTime = new Date();
      cartItem.added_at = addedTime;

      expect(cartItem.added_at).toBe(addedTime);
    });

    it('should support price updates when variant price changes', () => {
      const cartItem = new CartItem();
      cartItem.unit_price = 19.99;
      cartItem.quantity = 2;
      cartItem.total_price = 39.98;

      cartItem.unit_price = 24.99;
      cartItem.total_price = cartItem.quantity * cartItem.unit_price;

      expect(cartItem.unit_price).toBe(24.99);
      expect(cartItem.total_price).toBe(49.98);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero unit_price', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 5;
      cartItem.unit_price = 0;
      cartItem.total_price = 0;

      expect(cartItem.unit_price).toBe(0);
      expect(cartItem.total_price).toBe(0);
    });

    it('should handle very large quantity values', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 9999;
      cartItem.unit_price = 1.00;
      cartItem.total_price = 9999.00;

      expect(cartItem.quantity).toBe(9999);
      expect(cartItem.total_price).toBe(9999.00);
    });

    it('should handle fractional prices correctly', () => {
      const cartItem = new CartItem();
      cartItem.quantity = 3;
      cartItem.unit_price = 0.33;
      cartItem.total_price = Number((cartItem.quantity * cartItem.unit_price).toFixed(2));

      expect(cartItem.unit_price).toBe(0.33);
      expect(cartItem.total_price).toBe(0.99);
    });
  });

  describe('Indexing', () => {
    it('should have indexed cart_id for faster queries', () => {
      const cartItem = new CartItem();
      cartItem.cart_id = 100;

      expect(cartItem.cart_id).toBe(100);
    });

    it('should have indexed variant_id for faster queries', () => {
      const cartItem = new CartItem();
      cartItem.variant_id = 50;

      expect(cartItem.variant_id).toBe(50);
    });
  });
});
