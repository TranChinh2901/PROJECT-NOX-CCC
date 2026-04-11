import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import adminRouter from '@/routes/admin';
import { generateTokenWithRole } from '../../helpers/auth.helper';
import { User } from '@/modules/users/entity/user.entity';
import { Order } from '@/modules/orders/entity/order';
import { OrderItem } from '@/modules/orders/entity/order-item';
import { Product } from '@/modules/products/entity/product';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { Category } from '@/modules/products/entity/category';
import { Brand } from '@/modules/products/entity/brand';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/modules/orders/enum/order.enum';
import { HttpStatusCode } from '@/constants/status-code';
import { RoleType } from '@/modules/auth/enum/auth.enum';

describe('Analytics Integration Tests', () => {
  let app: Express;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUser: User;
  let categoryId: number;
  let brandId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    dataSource = AppDataSource;

    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminRouter);

    const userRepo = dataSource.getRepository(User);
    
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin_analytics@test.com' } });
    if (existingAdmin) {
      adminUser = existingAdmin;
    } else {
      adminUser = userRepo.create({
        fullname: 'Admin Analytics',
        email: 'admin_analytics@test.com',
        phone_number: '1234567890',
        password: 'hashed_password',
        role: RoleType.ADMIN,
      });
      await userRepo.save(adminUser);
    }

    adminToken = generateTokenWithRole(adminUser.id, adminUser.email, 'ADMIN');

    const category = await dataSource.getRepository(Category).save({
      name: 'Analytics Category',
      slug: `analytics-category-${Date.now()}`,
      description: 'Analytics test category',
      is_active: true,
    });
    categoryId = category.id;

    const brand = await dataSource.getRepository(Brand).save({
      name: 'Analytics Brand',
      slug: `analytics-brand-${Date.now()}`,
      description: 'Analytics test brand',
      is_active: true,
    });
    brandId = brand.id;
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    const orderRepo = dataSource.getRepository(Order);
    await orderRepo.query('SET FOREIGN_KEY_CHECKS = 0');
    await orderRepo.query('TRUNCATE TABLE order_items');
    await orderRepo.query('TRUNCATE TABLE orders');
    await orderRepo.query('TRUNCATE TABLE product_variants');
    await orderRepo.query('TRUNCATE TABLE products');
    await orderRepo.query("DELETE FROM users WHERE email <> 'admin_analytics@test.com'");
    await orderRepo.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  const createProductRecord = async (name: string, slug: string, sku: string, basePrice: number) =>
    dataSource.getRepository(Product).save({
      category_id: categoryId,
      brand_id: brandId,
      name,
      slug,
      sku,
      description: `${name} description`,
      base_price: basePrice,
      is_active: true,
    });

  const createVariantRecord = async (productId: number, sku: string, finalPrice: number) =>
    dataSource.getRepository(ProductVariant).save({
      product_id: productId,
      sku,
      final_price: finalPrice,
      price_adjustment: 0,
      is_active: true,
    });

  const createOrderRecord = async (
    orderNumber: string,
    status: OrderStatus,
    totalAmount: number,
    createdAt: Date,
    paymentStatus: PaymentStatus = status === OrderStatus.DELIVERED ? PaymentStatus.PAID : PaymentStatus.PENDING,
  ) =>
    dataSource.getRepository(Order).save({
      order_number: orderNumber,
      user_id: adminUser.id,
      status,
      payment_status: paymentStatus,
      payment_method: PaymentMethod.COD,
      shipping_address: { address: '123 Analytics St' },
      billing_address: { address: '123 Analytics St' },
      subtotal: totalAmount,
      total_amount: totalAmount,
      currency: 'VND',
      created_at: createdAt,
    });

  describe('GET /api/v1/admin/analytics/sales', () => {
    it('should return sales stats with completed orders', async () => {
      await createOrderRecord('SAL-001', OrderStatus.DELIVERED, 200, new Date('2024-01-15'), PaymentStatus.PAID);
      await createOrderRecord('SAL-002', OrderStatus.DELIVERED, 300, new Date('2024-01-20'), PaymentStatus.PAID);

      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toMatchObject({
        total_revenue: 500,
        total_orders: 2,
        average_order_value: 250,
      });
    });

    it('should exclude cancelled orders from sales stats', async () => {
      await createOrderRecord('SAL-003', OrderStatus.DELIVERED, 200, new Date('2024-01-15'), PaymentStatus.PAID);
      await createOrderRecord('SAL-004', OrderStatus.CANCELLED, 500, new Date('2024-01-20'));

      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toMatchObject({
        total_revenue: 200,
        total_orders: 1,
        average_order_value: 200,
      });
    });

    it('should return zeros for empty date range', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2099-01-01',
          end_date: '2099-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toMatchObject({
        total_revenue: 0,
        total_orders: 0,
        average_order_value: 0,
      });
    });

    it('should filter by date range correctly', async () => {
      await createOrderRecord('SAL-005', OrderStatus.DELIVERED, 100, new Date('2023-12-31'), PaymentStatus.PAID);
      await createOrderRecord('SAL-006', OrderStatus.DELIVERED, 200, new Date('2024-01-15'), PaymentStatus.PAID);
      await createOrderRecord('SAL-007', OrderStatus.DELIVERED, 300, new Date('2024-02-01'), PaymentStatus.PAID);

      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.total_revenue).toBe(200);
      expect(response.body.data.total_orders).toBe(1);
    });

    it('should return 400 for invalid date range', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2024-02-01',
          end_date: '2024-01-01',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/admin/analytics/orders', () => {
    it('should return order stats grouped by status', async () => {
      await createOrderRecord('ORD-101', OrderStatus.PENDING, 100, new Date('2024-01-15'));
      await createOrderRecord('ORD-102', OrderStatus.PENDING, 150, new Date('2024-01-16'));
      await createOrderRecord('ORD-103', OrderStatus.DELIVERED, 200, new Date('2024-01-17'), PaymentStatus.PAID);
      await createOrderRecord('ORD-104', OrderStatus.CANCELLED, 300, new Date('2024-01-18'));

      const response = await request(app)
        .get('/api/v1/admin/analytics/orders')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.orders_by_status).toBeInstanceOf(Array);
      expect(response.body.data.orders_by_status).toHaveLength(3);

      const pendingStats = response.body.data.orders_by_status.find(
        (s: any) => s.status === OrderStatus.PENDING
      );
      expect(pendingStats).toMatchObject({
        status: OrderStatus.PENDING,
        count: 2,
        total_revenue: 250,
      });

      const completedStats = response.body.data.orders_by_status.find(
        (s: any) => s.status === OrderStatus.DELIVERED
      );
      expect(completedStats).toMatchObject({
        status: OrderStatus.DELIVERED,
        count: 1,
        total_revenue: 200,
      });

      const cancelledStats = response.body.data.orders_by_status.find(
        (s: any) => s.status === OrderStatus.CANCELLED
      );
      expect(cancelledStats).toMatchObject({
        status: OrderStatus.CANCELLED,
        count: 1,
        total_revenue: 300,
      });
    });

    it('should return empty array for date range with no orders', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/orders')
        .query({
          start_date: '2099-01-01',
          end_date: '2099-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.orders_by_status).toBeInstanceOf(Array);
      expect(response.body.data.orders_by_status).toHaveLength(0);
    });

    it('should filter by date range correctly', async () => {
      await createOrderRecord('ORD-105', OrderStatus.PENDING, 100, new Date('2023-12-31'));
      await createOrderRecord('ORD-106', OrderStatus.DELIVERED, 200, new Date('2024-01-15'), PaymentStatus.PAID);

      const response = await request(app)
        .get('/api/v1/admin/analytics/orders')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.orders_by_status).toHaveLength(1);
      expect(response.body.data.orders_by_status[0].status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('GET /api/v1/admin/analytics/top-products', () => {
    it('should return top products by revenue', async () => {
      const product1 = await createProductRecord('Product A', 'analytics-product-a', 'AN-PROD-A', 100);
      const variant1 = await createVariantRecord(product1.id, 'SKU-A-001', 100);

      const product2 = await createProductRecord('Product B', 'analytics-product-b', 'AN-PROD-B', 200);
      const variant2 = await createVariantRecord(product2.id, 'SKU-B-001', 200);

      const order = await createOrderRecord('TOP-001', OrderStatus.DELIVERED, 500, new Date('2024-01-15'), PaymentStatus.PAID);

      await dataSource.getRepository(OrderItem).save({
        order_id: order.id,
        variant_id: variant1.id,
        product_snapshot: { name: product1.name, sku: product1.sku, price: product1.base_price },
        quantity: 2,
        unit_price: 100,
        total_price: 200,
      });

      await dataSource.getRepository(OrderItem).save({
        order_id: order.id,
        variant_id: variant2.id,
        product_snapshot: { name: product2.name, sku: product2.sku, price: product2.base_price },
        quantity: 1,
        unit_price: 200,
        total_price: 200,
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('product_id');
      expect(response.body.data[0]).toHaveProperty('product_name');
      expect(response.body.data[0]).toHaveProperty('total_quantity');
      expect(response.body.data[0]).toHaveProperty('total_revenue');
    });

    it('should limit results to specified limit', async () => {
      const products = [];
      for (let i = 1; i <= 10; i++) {
        const product = await createProductRecord(`Product ${i}`, `analytics-product-${i}`, `AN-PROD-${i}`, 100 * i);
        const variant = await createVariantRecord(product.id, `SKU-${i}-001`, 100 * i);
        const order = await createOrderRecord(`TOP-${100 + i}`, OrderStatus.DELIVERED, 100 * i, new Date('2024-01-15'), PaymentStatus.PAID);

        await dataSource.getRepository(OrderItem).save({
          order_id: order.id,
          variant_id: variant.id,
          product_snapshot: { name: product.name, sku: product.sku, price: product.base_price },
          quantity: 1,
          unit_price: 100 * i,
          total_price: 100 * i,
        });

        products.push(product);
      }

      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should exclude cancelled orders from top products', async () => {
      const product = await createProductRecord('Test Product', 'analytics-test-product', 'AN-TEST-PROD', 100);
      const variant = await createVariantRecord(product.id, 'SKU-TEST-001', 100);
      const completedOrder = await createOrderRecord('TOP-201', OrderStatus.DELIVERED, 200, new Date('2024-01-15'), PaymentStatus.PAID);

      await dataSource.getRepository(OrderItem).save({
        order_id: completedOrder.id,
        variant_id: variant.id,
        product_snapshot: { name: product.name, sku: product.sku, price: product.base_price },
        quantity: 2,
        unit_price: 100,
        total_price: 200,
      });

      const cancelledOrder = await createOrderRecord('TOP-202', OrderStatus.CANCELLED, 1000, new Date('2024-01-16'));

      await dataSource.getRepository(OrderItem).save({
        order_id: cancelledOrder.id,
        variant_id: variant.id,
        product_snapshot: { name: product.name, sku: product.sku, price: product.base_price },
        quantity: 10,
        unit_price: 100,
        total_price: 1000,
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      
      const testProduct = response.body.data.find((p: any) => p.product_id === product.id);
      expect(testProduct).toBeDefined();
      expect(testProduct.total_quantity).toBe(2);
      expect(testProduct.total_revenue).toBe(200);
    });

    it('should return empty array when no completed orders exist', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });

    it('should use default limit when not specified', async () => {
      const product = await createProductRecord('Default Product', 'analytics-default-product', 'AN-DEF-PROD', 100);
      const variant = await createVariantRecord(product.id, 'SKU-DEFAULT-001', 100);
      const order = await createOrderRecord('TOP-301', OrderStatus.DELIVERED, 100, new Date('2024-01-15'), PaymentStatus.PAID);

      await dataSource.getRepository(OrderItem).save({
        order_id: order.id,
        variant_id: variant.id,
        product_snapshot: { name: product.name, sku: product.sku, price: product.base_price },
        quantity: 1,
        unit_price: 100,
        total_price: 100,
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/admin/analytics/users', () => {
    it('should return user statistics with new registrations', async () => {
      const userRepo = dataSource.getRepository(User);

      await userRepo.save({
        fullname: 'User One',
        email: 'user1@test.com',
        phone_number: '1111111111',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2024-01-10'),
      });

      await userRepo.save({
        fullname: 'User Two',
        email: 'user2@test.com',
        phone_number: '2222222222',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2024-01-20'),
      });

      await userRepo.save({
        fullname: 'User Three',
        email: 'user3@test.com',
        phone_number: '3333333333',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2023-12-31'),
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/users')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data).toHaveProperty('total_users');
      expect(response.body.data).toHaveProperty('new_registrations');
      expect(response.body.data.total_users).toBeGreaterThanOrEqual(4); // Including admin
      expect(response.body.data.new_registrations).toBe(2);
    });

    it('should return zero new registrations for empty date range', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/users')
        .query({
          start_date: '2099-01-01',
          end_date: '2099-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.new_registrations).toBe(0);
      expect(response.body.data.total_users).toBeGreaterThan(0); // Admin user exists
    });

    it('should filter new registrations by date range correctly', async () => {
      const userRepo = dataSource.getRepository(User);

      await userRepo.save({
        fullname: 'Before Range',
        email: 'before@test.com',
        phone_number: '4444444444',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2023-12-31'),
      });

      await userRepo.save({
        fullname: 'During Range',
        email: 'during@test.com',
        phone_number: '5555555555',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2024-01-15'),
      });

      await userRepo.save({
        fullname: 'After Range',
        email: 'after@test.com',
        phone_number: '6666666666',
        password: 'hashed',
        role: RoleType.USER,
        created_at: new Date('2024-02-01'),
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/users')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(response.body.data.new_registrations).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should complete sales stats query within 5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/analytics/sales')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(duration).toBeLessThan(5000);
    });

    it('should complete order stats query within 5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/analytics/orders')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(duration).toBeLessThan(5000);
    });

    it('should complete top products query within 5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/analytics/top-products')
        .query({ limit: 100 })
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(duration).toBeLessThan(5000);
    });

    it('should complete user stats query within 5 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/analytics/users')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(HttpStatusCode.OK);
      expect(duration).toBeLessThan(5000);
    });
  });
});
