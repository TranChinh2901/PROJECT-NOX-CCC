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
});
