import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import { getTestDataSource, resetTestDatabase } from '../../setup/test-datasource';
import { generateTestAccessToken } from '../../helpers/auth.helper';
import adminRouter from '../../../src/routes/admin';
import { Review } from '../../../src/modules/reviews/entity/review';
import { User } from '../../../src/modules/users/entity/user.entity';
import { Product } from '../../../src/modules/products/entity/product';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';
import { Category } from '../../../src/modules/products/entity/category';
import { Brand } from '../../../src/modules/products/entity/brand';
import { OrderItem } from '../../../src/modules/orders/entity/order-item';
import { Order } from '../../../src/modules/orders/entity/order';
import { ADMIN_USER, USER_1, USER_2 } from '../../fixtures/users.fixture';
import { PRODUCT_1, PRODUCT_2 } from '../../fixtures/products.fixture';
import { RoleType } from '../../../src/modules/auth/enum/auth.enum';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../src/modules/orders/enum/order.enum';

describe('Admin Review Service Integration Tests', () => {
  let app: Express;
  let dataSource: DataSource;
  let adminToken: string;
  let reviewRepository: ReturnType<typeof dataSource.getRepository<Review>>;
  let userRepository: ReturnType<typeof dataSource.getRepository<User>>;
  let productRepository: ReturnType<typeof dataSource.getRepository<Product>>;
  let variantRepository: ReturnType<typeof dataSource.getRepository<ProductVariant>>;
  let categoryRepository: ReturnType<typeof dataSource.getRepository<Category>>;
  let brandRepository: ReturnType<typeof dataSource.getRepository<Brand>>;
  let orderRepository: ReturnType<typeof dataSource.getRepository<Order>>;
  let orderItemRepository: ReturnType<typeof dataSource.getRepository<OrderItem>>;

  // Test data
  let testUser1: User;
  let testUser2: User;
  let testProduct1: Product;
  let testProduct2: Product;
  let testOrder: Order;
  let testOrderItem1: OrderItem;
  let testOrderItem2: OrderItem;

  beforeAll(async () => {
    dataSource = getTestDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      await dataSource.query('PRAGMA foreign_keys = OFF');
    }

    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminRouter);

    adminToken = generateTestAccessToken(ADMIN_USER.id, ADMIN_USER.email, RoleType.ADMIN);

    reviewRepository = dataSource.getRepository(Review);
    userRepository = dataSource.getRepository(User);
    productRepository = dataSource.getRepository(Product);
    variantRepository = dataSource.getRepository(ProductVariant);
    categoryRepository = dataSource.getRepository(Category);
    brandRepository = dataSource.getRepository(Brand);
    orderRepository = dataSource.getRepository(Order);
    orderItemRepository = dataSource.getRepository(OrderItem);
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const timestamp = Date.now();
    
    testUser1 = await userRepository.save({
      ...USER_1,
      id: undefined,
      email: `user1-${timestamp}@test.com`,
      phone_number: `090${timestamp.toString().slice(-7)}`,
    });
    testUser2 = await userRepository.save({
      ...USER_2,
      id: undefined,
      email: `user2-${timestamp}@test.com`,
      phone_number: `091${timestamp.toString().slice(-7)}`,
    });

    const category = await categoryRepository.save({
      name: 'Test Category',
      slug: `test-category-${timestamp}`,
      description: 'Test category description',
    });

    const brand = await brandRepository.save({
      name: 'Test Brand',
      slug: `test-brand-${timestamp}`,
      description: 'Test brand description',
    });

    testProduct1 = await productRepository.save({
      ...PRODUCT_1,
      id: undefined,
      slug: `product-1-${timestamp}`,
      sku: `SKU-1-${timestamp}`,
      category_id: category.id,
      brand_id: brand.id,
    });
    testProduct2 = await productRepository.save({
      ...PRODUCT_2,
      id: undefined,
      slug: `product-2-${timestamp}`,
      sku: `SKU-2-${timestamp}`,
      category_id: category.id,
      brand_id: brand.id,
    });

    const variant1 = await variantRepository.save({
      product_id: testProduct1.id,
      sku: `VAR-SKU-1-${timestamp}`,
      size: 'S',
      color: 'Black',
      final_price: 500000,
      is_active: true,
    });

    const variant2 = await variantRepository.save({
      product_id: testProduct2.id,
      sku: `VAR-SKU-2-${timestamp}`,
      size: 'M',
      color: 'Blue',
      final_price: 500000,
      is_active: true,
    });
    testUser2 = await userRepository.save({
      ...USER_2,
      id: undefined,
    });

    // Create test products
    testProduct1 = await productRepository.save({
      ...PRODUCT_1,
      id: undefined,
      category_id: 1,
      brand_id: 1,
    });
    testProduct2 = await productRepository.save({
      ...PRODUCT_2,
      id: undefined,
      category_id: 1,
      brand_id: 1,
    });

    // Create test order
    testOrder = await orderRepository.save({
      user_id: testUser1.id,
      order_number: `ORDER-${timestamp}`,
      status: OrderStatus.DELIVERED,
      subtotal: 1000000,
      total_amount: 1000000,
      currency: 'VND',
      payment_method: PaymentMethod.COD,
      payment_status: PaymentStatus.PAID,
      shipping_address: { address: 'Test Address', city: 'Test City' },
      billing_address: { address: 'Test Address', city: 'Test City' },
    });

    // Create test order items
    testOrderItem1 = await orderItemRepository.save({
      order_id: testOrder.id,
      product_id: testProduct1.id,
      variant_id: variant1.id,
      product_snapshot: {
        name: testProduct1.name,
        sku: testProduct1.sku,
        price: testProduct1.base_price
      },
      quantity: 1,
      unit_price: 500000,
      total_price: 500000,
    });

    testOrderItem2 = await orderItemRepository.save({
      order_id: testOrder.id,
      product_id: testProduct2.id,
      variant_id: variant2.id,
      product_snapshot: {
        name: testProduct2.name,
        sku: testProduct2.sku,
        price: testProduct2.base_price
      },
      quantity: 1,
      unit_price: 500000,
      total_price: 500000,
    });
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('GET /api/v1/admin/reviews - List Reviews', () => {
    it('should list all reviews with pagination', async () => {
      // Create test reviews
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          title: 'Excellent Product',
          content: 'Love this product!',
          is_verified_purchase: true,
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 4,
          title: 'Good Quality',
          content: 'Nice quality product',
          is_verified_purchase: true,
          is_approved: false,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('should filter reviews by is_approved=false', async () => {
      // Create approved and unapproved reviews
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: 'Approved review',
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 3,
          content: 'Unapproved review 1',
          is_approved: false,
        },
        {
          product_id: testProduct1.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem1.id,
          rating: 2,
          content: 'Unapproved review 2',
          is_approved: false,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ is_approved: false });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data.every((r: any) => r.is_approved === false)).toBe(true);
    });

    it('should filter reviews by is_approved=true', async () => {
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: 'Approved review 1',
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem2.id,
          rating: 4,
          content: 'Approved review 2',
          is_approved: true,
        },
        {
          product_id: testProduct1.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem1.id,
          rating: 2,
          content: 'Unapproved review',
          is_approved: false,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ is_approved: true });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data.every((r: any) => r.is_approved === true)).toBe(true);
    });

    it('should filter reviews by product_id', async () => {
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: 'Review for product 1',
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 4,
          content: 'Review for product 2',
          is_approved: true,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ product_id: testProduct1.id });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].product_id).toBe(testProduct1.id);
    });

    it('should filter reviews by user_id', async () => {
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: 'Review by user 1',
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 4,
          content: 'Review by user 2',
          is_approved: true,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ user_id: testUser1.id });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].user_id).toBe(testUser1.id);
    });

    it('should filter reviews by rating', async () => {
      await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: '5-star review',
          is_approved: true,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 3,
          content: '3-star review',
          is_approved: true,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].rating).toBe(5);
    });
  });

  describe('GET /api/v1/admin/reviews/:id - Get Review', () => {
    it('should get review with user and product relations', async () => {
      const review = await reviewRepository.save({
        product_id: testProduct1.id,
        user_id: testUser1.id,
        order_item_id: testOrderItem1.id,
        rating: 5,
        title: 'Great Product',
        content: 'Highly recommend',
        is_verified_purchase: true,
        is_approved: true,
      });

      const response = await request(app)
        .get(`/api/v1/admin/reviews/${review.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: review.id,
        product_id: testProduct1.id,
        user_id: testUser1.id,
        rating: 5,
        title: 'Great Product',
        content: 'Highly recommend',
      });
      expect(response.body.data.user).toMatchObject({
        id: testUser1.id,
        fullname: testUser1.fullname,
        email: testUser1.email,
      });
      expect(response.body.data.product).toMatchObject({
        id: testProduct1.id,
        name: testProduct1.name,
        slug: testProduct1.slug,
      });
    });

    it('should return 404 when review does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/reviews/:id/approve - Approve Review', () => {
    it('should approve review and set is_approved to true', async () => {
      const review = await reviewRepository.save({
        product_id: testProduct1.id,
        user_id: testUser1.id,
        order_item_id: testOrderItem1.id,
        rating: 5,
        content: 'Pending review',
        is_approved: false,
      });

      const response = await request(app)
        .post(`/api/v1/admin/reviews/${review.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_approved).toBe(true);

      // Verify in database
      const updatedReview = await reviewRepository.findOne({
        where: { id: review.id },
      });
      expect(updatedReview?.is_approved).toBe(true);
    });

    it('should return 404 when approving non-existent review', async () => {
      const response = await request(app)
        .post('/api/v1/admin/reviews/99999/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/reviews/:id/reject - Reject Review', () => {
    it('should reject review and set is_approved to false', async () => {
      const review = await reviewRepository.save({
        product_id: testProduct1.id,
        user_id: testUser1.id,
        order_item_id: testOrderItem1.id,
        rating: 5,
        content: 'Approved review',
        is_approved: true,
      });

      const response = await request(app)
        .post(`/api/v1/admin/reviews/${review.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_approved).toBe(false);

      // Verify in database
      const updatedReview = await reviewRepository.findOne({
        where: { id: review.id },
      });
      expect(updatedReview?.is_approved).toBe(false);
    });

    it('should return 404 when rejecting non-existent review', async () => {
      const response = await request(app)
        .post('/api/v1/admin/reviews/99999/reject')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/reviews/:id - Delete Review', () => {
    it('should soft-delete review', async () => {
      const review = await reviewRepository.save({
        product_id: testProduct1.id,
        user_id: testUser1.id,
        order_item_id: testOrderItem1.id,
        rating: 5,
        content: 'Review to delete',
        is_approved: true,
      });

      const response = await request(app)
        .delete(`/api/v1/admin/reviews/${review.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const deletedReview = await reviewRepository.findOne({
        where: { id: review.id },
        withDeleted: true,
      });
      expect(deletedReview?.deleted_at).not.toBeNull();

      // Verify not found without withDeleted
      const normalQuery = await reviewRepository.findOne({
        where: { id: review.id },
      });
      expect(normalQuery).toBeNull();
    });

    it('should return 404 when deleting non-existent review', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/reviews/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/reviews/bulk-approve - Bulk Approve', () => {
    it('should approve multiple reviews at once', async () => {
      const reviews = await reviewRepository.save([
        {
          product_id: testProduct1.id,
          user_id: testUser1.id,
          order_item_id: testOrderItem1.id,
          rating: 5,
          content: 'Review 1',
          is_approved: false,
        },
        {
          product_id: testProduct2.id,
          user_id: testUser2.id,
          order_item_id: testOrderItem2.id,
          rating: 4,
          content: 'Review 2',
          is_approved: false,
        },
      ]);

      const ids = reviews.map(r => r.id);
      const response = await request(app)
        .post('/api/v1/admin/reviews/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.approved).toBe(2);

      // Verify in database
      const updatedReviews = await reviewRepository.find({
        where: ids.map(id => ({ id })),
      });
      expect(updatedReviews.every(r => r.is_approved === true)).toBe(true);
    });

    it('should reject bulk approve with more than 100 items', async () => {
      const ids = Array.from({ length: 101 }, (_, i) => i + 1);

      const response = await request(app)
        .post('/api/v1/admin/reviews/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when no IDs provided', async () => {
      const response = await request(app)
        .post('/api/v1/admin/reviews/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when some reviews do not exist', async () => {
      const review = await reviewRepository.save({
        product_id: testProduct1.id,
        user_id: testUser1.id,
        order_item_id: testOrderItem1.id,
        rating: 5,
        content: 'Valid review',
        is_approved: false,
      });

      const response = await request(app)
        .post('/api/v1/admin/reviews/bulk-approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [review.id, 99999] });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should return 400 for invalid review ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ rating: 10 }); // Invalid rating (should be 1-5)

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
