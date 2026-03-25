import 'reflect-metadata';
import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import router from '@/routes';
import { exceptionHandler } from '@/middlewares/exception-filter';
import { Category } from '@/modules/products/entity/category';
import { Product } from '@/modules/products/entity/product';
import { User } from '@/modules/users/entity/user.entity';
import { generateTestAccessToken } from '../../helpers/auth.helper';
import { ADMIN_USER } from '../../fixtures/users.fixture';
import { AppDataSource } from '@/config/database.config';

describe('Category Admin Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let categoryRepository: any;
  let productRepository: any;
  let userRepository: any;

  beforeAll(async () => {
    // Initialize AppDataSource (MySQL test database)
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    categoryRepository = AppDataSource.getRepository(Category);
    productRepository = AppDataSource.getRepository(Product);
    userRepository = AppDataSource.getRepository(User);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/', router);
    app.use(exceptionHandler);

    // Create admin user if not exists
    const existingAdmin = await userRepository.findOne({ where: { id: ADMIN_USER.id } });
    if (!existingAdmin) {
      const admin = userRepository.create(ADMIN_USER);
      await userRepository.save(admin);
    }

    // Generate admin token
    adminToken = generateTestAccessToken(ADMIN_USER.id, ADMIN_USER.email, 'ADMIN');
  });

  afterAll(async () => {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await productRepository.query('DELETE FROM products WHERE 1=1');
    await categoryRepository.query('DELETE FROM categories WHERE 1=1');
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await productRepository.query('DELETE FROM products WHERE 1=1');
    await categoryRepository.query('DELETE FROM categories WHERE 1=1');
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('GET /api/v1/admin/categories - List categories with pagination', () => {
    it('should list all categories with pagination', async () => {
      // Create test categories
      const parent = categoryRepository.create({
        name: 'Parent Category',
        slug: 'parent-category',
        description: 'Parent description',
        sort_order: 1,
      });
      await categoryRepository.save(parent);

      const child = categoryRepository.create({
        name: 'Child Category',
        slug: 'child-category',
        parent_id: parent.id,
        sort_order: 2,
      });
      await categoryRepository.save(child);

      const response = await request(app)
        .get('/api/v1/admin/categories')
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

    it('should support search functionality', async () => {
      const category1 = categoryRepository.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
      });
      const category2 = categoryRepository.create({
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion items',
      });
      await categoryRepository.save([category1, category2]);

      const response = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Electronic' })
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Electronics');
    });

    it('should support sorting by different columns', async () => {
      const cat1 = categoryRepository.create({
        name: 'Alpha',
        slug: 'alpha',
        sort_order: 2,
      });
      const cat2 = categoryRepository.create({
        name: 'Beta',
        slug: 'beta',
        sort_order: 1,
      });
      await categoryRepository.save([cat1, cat2]);

      const response = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'name', sortOrder: 'ASC' })
        .expect(200);

      expect(response.body.data.data[0].name).toBe('Alpha');
      expect(response.body.data.data[1].name).toBe('Beta');
    });
  });

  describe('GET /api/v1/admin/categories/tree - Get category tree', () => {
    it('should return nested tree structure with children arrays', async () => {
      // Create parent
      const parent = categoryRepository.create({
        name: 'Parent',
        slug: 'parent',
        sort_order: 1,
      });
      await categoryRepository.save(parent);

      // Create children
      const child1 = categoryRepository.create({
        name: 'Child 1',
        slug: 'child-1',
        parent_id: parent.id,
        sort_order: 1,
      });
      const child2 = categoryRepository.create({
        name: 'Child 2',
        slug: 'child-2',
        parent_id: parent.id,
        sort_order: 2,
      });
      await categoryRepository.save([child1, child2]);

      // Create grandchild
      const grandchild = categoryRepository.create({
        name: 'Grandchild',
        slug: 'grandchild',
        parent_id: child1.id,
        sort_order: 1,
      });
      await categoryRepository.save(grandchild);

      const response = await request(app)
        .get('/api/v1/admin/categories/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // One root category

      const rootCategory = response.body.data[0];
      expect(rootCategory.name).toBe('Parent');
      expect(rootCategory.children).toHaveLength(2);
      expect(rootCategory.children[0].name).toBe('Child 1');
      expect(rootCategory.children[0].children).toHaveLength(1);
      expect(rootCategory.children[0].children[0].name).toBe('Grandchild');
    });

    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/v1/admin/categories/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should exclude soft-deleted categories from tree', async () => {
      const active = categoryRepository.create({
        name: 'Active',
        slug: 'active',
      });
      await categoryRepository.save(active);

      const deleted = categoryRepository.create({
        name: 'Deleted',
        slug: 'deleted',
      });
      await categoryRepository.save(deleted);
      await categoryRepository.softDelete(deleted.id);

      const response = await request(app)
        .get('/api/v1/admin/categories/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Active');
    });
  });

  describe('GET /api/v1/admin/categories/:id - Get single category', () => {
    it('should return category with details', async () => {
      const category = categoryRepository.create({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        image_url: 'https://example.com/image.jpg',
        sort_order: 5,
        is_active: true,
      });
      await categoryRepository.save(category);

      const response = await request(app)
        .get(`/api/v1/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: category.id,
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        image_url: 'https://example.com/image.jpg',
        sort_order: 5,
        is_active: true,
      });
    });

    it('should return 404 when category not found', async () => {
      const response = await request(app)
        .get('/api/v1/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('POST /api/v1/admin/categories - Create category', () => {
    it('should create category without parent', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          slug: 'new-category',
          description: 'New description',
          sort_order: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'New Category',
        slug: 'new-category',
        description: 'New description',
        parent_id: null,
      });
    });

    it('should create category with optional parent_id', async () => {
      const parent = categoryRepository.create({
        name: 'Parent',
        slug: 'parent',
      });
      await categoryRepository.save(parent);

      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Child Category',
          slug: 'child-category',
          parent_id: parent.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parent_id).toBe(parent.id);
    });

    it('should return 400 when validation fails (missing required fields)', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'test-slug',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when parent_id does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Orphan Category',
          slug: 'orphan-category',
          parent_id: 99999,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 400 when slug already exists (duplicate)', async () => {
      const existing = categoryRepository.create({
        name: 'Existing',
        slug: 'duplicate-slug',
      });
      await categoryRepository.save(existing);

      const response = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          slug: 'duplicate-slug',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('PATCH /api/v1/admin/categories/:id - Update category', () => {
    it('should update category fields', async () => {
      const category = categoryRepository.create({
        name: 'Original Name',
        slug: 'original-slug',
        description: 'Original description',
      });
      await categoryRepository.save(category);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: category.id,
        name: 'Updated Name',
        slug: 'original-slug', // Unchanged
        description: 'Updated description',
      });
    });

    it('should allow setting parent_id to null (remove parent)', async () => {
      const parent = categoryRepository.create({
        name: 'Parent',
        slug: 'parent',
      });
      await categoryRepository.save(parent);

      const child = categoryRepository.create({
        name: 'Child',
        slug: 'child',
        parent_id: parent.id,
      });
      await categoryRepository.save(child);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${child.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parent_id: null,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parent_id).toBeNull();
    });

    it('should reject self-parent (parent_id === id)', async () => {
      const category = categoryRepository.create({
        name: 'Category',
        slug: 'category',
      });
      await categoryRepository.save(category);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parent_id: category.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject circular reference (parent cannot be descendant)', async () => {
      const categoryA = categoryRepository.create({
        name: 'Category A',
        slug: 'category-a',
      });
      await categoryRepository.save(categoryA);

      const categoryB = categoryRepository.create({
        name: 'Category B',
        slug: 'category-b',
        parent_id: categoryA.id,
      });
      await categoryRepository.save(categoryB);

      const categoryC = categoryRepository.create({
        name: 'Category C',
        slug: 'category-c',
        parent_id: categoryB.id,
      });
      await categoryRepository.save(categoryC);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${categoryA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parent_id: categoryC.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when updating non-existent category', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/admin/categories/:id - Delete category', () => {
    it('should soft-delete category when no children or products', async () => {
      const category = categoryRepository.create({
        name: 'To Delete',
        slug: 'to-delete',
      });
      await categoryRepository.save(category);

      await request(app)
        .delete(`/api/v1/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify soft delete
      const deleted = await categoryRepository.findOne({
        where: { id: category.id },
        withDeleted: true,
      });
      expect(deleted.deleted_at).not.toBeNull();
    });

    it('should return 409 when category has children (delete blocked)', async () => {
      const parent = categoryRepository.create({
        name: 'Parent',
        slug: 'parent',
      });
      await categoryRepository.save(parent);

      const child = categoryRepository.create({
        name: 'Child',
        slug: 'child',
        parent_id: parent.id,
      });
      await categoryRepository.save(child);

      const response = await request(app)
        .delete(`/api/v1/admin/categories/${parent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_IN_USE');
    });

    it('should return 409 when category has products (delete blocked)', async () => {
      const category = categoryRepository.create({
        name: 'Category with Products',
        slug: 'category-with-products',
      });
      await categoryRepository.save(category);

      const product = productRepository.create({
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TEST-SKU-001',
        base_price: 100,
        description: 'Test product description',
        category_id: category.id,
      });
      await productRepository.save(product);

      const response = await request(app)
        .delete(`/api/v1/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_IN_USE');
    });

    it('should return 404 when deleting non-existent category', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });

    it('should allow deleting category after soft-deleting its children', async () => {
      const parent = categoryRepository.create({
        name: 'Parent',
        slug: 'parent',
      });
      await categoryRepository.save(parent);

      const child = categoryRepository.create({
        name: 'Child',
        slug: 'child',
        parent_id: parent.id,
      });
      await categoryRepository.save(child);

      // Soft-delete child first
      await categoryRepository.softDelete(child.id);

      // Now parent should be deletable
      await request(app)
        .delete(`/api/v1/admin/categories/${parent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Authorization - Require admin access', () => {
    it('should return 401 when no token provided', async () => {
      await request(app)
        .get('/api/v1/admin/categories')
        .expect(401);
    });

    it('should return 403 when non-admin user attempts access', async () => {
      const userToken = generateTestAccessToken(2, 'user@example.com', 'USER');

      await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple levels of nesting in tree structure', async () => {
      // Create 5-level deep tree
      let parentId: number | null = null;
      for (let i = 1; i <= 5; i++) {
        const category: Category = categoryRepository.create({
          name: `Level ${i}`,
          slug: `level-${i}`,
          parent_id: parentId,
          sort_order: i,
        });
        const saved = await categoryRepository.save(category);
        parentId = saved.id;
      }

      const response = await request(app)
        .get('/api/v1/admin/categories/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      let current = response.body.data[0];
      for (let i = 1; i <= 4; i++) {
        expect(current.name).toBe(`Level ${i}`);
        expect(current.children).toHaveLength(1);
        current = current.children[0];
      }
      expect(current.name).toBe('Level 5');
      expect(current.children).toHaveLength(0);
    });

    it('should prevent circular reference in deep tree', async () => {
      const catA = categoryRepository.create({
        name: 'A',
        slug: 'a',
      });
      await categoryRepository.save(catA);

      const catB = categoryRepository.create({
        name: 'B',
        slug: 'b',
        parent_id: catA.id,
      });
      await categoryRepository.save(catB);

      const catC = categoryRepository.create({
        name: 'C',
        slug: 'c',
        parent_id: catB.id,
      });
      await categoryRepository.save(catC);

      const catD = categoryRepository.create({
        name: 'D',
        slug: 'd',
        parent_id: catC.id,
      });
      await categoryRepository.save(catD);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${catA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parent_id: catD.id,
        })
        .expect(400);

      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should handle empty string search gracefully', async () => {
      const category = categoryRepository.create({
        name: 'Category',
        slug: 'category',
      });
      await categoryRepository.save(category);

      const response = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: '' })
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
    });

    it('should validate category name uniqueness on update', async () => {
      const cat1 = categoryRepository.create({
        name: 'Category One',
        slug: 'category-one',
      });
      const cat2 = categoryRepository.create({
        name: 'Category Two',
        slug: 'category-two',
      });
      await categoryRepository.save([cat1, cat2]);

      const response = await request(app)
        .patch(`/api/v1/admin/categories/${cat2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Category One',
        })
        .expect(400);

      expect(response.body.errorCode).toBe('DUPLICATE_ENTRY');
    });
  });
});
