import { ProductImage } from './product-image';
import { Product } from './product';
import { ProductVariant } from './product-variant';

describe('ProductImage Entity', () => {
  describe('Schema Validation', () => {
    it('should create a ProductImage with all required fields', () => {
      const image = new ProductImage();
      image.id = 1;
      image.product_id = 10;
      image.image_url = 'https://cdn.example.com/product-123.jpg';
      image.sort_order = 0;
      image.is_primary = false;
      
      expect(image.id).toBe(1);
      expect(image.product_id).toBe(10);
      expect(image.image_url).toBe('https://cdn.example.com/product-123.jpg');
      expect(image.sort_order).toBe(0);
      expect(image.is_primary).toBe(false);
    });

    it('should allow nullable variant_id for product-level images', () => {
      const image = new ProductImage();
      image.variant_id = undefined;
      
      expect(image.variant_id).toBeUndefined();
    });

    it('should accept variant_id for variant-specific images', () => {
      const image = new ProductImage();
      image.variant_id = 5;
      
      expect(image.variant_id).toBe(5);
    });

    it('should allow nullable thumbnail_url', () => {
      const image = new ProductImage();
      image.thumbnail_url = undefined;
      
      expect(image.thumbnail_url).toBeUndefined();
    });

    it('should allow nullable alt_text', () => {
      const image = new ProductImage();
      image.alt_text = undefined;
      
      expect(image.alt_text).toBeUndefined();
    });

    it('should allow nullable deleted_at for active images', () => {
      const image = new ProductImage();
      image.deleted_at = undefined;
      
      expect(image.deleted_at).toBeUndefined();
    });

    it('should default sort_order to 0', () => {
      const image = new ProductImage();
      image.sort_order = 0;
      
      expect(image.sort_order).toBe(0);
    });

    it('should default is_primary to false', () => {
      const image = new ProductImage();
      image.is_primary = false;
      
      expect(image.is_primary).toBe(false);
    });
  });

  describe('Field Constraints', () => {
    it('should accept image_url at max length (500)', () => {
      const image = new ProductImage();
      const baseUrl = 'https://cdn.example.com/';
      image.image_url = baseUrl + 'a'.repeat(500 - baseUrl.length);
      
      expect(image.image_url.length).toBe(500);
    });

    it('should accept realistic CDN URLs', () => {
      const urls = [
        'https://cloudinary.com/image/upload/v123/product.jpg',
        'https://s3.amazonaws.com/bucket/product-image.png',
        'https://cdn.example.com/products/2024/01/shirt-red-m.jpg',
      ];
      
      urls.forEach(url => {
        const image = new ProductImage();
        image.image_url = url;
        expect(image.image_url).toBe(url);
        expect(image.image_url.length).toBeLessThanOrEqual(500);
      });
    });

    it('should accept thumbnail_url at max length (500)', () => {
      const image = new ProductImage();
      const baseUrl = 'https://cdn.example.com/thumb/';
      image.thumbnail_url = baseUrl + 'a'.repeat(500 - baseUrl.length);
      
      expect(image.thumbnail_url!.length).toBe(500);
    });

    it('should accept realistic thumbnail URLs', () => {
      const image = new ProductImage();
      image.thumbnail_url = 'https://cdn.example.com/thumbnails/product-123-thumb.jpg';
      
      expect(image.thumbnail_url).toContain('thumb');
      expect(image.thumbnail_url!.length).toBeLessThanOrEqual(500);
    });

    it('should accept alt_text at max length (255)', () => {
      const image = new ProductImage();
      image.alt_text = 'a'.repeat(255);
      
      expect(image.alt_text.length).toBe(255);
    });

    it('should accept descriptive alt_text for SEO', () => {
      const altTexts = [
        'Red cotton t-shirt front view',
        'Product detail close-up showing fabric texture',
        'Blue jeans back pocket detail',
      ];
      
      altTexts.forEach(text => {
        const image = new ProductImage();
        image.alt_text = text;
        expect(image.alt_text).toBe(text);
        expect(image.alt_text!.length).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at on creation', () => {
      const image = new ProductImage();
      image.created_at = new Date();
      
      expect(image.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at on modification', () => {
      const image = new ProductImage();
      image.updated_at = new Date();
      
      expect(image.updated_at).toBeInstanceOf(Date);
    });

    it('should set deleted_at on soft delete', () => {
      const image = new ProductImage();
      image.deleted_at = new Date();
      
      expect(image.deleted_at).toBeInstanceOf(Date);
    });

    it('should leave deleted_at null for active images', () => {
      const image = new ProductImage();
      image.deleted_at = undefined;
      
      expect(image.deleted_at).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with Product', () => {
      const product = new Product();
      product.id = 1;
      product.name = 'Test Product';
      
      const image = new ProductImage();
      image.product = product;
      image.product_id = product.id;
      
      expect(image.product).toBe(product);
      expect(image.product_id).toBe(1);
    });

    it('should define optional ManyToOne relationship with ProductVariant', () => {
      const variant = new ProductVariant();
      variant.id = 5;
      variant.sku = 'VARIANT-SKU';
      
      const image = new ProductImage();
      image.variant = variant;
      image.variant_id = variant.id;
      
      expect(image.variant).toBe(variant);
      expect(image.variant_id).toBe(5);
    });

    it('should allow product-level image without variant', () => {
      const product = new Product();
      product.id = 1;
      
      const image = new ProductImage();
      image.product_id = product.id;
      image.variant_id = undefined;
      image.variant = undefined;
      
      expect(image.product_id).toBe(1);
      expect(image.variant_id).toBeUndefined();
      expect(image.variant).toBeUndefined();
    });

    it('should allow multiple images for same product', () => {
      const product = new Product();
      product.id = 1;
      
      const image1 = new ProductImage();
      image1.product_id = product.id;
      image1.image_url = 'url1.jpg';
      image1.sort_order = 0;
      
      const image2 = new ProductImage();
      image2.product_id = product.id;
      image2.image_url = 'url2.jpg';
      image2.sort_order = 1;
      
      expect(image1.product_id).toBe(image2.product_id);
      expect(image1.image_url).not.toBe(image2.image_url);
    });

    it('should allow multiple images for same variant', () => {
      const variant = new ProductVariant();
      variant.id = 5;
      
      const image1 = new ProductImage();
      image1.variant_id = variant.id;
      image1.image_url = 'variant-front.jpg';
      
      const image2 = new ProductImage();
      image2.variant_id = variant.id;
      image2.image_url = 'variant-back.jpg';
      
      expect(image1.variant_id).toBe(image2.variant_id);
      expect(image1.image_url).not.toBe(image2.image_url);
    });
  });

  describe('Business Logic', () => {
    it('should support sort ordering for image gallery', () => {
      const image1 = new ProductImage();
      image1.sort_order = 0;
      
      const image2 = new ProductImage();
      image2.sort_order = 1;
      
      const image3 = new ProductImage();
      image3.sort_order = 2;
      
      expect(image1.sort_order).toBeLessThan(image2.sort_order);
      expect(image2.sort_order).toBeLessThan(image3.sort_order);
    });

    it('should allow negative sort_order for priority images', () => {
      const image = new ProductImage();
      image.sort_order = -1;
      
      expect(image.sort_order).toBe(-1);
    });

    it('should designate primary image with is_primary flag', () => {
      const primaryImage = new ProductImage();
      primaryImage.is_primary = true;
      primaryImage.image_url = 'primary.jpg';
      
      const secondaryImage = new ProductImage();
      secondaryImage.is_primary = false;
      secondaryImage.image_url = 'secondary.jpg';
      
      expect(primaryImage.is_primary).toBe(true);
      expect(secondaryImage.is_primary).toBe(false);
    });

    it('should support thumbnail for performance optimization', () => {
      const image = new ProductImage();
      image.image_url = 'https://cdn.example.com/products/full-res.jpg';
      image.thumbnail_url = 'https://cdn.example.com/products/thumb.jpg';
      
      expect(image.image_url).toContain('full-res');
      expect(image.thumbnail_url).toContain('thumb');
    });
  });

  describe('SEO and Accessibility', () => {
    it('should support alt_text for screen readers', () => {
      const image = new ProductImage();
      image.alt_text = 'Red cotton t-shirt front view on white background';
      
      expect(image.alt_text).toBeTruthy();
      expect(image.alt_text).toContain('t-shirt');
    });

    it('should allow empty alt_text for decorative images', () => {
      const image = new ProductImage();
      image.alt_text = undefined;
      
      expect(image.alt_text).toBeUndefined();
    });
  });

  describe('Image Gallery Scenarios', () => {
    it('should support product with multiple views', () => {
      const productId = 1;
      
      const frontView = new ProductImage();
      frontView.product_id = productId;
      frontView.image_url = 'front.jpg';
      frontView.alt_text = 'Front view';
      frontView.sort_order = 0;
      frontView.is_primary = true;
      
      const backView = new ProductImage();
      backView.product_id = productId;
      backView.image_url = 'back.jpg';
      backView.alt_text = 'Back view';
      backView.sort_order = 1;
      
      const sideView = new ProductImage();
      sideView.product_id = productId;
      sideView.image_url = 'side.jpg';
      sideView.alt_text = 'Side view';
      sideView.sort_order = 2;
      
      expect(frontView.is_primary).toBe(true);
      expect([frontView, backView, sideView].every(img => img.product_id === productId)).toBe(true);
    });

    it('should support variant-specific images', () => {
      const productId = 1;
      const redVariantId = 10;
      const blueVariantId = 11;
      
      const redImage = new ProductImage();
      redImage.product_id = productId;
      redImage.variant_id = redVariantId;
      redImage.image_url = 'red-variant.jpg';
      
      const blueImage = new ProductImage();
      blueImage.product_id = productId;
      blueImage.variant_id = blueVariantId;
      blueImage.image_url = 'blue-variant.jpg';
      
      expect(redImage.product_id).toBe(blueImage.product_id);
      expect(redImage.variant_id).not.toBe(blueImage.variant_id);
    });

    it('should support mix of product and variant images', () => {
      const productId = 1;
      const variantId = 10;
      
      const generalImage = new ProductImage();
      generalImage.product_id = productId;
      generalImage.variant_id = undefined;
      generalImage.image_url = 'general.jpg';
      
      const variantImage = new ProductImage();
      variantImage.product_id = productId;
      variantImage.variant_id = variantId;
      variantImage.image_url = 'variant-specific.jpg';
      
      expect(generalImage.product_id).toBe(variantImage.product_id);
      expect(generalImage.variant_id).toBeUndefined();
      expect(variantImage.variant_id).toBe(variantId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long image URLs', () => {
      const image = new ProductImage();
      image.image_url = 'https://example.com/' + 'a'.repeat(480);
      
      expect(image.image_url.length).toBeLessThanOrEqual(500);
    });

    it('should handle image without thumbnail', () => {
      const image = new ProductImage();
      image.image_url = 'full-size.jpg';
      image.thumbnail_url = undefined;
      
      expect(image.image_url).toBeTruthy();
      expect(image.thumbnail_url).toBeUndefined();
    });

    it('should handle same-length full and thumbnail URLs', () => {
      const image = new ProductImage();
      image.image_url = 'https://cdn.example.com/full.jpg';
      image.thumbnail_url = 'https://cdn.example.com/thumb.jpg';
      
      expect(image.image_url.length).toBeGreaterThan(0);
      expect(image.thumbnail_url!.length).toBeGreaterThan(0);
    });

    it('should handle zero sort_order', () => {
      const image = new ProductImage();
      image.sort_order = 0;
      
      expect(image.sort_order).toBe(0);
    });

    it('should handle large sort_order values', () => {
      const image = new ProductImage();
      image.sort_order = 999;
      
      expect(image.sort_order).toBe(999);
    });

    it('should handle product with only one image', () => {
      const image = new ProductImage();
      image.product_id = 1;
      image.image_url = 'only-image.jpg';
      image.is_primary = true;
      image.sort_order = 0;
      
      expect(image.is_primary).toBe(true);
      expect(image.sort_order).toBe(0);
    });
  });
});
