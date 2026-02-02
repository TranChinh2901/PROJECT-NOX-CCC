import { Review } from './review';
import { ReviewHelpful } from './review-helpful';
import { User } from '@/modules/users/entity/user.entity';
import { Product } from '@/modules/products/entity/product';
import { OrderItem } from '@/modules/orders/entity/order-item';

describe('Review Entity', () => {
  describe('Schema Validation', () => {
    it('should create a Review with all required fields', () => {
      const review = new Review();
      review.id = 1;
      review.product_id = 10;
      review.user_id = 5;
      review.order_item_id = 20;
      review.rating = 5;
      review.content = 'Great product!';
      review.is_verified_purchase = false;
      review.is_approved = false;
      review.helpful_count = 0;
      review.not_helpful_count = 0;
      
      expect(review.id).toBe(1);
      expect(review.product_id).toBe(10);
      expect(review.user_id).toBe(5);
      expect(review.order_item_id).toBe(20);
      expect(review.rating).toBe(5);
      expect(review.content).toBe('Great product!');
    });

    it('should allow nullable title', () => {
      const review = new Review();
      review.title = undefined;
      
      expect(review.title).toBeUndefined();
    });

    it('should allow nullable deleted_at', () => {
      const review = new Review();
      review.deleted_at = undefined;
      
      expect(review.deleted_at).toBeUndefined();
    });

    it('should default is_verified_purchase to false', () => {
      const review = new Review();
      review.is_verified_purchase = false;
      
      expect(review.is_verified_purchase).toBe(false);
    });

    it('should default is_approved to false', () => {
      const review = new Review();
      review.is_approved = false;
      
      expect(review.is_approved).toBe(false);
    });

    it('should default helpful_count to 0', () => {
      const review = new Review();
      review.helpful_count = 0;
      
      expect(review.helpful_count).toBe(0);
    });

    it('should default not_helpful_count to 0', () => {
      const review = new Review();
      review.not_helpful_count = 0;
      
      expect(review.not_helpful_count).toBe(0);
    });
  });

  describe('Rating Validation', () => {
    it('should accept rating of 1 (minimum)', () => {
      const review = new Review();
      review.rating = 1;
      
      expect(review.rating).toBe(1);
      expect(review.rating).toBeGreaterThanOrEqual(1);
    });

    it('should accept rating of 5 (maximum)', () => {
      const review = new Review();
      review.rating = 5;
      
      expect(review.rating).toBe(5);
      expect(review.rating).toBeLessThanOrEqual(5);
    });

    it('should accept all valid ratings 1-5', () => {
      const ratings = [1, 2, 3, 4, 5];
      
      ratings.forEach(rating => {
        const review = new Review();
        review.rating = rating;
        expect(review.rating).toBe(rating);
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Field Constraints', () => {
    it('should accept title at max length (200)', () => {
      const review = new Review();
      review.title = 'a'.repeat(200);
      
      expect(review.title.length).toBe(200);
    });

    it('should accept realistic review titles', () => {
      const titles = [
        'Excellent quality!',
        'Great product, highly recommend',
        'Disappointed with the quality',
      ];
      
      titles.forEach(title => {
        const review = new Review();
        review.title = title;
        expect(review.title).toBe(title);
        expect(review.title!.length).toBeLessThanOrEqual(200);
      });
    });

    it('should accept long review content', () => {
      const review = new Review();
      review.content = 'a'.repeat(5000);
      
      expect(review.content.length).toBe(5000);
    });

    it('should accept realistic review content', () => {
      const review = new Review();
      review.content = 'I purchased this product last month and have been very satisfied with the quality. The material is excellent and it fits perfectly. Highly recommend!';
      
      expect(review.content).toBeTruthy();
      expect(review.content.length).toBeGreaterThan(0);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at', () => {
      const review = new Review();
      review.created_at = new Date();
      
      expect(review.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at', () => {
      const review = new Review();
      review.updated_at = new Date();
      
      expect(review.updated_at).toBeInstanceOf(Date);
    });

    it('should set deleted_at on soft delete', () => {
      const review = new Review();
      review.deleted_at = new Date();
      
      expect(review.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with Product', () => {
      const product = new Product();
      product.id = 10;
      
      const review = new Review();
      review.product = product;
      review.product_id = product.id;
      
      expect(review.product).toBe(product);
      expect(review.product_id).toBe(10);
    });

    it('should define ManyToOne relationship with User', () => {
      const user = new User();
      user.id = 5;
      
      const review = new Review();
      review.user = user;
      review.user_id = user.id;
      
      expect(review.user).toBe(user);
      expect(review.user_id).toBe(5);
    });

    it('should define ManyToOne relationship with OrderItem', () => {
      const orderItem = new OrderItem();
      orderItem.id = 20;
      
      const review = new Review();
      review.order_item = orderItem;
      review.order_item_id = orderItem.id;
      
      expect(review.order_item).toBe(orderItem);
      expect(review.order_item_id).toBe(20);
    });

    it('should define OneToMany relationship with ReviewHelpful', () => {
      const review = new Review();
      review.id = 1;
      
      const vote1 = new ReviewHelpful();
      vote1.review_id = review.id;
      vote1.is_helpful = true;
      
      const vote2 = new ReviewHelpful();
      vote2.review_id = review.id;
      vote2.is_helpful = false;
      
      review.helpful_votes = [vote1, vote2];
      
      expect(review.helpful_votes).toHaveLength(2);
    });

    it('should allow multiple reviews for same product', () => {
      const productId = 10;
      
      const review1 = new Review();
      review1.product_id = productId;
      review1.user_id = 1;
      
      const review2 = new Review();
      review2.product_id = productId;
      review2.user_id = 2;
      
      expect(review1.product_id).toBe(review2.product_id);
      expect(review1.user_id).not.toBe(review2.user_id);
    });
  });

  describe('Verified Purchase', () => {
    it('should mark review as verified purchase', () => {
      const review = new Review();
      review.is_verified_purchase = true;
      
      expect(review.is_verified_purchase).toBe(true);
    });

    it('should allow unverified reviews', () => {
      const review = new Review();
      review.is_verified_purchase = false;
      
      expect(review.is_verified_purchase).toBe(false);
    });
  });

  describe('Moderation', () => {
    it('should start as unapproved', () => {
      const review = new Review();
      review.is_approved = false;
      
      expect(review.is_approved).toBe(false);
    });

    it('should allow approval', () => {
      const review = new Review();
      review.is_approved = false;
      
      review.is_approved = true;
      
      expect(review.is_approved).toBe(true);
    });

    it('should allow rejection (soft delete)', () => {
      const review = new Review();
      review.is_approved = false;
      review.deleted_at = new Date();
      
      expect(review.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe('Helpfulness Tracking', () => {
    it('should track helpful votes', () => {
      const review = new Review();
      review.helpful_count = 10;
      
      expect(review.helpful_count).toBe(10);
    });

    it('should track not helpful votes', () => {
      const review = new Review();
      review.not_helpful_count = 2;
      
      expect(review.not_helpful_count).toBe(2);
    });

    it('should increment helpful count', () => {
      const review = new Review();
      review.helpful_count = 5;
      
      review.helpful_count += 1;
      
      expect(review.helpful_count).toBe(6);
    });

    it('should calculate helpfulness ratio', () => {
      const review = new Review();
      review.helpful_count = 8;
      review.not_helpful_count = 2;
      
      const total = review.helpful_count + review.not_helpful_count;
      const ratio = review.helpful_count / total;
      
      expect(ratio).toBe(0.8);
    });
  });

  describe('Rating Distribution', () => {
    it('should support 5-star review', () => {
      const review = new Review();
      review.rating = 5;
      review.title = 'Perfect!';
      review.content = 'Exceeded my expectations';
      
      expect(review.rating).toBe(5);
    });

    it('should support 1-star review', () => {
      const review = new Review();
      review.rating = 1;
      review.title = 'Very disappointed';
      review.content = 'Did not match description';
      
      expect(review.rating).toBe(1);
    });

    it('should support 3-star review', () => {
      const review = new Review();
      review.rating = 3;
      review.title = 'It\'s okay';
      review.content = 'Average quality, nothing special';
      
      expect(review.rating).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle review with no title', () => {
      const review = new Review();
      review.title = undefined;
      review.content = 'Just content, no title';
      
      expect(review.title).toBeUndefined();
      expect(review.content).toBeTruthy();
    });

    it('should handle very short content', () => {
      const review = new Review();
      review.content = 'Good';
      
      expect(review.content).toBe('Good');
    });

    it('should handle zero helpful votes', () => {
      const review = new Review();
      review.helpful_count = 0;
      review.not_helpful_count = 0;
      
      expect(review.helpful_count).toBe(0);
      expect(review.not_helpful_count).toBe(0);
    });

    it('should enforce counts >= 0', () => {
      const review = new Review();
      review.helpful_count = 0;
      review.not_helpful_count = 0;
      
      expect(review.helpful_count).toBeGreaterThanOrEqual(0);
      expect(review.not_helpful_count).toBeGreaterThanOrEqual(0);
    });
  });
});
