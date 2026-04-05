import 'reflect-metadata';
import { AppDataSource } from '../../../src/config/database.config';
import { ProductService } from '../../../src/modules/products/product.service';
import { Product } from '../../../src/modules/products/entity/product';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';
import { ProductImage } from '../../../src/modules/products/entity/product-image';
import { Category } from '../../../src/modules/products/entity/category';
import { Brand } from '../../../src/modules/products/entity/brand';
import { Review } from '../../../src/modules/reviews/entity/review';
import { Inventory } from '../../../src/modules/inventory/entity/inventory';
import { createMockProduct, createMockProductVariant } from '../../helpers/mock-factory';
import { createMockRepository } from '../../setup/repository.mock';

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

const createRawManyQueryBuilder = (rows: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: ReturnType<typeof createMockRepository>;
  let productVariantRepository: ReturnType<typeof createMockRepository>;
  let productImageRepository: ReturnType<typeof createMockRepository>;
  let categoryRepository: ReturnType<typeof createMockRepository>;
  let brandRepository: ReturnType<typeof createMockRepository>;
  let reviewRepository: ReturnType<typeof createMockRepository>;
  let inventoryRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    productRepository = createMockRepository<Product>();
    productVariantRepository = createMockRepository<ProductVariant>();
    productImageRepository = createMockRepository<ProductImage>();
    categoryRepository = createMockRepository<Category>();
    brandRepository = createMockRepository<Brand>();
    reviewRepository = createMockRepository<Review>();
    inventoryRepository = createMockRepository<Inventory>();
    productVariantRepository.createQueryBuilder = jest.fn();
    inventoryRepository.createQueryBuilder = jest.fn();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: unknown) => {
      if (entity === Product) return productRepository;
      if (entity === ProductVariant) return productVariantRepository;
      if (entity === ProductImage) return productImageRepository;
      if (entity === Category) return categoryRepository;
      if (entity === Brand) return brandRepository;
      if (entity === Review) return reviewRepository;
      if (entity === Inventory) return inventoryRepository;
      return null;
    });

    service = new ProductService();
  });

  it('includes aggregated stock_quantity for featured products', async () => {
    const variant = createMockProductVariant({ id: 301, product_id: 201 });
    const product = createMockProduct({
      id: 201,
      variants: [variant],
      images: [],
    });

    productRepository.find.mockResolvedValue([product]);
    productVariantRepository.createQueryBuilder.mockReturnValue(
      createRawManyQueryBuilder([{ product_id: String(product.id), sold_count: '3' }]),
    );
    inventoryRepository.createQueryBuilder.mockReturnValue(
      createRawManyQueryBuilder([{ product_id: String(product.id), stock_quantity: '12' }]),
    );

    const result = await service.getFeaturedProducts(5);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: product.id,
      sold_count: 3,
      stock_quantity: 12,
    });
  });

  it('prefers matching leaf categories for conversational monitor searches', async () => {
    const gamingMonitor = createMockProduct({
      id: 501,
      name: 'LG UltraGear 27GS95QE 27in/QHD/240Hz',
      slug: 'lg-ultragear-27',
      sku: 'MONITOR-27',
      description:
        'LG UltraGear 27GS95QE thuộc nhóm màn hình, nổi bật với tần số quét cao và hiển thị rõ cho nhu cầu giải trí.',
      short_description: 'OLED, 240Hz.',
      category: {
        id: 10,
        name: 'PC - Màn Hình - Màn Hình',
        slug: 'pc-man-hinh-man-hinh',
      } as Category,
      brand: {
        id: 20,
        name: 'LG',
        slug: 'lg',
      } as Brand,
      variants: [
        createMockProductVariant({
          id: 601,
          product_id: 501,
          sku: 'MONITOR-27-BLK',
          size: '27 inch',
          material: 'OLED',
        }),
      ],
      images: [],
    });
    const gamingPc = createMockProduct({
      id: 502,
      name: 'PC Gaming RTX 4060 Ryzen 7 16GB/1TB',
      slug: 'pc-gaming-rtx-4060',
      sku: 'PC-4060',
      description:
        'PC Gaming RTX 4060 Ryzen 7 thuộc nhóm pc gaming, nổi bật với hiệu năng mạnh và chơi game mượt.',
      short_description: 'RTX 4060, hiệu năng mạnh.',
      category: {
        id: 11,
        name: 'PC - Màn Hình - PC Gaming',
        slug: 'pc-man-hinh-pc-gaming',
      } as Category,
      brand: {
        id: 21,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [
        createMockProductVariant({
          id: 602,
          product_id: 502,
          sku: 'PC-4060-16GB',
          size: '16GB/1TB',
          material: 'RTX 4060',
        }),
      ],
      images: [],
    });

    productRepository.find.mockResolvedValue([gamingMonitor, gamingPc]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('tôi đang tìm màn hình chơi game', 5);

    expect(result.data).toEqual([
      expect.objectContaining({
        id: 501,
        name: 'LG UltraGear 27GS95QE 27in/QHD/240Hz',
      }),
    ]);
    expect(result.suggestions).toEqual(['LG UltraGear 27GS95QE 27in/QHD/240Hz']);
  });

  it('still returns gaming PCs for PC gaming queries', async () => {
    const gamingMonitor = createMockProduct({
      id: 511,
      name: 'LG UltraGear 27GS95QE 27in/QHD/240Hz',
      slug: 'lg-ultragear-27',
      sku: 'MONITOR-27',
      description: 'Màn hình 27 inch QHD cho giải trí và làm việc.',
      short_description: 'OLED, 240Hz.',
      category: {
        id: 12,
        name: 'PC - Màn Hình - Màn Hình',
        slug: 'pc-man-hinh-man-hinh',
      } as Category,
      brand: {
        id: 22,
        name: 'LG',
        slug: 'lg',
      } as Brand,
      variants: [],
      images: [],
    });
    const gamingPc = createMockProduct({
      id: 512,
      name: 'PC Gaming RTX 4060 Ryzen 7 16GB/1TB',
      slug: 'pc-gaming-rtx-4060',
      sku: 'PC-4060',
      description: 'PC gaming cho nhu cầu chiến game và stream.',
      short_description: 'RTX 4060, Ryzen 7.',
      category: {
        id: 13,
        name: 'PC - Màn Hình - PC Gaming',
        slug: 'pc-man-hinh-pc-gaming',
      } as Category,
      brand: {
        id: 23,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [],
      images: [],
    });

    productRepository.find.mockResolvedValue([gamingMonitor, gamingPc]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('pc gaming', 5);

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: 512,
        name: 'PC Gaming RTX 4060 Ryzen 7 16GB/1TB',
      }),
    );
  });
});
