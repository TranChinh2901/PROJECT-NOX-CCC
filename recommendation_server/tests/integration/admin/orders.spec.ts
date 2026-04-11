import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import router from '@/routes';
import { exceptionHandler } from '@/middlewares/exception-filter';
import { AppDataSource } from '@/config/database.config';
import { Order } from '@/modules/orders/entity/order';
import { OrderItem } from '@/modules/orders/entity/order-item';
import { OrderStatusHistory } from '@/modules/orders/entity/order-status-history';
import { User } from '@/modules/users/entity/user.entity';
import { Inventory } from '@/modules/inventory/entity/inventory';
import { Warehouse } from '@/modules/inventory/entity/warehouse';
import { Product } from '@/modules/products/entity/product';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { Category } from '@/modules/products/entity/category';
import { Brand } from '@/modules/products/entity/brand';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/modules/orders/enum/order.enum';
import { generateTestAccessToken } from '../../helpers/auth.helper';
import { ADMIN_USER, USER_1 } from '../../fixtures/users.fixture';
import { PRODUCT_1_VARIANT_1, PRODUCT_1 } from '../../fixtures/products.fixture';

describe('Order Admin Service Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let testWarehouse: Warehouse;
  let testInventory: Inventory;
  const uniqueSuffix = Date.now().toString().slice(-6);

  const createProductSnapshot = () => ({
    name: 'Test Product',
    sku: 'TEST-SKU',
    variant_sku: PRODUCT_1_VARIANT_1.sku || 'VARIANT-SKU',
    price: PRODUCT_1_VARIANT_1.final_price,
  });

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/', router);
    app.use(exceptionHandler);

    const userRepo = AppDataSource.getRepository(User);
    const existingAdmin = await userRepo.findOne({ where: { id: ADMIN_USER.id } });
    if (!existingAdmin) {
      await userRepo.save(ADMIN_USER);
    }

    const existingUser = await userRepo.findOne({ where: { id: USER_1.id } });
    if (!existingUser) {
      await userRepo.save(USER_1);
    }

    adminToken = generateTestAccessToken(ADMIN_USER.id, ADMIN_USER.email, 'ADMIN');

    const categoryRepo = AppDataSource.getRepository(Category);
    const testCategory = await categoryRepo.save({
      name: `Test Category ${uniqueSuffix}`,
      slug: `test-category-orders-${uniqueSuffix}`,
      description: 'Test category for orders',
      is_active: true,
    });

    const brandRepo = AppDataSource.getRepository(Brand);
    const testBrand = await brandRepo.save({
      name: `Test Brand ${uniqueSuffix}`,
      slug: `test-brand-orders-${uniqueSuffix}`,
      description: 'Test brand for orders',
      is_active: true,
    });

    const productRepo = AppDataSource.getRepository(Product);
    const existingProduct = await productRepo.findOne({ where: { id: PRODUCT_1.id } });
    if (!existingProduct) {
      await productRepo.save({
        ...PRODUCT_1,
        category_id: testCategory.id,
        brand_id: testBrand.id,
      });
    }

    const variantRepo = AppDataSource.getRepository(ProductVariant);
    const existingVariant = await variantRepo.findOne({ where: { id: PRODUCT_1_VARIANT_1.id } });
    if (!existingVariant) {
      await variantRepo.save({
        ...PRODUCT_1_VARIANT_1,
        product_id: PRODUCT_1.id,
      });
    }

    const warehouseRepo = AppDataSource.getRepository(Warehouse);
    testWarehouse = await warehouseRepo.save({
      name: `Test Warehouse Orders ${uniqueSuffix}`,
      code: `TWO-${uniqueSuffix}`,
      address: '123 Test Address',
      city: 'Test City',
      is_active: true,
    });

    const inventoryRepo = AppDataSource.getRepository(Inventory);
    testInventory = await inventoryRepo.save({
      variant_id: PRODUCT_1_VARIANT_1.id,
      warehouse_id: testWarehouse.id,
      quantity_available: 100,
      quantity_reserved: 0,
      quantity_total: 100,
    });
  });

  afterAll(async () => {
    const orderItemRepo = AppDataSource.getRepository(OrderItem);
    const orderRepo = AppDataSource.getRepository(Order);
    const inventoryRepo = AppDataSource.getRepository(Inventory);
    const warehouseRepo = AppDataSource.getRepository(Warehouse);
    const variantRepo = AppDataSource.getRepository(ProductVariant);
    const productRepo = AppDataSource.getRepository(Product);
    const categoryRepo = AppDataSource.getRepository(Category);
    const brandRepo = AppDataSource.getRepository(Brand);

    await orderItemRepo.query('DELETE FROM order_items WHERE 1=1');
    await orderRepo.query('DELETE FROM orders WHERE 1=1');
    if (testInventory?.id) {
      await inventoryRepo.delete({ id: testInventory.id });
    }
    if (testWarehouse?.id) {
      await warehouseRepo.delete({ id: testWarehouse.id });
    }
    await variantRepo.delete({ id: PRODUCT_1_VARIANT_1.id });
    await productRepo.delete({ id: PRODUCT_1.id });
    await categoryRepo.delete({ slug: `test-category-orders-${uniqueSuffix}` });
    await brandRepo.delete({ slug: `test-brand-orders-${uniqueSuffix}` });

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('GET /api/v1/admin/orders - List Orders', () => {
    let order1: Order;
    let order2: Order;
    let order3: Order;

    beforeAll(async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      const orderItemRepo = AppDataSource.getRepository(OrderItem);

      order1 = await orderRepo.save({
        order_number: 'ORD-001',
        user_id: USER_1.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Main St' },
        billing_address: { address: '123 Main St' },
        subtotal: 100,
        total_amount: 100,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: order1.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 1,
        unit_price: 100,
        total_price: 100,
      });

      order2 = await orderRepo.save({
        order_number: 'ORD-002',
        user_id: USER_1.id,
        status: OrderStatus.CONFIRMED,
        payment_status: PaymentStatus.PAID,
        payment_method: PaymentMethod.CREDIT_CARD,
        shipping_address: { address: '456 Oak St' },
        billing_address: { address: '456 Oak St' },
        subtotal: 200,
        total_amount: 200,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: order2.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 2,
        unit_price: 100,
        total_price: 200,
      });

      order3 = await orderRepo.save({
        order_number: 'ORD-003',
        user_id: USER_1.id,
        status: OrderStatus.DELIVERED,
        payment_status: PaymentStatus.PAID,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '789 Pine St' },
        billing_address: { address: '789 Pine St' },
        subtotal: 300,
        total_amount: 300,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: order3.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 3,
        unit_price: 100,
        total_price: 300,
      });
    });

    afterAll(async () => {
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      const orderRepo = AppDataSource.getRepository(Order);
      await orderItemRepo.delete({ order_id: order1.id });
      await orderItemRepo.delete({ order_id: order2.id });
      await orderItemRepo.delete({ order_id: order3.id });
      await orderRepo.delete({ id: order1.id });
      await orderRepo.delete({ id: order2.id });
      await orderRepo.delete({ id: order3.id });
    });

    it('should list all orders', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .query({ status: OrderStatus.PENDING })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.every((order: Order) => order.status === OrderStatus.PENDING)).toBe(true);
    });

    it('should filter orders by payment_status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .query({ payment_status: PaymentStatus.PAID })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.every((order: Order) => order.payment_status === PaymentStatus.PAID)).toBe(true);
    });

    it('should filter orders by user_id', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .query({ user_id: USER_1.id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.every((order: Order) => order.user_id === USER_1.id)).toBe(true);
    });

    it('should filter orders by date range (start_date and end_date)', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get('/api/v1/admin/orders')
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should filter orders by start_date only', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const response = await request(app)
        .get('/api/v1/admin/orders')
        .query({ start_date: startDate.toISOString() })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/orders/:id - Get Order', () => {
    let testOrder: Order;

    beforeAll(async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      const orderItemRepo = AppDataSource.getRepository(OrderItem);

      testOrder = await orderRepo.save({
        order_number: 'ORD-GET-001',
        user_id: USER_1.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Test St' },
        billing_address: { address: '123 Test St' },
        subtotal: 100,
        total_amount: 100,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: testOrder.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 1,
        unit_price: 100,
        total_price: 100,
      });
    });

    afterAll(async () => {
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      const orderRepo = AppDataSource.getRepository(Order);
      await orderItemRepo.delete({ order_id: testOrder.id });
      await orderRepo.delete({ id: testOrder.id });
    });

    it('should get order with items, user, status history', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testOrder.id);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('should return 404 when order not found', async () => {
      const response = await request(app)
        .get('/api/v1/admin/orders/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/admin/orders/:id/status - Update Order Status', () => {
    let testOrder: Order;

    beforeEach(async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      const orderItemRepo = AppDataSource.getRepository(OrderItem);

      testOrder = await orderRepo.save({
        order_number: `OS-${Date.now().toString().slice(-8)}`,
        user_id: USER_1.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Test St' },
        billing_address: { address: '123 Test St' },
        subtotal: 100,
        total_amount: 100,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: testOrder.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 1,
        unit_price: 100,
        total_price: 100,
      });
    });

    afterEach(async () => {
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      const orderRepo = AppDataSource.getRepository(Order);
      const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
      await historyRepo.delete({ order_id: testOrder.id });
      await orderItemRepo.delete({ order_id: testOrder.id });
      await orderRepo.delete({ id: testOrder.id });
    });

    it('should update order status: PENDING → CONFIRMED', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(OrderStatus.CONFIRMED);

      const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
      const history = await historyRepo.findOne({
        where: { order_id: testOrder.id, status: OrderStatus.CONFIRMED },
        order: { id: 'DESC' },
      });

      expect(history).toBeDefined();
      expect(history!.previous_status).toBe(OrderStatus.PENDING);
      expect(history!.changed_by).toBe(ADMIN_USER.email);
    });

    it('should update order status through full chain: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED', async () => {
      let response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(OrderStatus.CONFIRMED);

      response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PROCESSING });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(OrderStatus.PROCESSING);

      response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.SHIPPED });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(OrderStatus.SHIPPED);
      expect(response.body.data.shipped_at).toBeDefined();

      response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.DELIVERED });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(OrderStatus.DELIVERED);
      expect(response.body.data.delivered_at).toBeDefined();
    });

    it('should reject invalid transition: DELIVERED → PENDING (HTTP 400)', async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      await orderRepo.update(testOrder.id, { status: OrderStatus.DELIVERED });

      const response = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PENDING });

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should create status history with changed_by as admin email (VARCHAR field)', async () => {
      await request(app)
        .patch(`/api/v1/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.CONFIRMED });

      const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
      const history = await historyRepo.findOne({
        where: { order_id: testOrder.id },
        order: { id: 'DESC' },
      });

      expect(history).toBeDefined();
      expect(history!.changed_by).toBe(ADMIN_USER.email);
      expect(typeof history!.changed_by).toBe('string');
    });
  });

  describe('POST /api/v1/admin/orders/:id/cancel - Cancel Order', () => {
    let testOrder: Order;
    let initialInventory: number;

    beforeEach(async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      const inventoryRepo = AppDataSource.getRepository(Inventory);

      const inventory = await inventoryRepo.findOne({
        where: { variant_id: PRODUCT_1_VARIANT_1.id },
      });
      initialInventory = inventory!.quantity_available;

      testOrder = await orderRepo.save({
        order_number: `OC-${Date.now().toString().slice(-8)}`,
        user_id: USER_1.id,
        status: OrderStatus.CONFIRMED,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Test St' },
        billing_address: { address: '123 Test St' },
        subtotal: 300,
        total_amount: 300,
        currency: 'VND',
      });

      await orderItemRepo.save({
        order_id: testOrder.id,
        variant_id: PRODUCT_1_VARIANT_1.id,
        product_snapshot: createProductSnapshot(),
        quantity: 3,
        unit_price: 100,
        total_price: 300,
      });

      await inventoryRepo.update(
        { variant_id: PRODUCT_1_VARIANT_1.id },
        {
          quantity_available: initialInventory - 3,
          quantity_reserved: 3,
        }
      );
    });

    afterEach(async () => {
      const orderItemRepo = AppDataSource.getRepository(OrderItem);
      const orderRepo = AppDataSource.getRepository(Order);
      const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
      const inventoryRepo = AppDataSource.getRepository(Inventory);

      await historyRepo.delete({ order_id: testOrder.id });
      await orderItemRepo.delete({ order_id: testOrder.id });
      await orderRepo.delete({ id: testOrder.id });

      await inventoryRepo.update(
        { variant_id: PRODUCT_1_VARIANT_1.id },
        {
          quantity_available: initialInventory,
          quantity_reserved: 0,
        }
      );
    });

    it('should cancel order and restore inventory (verify quantity_available increased)', async () => {
      const inventoryRepo = AppDataSource.getRepository(Inventory);

      const beforeInventory = await inventoryRepo.findOne({
        where: { variant_id: PRODUCT_1_VARIANT_1.id },
      });
      const beforeQty = beforeInventory!.quantity_available;

      const response = await request(app)
        .post(`/api/v1/admin/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const orderRepo = AppDataSource.getRepository(Order);
      const updatedOrder = await orderRepo.findOne({ where: { id: testOrder.id } });
      expect(updatedOrder!.status).toBe(OrderStatus.CANCELLED);

      const afterInventory = await inventoryRepo.findOne({
        where: { variant_id: PRODUCT_1_VARIANT_1.id },
      });
      expect(afterInventory!.quantity_available).toBe(beforeQty + 3);
    });

    it('should return 400 when order already cancelled', async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      await orderRepo.update(testOrder.id, { status: OrderStatus.CANCELLED });

      const response = await request(app)
        .post(`/api/v1/admin/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already cancelled');
    });
  });

  describe('POST /api/v1/admin/orders/:id/notes - Add Internal Note', () => {
    let testOrder: Order;

    beforeEach(async () => {
      const orderRepo = AppDataSource.getRepository(Order);

      testOrder = await orderRepo.save({
        order_number: `ON-${Date.now().toString().slice(-8)}`,
        user_id: USER_1.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Test St' },
        billing_address: { address: '123 Test St' },
        subtotal: 100,
        total_amount: 100,
        currency: 'VND',
      });
    });

    afterEach(async () => {
      const orderRepo = AppDataSource.getRepository(Order);
      await orderRepo.delete({ id: testOrder.id });
    });

    it('should add internal note to order', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/orders/${testOrder.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Test internal note' });

      expect(response.status).toBe(200);
      expect(response.body.data.internal_notes).toBeDefined();
      expect(response.body.data.internal_notes).toContain('Test internal note');
    });

    it('should append multiple internal notes', async () => {
      await request(app)
        .post(`/api/v1/admin/orders/${testOrder.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'First note' });

      const response = await request(app)
        .post(`/api/v1/admin/orders/${testOrder.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Second note' });

      expect(response.status).toBe(200);
      expect(response.body.data.internal_notes).toContain('First note');
      expect(response.body.data.internal_notes).toContain('Second note');
    });

    it('should return 404 when order not found', async () => {
      const response = await request(app)
        .post('/api/v1/admin/orders/999999/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Test note' });

      expect(response.status).toBe(404);
    });
  });
});
