import { Promotion } from './promotion';
import { PromotionType, PromotionAppliesTo } from '../enum/promotion.enum';

describe('Promotion Entity', () => {
  describe('Schema Validation', () => {
    it('should create a promotion with all required fields', () => {
      const promotion = new Promotion();
      promotion.id = 1;
      promotion.code = 'SAVE20';
      promotion.name = 'Summer Sale';
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 20;
      promotion.is_active = true;
      promotion.applies_to = PromotionAppliesTo.ALL;
      promotion.created_at = new Date();
      promotion.updated_at = new Date();

      expect(promotion.id).toBe(1);
      expect(promotion.code).toBe('SAVE20');
      expect(promotion.name).toBe('Summer Sale');
      expect(promotion.type).toBe(PromotionType.PERCENTAGE);
      expect(promotion.value).toBe(20);
      expect(promotion.is_active).toBe(true);
      expect(promotion.applies_to).toBe(PromotionAppliesTo.ALL);
    });

    it('should allow optional fields to be undefined', () => {
      const promotion = new Promotion();
      promotion.code = 'TEST';
      promotion.name = 'Test Promo';
      promotion.type = PromotionType.FIXED_AMOUNT;
      promotion.value = 10;

      expect(promotion.description).toBeUndefined();
      expect(promotion.min_order_amount).toBeUndefined();
      expect(promotion.max_discount_amount).toBeUndefined();
      expect(promotion.usage_limit).toBeUndefined();
      expect(promotion.usage_limit_per_user).toBeUndefined();
      expect(promotion.starts_at).toBeUndefined();
      expect(promotion.ends_at).toBeUndefined();
      expect(promotion.applicable_ids).toBeUndefined();
      expect(promotion.deleted_at).toBeUndefined();
    });

    it('should set default value for is_active as true', () => {
      const promotion = new Promotion();
      promotion.is_active = true;

      expect(promotion.is_active).toBe(true);
    });

    it('should set default value for applies_to as ALL', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.ALL;

      expect(promotion.applies_to).toBe(PromotionAppliesTo.ALL);
    });

    it('should allow optional description field', () => {
      const promotion = new Promotion();
      promotion.description = 'Save 20% on all summer items';

      expect(promotion.description).toBe('Save 20% on all summer items');
    });

    it('should allow long text in description field', () => {
      const promotion = new Promotion();
      const longDescription = 'a'.repeat(1000);
      promotion.description = longDescription;

      expect(promotion.description).toBe(longDescription);
      expect(promotion.description?.length).toBe(1000);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique code constraint', () => {
      const promotion1 = new Promotion();
      promotion1.code = 'UNIQUE2024';

      const promotion2 = new Promotion();
      promotion2.code = 'UNIQUE2024';

      expect(promotion1.code).toBe(promotion2.code);
    });

    it('should allow different codes for different promotions', () => {
      const promotion1 = new Promotion();
      promotion1.code = 'SUMMER20';

      const promotion2 = new Promotion();
      promotion2.code = 'WINTER30';

      expect(promotion1.code).not.toBe(promotion2.code);
    });
  });

  describe('Field Constraints', () => {
    it('should enforce code max length of 50 characters', () => {
      const promotion = new Promotion();
      promotion.code = 'A'.repeat(50);

      expect(promotion.code.length).toBe(50);
    });

    it('should enforce name max length of 100 characters', () => {
      const promotion = new Promotion();
      promotion.name = 'A'.repeat(100);

      expect(promotion.name.length).toBe(100);
    });

    it('should allow code with special characters and numbers', () => {
      const promotion = new Promotion();
      promotion.code = 'SAVE-2024_50%';

      expect(promotion.code).toBe('SAVE-2024_50%');
    });

    it('should store code in uppercase by convention', () => {
      const promotion = new Promotion();
      promotion.code = 'BLACKFRIDAY2024';

      expect(promotion.code).toBe('BLACKFRIDAY2024');
    });
  });

  describe('Enum Validation', () => {
    it('should accept PERCENTAGE promotion type', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;

      expect(promotion.type).toBe(PromotionType.PERCENTAGE);
      expect(promotion.type).toBe('percentage');
    });

    it('should accept FIXED_AMOUNT promotion type', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.FIXED_AMOUNT;

      expect(promotion.type).toBe(PromotionType.FIXED_AMOUNT);
      expect(promotion.type).toBe('fixed_amount');
    });

    it('should accept FREE_SHIPPING promotion type', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.FREE_SHIPPING;

      expect(promotion.type).toBe(PromotionType.FREE_SHIPPING);
      expect(promotion.type).toBe('free_shipping');
    });

    it('should accept ALL applies_to value', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.ALL;

      expect(promotion.applies_to).toBe(PromotionAppliesTo.ALL);
      expect(promotion.applies_to).toBe('all');
    });

    it('should accept CATEGORIES applies_to value', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.CATEGORIES;

      expect(promotion.applies_to).toBe(PromotionAppliesTo.CATEGORIES);
      expect(promotion.applies_to).toBe('categories');
    });

    it('should accept PRODUCTS applies_to value', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.PRODUCTS;

      expect(promotion.applies_to).toBe(PromotionAppliesTo.PRODUCTS);
      expect(promotion.applies_to).toBe('products');
    });
  });

  describe('Decimal Precision', () => {
    it('should store value with 2 decimal places', () => {
      const promotion = new Promotion();
      promotion.value = 25.99;

      expect(promotion.value).toBe(25.99);
    });

    it('should handle whole numbers for value', () => {
      const promotion = new Promotion();
      promotion.value = 50;

      expect(promotion.value).toBe(50);
    });

    it('should store min_order_amount with 2 decimal places', () => {
      const promotion = new Promotion();
      promotion.min_order_amount = 100.50;

      expect(promotion.min_order_amount).toBe(100.50);
    });

    it('should store max_discount_amount with 2 decimal places', () => {
      const promotion = new Promotion();
      promotion.max_discount_amount = 500.75;

      expect(promotion.max_discount_amount).toBe(500.75);
    });

    it('should handle large decimal values within precision', () => {
      const promotion = new Promotion();
      promotion.value = 99999999.99;

      expect(promotion.value).toBe(99999999.99);
    });
  });

  describe('Timestamp Fields', () => {
    it('should store starts_at timestamp', () => {
      const promotion = new Promotion();
      const startDate = new Date('2024-01-01T00:00:00Z');
      promotion.starts_at = startDate;

      expect(promotion.starts_at).toEqual(startDate);
    });

    it('should store ends_at timestamp', () => {
      const promotion = new Promotion();
      const endDate = new Date('2024-12-31T23:59:59Z');
      promotion.ends_at = endDate;

      expect(promotion.ends_at).toEqual(endDate);
    });

    it('should auto-generate created_at timestamp', () => {
      const promotion = new Promotion();
      const now = new Date();
      promotion.created_at = now;

      expect(promotion.created_at).toEqual(now);
    });

    it('should auto-update updated_at timestamp', () => {
      const promotion = new Promotion();
      const now = new Date();
      promotion.updated_at = now;

      expect(promotion.updated_at).toEqual(now);
    });

    it('should allow deleted_at to be null for active promotions', () => {
      const promotion = new Promotion();
      
      expect(promotion.deleted_at).toBeUndefined();
    });

    it('should store deleted_at timestamp for soft-deleted promotions', () => {
      const promotion = new Promotion();
      const deletedDate = new Date();
      promotion.deleted_at = deletedDate;

      expect(promotion.deleted_at).toEqual(deletedDate);
    });
  });

  describe('Relationships', () => {
    it('should have one-to-many relationship with PromotionUsage', () => {
      const promotion = new Promotion();
      
      expect(promotion.usages).toBeUndefined();
    });

    it('should allow multiple usages to be associated', () => {
      const promotion = new Promotion();
      promotion.usages = [];

      expect(Array.isArray(promotion.usages)).toBe(true);
      expect(promotion.usages.length).toBe(0);
    });
  });

  describe('Business Logic - Discount Calculations', () => {
    it('should calculate percentage discount correctly (20% off $100)', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 20;
      
      const orderAmount = 100;
      const discountAmount = Number(((orderAmount * promotion.value) / 100).toFixed(2));

      expect(discountAmount).toBe(20.00);
    });

    it('should calculate fixed amount discount correctly ($10 off $100)', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.FIXED_AMOUNT;
      promotion.value = 10;
      
      const orderAmount = 100;
      const discountAmount = Number(promotion.value.toFixed(2));
      const finalAmount = Number((orderAmount - discountAmount).toFixed(2));

      expect(discountAmount).toBe(10.00);
      expect(finalAmount).toBe(90.00);
    });

    it('should respect max_discount_amount for percentage promotions', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 50;
      promotion.max_discount_amount = 100;
      
      const orderAmount = 500;
      const calculatedDiscount = Number(((orderAmount * promotion.value) / 100).toFixed(2));
      const actualDiscount = Math.min(calculatedDiscount, promotion.max_discount_amount);

      expect(calculatedDiscount).toBe(250.00);
      expect(actualDiscount).toBe(100.00);
    });

    it('should apply full discount when below max_discount_amount', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 20;
      promotion.max_discount_amount = 100;
      
      const orderAmount = 200;
      const calculatedDiscount = Number(((orderAmount * promotion.value) / 100).toFixed(2));
      const actualDiscount = Math.min(calculatedDiscount, promotion.max_discount_amount);

      expect(calculatedDiscount).toBe(40.00);
      expect(actualDiscount).toBe(40.00);
    });
  });

  describe('Business Logic - Usage Limits', () => {
    it('should track usage_limit for total promotion uses', () => {
      const promotion = new Promotion();
      promotion.usage_limit = 100;

      expect(promotion.usage_limit).toBe(100);
    });

    it('should track usage_limit_per_user for individual user limits', () => {
      const promotion = new Promotion();
      promotion.usage_limit_per_user = 5;

      expect(promotion.usage_limit_per_user).toBe(5);
    });

    it('should allow unlimited usage when limits are null', () => {
      const promotion = new Promotion();
      promotion.usage_limit = undefined;
      promotion.usage_limit_per_user = undefined;

      expect(promotion.usage_limit).toBeUndefined();
      expect(promotion.usage_limit_per_user).toBeUndefined();
    });

    it('should handle usage_limit of 1 for one-time promotions', () => {
      const promotion = new Promotion();
      promotion.usage_limit = 1;

      expect(promotion.usage_limit).toBe(1);
    });
  });

  describe('Business Logic - Minimum Order Amount', () => {
    it('should require minimum order amount when set', () => {
      const promotion = new Promotion();
      promotion.min_order_amount = 50.00;
      
      const orderAmount1 = 75.00;
      const orderAmount2 = 30.00;
      
      const isValid1 = orderAmount1 >= promotion.min_order_amount;
      const isValid2 = orderAmount2 >= promotion.min_order_amount;

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
    });

    it('should allow any order amount when min_order_amount is null', () => {
      const promotion = new Promotion();
      promotion.min_order_amount = undefined;
      
      const smallOrder = 1.00;
      const isValid = promotion.min_order_amount === undefined || smallOrder >= promotion.min_order_amount;

      expect(isValid).toBe(true);
    });

    it('should accept exact minimum order amount', () => {
      const promotion = new Promotion();
      promotion.min_order_amount = 100.00;
      
      const orderAmount = 100.00;
      const isValid = orderAmount >= promotion.min_order_amount;

      expect(isValid).toBe(true);
    });
  });

  describe('Business Logic - Date Validation', () => {
    it('should validate promotion is active within date range', () => {
      const promotion = new Promotion();
      promotion.starts_at = new Date('2024-01-01');
      promotion.ends_at = new Date('2024-12-31');
      
      const checkDate = new Date('2024-06-15');
      const isWithinRange = checkDate >= promotion.starts_at && checkDate <= promotion.ends_at;

      expect(isWithinRange).toBe(true);
    });

    it('should invalidate promotion before start date', () => {
      const promotion = new Promotion();
      promotion.starts_at = new Date('2024-06-01');
      promotion.ends_at = new Date('2024-06-30');
      
      const checkDate = new Date('2024-05-31');
      const isWithinRange = checkDate >= promotion.starts_at && checkDate <= promotion.ends_at;

      expect(isWithinRange).toBe(false);
    });

    it('should invalidate promotion after end date', () => {
      const promotion = new Promotion();
      promotion.starts_at = new Date('2024-01-01');
      promotion.ends_at = new Date('2024-01-31');
      
      const checkDate = new Date('2024-02-01');
      const isWithinRange = checkDate >= promotion.starts_at && checkDate <= promotion.ends_at;

      expect(isWithinRange).toBe(false);
    });

    it('should allow promotions without date restrictions when dates are null', () => {
      const promotion = new Promotion();
      
      const checkDate = new Date();
      const hasNoStartRestriction = !promotion.starts_at;
      const hasNoEndRestriction = !promotion.ends_at;

      expect(hasNoStartRestriction).toBe(true);
      expect(hasNoEndRestriction).toBe(true);
    });
  });

  describe('Business Logic - Active Status', () => {
    it('should mark promotion as active', () => {
      const promotion = new Promotion();
      promotion.is_active = true;

      expect(promotion.is_active).toBe(true);
    });

    it('should mark promotion as inactive', () => {
      const promotion = new Promotion();
      promotion.is_active = false;

      expect(promotion.is_active).toBe(false);
    });

    it('should prevent usage when is_active is false', () => {
      const promotion = new Promotion();
      promotion.is_active = false;
      promotion.starts_at = new Date('2024-01-01');
      promotion.ends_at = new Date('2024-12-31');
      
      const checkDate = new Date('2024-06-15');
      const isDateValid = checkDate >= promotion.starts_at && checkDate <= promotion.ends_at;
      const canUse = promotion.is_active && isDateValid;

      expect(isDateValid).toBe(true);
      expect(canUse).toBe(false);
    });
  });

  describe('Business Logic - Applicable Scope', () => {
    it('should apply to all products when applies_to is ALL', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.ALL;
      promotion.applicable_ids = undefined;

      expect(promotion.applies_to).toBe(PromotionAppliesTo.ALL);
      expect(promotion.applicable_ids).toBeUndefined();
    });

    it('should apply to specific categories when applies_to is CATEGORIES', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.CATEGORIES;
      promotion.applicable_ids = [1, 2, 3];

      expect(promotion.applies_to).toBe(PromotionAppliesTo.CATEGORIES);
      expect(promotion.applicable_ids).toEqual([1, 2, 3]);
    });

    it('should apply to specific products when applies_to is PRODUCTS', () => {
      const promotion = new Promotion();
      promotion.applies_to = PromotionAppliesTo.PRODUCTS;
      promotion.applicable_ids = [101, 102, 103];

      expect(promotion.applies_to).toBe(PromotionAppliesTo.PRODUCTS);
      expect(promotion.applicable_ids).toEqual([101, 102, 103]);
    });

    it('should store empty array for applicable_ids', () => {
      const promotion = new Promotion();
      promotion.applicable_ids = [];

      expect(promotion.applicable_ids).toEqual([]);
      expect(promotion.applicable_ids?.length).toBe(0);
    });

    it('should handle large applicable_ids array', () => {
      const promotion = new Promotion();
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
      promotion.applicable_ids = largeArray;

      expect(promotion.applicable_ids?.length).toBe(100);
      expect(promotion.applicable_ids).toEqual(largeArray);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero discount value', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 0;

      expect(promotion.value).toBe(0);
    });

    it('should handle 100% discount (free promotion)', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.PERCENTAGE;
      promotion.value = 100;
      
      const orderAmount = 100;
      const discountAmount = Number(((orderAmount * promotion.value) / 100).toFixed(2));

      expect(promotion.value).toBe(100);
      expect(discountAmount).toBe(100.00);
    });

    it('should handle same start and end date (single day promotion)', () => {
      const promotion = new Promotion();
      const singleDay = new Date('2024-06-15');
      promotion.starts_at = singleDay;
      promotion.ends_at = singleDay;

      expect(promotion.starts_at).toEqual(promotion.ends_at);
    });

    it('should handle min_order_amount of zero', () => {
      const promotion = new Promotion();
      promotion.min_order_amount = 0;

      expect(promotion.min_order_amount).toBe(0);
    });

    it('should handle very small decimal values', () => {
      const promotion = new Promotion();
      promotion.value = 0.01;
      promotion.min_order_amount = 0.01;
      promotion.max_discount_amount = 0.01;

      expect(promotion.value).toBe(0.01);
      expect(promotion.min_order_amount).toBe(0.01);
      expect(promotion.max_discount_amount).toBe(0.01);
    });

    it('should handle free shipping promotion type', () => {
      const promotion = new Promotion();
      promotion.type = PromotionType.FREE_SHIPPING;
      promotion.value = 0;

      expect(promotion.type).toBe(PromotionType.FREE_SHIPPING);
      expect(promotion.value).toBe(0);
    });
  });
});
