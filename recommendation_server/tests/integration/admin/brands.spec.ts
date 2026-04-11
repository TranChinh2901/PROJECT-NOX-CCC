import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import router from '@/routes';
import { exceptionHandler } from '@/middlewares/exception-filter';
import { Brand } from '@/modules/products/entity/brand';
import { Product } from '@/modules/products/entity/product';
import { Category } from '@/modules/products/entity/category';
import { User } from '@/modules/users/entity/user.entity';
import { generateTestAccessToken } from '../../helpers/auth.helper';
import { ADMIN_USER } from '../../fixtures/users.fixture';
import { AppDataSource } from '@/config/database.config';

describe('Brand Admin Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let brandRepository: any;
  let productRepository: any;
  let categoryRepository: any;
  let userRepository: any;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    brandRepository = AppDataSource.getRepository(Brand);
    productRepository = AppDataSource.getRepository(Product);
    categoryRepository = AppDataSource.getRepository(Category);
    userRepository = AppDataSource.getRepository(User);

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/', router);
    app.use(exceptionHandler);

    const existingAdmin = await userRepository.findOne({ where: { id: ADMIN_USER.id } });
    if (!existingAdmin) {
      const admin = userRepository.create(ADMIN_USER);
      await userRepository.save(admin);
    }

    adminToken = generateTestAccessToken(ADMIN_USER.id, ADMIN_USER.email, 'ADMIN');
  });

  afterAll(async () => {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await productRepository.query('DELETE FROM products WHERE 1=1');
    await brandRepository.query('DELETE FROM brands WHERE 1=1');
    await categoryRepository.query('DELETE FROM categories WHERE 1=1');
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await productRepository.query('DELETE FROM products WHERE 1=1');
    await brandRepository.query('DELETE FROM brands WHERE 1=1');
    await categoryRepository.query('DELETE FROM categories WHERE 1=1');
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('GET /api/v1/admin/brands - List brands with pagination', () => {
    it('should list all brands with pagination', async () => {
      const brand1 = brandRepository.create({
        name: 'Nike',
        slug: 'nike',
        description: 'Just Do It',
      });
      const brand2 = brandRepository.create({
        name: 'Adidas',
        slug: 'adidas',
        description: 'Impossible is Nothing',
      });
      await brandRepository.save([brand1, brand2]);

      const response = await request(app)
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 15; i++) {
        await brandRepository.save(brandRepository.create({
          name: `Brand ${i}`,
          slug: `brand-${i}`,
        }));
      }

      const response = await request(app)
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response.body.data.data).toHaveLength(5);
      expect(response.body.data.pagination).toMatchObject({
        total: 15,
        page: 2,
        limit: 5,
        total_pages: 3,
      });
    });

    it('should support search functionality', async () => {
      const brand1 = brandRepository.create({
        name: 'Nike',
        slug: 'nike',
      });
      const brand2 = brandRepository.create({
        name: 'Adidas',
        slug: 'adidas',
      });
      await brandRepository.save([brand1, brand2]);

      const response = await request(app)
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'nike' })
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Nike');
    });

    it('should include soft-deleted brands', async () => {
      const brand = brandRepository.create({
        name: 'Deleted Brand',
        slug: 'deleted-brand',
      });
      await brandRepository.save(brand);
      await brandRepository.softDelete(brand.id);

      const response = await request(app)
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].deleted_at).not.toBeNull();
    });
  });

  describe('GET /api/v1/admin/brands/:id - Get single brand', () => {
    it('should return brand by id', async () => {
      const brand = brandRepository.create({
        name: 'Nike',
        slug: 'nike',
        description: 'Just Do It',
        website_url: 'https://nike.com',
      });
      await brandRepository.save(brand);

      const response = await request(app)
        .get(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Nike',
        slug: 'nike',
        description: 'Just Do It',
        website_url: 'https://nike.com',
      });
    });

    it('should return 404 when brand not found', async () => {
      const response = await request(app)
        .get('/api/v1/admin/brands/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.errorCode).toBe('BRAND_NOT_FOUND');
    });

    it('should return 400 for invalid id format', async () => {
      await request(app)
        .get('/api/v1/admin/brands/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/v1/admin/brands - Create brand', () => {
    it('should create new brand successfully', async () => {
      const brandData = {
        name: 'New Brand',
        slug: 'new-brand',
        description: 'A new brand',
        logo_url: 'https://example.com/logo.png',
        website_url: 'https://example.com',
        is_active: true,
      };

      const response = await request(app)
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(brandData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(brandData);
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject duplicate slug with 409 CONFLICT', async () => {
      const brand = brandRepository.create({
        name: 'Existing Brand',
        slug: 'existing-slug',
      });
      await brandRepository.save(brand);

      const response = await request(app)
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Brand',
          slug: 'existing-slug',
        })
        .expect(409);

      expect(response.body.errorCode).toBe('BRAND_ALREADY_EXISTS');
    });

    it('should reject missing required fields', async () => {
      await request(app)
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Brand',
        })
        .expect(400);
    });

    it('should create brand with minimal fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Minimal Brand',
          slug: 'minimal-brand',
        })
        .expect(201);

      expect(response.body.data.name).toBe('Minimal Brand');
      expect(response.body.data.slug).toBe('minimal-brand');
    });
  });

  describe('PATCH /api/v1/admin/brands/:id - Update brand', () => {
    it('should update brand successfully', async () => {
      const brand = brandRepository.create({
        name: 'Old Name',
        slug: 'old-slug',
      });
      await brandRepository.save(brand);

      const response = await request(app)
        .patch(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        name: 'New Name',
        slug: 'old-slug',
        description: 'Updated description',
      });
    });

    it('should reject duplicate slug on update with 409 CONFLICT', async () => {
      const brand1 = brandRepository.create({
        name: 'Brand 1',
        slug: 'brand-1',
      });
      const brand2 = brandRepository.create({
        name: 'Brand 2',
        slug: 'brand-2',
      });
      await brandRepository.save([brand1, brand2]);

      const response = await request(app)
        .patch(`/api/v1/admin/brands/${brand2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'brand-1',
        })
        .expect(409);

      expect(response.body.errorCode).toBe('BRAND_ALREADY_EXISTS');
    });

    it('should allow updating slug to same value', async () => {
      const brand = brandRepository.create({
        name: 'Brand',
        slug: 'brand-slug',
      });
      await brandRepository.save(brand);

      const response = await request(app)
        .patch(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'brand-slug',
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 when updating non-existent brand', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/brands/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.errorCode).toBe('BRAND_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/admin/brands/:id - Delete brand', () => {
    it('should soft-delete brand successfully', async () => {
      const brand = brandRepository.create({
        name: 'Brand to Delete',
        slug: 'delete-brand',
      });
      await brandRepository.save(brand);

      await request(app)
        .delete(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedBrand = await brandRepository.findOne({
        where: { id: brand.id },
        withDeleted: true,
      });
      expect(deletedBrand.deleted_at).not.toBeNull();
    });

    it('should reject delete when brand has active products with 409 CONFLICT', async () => {
      const category = categoryRepository.create({
        name: 'Test Category',
        slug: 'test-category',
      });
      await categoryRepository.save(category);

      const brand = brandRepository.create({
        name: 'Brand with Products',
        slug: 'brand-products',
      });
      await brandRepository.save(brand);

      const product = productRepository.create({
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-SKU-001',
        description: 'Product linked to brand',
        base_price: 100,
        brand_id: brand.id,
        category_id: category.id,
      });
      await productRepository.save(product);

      const response = await request(app)
        .delete(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(response.body.errorCode).toBe('BRAND_IN_USE');
    });

    it('should allow delete when brand has only soft-deleted products', async () => {
      const category = categoryRepository.create({
        name: 'Test Category',
        slug: 'test-category',
      });
      await categoryRepository.save(category);

      const brand = brandRepository.create({
        name: 'Brand',
        slug: 'brand',
      });
      await brandRepository.save(brand);

      const product = productRepository.create({
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-SKU-002',
        description: 'Soft deleted product linked to brand',
        base_price: 100,
        brand_id: brand.id,
        category_id: category.id,
      });
      await productRepository.save(product);
      await productRepository.softDelete(product.id);

      await request(app)
        .delete(`/api/v1/admin/brands/${brand.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent brand', async () => {
      await request(app)
        .delete('/api/v1/admin/brands/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app)
        .get('/api/v1/admin/brands')
        .expect(401);
    });

    it('should reject requests with non-admin user', async () => {
      const userToken = generateTestAccessToken(999, 'user@example.com', 'USER');

      await request(app)
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
