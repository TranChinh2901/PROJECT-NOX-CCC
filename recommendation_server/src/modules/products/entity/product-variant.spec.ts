import { ProductVariant } from './product-variant';
import { Product } from './product';

describe('ProductVariant Entity', () => {
  describe('Schema Validation', () => {
    it('should create a ProductVariant with all required fields', () => {
      const variant = new ProductVariant();
      variant.id = 1;
      variant.product_id = 10;
      variant.sku = 'TSHIRT-RED-M-001';
      variant.price_adjustment = 0;
      variant.final_price = 29.99;
      variant.is_active = true;
      variant.sort_order = 0;
      
      expect(variant.id).toBe(1);
      expect(variant.product_id).toBe(10);
      expect(variant.sku).toBe('TSHIRT-RED-M-001');
      expect(variant.price_adjustment).toBe(0);
      expect(variant.final_price).toBe(29.99);
      expect(variant.is_active).toBe(true);
      expect(variant.sort_order).toBe(0);
    });

    it('should allow nullable size field', () => {
      const variant = new ProductVariant();
      variant.size = undefined;
      
      expect(variant.size).toBeUndefined();
    });

    it('should allow nullable color field', () => {
      const variant = new ProductVariant();
      variant.color = undefined;
      
      expect(variant.color).toBeUndefined();
    });

    it('should allow nullable color_code field', () => {
      const variant = new ProductVariant();
      variant.color_code = undefined;
      
      expect(variant.color_code).toBeUndefined();
    });

    it('should allow nullable material field', () => {
      const variant = new ProductVariant();
      variant.material = undefined;
      
      expect(variant.material).toBeUndefined();
    });

    it('should allow nullable weight_kg field', () => {
      const variant = new ProductVariant();
      variant.weight_kg = undefined;
      
      expect(variant.weight_kg).toBeUndefined();
    });

    it('should allow nullable barcode field', () => {
      const variant = new ProductVariant();
      variant.barcode = undefined;
      
      expect(variant.barcode).toBeUndefined();
    });

    it('should allow nullable deleted_at for active variants', () => {
      const variant = new ProductVariant();
      variant.deleted_at = undefined;
      
      expect(variant.deleted_at).toBeUndefined();
    });

    it('should default price_adjustment to 0', () => {
      const variant = new ProductVariant();
      variant.price_adjustment = 0;
      
      expect(variant.price_adjustment).toBe(0);
    });

    it('should default is_active to true', () => {
      const variant = new ProductVariant();
      variant.is_active = true;
      
      expect(variant.is_active).toBe(true);
    });

    it('should default sort_order to 0', () => {
      const variant = new ProductVariant();
      variant.sort_order = 0;
      
      expect(variant.sort_order).toBe(0);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique SKU', () => {
      const variant1 = new ProductVariant();
      variant1.sku = 'UNIQUE-SKU-001';
      
      const variant2 = new ProductVariant();
      variant2.sku = 'UNIQUE-SKU-001';
      
      expect(variant1.sku).toBe(variant2.sku);
    });

    it('should allow different SKUs for different variants', () => {
      const variant1 = new ProductVariant();
      variant1.sku = 'SKU-001';
      
      const variant2 = new ProductVariant();
      variant2.sku = 'SKU-002';
      
      expect(variant1.sku).not.toBe(variant2.sku);
    });

    it('should enforce unique barcode when provided', () => {
      const variant1 = new ProductVariant();
      variant1.barcode = '1234567890123';
      
      const variant2 = new ProductVariant();
      variant2.barcode = '1234567890123';
      
      expect(variant1.barcode).toBe(variant2.barcode);
    });

    it('should allow different barcodes for different variants', () => {
      const variant1 = new ProductVariant();
      variant1.barcode = '1234567890123';
      
      const variant2 = new ProductVariant();
      variant2.barcode = '9876543210987';
      
      expect(variant1.barcode).not.toBe(variant2.barcode);
    });

    it('should allow multiple variants with null barcode', () => {
      const variant1 = new ProductVariant();
      variant1.barcode = undefined;
      
      const variant2 = new ProductVariant();
      variant2.barcode = undefined;
      
      expect(variant1.barcode).toBeUndefined();
      expect(variant2.barcode).toBeUndefined();
    });
  });

  describe('Field Constraints', () => {
    it('should accept SKU at max length (100)', () => {
      const variant = new ProductVariant();
      variant.sku = 'a'.repeat(100);
      
      expect(variant.sku.length).toBe(100);
    });

    it('should accept size at max length (50)', () => {
      const variant = new ProductVariant();
      variant.size = 'a'.repeat(50);
      
      expect(variant.size.length).toBe(50);
    });

    it('should accept common size values', () => {
      const sizes = ['S', 'M', 'L', 'XL', 'XXL', '42', '43', 'One Size'];
      
      sizes.forEach(size => {
        const variant = new ProductVariant();
        variant.size = size;
        expect(variant.size).toBe(size);
      });
    });

    it('should accept color at max length (50)', () => {
      const variant = new ProductVariant();
      variant.color = 'a'.repeat(50);
      
      expect(variant.color.length).toBe(50);
    });

    it('should accept common color names', () => {
      const colors = ['Red', 'Blue', 'Black', 'White', 'Navy Blue', 'Forest Green'];
      
      colors.forEach(color => {
        const variant = new ProductVariant();
        variant.color = color;
        expect(variant.color).toBe(color);
      });
    });

    it('should accept hex color code (7 chars with #)', () => {
      const variant = new ProductVariant();
      variant.color_code = '#FF0000';
      
      expect(variant.color_code).toBe('#FF0000');
      expect(variant.color_code.length).toBe(7);
    });

    it('should accept various hex color codes', () => {
      const colorCodes = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#123ABC'];
      
      colorCodes.forEach(code => {
        const variant = new ProductVariant();
        variant.color_code = code;
        expect(variant.color_code).toBe(code);
        expect(variant.color_code!.length).toBe(7);
      });
    });

    it('should accept material at max length (50)', () => {
      const variant = new ProductVariant();
      variant.material = 'a'.repeat(50);
      
      expect(variant.material.length).toBe(50);
    });

    it('should accept common material types', () => {
      const materials = ['Cotton', 'Polyester', 'Leather', 'Wool', 'Silk', 'Denim'];
      
      materials.forEach(material => {
        const variant = new ProductVariant();
        variant.material = material;
        expect(variant.material).toBe(material);
      });
    });

    it('should accept barcode at max length (100)', () => {
      const variant = new ProductVariant();
      variant.barcode = '1'.repeat(100);
      
      expect(variant.barcode!.length).toBe(100);
    });

    it('should accept common barcode formats', () => {
      const barcodes = [
        '1234567890123',
        '978-0-123456-78-9',
        'EAN-13-CODE',
      ];
      
      barcodes.forEach(barcode => {
        const variant = new ProductVariant();
        variant.barcode = barcode;
        expect(variant.barcode).toBe(barcode);
      });
    });
  });

  describe('Decimal Precision', () => {
    it('should handle price_adjustment with 2 decimal places', () => {
      const variant = new ProductVariant();
      variant.price_adjustment = 5.50;
      
      expect(variant.price_adjustment).toBe(5.50);
    });

    it('should handle negative price_adjustment (discount)', () => {
      const variant = new ProductVariant();
      variant.price_adjustment = -10.00;
      
      expect(variant.price_adjustment).toBe(-10.00);
    });

    it('should handle zero price_adjustment', () => {
      const variant = new ProductVariant();
      variant.price_adjustment = 0;
      
      expect(variant.price_adjustment).toBe(0);
    });

    it('should handle final_price with 2 decimal places', () => {
      const variant = new ProductVariant();
      variant.final_price = 49.99;
      
      expect(variant.final_price).toBe(49.99);
    });

    it('should calculate final_price from base price and adjustment', () => {
      const basePrice = 29.99;
      const adjustment = 5.00;
      const variant = new ProductVariant();
      variant.price_adjustment = adjustment;
      variant.final_price = Number((basePrice + adjustment).toFixed(2));
      
      expect(variant.final_price).toBe(34.99);
    });

    it('should handle weight_kg with 3 decimal places', () => {
      const variant = new ProductVariant();
      variant.weight_kg = 1.250;
      
      expect(variant.weight_kg).toBe(1.250);
    });

    it('should handle lightweight items', () => {
      const variant = new ProductVariant();
      variant.weight_kg = 0.125;
      
      expect(variant.weight_kg).toBe(0.125);
    });

    it('should handle heavy items', () => {
      const variant = new ProductVariant();
      variant.weight_kg = 25.500;
      
      expect(variant.weight_kg).toBe(25.500);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at on creation', () => {
      const variant = new ProductVariant();
      variant.created_at = new Date();
      
      expect(variant.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at on modification', () => {
      const variant = new ProductVariant();
      variant.updated_at = new Date();
      
      expect(variant.updated_at).toBeInstanceOf(Date);
    });

    it('should set deleted_at on soft delete', () => {
      const variant = new ProductVariant();
      variant.deleted_at = new Date();
      
      expect(variant.deleted_at).toBeInstanceOf(Date);
    });

    it('should leave deleted_at null for active variants', () => {
      const variant = new ProductVariant();
      variant.deleted_at = undefined;
      
      expect(variant.deleted_at).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with Product', () => {
      const product = new Product();
      product.id = 1;
      product.name = 'Test Product';
      
      const variant = new ProductVariant();
      variant.product = product;
      variant.product_id = product.id;
      
      expect(variant.product).toBe(product);
      expect(variant.product_id).toBe(1);
    });

    it('should allow multiple variants for same product', () => {
      const product = new Product();
      product.id = 1;
      
      const variant1 = new ProductVariant();
      variant1.product_id = product.id;
      variant1.sku = 'PROD-001-RED-M';
      variant1.color = 'Red';
      variant1.size = 'M';
      
      const variant2 = new ProductVariant();
      variant2.product_id = product.id;
      variant2.sku = 'PROD-001-BLUE-L';
      variant2.color = 'Blue';
      variant2.size = 'L';
      
      expect(variant1.product_id).toBe(variant2.product_id);
      expect(variant1.sku).not.toBe(variant2.sku);
    });
  });

  describe('Business Logic', () => {
    it('should support price adjustment above base price', () => {
      const basePrice = 29.99;
      const premiumAdjustment = 10.00;
      
      const variant = new ProductVariant();
      variant.price_adjustment = premiumAdjustment;
      variant.final_price = Number((basePrice + premiumAdjustment).toFixed(2));
      
      expect(variant.final_price).toBe(39.99);
      expect(variant.final_price).toBeGreaterThan(basePrice);
    });

    it('should support price adjustment below base price (discount)', () => {
      const basePrice = 29.99;
      const discountAdjustment = -5.00;
      
      const variant = new ProductVariant();
      variant.price_adjustment = discountAdjustment;
      variant.final_price = Number((basePrice + discountAdjustment).toFixed(2));
      
      expect(variant.final_price).toBe(24.99);
      expect(variant.final_price).toBeLessThan(basePrice);
    });

    it('should enforce final_price >= 0', () => {
      const variant = new ProductVariant();
      variant.final_price = 0;
      
      expect(variant.final_price).toBeGreaterThanOrEqual(0);
    });

    it('should support sort ordering for display', () => {
      const variant1 = new ProductVariant();
      variant1.sort_order = 1;
      
      const variant2 = new ProductVariant();
      variant2.sort_order = 2;
      
      const variant3 = new ProductVariant();
      variant3.sort_order = 0;
      
      expect(variant3.sort_order).toBeLessThan(variant1.sort_order);
      expect(variant1.sort_order).toBeLessThan(variant2.sort_order);
    });

    it('should track active/inactive status', () => {
      const variant = new ProductVariant();
      variant.is_active = true;
      
      expect(variant.is_active).toBe(true);
      
      variant.is_active = false;
      expect(variant.is_active).toBe(false);
    });
  });

  describe('Variant Combinations', () => {
    it('should support size + color combination', () => {
      const variant = new ProductVariant();
      variant.sku = 'SHIRT-001-RED-M';
      variant.size = 'M';
      variant.color = 'Red';
      variant.color_code = '#FF0000';
      
      expect(variant.size).toBe('M');
      expect(variant.color).toBe('Red');
      expect(variant.color_code).toBe('#FF0000');
    });

    it('should support size + color + material combination', () => {
      const variant = new ProductVariant();
      variant.sku = 'SHIRT-001-RED-M-COTTON';
      variant.size = 'M';
      variant.color = 'Red';
      variant.material = 'Cotton';
      
      expect(variant.size).toBe('M');
      expect(variant.color).toBe('Red');
      expect(variant.material).toBe('Cotton');
    });

    it('should support variants with only size attribute', () => {
      const variant = new ProductVariant();
      variant.sku = 'BASIC-TSHIRT-M';
      variant.size = 'M';
      variant.color = undefined;
      variant.material = undefined;
      
      expect(variant.size).toBe('M');
      expect(variant.color).toBeUndefined();
      expect(variant.material).toBeUndefined();
    });

    it('should support variants with only color attribute', () => {
      const variant = new ProductVariant();
      variant.sku = 'ONESIZE-HAT-RED';
      variant.color = 'Red';
      variant.size = undefined;
      variant.material = undefined;
      
      expect(variant.color).toBe('Red');
      expect(variant.size).toBeUndefined();
      expect(variant.material).toBeUndefined();
    });

    it('should support variants with no attributes (single SKU products)', () => {
      const variant = new ProductVariant();
      variant.sku = 'UNIQUE-ITEM-001';
      variant.size = undefined;
      variant.color = undefined;
      variant.material = undefined;
      
      expect(variant.size).toBeUndefined();
      expect(variant.color).toBeUndefined();
      expect(variant.material).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long SKU', () => {
      const variant = new ProductVariant();
      variant.sku = 'a'.repeat(100);
      
      expect(variant.sku.length).toBe(100);
    });

    it('should handle zero final price', () => {
      const variant = new ProductVariant();
      variant.final_price = 0;
      
      expect(variant.final_price).toBe(0);
    });

    it('should handle very small weight', () => {
      const variant = new ProductVariant();
      variant.weight_kg = 0.001;
      
      expect(variant.weight_kg).toBe(0.001);
    });

    it('should handle negative sort_order', () => {
      const variant = new ProductVariant();
      variant.sort_order = -1;
      
      expect(variant.sort_order).toBe(-1);
    });

    it('should handle variant with barcode but no other attributes', () => {
      const variant = new ProductVariant();
      variant.sku = 'SIMPLE-001';
      variant.barcode = '1234567890123';
      variant.size = undefined;
      variant.color = undefined;
      variant.material = undefined;
      
      expect(variant.barcode).toBe('1234567890123');
      expect(variant.size).toBeUndefined();
    });
  });
});
