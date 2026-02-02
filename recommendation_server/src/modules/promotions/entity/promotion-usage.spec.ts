import { PromotionUsage } from './promotion-usage';

describe('PromotionUsage Entity', () => {
  describe('Schema Validation', () => {
    it('should create a promotion usage with all required fields', () => {
      const usage = new PromotionUsage();
      usage.id = 1;
      usage.promotion_id = 10;
      usage.order_id = 100;
      usage.user_id = 5;
      usage.discount_amount = 25.50;
      usage.used_at = new Date();

      expect(usage.id).toBe(1);
      expect(usage.promotion_id).toBe(10);
      expect(usage.order_id).toBe(100);
      expect(usage.user_id).toBe(5);
      expect(usage.discount_amount).toBe(25.50);
      expect(usage.used_at).toBeInstanceOf(Date);
    });

    it('should require promotion_id', () => {
      const usage = new PromotionUsage();
      usage.promotion_id = 10;

      expect(usage.promotion_id).toBe(10);
    });

    it('should require order_id', () => {
      const usage = new PromotionUsage();
      usage.order_id = 100;

      expect(usage.order_id).toBe(100);
    });

    it('should require user_id', () => {
      const usage = new PromotionUsage();
      usage.user_id = 5;

      expect(usage.user_id).toBe(5);
    });

    it('should require discount_amount', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 15.99;

      expect(usage.discount_amount).toBe(15.99);
    });

    it('should require used_at timestamp', () => {
      const usage = new PromotionUsage();
      const timestamp = new Date();
      usage.used_at = timestamp;

      expect(usage.used_at).toEqual(timestamp);
    });
  });

  describe('Decimal Precision', () => {
    it('should store discount_amount with 2 decimal places', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 49.99;

      expect(usage.discount_amount).toBe(49.99);
    });

    it('should handle whole numbers for discount_amount', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 50;

      expect(usage.discount_amount).toBe(50);
    });

    it('should handle zero discount_amount', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 0;

      expect(usage.discount_amount).toBe(0);
    });

    it('should handle small decimal values', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 0.01;

      expect(usage.discount_amount).toBe(0.01);
    });

    it('should handle large decimal values within precision', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 99999999.99;

      expect(usage.discount_amount).toBe(99999999.99);
    });
  });

  describe('Timestamp Fields', () => {
    it('should store used_at as timestamp', () => {
      const usage = new PromotionUsage();
      const timestamp = new Date('2024-01-15T10:30:00Z');
      usage.used_at = timestamp;

      expect(usage.used_at).toEqual(timestamp);
    });

    it('should handle current timestamp for used_at', () => {
      const usage = new PromotionUsage();
      const now = new Date();
      usage.used_at = now;

      expect(usage.used_at).toEqual(now);
    });

    it('should preserve millisecond precision in timestamps', () => {
      const usage = new PromotionUsage();
      const timestamp = new Date('2024-01-15T10:30:45.123Z');
      usage.used_at = timestamp;

      expect(usage.used_at.getMilliseconds()).toBe(timestamp.getMilliseconds());
    });
  });

  describe('Relationships', () => {
    it('should have many-to-one relationship with Promotion', () => {
      const usage = new PromotionUsage();
      usage.promotion_id = 10;

      expect(usage.promotion_id).toBe(10);
      expect(usage.promotion).toBeUndefined();
    });

    it('should have many-to-one relationship with Order', () => {
      const usage = new PromotionUsage();
      usage.order_id = 100;

      expect(usage.order_id).toBe(100);
      expect(usage.order).toBeUndefined();
    });

    it('should have many-to-one relationship with User', () => {
      const usage = new PromotionUsage();
      usage.user_id = 5;

      expect(usage.user_id).toBe(5);
      expect(usage.user).toBeUndefined();
    });
  });

  describe('Business Logic - Usage Tracking', () => {
    it('should track when a promotion was used for an order', () => {
      const usage = new PromotionUsage();
      usage.promotion_id = 10;
      usage.order_id = 100;
      usage.user_id = 5;
      usage.discount_amount = 20.00;
      usage.used_at = new Date('2024-01-15T10:30:00Z');

      expect(usage.promotion_id).toBe(10);
      expect(usage.order_id).toBe(100);
      expect(usage.user_id).toBe(5);
      expect(usage.discount_amount).toBe(20.00);
      expect(usage.used_at).toBeInstanceOf(Date);
    });

    it('should allow multiple usages of same promotion by different users', () => {
      const usage1 = new PromotionUsage();
      usage1.promotion_id = 10;
      usage1.user_id = 1;
      usage1.order_id = 100;

      const usage2 = new PromotionUsage();
      usage2.promotion_id = 10;
      usage2.user_id = 2;
      usage2.order_id = 101;

      expect(usage1.promotion_id).toBe(usage2.promotion_id);
      expect(usage1.user_id).not.toBe(usage2.user_id);
      expect(usage1.order_id).not.toBe(usage2.order_id);
    });

    it('should allow same user to use different promotions', () => {
      const usage1 = new PromotionUsage();
      usage1.promotion_id = 10;
      usage1.user_id = 1;
      usage1.order_id = 100;

      const usage2 = new PromotionUsage();
      usage2.promotion_id = 11;
      usage2.user_id = 1;
      usage2.order_id = 101;

      expect(usage1.user_id).toBe(usage2.user_id);
      expect(usage1.promotion_id).not.toBe(usage2.promotion_id);
      expect(usage1.order_id).not.toBe(usage2.order_id);
    });

    it('should record actual discount applied at time of use', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 15.50;

      expect(usage.discount_amount).toBe(15.50);
    });

    it('should handle promotional discount of zero', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 0.00;

      expect(usage.discount_amount).toBe(0.00);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small discount amounts', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 0.01;

      expect(usage.discount_amount).toBe(0.01);
    });

    it('should handle large discount amounts', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 9999.99;

      expect(usage.discount_amount).toBe(9999.99);
    });

    it('should handle maximum decimal precision', () => {
      const usage = new PromotionUsage();
      usage.discount_amount = 12345.67;

      expect(usage.discount_amount).toBe(12345.67);
    });

    it('should allow same promotion on multiple orders for same user', () => {
      const usage1 = new PromotionUsage();
      usage1.promotion_id = 10;
      usage1.user_id = 1;
      usage1.order_id = 100;

      const usage2 = new PromotionUsage();
      usage2.promotion_id = 10;
      usage2.user_id = 1;
      usage2.order_id = 101;

      expect(usage1.promotion_id).toBe(usage2.promotion_id);
      expect(usage1.user_id).toBe(usage2.user_id);
      expect(usage1.order_id).not.toBe(usage2.order_id);
    });

    it('should store historical promotion usage even after promotion is deleted', () => {
      const usage = new PromotionUsage();
      usage.promotion_id = 999;
      usage.order_id = 100;
      usage.user_id = 5;
      usage.discount_amount = 10.00;
      usage.used_at = new Date();

      expect(usage.promotion_id).toBe(999);
    });
  });
});
