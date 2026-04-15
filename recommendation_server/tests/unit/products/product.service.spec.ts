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
import { maybePlanStorefrontSearch } from '../../../src/modules/products/product-search-planner';
import { getEmbedding } from '../../../src/utils/chatbot/chatbot-embeddings';

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../src/modules/products/product-search-planner', () => ({
  maybePlanStorefrontSearch: jest.fn(),
}));

jest.mock('../../../src/utils/chatbot/chatbot-embeddings', () => ({
  getEmbedding: jest.fn(),
}));

const mockedMaybePlanStorefrontSearch = jest.mocked(maybePlanStorefrontSearch);
const mockedGetEmbedding = jest.mocked(getEmbedding);

const createRawManyQueryBuilder = (rows: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

const createSearchCategory = (id: number, name: string, parent_id?: number): Category => ({
  id,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  parent_id,
  is_active: true,
  sort_order: 0,
} as Category);

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
    mockedMaybePlanStorefrontSearch.mockResolvedValue(null);
    mockedGetEmbedding.mockRejectedValue(new Error('Embedding disabled in unit test'));

    productRepository = createMockRepository<Product>();
    productVariantRepository = createMockRepository<ProductVariant>();
    productImageRepository = createMockRepository<ProductImage>();
    categoryRepository = createMockRepository<Category>();
    brandRepository = createMockRepository<Brand>();
    reviewRepository = createMockRepository<Review>();
    inventoryRepository = createMockRepository<Inventory>();
    productVariantRepository.createQueryBuilder = jest.fn();
    inventoryRepository.createQueryBuilder = jest.fn();
    productRepository.createQueryBuilder = jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockImplementation(() => productRepository.find()),
    });
    categoryRepository.find.mockResolvedValue([]);

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
    const rootCategory = createSearchCategory(1, 'PC - Màn Hình');
    const monitorCategory = createSearchCategory(10, 'Màn Hình', 1);
    const gamingCategory = createSearchCategory(11, 'PC Gaming', 1);
    const gamingMonitor = createMockProduct({
      id: 501,
      category_id: 10,
      name: 'LG UltraGear 27GS95QE 27in/QHD/240Hz',
      slug: 'lg-ultragear-27',
      sku: 'MONITOR-27',
      description:
        'LG UltraGear 27GS95QE thuộc nhóm màn hình, nổi bật với tần số quét cao và hiển thị rõ cho nhu cầu giải trí.',
      short_description: 'OLED, 240Hz.',
      category: {
        id: 10,
        name: 'Màn Hình',
        slug: 'man-hinh',
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
      category_id: 11,
      name: 'PC Gaming RTX 4060 Ryzen 7 16GB/1TB',
      slug: 'pc-gaming-rtx-4060',
      sku: 'PC-4060',
      description:
        'PC Gaming RTX 4060 Ryzen 7 thuộc nhóm pc gaming, nổi bật với hiệu năng mạnh và chơi game mượt.',
      short_description: 'RTX 4060, hiệu năng mạnh.',
      category: {
        id: 11,
        name: 'PC Gaming',
        slug: 'pc-gaming',
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

    categoryRepository.find.mockResolvedValue([rootCategory, monitorCategory, gamingCategory]);
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
    const rootCategory = createSearchCategory(2, 'PC - Màn Hình');
    const monitorCategory = createSearchCategory(12, 'Màn Hình', 2);
    const gamingCategory = createSearchCategory(13, 'PC Gaming', 2);
    const gamingMonitor = createMockProduct({
      id: 511,
      category_id: 12,
      name: 'LG UltraGear 27GS95QE 27in/QHD/240Hz',
      slug: 'lg-ultragear-27',
      sku: 'MONITOR-27',
      description: 'Màn hình 27 inch QHD cho giải trí và làm việc.',
      short_description: 'OLED, 240Hz.',
      category: {
        id: 12,
        name: 'Màn Hình',
        slug: 'man-hinh',
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
      category_id: 13,
      name: 'PC Gaming RTX 4060 Ryzen 7 16GB/1TB',
      slug: 'pc-gaming-rtx-4060',
      sku: 'PC-4060',
      description: 'PC gaming cho nhu cầu chiến game và stream.',
      short_description: 'RTX 4060, Ryzen 7.',
      category: {
        id: 13,
        name: 'PC Gaming',
        slug: 'pc-gaming',
      } as Category,
      brand: {
        id: 23,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([rootCategory, monitorCategory, gamingCategory]);
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

  it('expands parent categories for dien thoai queries and suppresses weak fallback products', async () => {
    const phoneRootCategory = createSearchCategory(30, 'Điện Thoại');
    const iphoneCategory = createSearchCategory(31, 'iPhone', 30);
    const samsungCategory = createSearchCategory(32, 'Samsung Galaxy', 30);
    const accessoryCategory = createSearchCategory(40, 'Âm Thanh - Phụ Kiện');
    const iphoneProduct = createMockProduct({
      id: 701,
      category_id: 31,
      name: 'iPhone 17 128GB',
      slug: 'iphone-17-128gb',
      sku: 'IPHONE-17-128',
      description: 'Điện thoại Apple màn hình đẹp và hiệu năng mạnh.',
      short_description: 'Apple A19.',
      category: {
        id: 31,
        name: 'iPhone',
        slug: 'iphone',
      } as Category,
      brand: {
        id: 80,
        name: 'Apple',
        slug: 'apple',
      } as Brand,
      variants: [],
      images: [],
    });
    const samsungProduct = createMockProduct({
      id: 702,
      category_id: 32,
      name: 'Samsung Galaxy S26 256GB',
      slug: 'samsung-galaxy-s26-256gb',
      sku: 'SAMSUNG-S26-256',
      description: 'Điện thoại flagship với màn hình sáng và pin bền.',
      short_description: 'Galaxy AI.',
      category: {
        id: 32,
        name: 'Samsung Galaxy',
        slug: 'samsung-galaxy',
      } as Category,
      brand: {
        id: 81,
        name: 'Samsung',
        slug: 'samsung',
      } as Brand,
      variants: [],
      images: [],
    });
    const fallbackAccessory = createMockProduct({
      id: 703,
      category_id: 40,
      name: 'Thiết Bị Công Nghệ NOX Bản Cao Cấp',
      slug: 'thiet-bi-cong-nghe-nox-ban-cao-cap',
      sku: 'NOX-ACCESSORY',
      description: 'Thiết bị công nghệ đa dụng cho bàn làm việc.',
      short_description: 'Tech Ready.',
      category: {
        id: 40,
        name: 'Âm Thanh - Phụ Kiện',
        slug: 'am-thanh-phu-kien',
      } as Category,
      brand: {
        id: 82,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([
      phoneRootCategory,
      iphoneCategory,
      samsungCategory,
      accessoryCategory,
    ]);
    productRepository.find.mockResolvedValue([iphoneProduct, samsungProduct, fallbackAccessory]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('điện thoại', 5);

    expect(result.data).toEqual([
      expect.objectContaining({ id: 701, name: 'iPhone 17 128GB' }),
      expect.objectContaining({ id: 702, name: 'Samsung Galaxy S26 256GB' }),
    ]);
    expect(result.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 703 })]),
    );
  });

  it('supports generic may tinh aliases across laptops and PCs without pulling unrelated accessories', async () => {
    const laptopRootCategory = createSearchCategory(60, 'Laptop');
    const macbookCategory = createSearchCategory(61, 'MacBook', 60);
    const pcGamingCategory = createSearchCategory(62, 'PC Gaming');
    const speakerCategory = createSearchCategory(63, 'Loa');
    const macbookProduct = createMockProduct({
      id: 851,
      category_id: 61,
      name: 'MacBook Air M4 13',
      slug: 'macbook-air-m4-13',
      sku: 'MACBOOK-AIR-M4-13',
      description: 'Laptop mỏng nhẹ cho học tập và làm việc.',
      short_description: 'Apple M4.',
      category: {
        id: 61,
        name: 'MacBook',
        slug: 'macbook',
      } as Category,
      brand: {
        id: 91,
        name: 'Apple',
        slug: 'apple',
      } as Brand,
      variants: [],
      images: [],
    });
    const pcProduct = createMockProduct({
      id: 852,
      category_id: 62,
      name: 'PC Gaming RTX 4060 Ryzen 7',
      slug: 'pc-gaming-rtx-4060-ryzen-7',
      sku: 'PC-RTX-4060-R7',
      description: 'PC desktop hiệu năng cao cho chơi game và làm việc.',
      short_description: 'RTX 4060.',
      category: {
        id: 62,
        name: 'PC Gaming',
        slug: 'pc-gaming',
      } as Category,
      brand: {
        id: 92,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [],
      images: [],
    });
    const speakerProduct = createMockProduct({
      id: 853,
      category_id: 63,
      name: 'JBL Charge 6',
      slug: 'jbl-charge-6',
      sku: 'JBL-CHARGE-6',
      description: 'Loa bluetooth di động cho giải trí.',
      short_description: 'Portable speaker.',
      category: speakerCategory,
      brand: {
        id: 93,
        name: 'JBL',
        slug: 'jbl',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([
      laptopRootCategory,
      macbookCategory,
      pcGamingCategory,
      speakerCategory,
    ]);
    productRepository.find.mockResolvedValue([macbookProduct, pcProduct, speakerProduct]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('máy tính', 5);

    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 851, name: 'MacBook Air M4 13' }),
        expect.objectContaining({ id: 852, name: 'PC Gaming RTX 4060 Ryzen 7' }),
      ]),
    );
    expect(result.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 853 })]),
    );
  });

  it('returns direct tai nghe category matches without mixing in unrelated speakers', async () => {
    const headphoneCategory = createSearchCategory(70, 'Tai Nghe');
    const speakerCategory = createSearchCategory(71, 'Loa');
    const headphoneProduct = createMockProduct({
      id: 901,
      category_id: 70,
      name: 'Sony WH-1000XM6',
      slug: 'sony-wh-1000xm6',
      sku: 'SONY-WH-1000XM6',
      description: 'Tai nghe chống ồn cho làm việc và giải trí.',
      short_description: 'ANC headphone.',
      category: headphoneCategory,
      brand: {
        id: 94,
        name: 'Sony',
        slug: 'sony',
      } as Brand,
      variants: [],
      images: [],
    });
    const speakerProduct = createMockProduct({
      id: 902,
      category_id: 71,
      name: 'JBL Charge 6',
      slug: 'jbl-charge-6-unmatched',
      sku: 'JBL-CHARGE-6-UNMATCHED',
      description: 'Loa bluetooth di động cho giải trí.',
      short_description: 'Portable speaker.',
      category: speakerCategory,
      brand: {
        id: 95,
        name: 'JBL',
        slug: 'jbl',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([headphoneCategory, speakerCategory]);
    productRepository.find.mockResolvedValue([headphoneProduct, speakerProduct]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('tai nghe', 5);

    expect(result.data).toEqual([
      expect.objectContaining({ id: 901, name: 'Sony WH-1000XM6' }),
    ]);
  });

  it('uses optional storefront Gemini planning when heuristics do not match a conversational query', async () => {
    const creatorCategory = createSearchCategory(74, 'PC Gaming');
    const creatorProduct = createMockProduct({
      id: 921,
      category_id: 74,
      name: 'PC Streaming RTX 4070 Ti',
      slug: 'pc-streaming-rtx-4070-ti',
      sku: 'PC-STREAM-4070TI',
      description: 'PC cho stream, dựng nội dung và gaming.',
      short_description: 'RTX 4070 Ti creator.',
      category: creatorCategory,
      brand: {
        id: 98,
        name: 'NOXPC',
        slug: 'noxpc',
      } as Brand,
      variants: [],
      images: [],
    });

    mockedMaybePlanStorefrontSearch.mockResolvedValue({
      rewrittenQuery: 'pc creator stream gaming',
      categoryIds: [74],
      brandNames: [],
      queryVariants: ['pc stream creator'],
      requiredTerms: [],
      preferredTerms: ['stream', 'creator'],
      avoidTerms: [],
      strictCategory: true,
      strictBrand: false,
      confidence: 0.92,
    });
    categoryRepository.find.mockResolvedValue([creatorCategory]);
    productRepository.find.mockResolvedValue([creatorProduct]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('máy nào phù hợp để stream game', 5);

    expect(mockedMaybePlanStorefrontSearch).toHaveBeenCalled();
    expect(result.data).toEqual([
      expect.objectContaining({ id: 921, name: 'PC Streaming RTX 4070 Ti' }),
    ]);
  });

  it('returns no irrelevant results for unmatched generic printer queries', async () => {
    const laptopCategory = createSearchCategory(72, 'Laptop');
    const speakerCategory = createSearchCategory(73, 'Loa');
    const laptopProduct = createMockProduct({
      id: 911,
      category_id: 72,
      name: 'MacBook Air M4 13',
      slug: 'macbook-air-m4-13-unmatched',
      sku: 'MACBOOK-AIR-M4-13-UNMATCHED',
      description: 'Laptop mỏng nhẹ cho học tập và làm việc.',
      short_description: 'Apple M4.',
      category: laptopCategory,
      brand: {
        id: 96,
        name: 'Apple',
        slug: 'apple',
      } as Brand,
      variants: [],
      images: [],
    });
    const speakerProduct = createMockProduct({
      id: 912,
      category_id: 73,
      name: 'JBL Charge 6',
      slug: 'jbl-charge-6-unmatched-2',
      sku: 'JBL-CHARGE-6-UNMATCHED-2',
      description: 'Loa bluetooth di động cho giải trí.',
      short_description: 'Portable speaker.',
      category: speakerCategory,
      brand: {
        id: 97,
        name: 'JBL',
        slug: 'jbl',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([laptopCategory, speakerCategory]);
    productRepository.find.mockResolvedValue([laptopProduct, speakerProduct]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('máy in', 5);

    expect(result.data).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('falls back to fuzzy ranking when no taxonomy category matches exist', async () => {
    const monitorCategory = createSearchCategory(50, 'Màn Hình');
    const monitorProduct = createMockProduct({
      id: 801,
      category_id: 50,
      name: 'LG UltraGear 27GS95QE',
      slug: 'lg-ultragear-27gs95qe',
      sku: 'ULTRAGEAR-27',
      description: 'Màn hình gaming cho nhu cầu giải trí tốc độ cao.',
      short_description: '240Hz OLED.',
      category: monitorCategory,
      brand: {
        id: 90,
        name: 'LG',
        slug: 'lg',
      } as Brand,
      variants: [],
      images: [],
    });

    categoryRepository.find.mockResolvedValue([monitorCategory]);
    productRepository.find.mockResolvedValue([monitorProduct]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('ultragear', 5);

    expect(result.data).toEqual([
      expect.objectContaining({ id: 801, name: 'LG UltraGear 27GS95QE' }),
    ]);
  });

  it('uses semantic search to match colloquial queries like "đồ nghe nhạc" to speakers and headphones', async () => {
    const speakerCategory = createSearchCategory(80, 'Loa');
    const headphoneCategory = createSearchCategory(81, 'Tai Nghe');
    const watchCategory = createSearchCategory(82, 'Đồng Hồ Thông Minh');

    const speakerProduct = createMockProduct({
      id: 1001,
      category_id: 80,
      name: 'Loa Bluetooth JBL Charge 6',
      description: 'Âm thanh sống động, bass mạnh mẽ.',
      category: speakerCategory,
      embedding: [0.8, 0.2, 0.1, 0.9], // Fake high similarity embedding
    });

    const headphoneProduct = createMockProduct({
      id: 1002,
      category_id: 81,
      name: 'Tai Nghe Không Dây Sony',
      description: 'Chống ồn chủ động, nghe nhạc tuyệt đỉnh.',
      category: headphoneCategory,
      embedding: [0.8, 0.3, 0.1, 0.85], // Fake high similarity embedding
    });

    const watchProduct = createMockProduct({
      id: 1003,
      category_id: 82,
      name: 'Apple Watch Series 11',
      description: 'Đồng hồ thông minh theo dõi sức khỏe.',
      category: watchCategory,
      embedding: [-0.5, 0.1, 0.9, -0.2], // Fake low similarity embedding
    });

    categoryRepository.find.mockResolvedValue([speakerCategory, headphoneCategory, watchCategory]);
    productRepository.find.mockResolvedValue([speakerProduct, headphoneProduct, watchProduct]);
    
    // Mock the external getEmbedding function to return a specific vector for 'đồ nghe nhạc'
    mockedGetEmbedding.mockResolvedValue([0.85, 0.25, 0.1, 0.9]);

    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('đồ nghe nhạc', 5);

    // It should rank the speaker and headphone highly due to semantic similarity, and exclude the watch
    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1001 }),
      expect.objectContaining({ id: 1002 }),
    ]));
    expect(result.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1003 }),
    ]));
  });

  it('falls back to text search when the database has no product embedding column', async () => {
    const headphoneCategory = createSearchCategory(81, 'Tai Nghe');
    const headphoneProduct = createMockProduct({
      id: 1051,
      category_id: 81,
      name: 'Tai Nghe Sony WH-1000XM6',
      description: 'Tai nghe chống ồn dành cho nghe nhạc và làm việc.',
      category: headphoneCategory,
    });
    const missingEmbeddingColumnError = Object.assign(
      new Error("Unknown column 'product.embedding' in 'field list'"),
      {
        code: 'ER_BAD_FIELD_ERROR',
        driverError: {
          code: 'ER_BAD_FIELD_ERROR',
          sqlMessage: "Unknown column 'product.embedding' in 'field list'",
        },
      },
    );
    const firstQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockRejectedValue(missingEmbeddingColumnError),
    };
    const retryQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([headphoneProduct]),
    };

    categoryRepository.find.mockResolvedValue([headphoneCategory]);
    mockedGetEmbedding.mockResolvedValue([0.85, 0.25, 0.1, 0.9]);
    productRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValueOnce(firstQueryBuilder)
      .mockReturnValueOnce(retryQueryBuilder);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('tai nghe sony', 5);

    expect(firstQueryBuilder.addSelect).toHaveBeenCalledWith('product.embedding');
    expect(retryQueryBuilder.addSelect).not.toHaveBeenCalled();
    expect(result.data).toEqual([
      expect.objectContaining({ id: 1051, name: 'Tai Nghe Sony WH-1000XM6' }),
    ]);
  });

  it('keeps lexical audio matches when semantic-only matches exist on unrelated embedded products', async () => {
    const speakerCategory = createSearchCategory(90, 'Loa');
    const headphoneCategory = createSearchCategory(91, 'Tai Nghe');
    const watchCategory = createSearchCategory(92, 'Đồng Hồ Thông Minh');

    const speakerProduct = createMockProduct({
      id: 1101,
      category_id: 90,
      name: 'Loa Bluetooth Marshall Emberton',
      description: 'Loa di động nghe nhạc bluetooth với âm bass rõ và sân khấu rộng.',
      category: speakerCategory,
      embedding: undefined,
    });

    const headphoneProduct = createMockProduct({
      id: 1102,
      category_id: 91,
      name: 'Tai Nghe Sony WH-1000XM6',
      description: 'Tai nghe chống ồn dành cho nghe nhạc và di chuyển hằng ngày.',
      category: headphoneCategory,
      embedding: undefined,
    });

    const watchProduct = createMockProduct({
      id: 1103,
      category_id: 92,
      name: 'Apple Watch Series 11',
      description: 'Đồng hồ thông minh theo dõi sức khỏe.',
      category: watchCategory,
      embedding: [0.88, 0.19, 0.08, 0.91],
    });

    categoryRepository.find.mockResolvedValue([speakerCategory, headphoneCategory, watchCategory]);
    productRepository.find.mockResolvedValue([speakerProduct, headphoneProduct, watchProduct]);
    mockedGetEmbedding.mockResolvedValue([0.87, 0.2, 0.09, 0.9]);
    productVariantRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));
    inventoryRepository.createQueryBuilder.mockReturnValue(createRawManyQueryBuilder([]));

    const result = await service.searchProducts('đồ nghe nhạc', 5);

    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1101 }),
      expect.objectContaining({ id: 1102 }),
    ]));
    expect(result.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1103 }),
    ]));
  });
});
