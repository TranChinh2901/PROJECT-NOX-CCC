import 'reflect-metadata';
import { AppDataSource } from '../../../src/config/database.config';
import { AdminProductService } from '../../../src/modules/admin/admin-product.service';
import { Product } from '../../../src/modules/products/entity/product';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';
import { ProductImage } from '../../../src/modules/products/entity/product-image';
import { Category } from '../../../src/modules/products/entity/category';
import { Brand } from '../../../src/modules/products/entity/brand';
import { Inventory } from '../../../src/modules/inventory/entity/inventory';
import { AppError } from '../../../src/common/error.response';
import supabaseStorageService from '../../../src/services/supabase-storage.service';
import { createMockProduct } from '../../helpers/mock-factory';
import { createMockRepository } from '../../setup/repository.mock';

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../src/services/supabase-storage.service', () => ({
  __esModule: true,
  default: {
    uploadProductImage: jest.fn(),
    deleteProductImageByPublicUrl: jest.fn(),
  },
}));

const createListQueryBuilder = (products: Product[], total: number) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(total),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(products),
});

const createRawManyQueryBuilder = (rows: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

describe('AdminProductService', () => {
  let service: AdminProductService;
  let productRepository: ReturnType<typeof createMockRepository>;
  let productVariantRepository: ReturnType<typeof createMockRepository>;
  let productImageRepository: ReturnType<typeof createMockRepository>;
  let categoryRepository: ReturnType<typeof createMockRepository>;
  let brandRepository: ReturnType<typeof createMockRepository>;
  let inventoryRepository: ReturnType<typeof createMockRepository>;
  const mockedStorageService = jest.mocked(supabaseStorageService);

  beforeEach(() => {
    jest.clearAllMocks();

    productRepository = createMockRepository<Product>();
    productVariantRepository = createMockRepository<ProductVariant>();
    productImageRepository = createMockRepository<ProductImage>();
    categoryRepository = createMockRepository<Category>();
    brandRepository = createMockRepository<Brand>();
    inventoryRepository = createMockRepository<Inventory>();
    productRepository.createQueryBuilder = jest.fn();
    inventoryRepository.createQueryBuilder = jest.fn();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: unknown) => {
      if (entity === Product) return productRepository;
      if (entity === ProductVariant) return productVariantRepository;
      if (entity === ProductImage) return productImageRepository;
      if (entity === Category) return categoryRepository;
      if (entity === Brand) return brandRepository;
      if (entity === Inventory) return inventoryRepository;
      return null;
    });

    service = new AdminProductService();
  });

  it('includes aggregated stock_quantity in admin product listings', async () => {
    const product = createMockProduct({ id: 901, images: [], variants: [] });

    productRepository.createQueryBuilder.mockReturnValue(createListQueryBuilder([product], 1));
    inventoryRepository.createQueryBuilder.mockReturnValue(
      createRawManyQueryBuilder([{ product_id: String(product.id), stock_quantity: '7' }]),
    );

    const result = await service.listProducts({ page: 1, limit: 10 });

    expect(result.pagination.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: product.id,
      stock_quantity: 7,
    });
  });

  it('stores provider URLs unchanged when uploading product images and mirrors them to thumbnails', async () => {
    const productId = 44;
    const uploadedUrl = 'https://res.cloudinary.com/demo/image/upload/v1744098725/products/44/front-view.jpg';
    const existingPrimary = {
      id: 11,
      product_id: productId,
      sort_order: 4,
      is_primary: true,
      image_url: 'https://legacy.example.com/product-44.jpg',
    } as ProductImage;

    productRepository.findOne.mockResolvedValue(
      createMockProduct({
        id: productId,
        images: [existingPrimary],
      }),
    );
    productImageRepository.create.mockImplementation((payload: Partial<ProductImage>) => payload);
    productImageRepository.save.mockImplementation(async (payload: Partial<ProductImage>) => ({
      id: 501,
      created_at: new Date('2026-04-08T02:00:00.000Z'),
      updated_at: new Date('2026-04-08T02:00:00.000Z'),
      ...payload,
    }));
    mockSupabaseStorageService.uploadProductImage.mockResolvedValue({
      path: 'products/44/front-view.jpg',
      publicUrl: uploadedUrl,
    });

    const file = {
      originalname: 'front-view.png',
      mimetype: 'image/png',
      buffer: Buffer.from('image'),
    } as Express.Multer.File;

    const result = await service.uploadProductImages(productId, [file], {
      is_primary: true,
    });

    expect(productImageRepository.update).toHaveBeenCalledWith(
      { product_id: productId },
      { is_primary: false },
    );
    expect(mockSupabaseStorageService.uploadProductImage).toHaveBeenCalledWith(productId, file);
    expect(productImageRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      product_id: productId,
      image_url: uploadedUrl,
      thumbnail_url: uploadedUrl,
      alt_text: 'front-view.png',
      sort_order: 5,
      is_primary: true,
    }));
    expect(result).toEqual([
      expect.objectContaining({
        id: 501,
        product_id: productId,
        image_url: uploadedUrl,
        thumbnail_url: uploadedUrl,
        alt_text: 'front-view.png',
        sort_order: 5,
        is_primary: true,
      }),
    ]);
  });

  it('increments sort order across a batch and keeps only the first uploaded image as primary', async () => {
    const productId = 55;
    const variantId = 902;

    productRepository.findOne.mockResolvedValue(
      createMockProduct({
        id: productId,
        images: [],
      }),
    );
    productVariantRepository.findOne.mockResolvedValue({ id: variantId, product_id: productId });
    productImageRepository.create.mockImplementation((payload: Partial<ProductImage>) => payload);
    productImageRepository.save.mockImplementation(async (payload: Partial<ProductImage>) => ({
      id: payload.sort_order ?? 0,
      created_at: new Date('2026-04-08T02:00:00.000Z'),
      updated_at: new Date('2026-04-08T02:00:00.000Z'),
      ...payload,
    }));
    mockSupabaseStorageService.uploadProductImage
      .mockResolvedValueOnce({
        path: 'products/55/gallery-1.jpg',
        publicUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/55/gallery-1.jpg',
      })
      .mockResolvedValueOnce({
        path: 'products/55/gallery-2.jpg',
        publicUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/55/gallery-2.jpg',
      });

    const files = [
      {
        originalname: 'gallery-1.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('first'),
      },
      {
        originalname: 'gallery-2.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('second'),
      },
    ] as Express.Multer.File[];

    const result = await service.uploadProductImages(productId, files, {
      variant_id: variantId,
      alt_text: 'Gallery angle',
      is_primary: true,
      sort_order: 10,
    });

    expect(productVariantRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: variantId,
        product_id: productId,
      },
    });
    expect(productImageRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      product_id: productId,
      variant_id: variantId,
      alt_text: 'Gallery angle',
      sort_order: 10,
      is_primary: true,
    }));
    expect(productImageRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      product_id: productId,
      variant_id: variantId,
      alt_text: 'Gallery angle',
      sort_order: 11,
      is_primary: false,
    }));
    expect(result).toEqual([
      expect.objectContaining({ id: 10, sort_order: 10, is_primary: true }),
      expect.objectContaining({ id: 11, sort_order: 11, is_primary: false }),
    ]);
  });

  it('deletes the product image row after removing the stored asset by URL', async () => {
    const productId = 70;
    const imageId = 88;
    const productImage = {
      id: imageId,
      product_id: productId,
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/products/70/primary.jpg',
    } as ProductImage;

    productImageRepository.findOne.mockResolvedValue(productImage);
    mockSupabaseStorageService.deleteProductImageByPublicUrl.mockResolvedValue(undefined);
    productImageRepository.delete.mockResolvedValue({ affected: 1 });

    await service.deleteProductImage(productId, imageId);

    expect(mockSupabaseStorageService.deleteProductImageByPublicUrl).toHaveBeenCalledWith(
      productImage.image_url,
    );
    expect(productImageRepository.delete).toHaveBeenCalledWith({ id: imageId });
  });

  it('rejects uploads when no product image files are provided', async () => {
    await expect(
      service.uploadProductImages(99, [], { is_primary: false }),
    ).rejects.toBeInstanceOf(AppError);

    expect(productRepository.findOne).not.toHaveBeenCalled();
    expect(mockSupabaseStorageService.uploadProductImage).not.toHaveBeenCalled();
  });
});
