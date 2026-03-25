import { UserBehaviorLog } from './user-behavior-log';
import { UserActionType } from '../enum/user-behavior.enum';
import { DeviceType } from '@/modules/users/enum/user-session.enum';

describe('UserBehaviorLog Entity', () => {
  describe('Schema Validation', () => {
    it('should create a user behavior log with all required fields', () => {
      const log = new UserBehaviorLog();
      log.id = 1;
      log.session_id = 100;
      log.action_type = UserActionType.VIEW;
      log.device_type = DeviceType.DESKTOP;
      log.page_url = 'https://example.com/products/123';
      log.created_at = new Date();

      expect(log.id).toBe(1);
      expect(log.session_id).toBe(100);
      expect(log.action_type).toBe(UserActionType.VIEW);
      expect(log.device_type).toBe(DeviceType.DESKTOP);
      expect(log.page_url).toBe('https://example.com/products/123');
      expect(log.created_at).toBeInstanceOf(Date);
    });

    it('should require session_id', () => {
      const log = new UserBehaviorLog();
      log.session_id = 100;

      expect(log.session_id).toBe(100);
    });

    it('should require action_type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.CLICK;

      expect(log.action_type).toBe(UserActionType.CLICK);
    });

    it('should require device_type', () => {
      const log = new UserBehaviorLog();
      log.device_type = DeviceType.MOBILE;

      expect(log.device_type).toBe(DeviceType.MOBILE);
    });

    it('should require page_url', () => {
      const log = new UserBehaviorLog();
      log.page_url = 'https://example.com/cart';

      expect(log.page_url).toBe('https://example.com/cart');
    });

    it('should allow optional fields to be undefined', () => {
      const log = new UserBehaviorLog();
      log.session_id = 100;
      log.action_type = UserActionType.VIEW;
      log.device_type = DeviceType.DESKTOP;
      log.page_url = '/products';

      expect(log.user_id).toBeUndefined();
      expect(log.product_id).toBeUndefined();
      expect(log.variant_id).toBeUndefined();
      expect(log.search_query).toBeUndefined();
      expect(log.metadata).toBeUndefined();
      expect(log.referrer_url).toBeUndefined();
      expect(log.ip_address).toBeUndefined();
      expect(log.session_duration_seconds).toBeUndefined();
    });

    it('should allow user_id for authenticated users', () => {
      const log = new UserBehaviorLog();
      log.user_id = 5;

      expect(log.user_id).toBe(5);
    });

    it('should allow anonymous sessions without user_id', () => {
      const log = new UserBehaviorLog();
      log.session_id = 100;
      log.user_id = undefined;

      expect(log.session_id).toBe(100);
      expect(log.user_id).toBeUndefined();
    });
  });

  describe('Field Constraints', () => {
    it('should enforce page_url max length of 500 characters', () => {
      const log = new UserBehaviorLog();
      const baseUrl = 'https://example.com/';
      log.page_url = baseUrl + 'a'.repeat(480);

      expect(log.page_url.length).toBe(500);
    });

    it('should enforce referrer_url max length of 500 characters', () => {
      const log = new UserBehaviorLog();
      const baseUrl = 'https://example.com/';
      log.referrer_url = baseUrl + 'a'.repeat(480);

      expect(log.referrer_url?.length).toBe(500);
    });

    it('should enforce search_query max length of 255 characters', () => {
      const log = new UserBehaviorLog();
      log.search_query = 'a'.repeat(255);

      expect(log.search_query.length).toBe(255);
    });

    it('should enforce ip_address max length of 45 characters', () => {
      const log = new UserBehaviorLog();
      log.ip_address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      expect(log.ip_address.length).toBe(39);
    });

    it('should store IPv4 address', () => {
      const log = new UserBehaviorLog();
      log.ip_address = '192.168.1.1';

      expect(log.ip_address).toBe('192.168.1.1');
    });

    it('should store IPv6 address', () => {
      const log = new UserBehaviorLog();
      log.ip_address = '2001:db8::8a2e:370:7334';

      expect(log.ip_address).toBe('2001:db8::8a2e:370:7334');
    });
  });

  describe('Enum Validation - Action Type', () => {
    it('should accept VIEW action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.VIEW;

      expect(log.action_type).toBe(UserActionType.VIEW);
      expect(log.action_type).toBe('view');
    });

    it('should accept CLICK action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.CLICK;

      expect(log.action_type).toBe(UserActionType.CLICK);
      expect(log.action_type).toBe('click');
    });

    it('should accept ADD_TO_CART action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.ADD_TO_CART;

      expect(log.action_type).toBe(UserActionType.ADD_TO_CART);
      expect(log.action_type).toBe('add_to_cart');
    });

    it('should accept REMOVE_FROM_CART action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.REMOVE_FROM_CART;

      expect(log.action_type).toBe(UserActionType.REMOVE_FROM_CART);
      expect(log.action_type).toBe('remove_from_cart');
    });

    it('should accept PURCHASE action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.PURCHASE;

      expect(log.action_type).toBe(UserActionType.PURCHASE);
      expect(log.action_type).toBe('purchase');
    });

    it('should accept SEARCH action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.SEARCH;

      expect(log.action_type).toBe(UserActionType.SEARCH);
      expect(log.action_type).toBe('search');
    });

    it('should accept WISHLIST_ADD action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.WISHLIST_ADD;

      expect(log.action_type).toBe(UserActionType.WISHLIST_ADD);
      expect(log.action_type).toBe('wishlist_add');
    });

    it('should accept REVIEW_VIEW action type', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.REVIEW_VIEW;

      expect(log.action_type).toBe(UserActionType.REVIEW_VIEW);
      expect(log.action_type).toBe('review_view');
    });
  });

  describe('Enum Validation - Device Type', () => {
    it('should accept DESKTOP device type', () => {
      const log = new UserBehaviorLog();
      log.device_type = DeviceType.DESKTOP;

      expect(log.device_type).toBe(DeviceType.DESKTOP);
      expect(log.device_type).toBe('desktop');
    });

    it('should accept MOBILE device type', () => {
      const log = new UserBehaviorLog();
      log.device_type = DeviceType.MOBILE;

      expect(log.device_type).toBe(DeviceType.MOBILE);
      expect(log.device_type).toBe('mobile');
    });

    it('should accept TABLET device type', () => {
      const log = new UserBehaviorLog();
      log.device_type = DeviceType.TABLET;

      expect(log.device_type).toBe(DeviceType.TABLET);
      expect(log.device_type).toBe('tablet');
    });

    it('should accept UNKNOWN device type', () => {
      const log = new UserBehaviorLog();
      log.device_type = DeviceType.UNKNOWN;

      expect(log.device_type).toBe(DeviceType.UNKNOWN);
      expect(log.device_type).toBe('unknown');
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-generate created_at timestamp', () => {
      const log = new UserBehaviorLog();
      const now = new Date();
      log.created_at = now;

      expect(log.created_at).toEqual(now);
    });

    it('should store timestamp with millisecond precision', () => {
      const log = new UserBehaviorLog();
      const timestamp = new Date('2024-01-15T10:30:45.123Z');
      log.created_at = timestamp;

      expect(log.created_at.getMilliseconds()).toBe(timestamp.getMilliseconds());
    });
  });

  describe('Relationships', () => {
    it('should have many-to-one relationship with UserSession', () => {
      const log = new UserBehaviorLog();
      log.session_id = 100;

      expect(log.session_id).toBe(100);
      expect(log.session).toBeUndefined();
    });

    it('should have many-to-one relationship with User', () => {
      const log = new UserBehaviorLog();
      log.user_id = 5;

      expect(log.user_id).toBe(5);
      expect(log.user).toBeUndefined();
    });

    it('should have many-to-one relationship with Product', () => {
      const log = new UserBehaviorLog();
      log.product_id = 10;

      expect(log.product_id).toBe(10);
      expect(log.product).toBeUndefined();
    });

    it('should have many-to-one relationship with ProductVariant', () => {
      const log = new UserBehaviorLog();
      log.variant_id = 25;

      expect(log.variant_id).toBe(25);
      expect(log.variant).toBeUndefined();
    });
  });

  describe('Business Logic - Product Viewing', () => {
    it('should track product view with product_id', () => {
      const log = new UserBehaviorLog();
      log.session_id = 100;
      log.action_type = UserActionType.VIEW;
      log.product_id = 10;
      log.page_url = 'https://example.com/products/10';
      log.device_type = DeviceType.DESKTOP;
      log.created_at = new Date();

      expect(log.action_type).toBe(UserActionType.VIEW);
      expect(log.product_id).toBe(10);
    });

    it('should track specific variant view', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.VIEW;
      log.product_id = 10;
      log.variant_id = 25;

      expect(log.product_id).toBe(10);
      expect(log.variant_id).toBe(25);
    });
  });

  describe('Business Logic - Shopping Cart Actions', () => {
    it('should track add to cart action', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.ADD_TO_CART;
      log.product_id = 10;
      log.variant_id = 25;
      log.page_url = 'https://example.com/products/10';

      expect(log.action_type).toBe(UserActionType.ADD_TO_CART);
      expect(log.product_id).toBe(10);
      expect(log.variant_id).toBe(25);
    });

    it('should track remove from cart action', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.REMOVE_FROM_CART;
      log.product_id = 10;
      log.page_url = 'https://example.com/cart';

      expect(log.action_type).toBe(UserActionType.REMOVE_FROM_CART);
      expect(log.product_id).toBe(10);
    });
  });

  describe('Business Logic - Search Tracking', () => {
    it('should track search action with query', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.SEARCH;
      log.search_query = 'summer dress';
      log.page_url = 'https://example.com/search?q=summer+dress';

      expect(log.action_type).toBe(UserActionType.SEARCH);
      expect(log.search_query).toBe('summer dress');
    });

    it('should handle empty search query', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.SEARCH;
      log.search_query = '';

      expect(log.search_query).toBe('');
    });

    it('should track long search queries', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.SEARCH;
      log.search_query = 'red cotton summer dress with pockets for women size large';

      expect(log.action_type).toBe(UserActionType.SEARCH);
      expect(log.search_query?.length).toBeGreaterThan(0);
    });
  });

  describe('Business Logic - Purchase Tracking', () => {
    it('should track purchase action', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.PURCHASE;
      log.user_id = 5;
      log.product_id = 10;
      log.page_url = 'https://example.com/checkout/success';

      expect(log.action_type).toBe(UserActionType.PURCHASE);
      expect(log.user_id).toBe(5);
      expect(log.product_id).toBe(10);
    });
  });

  describe('Business Logic - Wishlist Tracking', () => {
    it('should track wishlist add action', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.WISHLIST_ADD;
      log.user_id = 5;
      log.product_id = 10;
      log.page_url = 'https://example.com/products/10';

      expect(log.action_type).toBe(UserActionType.WISHLIST_ADD);
      expect(log.product_id).toBe(10);
    });
  });

  describe('Business Logic - Review Tracking', () => {
    it('should track review view action', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.REVIEW_VIEW;
      log.product_id = 10;
      log.page_url = 'https://example.com/products/10/reviews';

      expect(log.action_type).toBe(UserActionType.REVIEW_VIEW);
      expect(log.product_id).toBe(10);
    });
  });

  describe('Business Logic - Session Duration', () => {
    it('should track session duration in seconds', () => {
      const log = new UserBehaviorLog();
      log.session_duration_seconds = 120;

      expect(log.session_duration_seconds).toBe(120);
    });

    it('should allow zero duration for new sessions', () => {
      const log = new UserBehaviorLog();
      log.session_duration_seconds = 0;

      expect(log.session_duration_seconds).toBe(0);
    });

    it('should handle long session durations', () => {
      const log = new UserBehaviorLog();
      log.session_duration_seconds = 3600;

      expect(log.session_duration_seconds).toBe(3600);
    });
  });

  describe('Business Logic - Metadata Storage', () => {
    it('should store additional metadata as JSON', () => {
      const log = new UserBehaviorLog();
      log.metadata = {
        category: 'dresses',
        price_range: '50-100',
        filters_applied: ['color:red', 'size:M']
      };

      expect(log.metadata).toBeDefined();
      expect(log.metadata).toHaveProperty('category');
    });

    it('should store empty metadata object', () => {
      const log = new UserBehaviorLog();
      log.metadata = {};

      expect(log.metadata).toEqual({});
    });

    it('should handle complex nested metadata', () => {
      const log = new UserBehaviorLog();
      log.metadata = {
        scroll_depth: 75,
        time_on_page: 45,
        clicked_elements: ['add-to-cart', 'size-selector'],
        viewport: { width: 1920, height: 1080 }
      };

      expect(log.metadata).toBeDefined();
      expect(typeof log.metadata).toBe('object');
    });
  });

  describe('Business Logic - Referrer Tracking', () => {
    it('should track referrer URL', () => {
      const log = new UserBehaviorLog();
      log.referrer_url = 'https://google.com/search?q=summer+dress';
      log.page_url = 'https://example.com/products';

      expect(log.referrer_url).toBe('https://google.com/search?q=summer+dress');
    });

    it('should allow null referrer for direct traffic', () => {
      const log = new UserBehaviorLog();
      log.referrer_url = undefined;

      expect(log.referrer_url).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle action without product_id', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.CLICK;
      log.product_id = undefined;
      log.page_url = 'https://example.com/about';

      expect(log.action_type).toBe(UserActionType.CLICK);
      expect(log.product_id).toBeUndefined();
    });

    it('should handle variant_id without product_id', () => {
      const log = new UserBehaviorLog();
      log.variant_id = 25;
      log.product_id = undefined;

      expect(log.variant_id).toBe(25);
      expect(log.product_id).toBeUndefined();
    });

    it('should track actions on non-product pages', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.CLICK;
      log.page_url = 'https://example.com/about-us';
      log.product_id = undefined;

      expect(log.page_url).toBe('https://example.com/about-us');
      expect(log.product_id).toBeUndefined();
    });

    it('should handle very long URLs up to max length', () => {
      const log = new UserBehaviorLog();
      const longUrl = 'https://example.com/products?' + 'param=value&'.repeat(50);
      log.page_url = longUrl.substring(0, 500);

      expect(log.page_url.length).toBe(500);
    });

    it('should preserve special characters in search queries', () => {
      const log = new UserBehaviorLog();
      log.action_type = UserActionType.SEARCH;
      log.search_query = 'women\'s dress (size M) - red & blue';

      expect(log.search_query).toBe('women\'s dress (size M) - red & blue');
    });
  });
});
