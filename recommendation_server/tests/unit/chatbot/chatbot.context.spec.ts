import {
  buildChatbotSystemInstruction,
  executeChatbotFunctionCall,
  getChatbotFunctionDeclarations,
} from '../../../src/utils/chatbot/chatbot-context';
import { AppDataSource } from '../../../src/config/database.config';
import { Order } from '../../../src/modules/orders/entity/order';
import productService from '../../../src/modules/products/product.service';
import orderService from '../../../src/modules/orders/order.service';
import { Promotion } from '../../../src/modules/promotions/entity/promotion';

jest.mock('../../../src/modules/products/product.service', () => ({
  __esModule: true,
  default: {
    searchProducts: jest.fn(),
    getProductById: jest.fn(),
    getProductBySlug: jest.fn(),
    getFeaturedProducts: jest.fn(),
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

const mockedProductService = jest.mocked(productService);
const mockedOrderService = jest.mocked(orderService);
const mockedGetRepository = jest.mocked(AppDataSource.getRepository);

describe('chatbot function tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('declares the expected Gemini function tools', () => {
    expect(getChatbotFunctionDeclarations().map((tool) => tool.name)).toEqual([
      'search_products',
      'get_product_details',
      'get_featured_products',
      'get_active_promotions',
      'get_my_recent_orders',
      'get_my_order_by_number',
    ]);
  });

  it('executes product search with scoped product summaries', async () => {
    mockedProductService.searchProducts.mockResolvedValue({
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

    expect(mockedProductService.searchProducts).toHaveBeenCalledWith('man hinh Dell 27', 3);
    expect(result).toEqual(
      expect.objectContaining({
        query: 'man hinh Dell 27',
        suggestions: ['Dell 27 inch'],
        products: [
          expect.objectContaining({
            id: 10,
            name: 'Dell UltraSharp 27',
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
    expect(instructions).toContain('Không bịa ra giá');
  });
});
