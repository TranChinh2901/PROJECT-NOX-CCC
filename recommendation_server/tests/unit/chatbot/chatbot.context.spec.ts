import {
  buildChatbotSystemInstruction,
  executeChatbotFunctionCall,
  getChatbotFunctionDeclarations,
} from '../../../src/utils/chatbot/chatbot-context';
import { planCatalogSearch } from '../../../src/utils/chatbot/chatbot-query-planner';
import { AppDataSource } from '../../../src/config/database.config';
import categoryService from '../../../src/modules/products/category.service';
import { Order } from '../../../src/modules/orders/entity/order';
import productService from '../../../src/modules/products/product.service';
import orderService from '../../../src/modules/orders/order.service';
import { Promotion } from '../../../src/modules/promotions/entity/promotion';

jest.mock('../../../src/modules/products/category.service', () => ({
  __esModule: true,
  default: {
    getAllCategories: jest.fn(),
    getRootCategories: jest.fn(),
  },
}));

jest.mock('../../../src/modules/products/product.service', () => ({
  __esModule: true,
  default: {
    searchProducts: jest.fn(),
    searchProductsWithContext: jest.fn(),
    getProductById: jest.fn(),
    getProductBySlug: jest.fn(),
    getFeaturedProducts: jest.fn(),
    getRelatedProducts: jest.fn(),
  },
}));

jest.mock('../../../src/modules/orders/order.service', () => ({
  __esModule: true,
  default: {
    getUserOrders: jest.fn(),
    getOrderById: jest.fn(),
  },
}));

jest.mock('../../../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../src/utils/chatbot/chatbot-query-planner', () => ({
  planCatalogSearch: jest.fn(),
}));

const mockedProductService = jest.mocked(productService);
const mockedOrderService = jest.mocked(orderService);
const mockedCategoryService = jest.mocked(categoryService);
const mockedGetRepository = jest.mocked(AppDataSource.getRepository);
const mockedPlanCatalogSearch = jest.mocked(planCatalogSearch);

describe('chatbot function tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPlanCatalogSearch.mockResolvedValue({
      rewrittenQuery: 'man hinh Dell 27 gaming',
      matchedCategoryIds: [2],
      matchedCategoryNames: ['PC - Màn Hình - Màn Hình'],
      brands: ['Dell'],
      requiredTerms: ['27 inch'],
      preferredTerms: ['gaming'],
      avoidTerms: [],
      strictCategory: true,
      strictBrand: true,
      confidence: 0.9,
    });
  });

  it('declares the expected Gemini function tools', () => {
    expect(getChatbotFunctionDeclarations().map((tool) => tool.name)).toEqual([
      'search_products',
      'get_product_details',
      'get_categories',
      'get_related_products',
      'get_featured_products',
      'get_store_info',
      'get_active_promotions',
      'get_my_recent_orders',
      'get_my_order_by_number',
    ]);
  });

  it('executes product search with scoped product summaries', async () => {
    mockedCategoryService.getAllCategories.mockResolvedValue([
      {
        id: 1,
        name: 'PC - Màn Hình',
        slug: 'pc-man-hinh',
        children: [
          {
            id: 2,
            name: 'PC - Màn Hình - Màn Hình',
            slug: 'pc-man-hinh-man-hinh',
            children: [],
          },
        ],
      },
    ] as never);
    mockedProductService.searchProductsWithContext.mockResolvedValue({
      data: [
        {
          id: 10,
          name: 'Dell UltraSharp 27',
          slug: 'dell-ultrasharp-27',
          sku: 'DELL-27',
          brand: { name: 'Dell' },
          category: { name: 'Monitor' },
          base_price: 7990000,
          compare_at_price: 8990000,
          short_description: 'Man hinh van phong',
          sold_count: 20,
          stock_quantity: 333,
          variants: [
            {
              id: 101,
              sku: 'DELL-27-BLK',
              color: 'Black',
              size: '27 inch',
              material: 'IPS',
              final_price: 7990000,
            },
          ],
        },
      ],
      suggestions: ['Dell 27 inch'],
    } as never);

    const result = await executeChatbotFunctionCall(
      {
        name: 'search_products',
        args: {
          query: 'man hinh Dell 27',
          limit: 3,
        },
      },
      {},
    );

    expect(mockedPlanCatalogSearch).toHaveBeenCalledWith(
      'man hinh Dell 27',
      [
        {
          id: 2,
          name: 'PC - Màn Hình - Màn Hình',
          slug: 'pc-man-hinh-man-hinh',
          leafName: 'Màn Hình',
        },
      ],
    );
    expect(mockedProductService.searchProductsWithContext).toHaveBeenCalledWith('man hinh Dell 27 gaming', 3, {
      categoryIds: [2],
      brandNames: ['Dell'],
      queryVariants: ['man hinh Dell 27', 'man hinh Dell 27 gaming', '27 inch', 'gaming'],
      requiredTerms: ['27 inch'],
      preferredTerms: ['gaming'],
      avoidTerms: [],
      strictCategory: true,
      strictBrand: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        query: 'man hinh Dell 27',
        rewritten_query: 'man hinh Dell 27 gaming',
        suggestions: ['Dell 27 inch'],
        products: [
          expect.objectContaining({
            id: 10,
            name: 'Dell UltraSharp 27',
            product_path: '/product/dell-ultrasharp-27',
            total_available: 333,
            stock_status: 'in_stock',
          }),
        ],
        matched_categories: [
          expect.objectContaining({
            id: 2,
            leaf_name: 'Màn Hình',
          }),
        ],
      }),
    );
  });

  it('returns active promotions from the repository', async () => {
    mockedGetRepository.mockImplementation((entity) => {
      if (entity === Promotion) {
        return {
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([
              {
                code: 'SAVE10',
                name: 'Giam 10%',
                description: 'Ap dung cho don du dieu kien',
                type: 'percentage',
                value: 10,
                applies_to: 'all',
                min_order_amount: 500000,
                max_discount_amount: 200000,
                ends_at: null,
              },
            ]),
          }),
        } as never;
      }

      throw new Error(`Unexpected repository request: ${String(entity)}`);
    });

    const result = await executeChatbotFunctionCall(
      {
        name: 'get_active_promotions',
        args: {
          limit: 2,
        },
      },
      {},
    );

    expect(result).toEqual({
      promotions: [
        expect.objectContaining({
          code: 'SAVE10',
          name: 'Giam 10%',
        }),
      ],
    });
  });

  it('returns category data for browsing guidance', async () => {
    mockedCategoryService.getRootCategories.mockResolvedValue([
      {
        id: 1,
        name: 'Laptop',
        slug: 'laptop',
      },
      {
        id: 2,
        name: 'Monitor',
        slug: 'monitor',
      },
    ] as never);

    const result = await executeChatbotFunctionCall(
      {
        name: 'get_categories',
        args: {
          rootOnly: true,
        },
      },
      {},
    );

    expect(mockedCategoryService.getRootCategories).toHaveBeenCalled();
    expect(result).toEqual({
      categories: [
        expect.objectContaining({ slug: 'laptop' }),
        expect.objectContaining({ slug: 'monitor' }),
      ],
    });
  });

  it('returns related products for a selected product', async () => {
    mockedProductService.getRelatedProducts.mockResolvedValue([
      {
        id: 11,
        name: 'Dell UltraSharp 24',
        slug: 'dell-ultrasharp-24',
        sku: 'DELL-24',
        brand: { name: 'Dell' },
        category: { name: 'Monitor' },
        base_price: 5990000,
        compare_at_price: null,
        short_description: 'Man hinh lien quan',
        sold_count: 12,
        variants: [],
      },
    ] as never);

    const result = await executeChatbotFunctionCall(
      {
        name: 'get_related_products',
        args: {
          productId: 10,
          limit: 2,
        },
      },
      {},
    );

    expect(mockedProductService.getRelatedProducts).toHaveBeenCalledWith(10, 2);
    expect(result).toEqual({
      products: [
        expect.objectContaining({
          id: 11,
          name: 'Dell UltraSharp 24',
          product_path: '/product/dell-ultrasharp-24',
        }),
      ],
    });
  });

  it('returns store checkout info', async () => {
    const result = await executeChatbotFunctionCall(
      {
        name: 'get_store_info',
        args: {},
      },
      {},
    );

    expect(result).toEqual({
      supported_payment_methods: ['cod', 'credit_card', 'bank_transfer', 'e_wallet'],
      default_shipping_fee_vnd: 30000,
      currency: 'VND',
    });
  });

  it('requires authentication before exposing user orders', async () => {
    const result = await executeChatbotFunctionCall(
      {
        name: 'get_my_recent_orders',
        args: {},
      },
      {},
    );

    expect(result).toEqual({
      requires_auth: true,
      error: 'user must be authenticated',
    });
    expect(mockedOrderService.getUserOrders).not.toHaveBeenCalled();
  });

  it('loads a specific authenticated order by number', async () => {
    mockedGetRepository.mockImplementation((entity) => {
      if (entity === Order) {
        return {
          findOne: jest.fn().mockResolvedValue({
            id: 55,
            order_number: 'ORD-2026-123456',
            user_id: 7,
          }),
        } as never;
      }

      throw new Error(`Unexpected repository request: ${String(entity)}`);
    });
    mockedOrderService.getOrderById.mockResolvedValue({
      id: 55,
      order_number: 'ORD-2026-123456',
      status: 'processing',
      payment_status: 'paid',
      total_amount: 12990000,
      currency: 'VND',
      tracking_number: 'TRACK-1',
      items: [
        {
          quantity: 1,
          unit_price: 12990000,
          product: { name: 'Laptop Pro 14' },
        },
      ],
    } as never);

    const result = await executeChatbotFunctionCall(
      {
        name: 'get_my_order_by_number',
        args: {
          orderNumber: 'ord-2026-123456',
        },
      },
      { userId: 7 },
    );

    expect(result).toEqual({
      order_found: true,
      order: expect.objectContaining({
        order_number: 'ORD-2026-123456',
        status: 'processing',
      }),
    });
  });

  it('adds function-calling guidance to the system instruction', () => {
    const instructions = buildChatbotSystemInstruction('Base instructions');

    expect(instructions).toContain('Base instructions');
    expect(instructions).toContain('ưu tiên dùng function');
    expect(instructions).toContain('product_path');
    expect(instructions).toContain('Không tự chế URL sản phẩm');
    expect(instructions).toContain('Không bịa ra giá');
    expect(instructions).toContain('Chỉ được nói một sản phẩm "hết hàng"');
    expect(instructions).toContain('chưa xác minh được tồn kho');
  });
});
