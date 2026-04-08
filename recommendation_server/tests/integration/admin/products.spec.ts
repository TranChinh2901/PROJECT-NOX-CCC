import 'reflect-metadata';
import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import router from '@/routes';
import { exceptionHandler } from '@/middlewares/exception-filter';
import { Product } from '@/modules/products/entity/product';
import { ProductVariant } from '@/modules/products/entity/product-variant';
import { ProductImage } from '@/modules/products/entity/product-image';
import { Category } from '@/modules/products/entity/category';
import { Brand } from '@/modules/products/entity/brand';
import { User } from '@/modules/users/entity/user.entity';
import { UserSession } from '@/modules/users/entity/user-session';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { generateTokenWithRole } from '../../helpers/auth.helper';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';

describe('Admin Product Integration Tests', () => {
  let app: Application;
  let dataSource: DataSource;
  let adminToken: string;
  let categoryId: number;
  let brandId: number;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Product, ProductVariant, ProductImage, Category, Brand, User, UserSession],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/', router);
    app.use(exceptionHandler);

    const userRepository = dataSource.getRepository(User);
    const adminUser = userRepository.create({
      fullname: 'Admin Test User',
      email: 'admin.test@example.com',
      phone_number: '1234567890',
      password: 'hashedpassword',
      role: RoleType.ADMIN,
      is_verified: true,
    });
    const savedAdmin = await userRepository.save(adminUser);

    adminToken = generateTokenWithRole(savedAdmin.id, savedAdmin.email, RoleType.ADMIN);

    const categoryRepository = dataSource.getRepository(Category);
    const category = categoryRepository.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Category for integration tests',
      is_active: true,
    });
    const savedCategory = await categoryRepository.save(category);
    categoryId = savedCategory.id;

    const brandRepository = dataSource.getRepository(Brand);
    const brand = brandRepository.create({
      name: 'Test Brand',
      slug: 'test-brand',
      description: 'Brand for integration tests',
      is_active: true,
    });
    const savedBrand = await brandRepository.save(brand);
    brandId = savedBrand.id;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  afterEach(async () => {
    const productRepository = dataSource.getRepository(Product);
    const variantRepository = dataSource.getRepository(ProductVariant);
    const imageRepository = dataSource.getRepository(ProductImage);

    const allImages = await imageRepository.find();
    if (allImages.length > 0) {
      await imageRepository.remove(allImages);
    }

    const allVariants = await variantRepository.find();
    if (allVariants.length > 0) {
      await variantRepository.remove(allVariants);
    }

    const allProducts = await productRepository.find();
    if (allProducts.length > 0) {
      await productRepository.remove(allProducts);
    }
  });

  describe('GET /api/v1/admin/products', () => {
    it('should return paginated products with default pagination', async () => {
      const productRepository = dataSource.getRepository(Product);
      for (let i = 1; i <= 15; i++) {
        await productRepository.save(
          productRepository.create({
            category_id: categoryId,
            brand_id: brandId,
            name: `Test Product ${i}`,
            slug: `test-product-${i}`,
            sku: `SKU-TEST-${i}`,
            description: 'Test description',
            base_price: 100 + i,
            is_active: true,
          })
        );
      }

      const response = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data).toHaveLength(10);
      expect(response.body.data.pagination).toEqual({
        total: 15,
        page: 1,
        limit: 10,
        total_pages: 2,
      });
    });

    it('should return products with custom pagination', async () => {
      const productRepository = dataSource.getRepository(Product);
      for (let i = 1; i <= 15; i++) {
        await productRepository.save(
          productRepository.create({
            category_id: categoryId,
            name: `Product ${i}`,
            slug: `product-${i}`,
            sku: `SKU-${i}`,
            description: 'Description',
            base_price: 50,
            is_active: true,
          })
        );
      }

      const response = await request(app)
        .get('/api/v1/admin/products?page=2&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.data).toHaveLength(5);
      expect(response.body.data.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        total_pages: 3,
      });
    });

    it('should include soft-deleted products for admin', async () => {
      const productRepository = dataSource.getRepository(Product);
      const product = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Deleted Product',
          slug: 'deleted-product',
          sku: 'SKU-DELETED',
          description: 'Will be deleted',
          base_price: 100,
          is_active: true,
        })
      );

      await productRepository.softDelete({ id: product.id });

      const response = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].deleted_at).not.toBeNull();
    });

    it('should search products by name', async () => {
      const productRepository = dataSource.getRepository(Product);
      await productRepository.save([
        productRepository.create({
          category_id: categoryId,
          name: 'Red Shirt',
          slug: 'red-shirt',
          sku: 'SKU-RED',
          description: 'A red shirt',
          base_price: 50,
          is_active: true,
        }),
        productRepository.create({
          category_id: categoryId,
          name: 'Blue Pants',
          slug: 'blue-pants',
          sku: 'SKU-BLUE',
          description: 'Blue pants',
          base_price: 60,
          is_active: true,
        }),
      ]);

      const response = await request(app)
        .get('/api/v1/admin/products?search=Red')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Red Shirt');
    });

    it('should filter products by category, brand, and active status', async () => {
      const categoryRepository = dataSource.getRepository(Category);
      const brandRepository = dataSource.getRepository(Brand);
      const productRepository = dataSource.getRepository(Product);

      const secondCategory = await categoryRepository.save(
        categoryRepository.create({
          name: 'Filtered Category',
          slug: 'filtered-category',
          description: 'Extra category for filters',
          is_active: true,
        }),
      );

      const secondBrand = await brandRepository.save(
        brandRepository.create({
          name: 'Filtered Brand',
          slug: 'filtered-brand',
          description: 'Extra brand for filters',
          is_active: true,
        }),
      );

      await productRepository.save([
        productRepository.create({
          category_id: categoryId,
          brand_id: brandId,
          name: 'Included Product',
          slug: 'included-product',
          sku: 'SKU-INCLUDED',
          description: 'Should match all filters',
          base_price: 120,
          is_active: true,
        }),
        productRepository.create({
          category_id: secondCategory.id,
          brand_id: brandId,
          name: 'Wrong Category',
          slug: 'wrong-category',
          sku: 'SKU-WRONG-CATEGORY',
          description: 'Wrong category',
          base_price: 120,
          is_active: true,
        }),
        productRepository.create({
          category_id: categoryId,
          brand_id: secondBrand.id,
          name: 'Wrong Brand',
          slug: 'wrong-brand',
          sku: 'SKU-WRONG-BRAND',
          description: 'Wrong brand',
          base_price: 120,
          is_active: true,
        }),
        productRepository.create({
          category_id: categoryId,
          brand_id: brandId,
          name: 'Inactive Product',
          slug: 'inactive-product',
          sku: 'SKU-INACTIVE',
          description: 'Wrong status',
          base_price: 120,
          is_active: false,
        }),
      ]);

      const response = await request(app)
        .get(`/api/v1/admin/products?category_id=${categoryId}&brand_id=${brandId}&is_active=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Included Product');
    });
  });

  describe('GET /api/v1/admin/products/:id', () => {
    it('should return a single product with relations', async () => {
      const productRepository = dataSource.getRepository(Product);
      const product = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          brand_id: brandId,
          name: 'Single Product',
          slug: 'single-product',
          sku: 'SKU-SINGLE',
          description: 'Single product description',
          base_price: 100,
          is_active: true,
        })
      );

      const response = await request(app)
        .get(`/api/v1/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      expect(response.body.data.id).toBe(product.id);
      expect(response.body.data.name).toBe('Single Product');
      expect(response.body.data.category).toMatchObject({
        id: categoryId,
        name: 'Test Category',
      });
      expect(response.body.data.brand).toMatchObject({
        id: brandId,
        name: 'Test Brand',
      });
    });

    it('should return 404 when product not found', async () => {
      const response = await request(app)
        .get('/api/v1/admin/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    });
  });

  describe('POST /api/v1/admin/products', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        category_id: categoryId,
        brand_id: brandId,
        name: 'New Product',
        slug: 'new-product',
        sku: 'SKU-NEW',
        description: 'This is a new product',
        short_description: 'New product',
        base_price: 150,
        compare_at_price: 200,
        cost_price: 80,
        weight_kg: 0.5,
        is_active: true,
        is_featured: false,
        meta_title: 'New Product Meta',
        meta_description: 'Meta description',
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(HttpStatusCode.CREATED);

      expect(response.body.data).toMatchObject({
        name: 'New Product',
        sku: 'SKU-NEW',
        base_price: 150,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 409 CONFLICT for duplicate SKU', async () => {
      const productRepository = dataSource.getRepository(Product);
      await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Existing Product',
          slug: 'existing-product',
          sku: 'SKU-DUPLICATE',
          description: 'Existing',
          base_price: 100,
          is_active: true,
        })
      );

      const duplicateData = {
        category_id: categoryId,
        name: 'Another Product',
        slug: 'another-product',
        sku: 'SKU-DUPLICATE',
        description: 'Another product',
        base_price: 120,
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(HttpStatusCode.BAD_REQUEST);

      expect(response.body.error_code).toBe(ErrorCode.DUPLICATE_SKU);
    });

    it('should return 404 for non-existent category', async () => {
      const productData = {
        category_id: 99999,
        name: 'Product',
        slug: 'product',
        sku: 'SKU-NOCAT',
        description: 'No category',
        base_price: 100,
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.CATEGORY_NOT_FOUND);
    });

    it('should return 404 for non-existent brand', async () => {
      const productData = {
        category_id: categoryId,
        brand_id: 99999,
        name: 'Product',
        slug: 'product',
        sku: 'SKU-NOBRAND',
        description: 'No brand',
        base_price: 100,
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.BRAND_NOT_FOUND);
    });

    it('should return 400 for validation errors', async () => {
      const invalidData = {
        category_id: categoryId,
        name: '',
        slug: 'test-slug',
        sku: 'SKU-TEST',
        description: 'Test',
        base_price: -10,
      };

      const response = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(HttpStatusCode.BAD_REQUEST);

      expect(response.body.error_code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('PATCH /api/v1/admin/products/:id', () => {
    it('should update an existing product', async () => {
      const productRepository = dataSource.getRepository(Product);
      const product = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Original Name',
          slug: 'original-slug',
          sku: 'SKU-ORIGINAL',
          description: 'Original description',
          base_price: 100,
          is_active: true,
        })
      );

      const updateData = {
        name: 'Updated Name',
        base_price: 150,
        is_featured: true,
      };

      const response = await request(app)
        .patch(`/api/v1/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(HttpStatusCode.OK);

      expect(response.body.data).toMatchObject({
        id: product.id,
        name: 'Updated Name',
        base_price: 150,
        is_featured: true,
        sku: 'SKU-ORIGINAL',
      });
    });

    it('should return 404 when updating non-existent product', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    });

    it('should return 409 when updating to duplicate SKU', async () => {
      const productRepository = dataSource.getRepository(Product);
      const product1 = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Product 1',
          slug: 'product-1',
          sku: 'SKU-1',
          description: 'Product 1',
          base_price: 100,
          is_active: true,
        })
      );

      await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Product 2',
          slug: 'product-2',
          sku: 'SKU-2',
          description: 'Product 2',
          base_price: 100,
          is_active: true,
        })
      );

      const response = await request(app)
        .patch(`/api/v1/admin/products/${product1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'SKU-2' })
        .expect(HttpStatusCode.BAD_REQUEST);

      expect(response.body.error_code).toBe(ErrorCode.DUPLICATE_SKU);
    });
  });

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('should soft-delete product with cascade to variants and images', async () => {
      const productRepository = dataSource.getRepository(Product);
      const variantRepository = dataSource.getRepository(ProductVariant);
      const imageRepository = dataSource.getRepository(ProductImage);

      const product = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Product to Delete',
          slug: 'product-to-delete',
          sku: 'SKU-DELETE',
          description: 'Will be deleted',
          base_price: 100,
          is_active: true,
        })
      );

      await variantRepository.save([
        variantRepository.create({
          product_id: product.id,
          sku: 'SKU-DELETE-V1',
          size: 'M',
          color: 'Red',
          price_adjustment: 0,
          final_price: 100,
          is_active: true,
        }),
        variantRepository.create({
          product_id: product.id,
          sku: 'SKU-DELETE-V2',
          size: 'L',
          color: 'Blue',
          price_adjustment: 10,
          final_price: 110,
          is_active: true,
        }),
      ]);

      await imageRepository.save([
        imageRepository.create({
          product_id: product.id,
          image_url: 'http://example.com/image1.jpg',
          is_primary: true,
          sort_order: 0,
        }),
        imageRepository.create({
          product_id: product.id,
          image_url: 'http://example.com/image2.jpg',
          is_primary: false,
          sort_order: 1,
        }),
      ]);

      await request(app)
        .delete(`/api/v1/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.OK);

      const deletedProduct = await productRepository.findOne({
        where: { id: product.id },
        withDeleted: true,
      });
      expect(deletedProduct?.deleted_at).not.toBeNull();

      const deletedVariants = await variantRepository.find({
        where: { product_id: product.id },
        withDeleted: true,
      });
      expect(deletedVariants).toHaveLength(2);
      deletedVariants.forEach((variant) => {
        expect(variant.deleted_at).not.toBeNull();
      });

      const deletedImages = await imageRepository.find({
        where: { product_id: product.id },
        withDeleted: true,
      });
      expect(deletedImages).toHaveLength(2);
      deletedImages.forEach((image) => {
        expect(image.deleted_at).not.toBeNull();
      });
    });

    it('should return 404 when deleting non-existent product', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    });
  });

  describe('POST /api/v1/admin/products/bulk-delete', () => {
    it('should bulk delete multiple products', async () => {
      const productRepository = dataSource.getRepository(Product);
      const products = [];

      for (let i = 1; i <= 5; i++) {
        const product = await productRepository.save(
          productRepository.create({
            category_id: categoryId,
            name: `Bulk Product ${i}`,
            slug: `bulk-product-${i}`,
            sku: `SKU-BULK-${i}`,
            description: 'Bulk delete test',
            base_price: 100,
            is_active: true,
          })
        );
        products.push(product);
      }

      const ids = products.map((p) => p.id);

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids })
        .expect(HttpStatusCode.OK);

      expect(response.body.data.deleted).toBe(5);

      const deletedProducts = await productRepository.find({
        where: ids.map((id) => ({ id })),
        withDeleted: true,
      });
      deletedProducts.forEach((product) => {
        expect(product.deleted_at).not.toBeNull();
      });
    });

    it('should return 400 for bulk delete exceeding max limit', async () => {
      const ids = Array.from({ length: 101 }, (_, i) => i + 1);

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids })
        .expect(HttpStatusCode.BAD_REQUEST);

      expect(response.body.error_code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toContain('100');
    });

    it('should return 400 for empty IDs array', async () => {
      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(HttpStatusCode.BAD_REQUEST);

      expect(response.body.error_code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should return 404 when one or more products not found', async () => {
      const productRepository = dataSource.getRepository(Product);
      const product = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Bulk Product',
          slug: 'bulk-product',
          sku: 'SKU-BULK',
          description: 'Bulk test',
          base_price: 100,
          is_active: true,
        })
      );

      const ids = [product.id, 99999];

      const response = await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids })
        .expect(HttpStatusCode.NOT_FOUND);

      expect(response.body.error_code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    });

    it('should soft-delete variants and images for all bulk-deleted products', async () => {
      const productRepository = dataSource.getRepository(Product);
      const variantRepository = dataSource.getRepository(ProductVariant);
      const imageRepository = dataSource.getRepository(ProductImage);

      const product1 = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Bulk Product 1',
          slug: 'bulk-product-1',
          sku: 'SKU-BULK-1',
          description: 'Bulk test 1',
          base_price: 100,
          is_active: true,
        })
      );

      const product2 = await productRepository.save(
        productRepository.create({
          category_id: categoryId,
          name: 'Bulk Product 2',
          slug: 'bulk-product-2',
          sku: 'SKU-BULK-2',
          description: 'Bulk test 2',
          base_price: 100,
          is_active: true,
        })
      );

      await variantRepository.save([
        variantRepository.create({
          product_id: product1.id,
          sku: 'SKU-BULK-1-V1',
          size: 'S',
          price_adjustment: 0,
          final_price: 100,
          is_active: true,
        }),
        variantRepository.create({
          product_id: product1.id,
          sku: 'SKU-BULK-1-V2',
          size: 'M',
          price_adjustment: 0,
          final_price: 100,
          is_active: true,
        }),
        variantRepository.create({
          product_id: product2.id,
          sku: 'SKU-BULK-2-V1',
          size: 'L',
          price_adjustment: 0,
          final_price: 100,
          is_active: true,
        }),
      ]);

      await imageRepository.save([
        imageRepository.create({
          product_id: product1.id,
          image_url: 'http://example.com/bulk1.jpg',
          is_primary: true,
          sort_order: 0,
        }),
        imageRepository.create({
          product_id: product2.id,
          image_url: 'http://example.com/bulk2.jpg',
          is_primary: true,
          sort_order: 0,
        }),
      ]);

      await request(app)
        .post('/api/v1/admin/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [product1.id, product2.id] })
        .expect(HttpStatusCode.OK);

      const allVariants = await variantRepository.find({
        where: [{ product_id: product1.id }, { product_id: product2.id }],
        withDeleted: true,
      });
      expect(allVariants).toHaveLength(3);
      allVariants.forEach((variant) => {
        expect(variant.deleted_at).not.toBeNull();
      });

      const allImages = await imageRepository.find({
        where: [{ product_id: product1.id }, { product_id: product2.id }],
        withDeleted: true,
      });
      expect(allImages).toHaveLength(2);
      allImages.forEach((image) => {
        expect(image.deleted_at).not.toBeNull();
      });
    });
  });
});
