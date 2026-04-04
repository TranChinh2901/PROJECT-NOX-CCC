import 'reflect-metadata';
import { AppDataSource } from '../../../src/config/database.config';
import { AdminProductService } from '../../../src/modules/admin/admin-product.service';
import { Product } from '../../../src/modules/products/entity/product';
import { ProductVariant } from '../../../src/modules/products/entity/product-variant';
import { ProductImage } from '../../../src/modules/products/entity/product-image';
import { Category } from '../../../src/modules/products/entity/category';
import { Brand } from '../../../src/modules/products/entity/brand';
import { Inventory } from '../../../src/modules/inventory/entity/inventory';
import { createMockProduct } from '../../helpers/mock-factory';
import { createMockRepository } from '../../setup/repository.mock';

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../src/services/supabase-storage.service', () => ({
  __esModule: true,
  default: {},
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
});
