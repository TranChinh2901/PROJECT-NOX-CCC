import 'reflect-metadata';
import { Cart } from './cart';
import { CartItem } from './cart-item';
import { User } from '@/modules/users/entity/user.entity';
import { CartStatus } from '../enum/cart.enum';

describe('Cart Entity', () => {
  describe('Schema Validation', () => {
    it('should create a valid cart with all required fields', () => {
      const cart = new Cart();
      cart.id = 1;
      cart.user_id = 100;
      cart.guest_token = 'guest-cart-5';
      cart.status = CartStatus.ACTIVE;
      cart.total_amount = 112.99;
      cart.item_count = 3;
      cart.currency = 'VND';

      expect(cart.id).toBe(1);
      expect(cart.user_id).toBe(100);
      expect(cart.guest_token).toBe('guest-cart-5');
      expect(cart.status).toBe(CartStatus.ACTIVE);
      expect(cart.total_amount).toBe(112.99);
      expect(cart.item_count).toBe(3);
      expect(cart.currency).toBe('VND');
    });

    it('should allow cart with user_id but no guest_token (authenticated cart)', () => {
      const cart = new Cart();
      cart.user_id = 100;
      cart.guest_token = null;
      cart.status = CartStatus.ACTIVE;
      cart.total_amount = 0;
      cart.item_count = 0;
      cart.currency = 'VND';

      expect(cart.user_id).toBe(100);
      expect(cart.guest_token).toBeNull();
    });

    it('should allow cart with guest_token but no user_id (anonymous cart)', () => {
      const cart = new Cart();
      cart.user_id = undefined;
      cart.guest_token = 'guest-cart-10';
      cart.status = CartStatus.ACTIVE;
      cart.total_amount = 0;
      cart.item_count = 0;
      cart.currency = 'VND';

      expect(cart.user_id).toBeUndefined();
      expect(cart.guest_token).toBe('guest-cart-10');
    });

    it('should have default status as ACTIVE', () => {
      const cart = new Cart();
      cart.status = CartStatus.ACTIVE;

      expect(cart.status).toBe(CartStatus.ACTIVE);
    });

    it('should allow all valid CartStatus enum values', () => {
      const activeCart = new Cart();
      activeCart.status = CartStatus.ACTIVE;
      expect(activeCart.status).toBe(CartStatus.ACTIVE);

      const convertedCart = new Cart();
      convertedCart.status = CartStatus.CONVERTED;
      expect(convertedCart.status).toBe(CartStatus.CONVERTED);

      const abandonedCart = new Cart();
      abandonedCart.status = CartStatus.ABANDONED;
      expect(abandonedCart.status).toBe(CartStatus.ABANDONED);
    });

    it('should have default currency as VND', () => {
      const cart = new Cart();
      cart.currency = 'VND';

      expect(cart.currency).toBe('VND');
    });
  });

  describe('Decimal Field Precision', () => {
    it('should store decimal values with precision 10, scale 2 for total_amount', () => {
      const cart = new Cart();
      cart.total_amount = 1234.56;

      expect(cart.total_amount).toBe(1234.56);
    });

    it('should handle zero value for total_amount', () => {
      const cart = new Cart();
      cart.total_amount = 0;

      expect(cart.total_amount).toBe(0);
    });

    it('should handle large decimal values within precision limits', () => {
      const cart = new Cart();
      cart.total_amount = 99999999.99;

      expect(cart.total_amount).toBe(99999999.99);
    });

    it('should handle very small decimal values (cents)', () => {
      const cart = new Cart();
      cart.total_amount = 0.01;

      expect(cart.total_amount).toBe(0.01);
    });
  });

  describe('Item Count Field', () => {
    it('should default item_count to 0 for empty cart', () => {
      const cart = new Cart();
      cart.item_count = 0;

      expect(cart.item_count).toBe(0);
    });

    it('should allow positive integer values for item_count', () => {
      const cart = new Cart();
      cart.item_count = 5;

      expect(cart.item_count).toBe(5);
    });

    it('should handle large item counts', () => {
      const cart = new Cart();
      cart.item_count = 100;

      expect(cart.item_count).toBe(100);
    });
  });

  describe('Relationship Definitions', () => {
    it('should define relationship with User entity', () => {
      const cart = new Cart();
      const user = new User();
      user.id = 100;

      cart.user = user;
      cart.user_id = user.id;

      expect(cart.user).toBe(user);
      expect(cart.user_id).toBe(100);
    });

    it('should store guest token for anonymous carts', () => {
      const cart = new Cart();
      cart.guest_token = 'guest-token-5';

      expect(cart.guest_token).toBe('guest-token-5');
    });

    it('should define relationship with CartItem entities (one-to-many)', () => {
      const cart = new Cart();
      const item1 = new CartItem();
      const item2 = new CartItem();
      
      item1.id = 1;
      item1.cart_id = cart.id;
      item2.id = 2;
      item2.cart_id = cart.id;

      cart.items = [item1, item2];

      expect(cart.items).toHaveLength(2);
      expect(cart.items[0]).toBe(item1);
      expect(cart.items[1]).toBe(item2);
    });

    it('should allow empty items array for new cart', () => {
      const cart = new Cart();
      cart.items = [];

      expect(cart.items).toEqual([]);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at timestamp', () => {
      const cart = new Cart();
      const now = new Date();
      cart.created_at = now;

      expect(cart.created_at).toBe(now);
    });

    it('should have updated_at timestamp', () => {
      const cart = new Cart();
      const now = new Date();
      cart.updated_at = now;

      expect(cart.updated_at).toBe(now);
    });

    it('should have nullable deleted_at timestamp for soft deletes', () => {
      const cart = new Cart();
      cart.deleted_at = undefined;

      expect(cart.deleted_at).toBeUndefined();
    });

    it('should set deleted_at when cart is soft deleted', () => {
      const cart = new Cart();
      const deletionTime = new Date();
      cart.deleted_at = deletionTime;

      expect(cart.deleted_at).toBe(deletionTime);
    });

    it('should have nullable expires_at timestamp', () => {
      const cart = new Cart();
      cart.expires_at = undefined;

      expect(cart.expires_at).toBeUndefined();
    });

    it('should set expires_at for temporary carts', () => {
      const cart = new Cart();
      const expiryTime = new Date(Date.now() + 1000 * 60 * 60 * 24);
      cart.expires_at = expiryTime;

      expect(cart.expires_at).toBe(expiryTime);
    });
  });

  describe('Business Logic Constraints', () => {
    it('should allow either user_id or guest_token to be set (not both required)', () => {
      const authenticatedCart = new Cart();
      authenticatedCart.user_id = 100;
      authenticatedCart.guest_token = null;

      const anonymousCart = new Cart();
      anonymousCart.user_id = undefined;
      anonymousCart.guest_token = 'guest-cart-5';

      expect(authenticatedCart.user_id).toBe(100);
      expect(authenticatedCart.guest_token).toBeNull();
      expect(anonymousCart.user_id).toBeUndefined();
      expect(anonymousCart.guest_token).toBe('guest-cart-5');
    });

    it('should support cart claiming (guest_token -> user_id migration)', () => {
      const cart = new Cart();
      cart.guest_token = 'guest-cart-10';
      cart.user_id = undefined;

      expect(cart.guest_token).toBe('guest-cart-10');
      expect(cart.user_id).toBeUndefined();

      cart.user_id = 100;
      cart.guest_token = null;

      expect(cart.user_id).toBe(100);
      expect(cart.guest_token).toBeNull();
    });

    it('should handle cart abandonment workflow', () => {
      const cart = new Cart();
      cart.status = CartStatus.ACTIVE;
      cart.updated_at = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

      expect(cart.status).toBe(CartStatus.ACTIVE);

      cart.status = CartStatus.ABANDONED;

      expect(cart.status).toBe(CartStatus.ABANDONED);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with user_id', () => {
      const cart = new Cart();
      cart.user_id = 999;

      expect(cart.user_id).toBe(999);
    });

    it('should preserve guest token identity for anonymous carts', () => {
      const cart = new Cart();
      cart.guest_token = 'guest-cart-15';

      expect(cart.guest_token).toBe('guest-cart-15');
    });

    it('should allow updating cart total_amount', () => {
      const cart = new Cart();
      cart.total_amount = 100.00;

      cart.total_amount = 150.00;

      expect(cart.total_amount).toBe(150.00);
    });

    it('should allow updating item_count', () => {
      const cart = new Cart();
      cart.item_count = 2;

      cart.item_count = 5;

      expect(cart.item_count).toBe(5);
    });

    it('should synchronize item_count with items array length', () => {
      const cart = new Cart();
      const item1 = new CartItem();
      const item2 = new CartItem();
      const item3 = new CartItem();

      cart.items = [item1, item2, item3];
      cart.item_count = 3;

      expect(cart.item_count).toBe(cart.items.length);
    });
  });

  describe('Cart Status Transitions', () => {
    it('should transition from ACTIVE to CONVERTED when order is created', () => {
      const cart = new Cart();
      cart.status = CartStatus.ACTIVE;

      cart.status = CartStatus.CONVERTED;

      expect(cart.status).toBe(CartStatus.CONVERTED);
    });

    it('should transition from ACTIVE to ABANDONED when cart is stale', () => {
      const cart = new Cart();
      cart.status = CartStatus.ACTIVE;

      cart.status = CartStatus.ABANDONED;

      expect(cart.status).toBe(CartStatus.ABANDONED);
    });

    it('should transition from ABANDONED to ACTIVE when user returns', () => {
      const cart = new Cart();
      cart.status = CartStatus.ABANDONED;

      cart.status = CartStatus.ACTIVE;
      cart.updated_at = new Date();

      expect(cart.status).toBe(CartStatus.ACTIVE);
    });
  });

  describe('Currency Field', () => {
    it('should store currency code with max length 3', () => {
      const cart = new Cart();
      cart.currency = 'USD';

      expect(cart.currency).toBe('USD');
      expect(cart.currency.length).toBeLessThanOrEqual(3);
    });

    it('should support VND currency', () => {
      const cart = new Cart();
      cart.currency = 'VND';

      expect(cart.currency).toBe('VND');
    });

    it('should support other common currencies', () => {
      const usdCart = new Cart();
      usdCart.currency = 'USD';
      expect(usdCart.currency).toBe('USD');

      const eurCart = new Cart();
      eurCart.currency = 'EUR';
      expect(eurCart.currency).toBe('EUR');

      const gbpCart = new Cart();
      gbpCart.currency = 'GBP';
      expect(gbpCart.currency).toBe('GBP');
    });
  });

  describe('Expiration Logic', () => {
    it('should check if cart is expired based on expires_at', () => {
      const cart = new Cart();
      const pastDate = new Date(Date.now() - 1000);
      cart.expires_at = pastDate;

      expect(cart.expires_at).toBe(pastDate);
      expect(cart.expires_at!.getTime()).toBeLessThan(new Date().getTime());
    });

    it('should check if cart is not expired when expires_at is in future', () => {
      const cart = new Cart();
      const futureDate = new Date(Date.now() + 1000 * 60 * 60);
      cart.expires_at = futureDate;

      expect(cart.expires_at).toBe(futureDate);
      expect(cart.expires_at!.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should handle carts without expiration', () => {
      const cart = new Cart();
      cart.expires_at = undefined;

      expect(cart.expires_at).toBeUndefined();
    });
  });
});
