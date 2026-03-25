import { DataSource } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import { Category } from '@/modules/products/entity/category';
import { Brand } from '@/modules/products/entity/brand';
import { Product } from '@/modules/products/entity/product';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { Warehouse } from '@/modules/inventory/entity/warehouse';
import { Inventory } from '@/modules/inventory/entity/inventory';
import { User } from '@/modules/users/entity/user.entity';
import { UserSession } from '@/modules/users/entity/user-session';
import { Cart } from '@/modules/cart/entity/cart';
import { CartItem } from '@/modules/cart/entity/cart-item';
import { Order } from '@/modules/orders/entity/order';
import { OrderItem } from '@/modules/orders/entity/order-item';
import { UserBehaviorLog } from '@/modules/ai/entity/user-behavior-log';
import { UserActionType } from '@/modules/ai/enum/user-behavior.enum';
import { DeviceType } from '@/modules/users/enum/user-session.enum';
import { CartStatus } from '@/modules/cart/enum/cart.enum';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/modules/orders/enum/order.enum';

describe('Database Integration Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = AppDataSource;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Category → Product → Variant Chain', () => {
    it('should create category → product → variant chain successfully', async () => {
      const categoryRepo = dataSource.getRepository(Category);
      const brandRepo = dataSource.getRepository(Brand);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const category = categoryRepo.create({
        name: 'Integration Test Category',
        slug: 'integration-test-category',
        description: 'Test category for integration tests',
        is_active: true,
      });
      await categoryRepo.save(category);
      expect(category.id).toBeDefined();

      const brand = brandRepo.create({
        name: 'Integration Test Brand',
        slug: 'integration-test-brand',
        is_active: true,
      });
      await brandRepo.save(brand);
      expect(brand.id).toBeDefined();

      const product = productRepo.create({
        category_id: category.id,
        brand_id: brand.id,
        name: 'Integration Test Product',
        slug: 'integration-test-product',
        sku: 'INT-TEST-001',
        description: 'Test product for integration tests',
        base_price: 99.99,
        is_active: true,
      });
      await productRepo.save(product);
      expect(product.id).toBeDefined();

      const variant = variantRepo.create({
        product_id: product.id,
        sku: 'INT-TEST-001-M-RED',
        size: 'M',
        color: 'Red',
        color_code: '#FF0000',
        final_price: 99.99,
        is_active: true,
      });
      await variantRepo.save(variant);
      expect(variant.id).toBeDefined();

      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await brandRepo.delete(brand.id);
      await categoryRepo.delete(category.id);
    });

    it('should load product with relationships', async () => {
      const categoryRepo = dataSource.getRepository(Category);
      const brandRepo = dataSource.getRepository(Brand);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Test Category Relations',
          slug: 'test-category-relations',
          is_active: true,
        })
      );

      const brand = await brandRepo.save(
        brandRepo.create({
          name: 'Test Brand Relations',
          slug: 'test-brand-relations',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          brand_id: brand.id,
          name: 'Test Product Relations',
          slug: 'test-product-relations',
          sku: 'REL-TEST-001',
          description: 'Test',
          base_price: 50.00,
          is_active: true,
        })
      );

      await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'REL-TEST-001-VAR',
          final_price: 50.00,
          is_active: true,
        })
      );

      const loadedProduct = await productRepo.findOne({
        where: { id: product.id },
        relations: ['category', 'brand', 'variants'],
      });

      expect(loadedProduct).toBeDefined();
      expect(loadedProduct?.category.id).toBe(category.id);
      expect(loadedProduct?.brand?.id).toBe(brand.id);
      expect(loadedProduct?.variants).toBeDefined();
      expect(loadedProduct?.variants?.length).toBeGreaterThan(0);

      await variantRepo.delete({ product_id: product.id });
      await productRepo.delete(product.id);
      await brandRepo.delete(brand.id);
      await categoryRepo.delete(category.id);
    });
  });

  describe('Warehouse → Inventory Chain', () => {
    it('should create warehouse → inventory chain successfully', async () => {
      const warehouseRepo = dataSource.getRepository(Warehouse);
      const inventoryRepo = dataSource.getRepository(Inventory);
      const categoryRepo = dataSource.getRepository(Category);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const warehouse = warehouseRepo.create({
        name: 'Test Warehouse',
        code: 'WH-TEST-001',
        address: '123 Test St',
        city: 'Test City',
        country: 'Vietnam',
        is_active: true,
      });
      await warehouseRepo.save(warehouse);
      expect(warehouse.id).toBeDefined();

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Inventory Test Category',
          slug: 'inventory-test-category',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          name: 'Inventory Test Product',
          slug: 'inventory-test-product',
          sku: 'INV-TEST-001',
          description: 'Test',
          base_price: 25.00,
          is_active: true,
        })
      );

      const variant = await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'INV-TEST-001-VAR',
          final_price: 25.00,
          is_active: true,
        })
      );

      const inventory = inventoryRepo.create({
        variant_id: variant.id,
        warehouse_id: warehouse.id,
        quantity_available: 100,
        quantity_reserved: 10,
        quantity_total: 110,
      });
      await inventoryRepo.save(inventory);
      expect(inventory.id).toBeDefined();
      expect(inventory.quantity_available).toBe(100);

      await inventoryRepo.delete(inventory.id);
      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await categoryRepo.delete(category.id);
      await warehouseRepo.delete(warehouse.id);
    });

    it('should enforce unique constraint on variant_id and warehouse_id', async () => {
      const warehouseRepo = dataSource.getRepository(Warehouse);
      const inventoryRepo = dataSource.getRepository(Inventory);
      const categoryRepo = dataSource.getRepository(Category);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const warehouse = await warehouseRepo.save(
        warehouseRepo.create({
          name: 'Unique Test Warehouse',
          code: 'WH-UNQ-001',
          address: '456 Test Ave',
          city: 'Test City',
          country: 'Vietnam',
          is_active: true,
        })
      );

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Unique Inventory Category',
          slug: 'unique-inventory-category',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          name: 'Unique Inventory Product',
          slug: 'unique-inventory-product',
          sku: 'UNQ-INV-001',
          description: 'Test',
          base_price: 30.00,
          is_active: true,
        })
      );

      const variant = await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'UNQ-INV-001-VAR',
          final_price: 30.00,
          is_active: true,
        })
      );

      const inventory1 = await inventoryRepo.save(
        inventoryRepo.create({
          variant_id: variant.id,
          warehouse_id: warehouse.id,
          quantity_total: 50,
        })
      );

      await expect(
        inventoryRepo.save(
          inventoryRepo.create({
            variant_id: variant.id,
            warehouse_id: warehouse.id,
            quantity_total: 100,
          })
        )
      ).rejects.toThrow();

      await inventoryRepo.delete(inventory1.id);
      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await categoryRepo.delete(category.id);
      await warehouseRepo.delete(warehouse.id);
    });
  });

  describe('User → Cart → CartItem Chain', () => {
    it('should create user → cart → cart_item chain successfully', async () => {
      const userRepo = dataSource.getRepository(User);
      const sessionRepo = dataSource.getRepository(UserSession);
      const cartRepo = dataSource.getRepository(Cart);
      const cartItemRepo = dataSource.getRepository(CartItem);
      const categoryRepo = dataSource.getRepository(Category);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const user = userRepo.create({
        fullname: 'Test User',
        email: `cart-test-${Date.now()}@example.com`,
        phone_number: `+8490000${Math.floor(Math.random() * 10000)}`,
        password: 'hashedpassword',
      });
      await userRepo.save(user);
      expect(user.id).toBeDefined();

      const session = await sessionRepo.save(
        sessionRepo.create({
          user_id: user.id,
          session_token: `token-${Date.now()}`,
          device_type: DeviceType.DESKTOP,
          started_at: new Date(),
          is_active: true,
        })
      );

      const cart = cartRepo.create({
        user_id: user.id,
        guest_token: session.session_token,
        status: CartStatus.ACTIVE,
        total_amount: 0,
        item_count: 0,
      });
      await cartRepo.save(cart);
      expect(cart.id).toBeDefined();

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Cart Test Category',
          slug: 'cart-test-category',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          name: 'Cart Test Product',
          slug: 'cart-test-product',
          sku: 'CART-TEST-001',
          description: 'Test',
          base_price: 45.00,
          is_active: true,
        })
      );

      const variant = await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'CART-TEST-001-VAR',
          final_price: 45.00,
          is_active: true,
        })
      );

      const cartItem = cartItemRepo.create({
        cart_id: cart.id,
        variant_id: variant.id,
        quantity: 2,
        unit_price: 45.00,
        total_price: 90.00,
        added_at: new Date(),
      });
      await cartItemRepo.save(cartItem);
      expect(cartItem.id).toBeDefined();
      expect(cartItem.quantity).toBe(2);

      await cartItemRepo.delete(cartItem.id);
      await cartRepo.delete(cart.id);
      await sessionRepo.delete(session.id);
      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await categoryRepo.delete(category.id);
      await userRepo.delete(user.id);
    });
  });

  describe('Order → OrderItem with Product Snapshot', () => {
    it('should create order → order_item with product snapshot successfully', async () => {
      const userRepo = dataSource.getRepository(User);
      const orderRepo = dataSource.getRepository(Order);
      const orderItemRepo = dataSource.getRepository(OrderItem);
      const categoryRepo = dataSource.getRepository(Category);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const user = await userRepo.save(
        userRepo.create({
          fullname: 'Order Test User',
          email: `order-test-${Date.now()}@example.com`,
          phone_number: `+8491000${Math.floor(Math.random() * 10000)}`,
          password: 'hashedpassword',
        })
      );

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Order Test Category',
          slug: 'order-test-category',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          name: 'Order Test Product',
          slug: 'order-test-product',
          sku: 'ORD-TEST-001',
          description: 'Test product',
          base_price: 75.00,
          is_active: true,
        })
      );

      const variant = await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'ORD-TEST-001-L',
          size: 'L',
          final_price: 75.00,
          is_active: true,
        })
      );

      const order = orderRepo.create({
        order_number: `ORD-${Date.now()}`,
        user_id: user.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: {
          name: 'Test User',
          phone: '+84900000000',
          address: '123 Test St',
          city: 'Test City',
          country: 'Vietnam',
        },
        billing_address: {
          name: 'Test User',
          phone: '+84900000000',
          address: '123 Test St',
          city: 'Test City',
          country: 'Vietnam',
        },
        subtotal: 150.00,
        total_amount: 150.00,
      });
      await orderRepo.save(order);
      expect(order.id).toBeDefined();

      const productSnapshot = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        variant_id: variant.id,
        variant_sku: variant.sku,
        size: variant.size,
        color: variant.color,
      };

      const orderItem = orderItemRepo.create({
        order_id: order.id,
        variant_id: variant.id,
        product_snapshot: productSnapshot,
        quantity: 2,
        unit_price: 75.00,
        total_price: 150.00,
      });
      await orderItemRepo.save(orderItem);
      expect(orderItem.id).toBeDefined();
      expect(orderItem.product_snapshot).toBeDefined();

      await orderItemRepo.delete(orderItem.id);
      await orderRepo.delete(order.id);
      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await categoryRepo.delete(category.id);
      await userRepo.delete(user.id);
    });
  });

  describe('User Behavior Log Captures Session Data', () => {
    it('should capture user behavior log with session data successfully', async () => {
      const userRepo = dataSource.getRepository(User);
      const sessionRepo = dataSource.getRepository(UserSession);
      const behaviorLogRepo = dataSource.getRepository(UserBehaviorLog);
      const categoryRepo = dataSource.getRepository(Category);
      const productRepo = dataSource.getRepository(Product);
      const variantRepo = dataSource.getRepository(ProductVariant);

      const user = await userRepo.save(
        userRepo.create({
          fullname: 'Behavior Test User',
          email: `behavior-test-${Date.now()}@example.com`,
          phone_number: `+8492000${Math.floor(Math.random() * 10000)}`,
          password: 'hashedpassword',
        })
      );

      const session = await sessionRepo.save(
        sessionRepo.create({
          user_id: user.id,
          session_token: `behavior-token-${Date.now()}`,
          device_type: DeviceType.MOBILE,
          started_at: new Date(),
          is_active: true,
        })
      );

      const category = await categoryRepo.save(
        categoryRepo.create({
          name: 'Behavior Test Category',
          slug: 'behavior-test-category',
          is_active: true,
        })
      );

      const product = await productRepo.save(
        productRepo.create({
          category_id: category.id,
          name: 'Behavior Test Product',
          slug: 'behavior-test-product',
          sku: 'BEH-TEST-001',
          description: 'Test',
          base_price: 60.00,
          is_active: true,
        })
      );

      const variant = await variantRepo.save(
        variantRepo.create({
          product_id: product.id,
          sku: 'BEH-TEST-001-VAR',
          final_price: 60.00,
          is_active: true,
        })
      );

      const behaviorLog = behaviorLogRepo.create({
        session_id: session.id,
        user_id: user.id,
        action_type: UserActionType.VIEW,
        product_id: product.id,
        variant_id: variant.id,
        device_type: DeviceType.MOBILE,
        page_url: '/products/behavior-test-product',
        ip_address: '127.0.0.1',
        session_duration_seconds: 45,
      });
      await behaviorLogRepo.save(behaviorLog);
      expect(behaviorLog.id).toBeDefined();
      expect(behaviorLog.session_id).toBe(session.id);
      expect(behaviorLog.user_id).toBe(user.id);
      expect(behaviorLog.device_type).toBe(DeviceType.MOBILE);

      await behaviorLogRepo.delete(behaviorLog.id);
      await variantRepo.delete(variant.id);
      await productRepo.delete(product.id);
      await categoryRepo.delete(category.id);
      await sessionRepo.delete(session.id);
      await userRepo.delete(user.id);
    });

    it('should capture search behavior', async () => {
      const sessionRepo = dataSource.getRepository(UserSession);
      const behaviorLogRepo = dataSource.getRepository(UserBehaviorLog);

      const session = await sessionRepo.save(
        sessionRepo.create({
          session_token: `search-token-${Date.now()}`,
          device_type: DeviceType.DESKTOP,
          started_at: new Date(),
          is_active: true,
        })
      );

      const searchLog = behaviorLogRepo.create({
        session_id: session.id,
        action_type: UserActionType.SEARCH,
        search_query: 'summer dress',
        device_type: DeviceType.DESKTOP,
        page_url: '/search?q=summer+dress',
      });
      await behaviorLogRepo.save(searchLog);
      expect(searchLog.id).toBeDefined();
      expect(searchLog.search_query).toBe('summer dress');

      await behaviorLogRepo.delete(searchLog.id);
      await sessionRepo.delete(session.id);
    });
  });
});
