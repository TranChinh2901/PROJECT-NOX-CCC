import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/entity/user.entity';
import { Order } from '@/modules/orders/entity/order';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { GenderType } from '@/modules/users/enum/user.enum';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/modules/orders/enum/order.enum';
import { generateTokenWithRole } from '../../helpers/auth.helper';
import adminRoutes from '@/routes/admin/index';
import { AppDataSource } from '@/config/database.config';
import bcryptjs from 'bcryptjs';
import { exceptionHandler } from '@/middlewares/exception-filter';

describe('User Admin Service Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let testUsers: User[];
  let userRepository: any;
  let orderRepository: any;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    userRepository = AppDataSource.getRepository(User);
    orderRepository = AppDataSource.getRepository(Order);

    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminRoutes);
    app.use(exceptionHandler);

    adminToken = generateTokenWithRole(1, 'admin@example.com', 'ADMIN');
  });

  afterAll(async () => {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    await orderRepository.query('SET FOREIGN_KEY_CHECKS = 0');
    await orderRepository.query('TRUNCATE TABLE orders');
    await orderRepository.query('TRUNCATE TABLE users');
    await orderRepository.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const passwordHash = await bcryptjs.hash('password123', 10);
    
    testUsers = await userRepository.save([
      {
        fullname: 'Admin User',
        email: 'admin@example.com',
        phone_number: '0901234567',
        password: passwordHash,
        is_verified: true,
        role: RoleType.ADMIN,
      },
      {
        fullname: 'John Doe',
        email: 'john@example.com',
        phone_number: '0902234567',
        password: passwordHash,
        is_verified: true,
        role: RoleType.USER,
      },
      {
        fullname: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: '0903234567',
        password: passwordHash,
        is_verified: false,
        role: RoleType.USER,
      },
      {
        fullname: 'Bob Wilson',
        email: 'bob@example.com',
        phone_number: '0904234567',
        password: passwordHash,
        is_verified: true,
        role: RoleType.USER,
      },
    ]);
  });

  describe('GET /api/v1/admin/users - List Users', () => {
    it('should list all users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(4);
      expect(response.body.data.pagination).toMatchObject({
        total: 4,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: RoleType.USER })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.data.every((u: any) => u.role === RoleType.USER)).toBe(true);
    });

    it('should paginate users correctly', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.total_pages).toBe(2);
    });

    it('should search users by fullname', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'John' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].fullname).toBe('John Doe');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'jane@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].email).toBe('jane@example.com');
    });
  });

  describe('GET /api/v1/admin/users/:id - Get User', () => {
    it('should get user with order count', async () => {
      const user = testUsers[1];
      
      await orderRepository.save({
        order_number: 'ORD-TEST-001',
        user_id: user.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.COD,
        shipping_address: { address: '123 Test St' },
        billing_address: { address: '123 Test St' },
        subtotal: 100,
        total_amount: 100,
        currency: 'VND',
      });

      const response = await request(app)
        .get(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.order_count).toBe(1);
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USER_NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/admin/users/:id - Update User', () => {
    it('should update user fullname', async () => {
      const user = testUsers[1];

      const response = await request(app)
        .patch(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullname: 'John Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullname).toBe('John Updated');
      expect(response.body.data.id).toBe(user.id);
    });

    it('should update user email', async () => {
      const user = testUsers[1];

      const response = await request(app)
        .patch(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newemail@example.com');
    });

    it('should update user role', async () => {
      const user = testUsers[1];

      const response = await request(app)
        .patch(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: RoleType.ADMIN })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(RoleType.ADMIN);
    });

    it('should return 409 when email already exists', async () => {
      const user = testUsers[1];
      const existingEmail = testUsers[2].email;

      const response = await request(app)
        .patch(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: existingEmail })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullname: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USER_NOT_FOUND');
    });

    it('should return 400 when no fields provided', async () => {
      const user = testUsers[1];

      const response = await request(app)
        .patch(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/users/:id/deactivate - Deactivate User', () => {
    it('should deactivate user by setting is_verified to false', async () => {
      const user = testUsers[1];
      expect(user.is_verified).toBe(true);

      const response = await request(app)
        .post(`/api/v1/admin/users/${user.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      const updatedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(updatedUser?.is_verified).toBe(false);
    });

    it('should preserve user orders when deactivated', async () => {
      const user = testUsers[1];
      
      await orderRepository.save([
        {
          order_number: 'ORD-TEST-002',
          user_id: user.id,
          status: OrderStatus.PENDING,
          payment_status: PaymentStatus.PENDING,
          payment_method: PaymentMethod.COD,
          shipping_address: { address: '123 Test St' },
          billing_address: { address: '123 Test St' },
          subtotal: 100,
          total_amount: 100,
          currency: 'VND',
        },
        {
          order_number: 'ORD-TEST-003',
          user_id: user.id,
          status: OrderStatus.DELIVERED,
          payment_status: PaymentStatus.PAID,
          payment_method: PaymentMethod.COD,
          shipping_address: { address: '123 Test St' },
          billing_address: { address: '123 Test St' },
          subtotal: 200,
          total_amount: 200,
          currency: 'VND',
        },
      ]);

      const orderCountBefore = await orderRepository.count({ where: { user_id: user.id } });
      expect(orderCountBefore).toBe(2);

      await request(app)
        .post(`/api/v1/admin/users/${user.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const orderCountAfter = await orderRepository.count({ where: { user_id: user.id } });
      expect(orderCountAfter).toBe(2);

      const deactivatedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(deactivatedUser?.is_verified).toBe(false);
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users/9999/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USER_NOT_FOUND');
    });
  });

  describe('POST /api/v1/admin/users/:id/activate - Activate User', () => {
    it('should activate user by setting is_verified to true', async () => {
      const user = testUsers[2];
      expect(user.is_verified).toBe(false);

      const response = await request(app)
        .post(`/api/v1/admin/users/${user.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('activated');

      const updatedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(updatedUser?.is_verified).toBe(true);
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users/9999/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USER_NOT_FOUND');
    });
  });

  describe('POST /api/v1/admin/users/bulk-deactivate - Bulk Deactivate', () => {
    it('should deactivate multiple users', async () => {
      const userIds = [testUsers[1].id, testUsers[3].id];

      const response = await request(app)
        .post('/api/v1/admin/users/bulk-deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: userIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deactivated).toBe(2);

      const deactivatedUsers = await userRepository.findByIds(userIds);
      expect(deactivatedUsers.every((u: User) => u.is_verified === false)).toBe(true);
    });

    it('should return 400 when exceeding max 100 users', async () => {
      const userIds = Array.from({ length: 101 }, (_, i) => i + 1);

      const response = await request(app)
        .post('/api/v1/admin/users/bulk-deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: userIds })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when no IDs provided', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users/bulk-deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when one or more users not found', async () => {
      const userIds = [testUsers[1].id, 9999];

      const response = await request(app)
        .post('/api/v1/admin/users/bulk-deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: userIds })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USER_NOT_FOUND');
    });

    it('should preserve orders for all deactivated users', async () => {
      const userIds = [testUsers[1].id, testUsers[3].id];
      
      await orderRepository.save([
        {
          order_number: 'ORD-BULK-001',
          user_id: testUsers[1].id,
          status: OrderStatus.DELIVERED,
          payment_status: PaymentStatus.PAID,
          payment_method: PaymentMethod.COD,
          shipping_address: { address: '123 Test St' },
          billing_address: { address: '123 Test St' },
          subtotal: 100,
          total_amount: 100,
          currency: 'VND',
        },
        {
          order_number: 'ORD-BULK-002',
          user_id: testUsers[3].id,
          status: OrderStatus.DELIVERED,
          payment_status: PaymentStatus.PAID,
          payment_method: PaymentMethod.COD,
          shipping_address: { address: '456 Test Ave' },
          billing_address: { address: '456 Test Ave' },
          subtotal: 200,
          total_amount: 200,
          currency: 'VND',
        },
      ]);

      const orderCountBefore = await orderRepository.count({
        where: userIds.map(id => ({ user_id: id })),
      });
      expect(orderCountBefore).toBe(2);

      await request(app)
        .post('/api/v1/admin/users/bulk-deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: userIds })
        .expect(200);

      const orderCountAfter = await orderRepository.count({
        where: userIds.map(id => ({ user_id: id })),
      });
      expect(orderCountAfter).toBe(2);
    });
  });
});
