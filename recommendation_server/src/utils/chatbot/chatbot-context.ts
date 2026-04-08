import { AppDataSource } from '@/config/database.config';
import categoryService from '@/modules/products/category.service';
import { Order } from '@/modules/orders/entity/order';
import { PaymentMethod } from '@/modules/orders/enum/order.enum';
import orderService from '@/modules/orders/order.service';
import productService from '@/modules/products/product.service';
import { Promotion } from '@/modules/promotions/entity/promotion';
import {
  planCatalogSearch,
  type CatalogCategoryOption,
} from '@/utils/chatbot/chatbot-query-planner';

type ChatbotFunctionDeclaration = {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type ChatbotToolExecutionContext = {
  userId?: number;
};

export type ChatbotFunctionCall = {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
};

const MAX_TOOL_LIMIT = 5;

type CategoryTreeNode = {
  id: number;
  name: string;
  slug: string;
  children?: CategoryTreeNode[];
};

const clampLimit = (value: unknown, fallback: number): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(numericValue), MAX_TOOL_LIMIT);
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const buildProductPath = (product: { id?: unknown; slug?: unknown }): string | null => {
  const slug = typeof product.slug === 'string' ? product.slug.trim() : '';
  if (slug) {
    return `/product/${slug}`;
  }

  const productId = toNumberOrUndefined(product.id);
  if (productId !== undefined) {
    return `/product/${productId}`;
  }

  return null;
};

const summarizeProduct = (product: any) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const explicitStockQuantity = toNumberOrUndefined(product?.stock_quantity);

  const variantAvailabilityById = new Map<number, number | undefined>();
  for (const variant of variants) {
    const quantityAvailable = Array.isArray(variant?.inventory)
      ? variant.inventory.reduce(
          (sum: number, inventory: any) => sum + (toNumberOrUndefined(inventory?.quantity_available) ?? 0),
          0,
        )
      : undefined;

    if (typeof variant?.id === 'number') {
      variantAvailabilityById.set(variant.id, quantityAvailable);
    }
  }

  const variantSummaries = variants.slice(0, 3).map((variant: any) => {
    const quantityAvailable = typeof variant?.id === 'number'
      ? variantAvailabilityById.get(variant.id)
      : undefined;

    return {
      id: variant.id,
      sku: variant.sku,
      color: variant.color ?? null,
      size: variant.size ?? null,
      material: variant.material ?? null,
      final_price: variant.final_price,
      quantity_available: quantityAvailable,
    };
  });

  const inventoryDerivedTotal = variants.some((variant: any) => Array.isArray(variant?.inventory))
    ? variants.reduce((sum: number, variant: any) => {
        const quantityAvailable = typeof variant?.id === 'number'
          ? variantAvailabilityById.get(variant.id)
          : undefined;

        return sum + (quantityAvailable ?? 0);
      }, 0)
    : undefined;
  const totalAvailable = explicitStockQuantity ?? inventoryDerivedTotal;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    product_path: buildProductPath(product),
    sku: product.sku,
    brand: product.brand?.name ?? null,
    category: product.category?.name ?? null,
    base_price: product.base_price,
    compare_at_price: product.compare_at_price ?? null,
    short_description: product.short_description ?? null,
    sold_count: toNumberOrUndefined(product.sold_count) ?? 0,
    total_available: totalAvailable,
    stock_status:
      totalAvailable === undefined ? 'unknown' : totalAvailable > 0 ? 'in_stock' : 'out_of_stock',
    variants: variantSummaries,
  };
};

const summarizePromotion = (promotion: Promotion) => ({
  code: promotion.code,
  name: promotion.name,
  description: promotion.description ?? null,
  type: promotion.type,
  value: promotion.value,
  min_order_amount: promotion.min_order_amount ?? null,
  max_discount_amount: promotion.max_discount_amount ?? null,
  applies_to: promotion.applies_to,
  ends_at: promotion.ends_at ?? null,
});

const summarizeOrder = (order: any) => ({
  id: order.id,
  order_number: order.order_number,
  status: order.status,
  payment_status: order.payment_status,
  total_amount: order.total_amount,
  currency: order.currency,
  tracking_number: order.tracking_number ?? null,
  created_at: order.created_at ?? null,
  items: Array.isArray(order.items)
    ? order.items.slice(0, 3).map((item: any) => ({
        product_name: item.product?.name ?? item.product_snapshot?.product_name ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    : [],
});

const loadActivePromotions = async (limit: number) => {
  const now = new Date();
  const promotionRepository = AppDataSource.getRepository(Promotion);

  const promotions = await promotionRepository
    .createQueryBuilder('promotion')
    .where('promotion.is_active = :isActive', { isActive: true })
    .andWhere('promotion.deleted_at IS NULL')
    .andWhere('(promotion.starts_at IS NULL OR promotion.starts_at <= :now)', { now })
    .andWhere('(promotion.ends_at IS NULL OR promotion.ends_at >= :now)', { now })
    .orderBy('CASE WHEN promotion.ends_at IS NULL THEN 1 ELSE 0 END', 'ASC')
    .addOrderBy('promotion.ends_at', 'ASC')
    .addOrderBy('promotion.created_at', 'DESC')
    .limit(limit)
    .getMany();

  return promotions.map(summarizePromotion);
};

const flattenLeafCategories = (categories: CategoryTreeNode[]): CatalogCategoryOption[] =>
  categories.flatMap((category) => {
    if (!Array.isArray(category.children) || category.children.length === 0) {
      return [
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          leafName: category.name.split(' - ').pop()?.trim() || category.name,
        },
      ];
    }

    return flattenLeafCategories(category.children);
  });

export const getChatbotFunctionDeclarations = (): ChatbotFunctionDeclaration[] => [
  {
    name: 'search_products',
    description:
      'Search the TechNova catalog for products that match the customer request. Use for product advice, shopping recommendations, and comparing options.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The customer search query, such as "27 inch Dell monitor for office".',
        },
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of product matches to return. Use a small number like 3.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_details',
    description:
      'Get detailed information for a specific product, including variants and stock summary when available.',
    parameters: {
      type: 'OBJECT',
      properties: {
        productId: {
          type: 'NUMBER',
          description: 'The numeric product id when known.',
        },
        slug: {
          type: 'STRING',
          description: 'The product slug when the id is not known.',
        },
      },
    },
  },
  {
    name: 'get_categories',
    description:
      'Get product categories so you can guide the customer to the right shopping section or category path.',
    parameters: {
      type: 'OBJECT',
      properties: {
        rootOnly: {
          type: 'BOOLEAN',
          description: 'When true, only return top-level categories.',
        },
      },
    },
  },
  {
    name: 'get_related_products',
    description:
      'Get related or similar products for a known product. Use after identifying a product the customer is interested in.',
    parameters: {
      type: 'OBJECT',
      properties: {
        productId: {
          type: 'NUMBER',
          description: 'The numeric product id.',
        },
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of related products to return.',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'get_featured_products',
    description: 'Get a small list of featured or highlighted TechNova products.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of featured products to return.',
        },
      },
    },
  },
  {
    name: 'get_store_info',
    description:
      'Get store checkout information such as supported payment methods and the current base shipping fee used by the server.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_active_promotions',
    description: 'Get currently active promotions, sales, vouchers, or discount campaigns.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of promotions to return.',
        },
      },
    },
  },
  {
    name: 'get_my_recent_orders',
    description:
      'Get the signed-in customer recent orders. Use only when the user asks about their own orders or delivery status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'NUMBER',
          description: 'Maximum number of recent orders to return.',
        },
      },
    },
  },
  {
    name: 'get_my_order_by_number',
    description:
      'Get one specific signed-in customer order by order number, for example ORD-2026-123456.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderNumber: {
          type: 'STRING',
          description: 'The order number to look up.',
        },
      },
      required: ['orderNumber'],
    },
  },
];

export const executeChatbotFunctionCall = async (
  functionCall: ChatbotFunctionCall,
  context: ChatbotToolExecutionContext,
) => {
  const args = functionCall.args ?? {};

  switch (functionCall.name) {
    case 'search_products': {
      const query = typeof args.query === 'string' ? args.query.trim() : '';
      if (!query) {
        return {
          error: 'query is required',
        };
      }

      const limit = clampLimit(args.limit, 3);
      const leafCategories = flattenLeafCategories((await categoryService.getAllCategories()) as CategoryTreeNode[]);
      const searchPlan = await planCatalogSearch(query, leafCategories);
      const searchResults = await productService.searchProductsWithContext(
        searchPlan.rewrittenQuery || query,
        limit,
        {
          categoryIds: searchPlan.matchedCategoryIds,
          brandNames: searchPlan.brands,
          queryVariants: [query, searchPlan.rewrittenQuery, ...searchPlan.requiredTerms, ...searchPlan.preferredTerms],
          requiredTerms: searchPlan.requiredTerms,
          preferredTerms: searchPlan.preferredTerms,
          avoidTerms: searchPlan.avoidTerms,
          strictCategory: searchPlan.strictCategory && searchPlan.confidence >= 0.45,
          strictBrand: searchPlan.strictBrand,
        },
      );

      return {
        query,
        rewritten_query: searchPlan.rewrittenQuery,
        matched_categories: leafCategories
          .filter((category) => searchPlan.matchedCategoryIds.includes(category.id))
          .map(({ id, name, slug, leafName }) => ({ id, name, slug, leaf_name: leafName })),
        required_terms: searchPlan.requiredTerms,
        preferred_terms: searchPlan.preferredTerms,
        avoid_terms: searchPlan.avoidTerms,
        brands: searchPlan.brands,
        suggestions: searchResults.suggestions ?? [],
        products: Array.isArray(searchResults.data) ? searchResults.data.slice(0, limit).map(summarizeProduct) : [],
      };
    }

    case 'get_product_details': {
      const productId = toNumberOrUndefined(args.productId);
      const slug = typeof args.slug === 'string' ? args.slug.trim() : '';

      if (!productId && !slug) {
        return {
          error: 'productId or slug is required',
        };
      }

      const product = productId
        ? await productService.getProductById(productId)
        : await productService.getProductBySlug(slug);

      return {
        product: summarizeProduct(product),
      };
    }

    case 'get_featured_products': {
      const limit = clampLimit(args.limit, 3);
      const featuredProducts = await productService.getFeaturedProducts(limit);

      return {
        products: featuredProducts.map(summarizeProduct),
      };
    }

    case 'get_categories': {
      const rootOnly = Boolean(args.rootOnly);
      const categories = rootOnly
        ? await categoryService.getRootCategories()
        : await categoryService.getAllCategories();

      return {
        categories,
      };
    }

    case 'get_related_products': {
      const productId = toNumberOrUndefined(args.productId);
      if (!productId) {
        return {
          error: 'productId is required',
        };
      }

      const limit = clampLimit(args.limit, 4);
      const relatedProducts = await productService.getRelatedProducts(productId, limit);

      return {
        products: relatedProducts.map(summarizeProduct),
      };
    }

    case 'get_store_info': {
      return {
        supported_payment_methods: Object.values(PaymentMethod),
        default_shipping_fee_vnd: 30000,
        currency: 'VND',
      };
    }

    case 'get_active_promotions': {
      const limit = clampLimit(args.limit, 3);

      return {
        promotions: await loadActivePromotions(limit),
      };
    }

    case 'get_my_recent_orders': {
      if (!context.userId) {
        return {
          requires_auth: true,
          error: 'user must be authenticated',
        };
      }

      const limit = clampLimit(args.limit, 3);
      const recentOrders = await orderService.getUserOrders(context.userId, { page: 1, limit });

      return {
        orders: Array.isArray(recentOrders.data) ? recentOrders.data.slice(0, limit).map(summarizeOrder) : [],
      };
    }

    case 'get_my_order_by_number': {
      if (!context.userId) {
        return {
          requires_auth: true,
          error: 'user must be authenticated',
        };
      }

      const orderNumber = typeof args.orderNumber === 'string' ? args.orderNumber.trim().toUpperCase() : '';
      if (!orderNumber) {
        return {
          error: 'orderNumber is required',
        };
      }

      const orderRepository = AppDataSource.getRepository(Order);
      const order = await orderRepository.findOne({
        where: {
          order_number: orderNumber,
          user_id: context.userId,
        },
      });

      if (!order) {
        return {
          order_found: false,
          order_number: orderNumber,
        };
      }

      const orderDetails = await orderService.getOrderById(order.id, context.userId);

      return {
        order_found: true,
        order: summarizeOrder(orderDetails),
      };
    }

    default:
      return {
        error: `Unsupported function: ${functionCall.name}`,
      };
  }
};

export const buildChatbotSystemInstruction = (baseInstructions: string): string =>
  [
    baseInstructions,
    'Khi câu hỏi liên quan đến sản phẩm, tồn kho, khuyến mãi hoặc đơn hàng của khách, hãy ưu tiên dùng function phù hợp để lấy dữ liệu thật từ hệ thống trước khi trả lời.',
    'Khi function trả về product_path cho sản phẩm phù hợp, hãy đưa kèm link/path đó trong câu trả lời để khách mở trang sản phẩm nhanh hơn.',
    'Không tự chế URL sản phẩm. Nếu đã có product_path từ dữ liệu hệ thống thì dùng đúng giá trị đó.',
    'Không bịa ra giá, tồn kho, khuyến mãi, mã đơn, trạng thái giao hàng hoặc chính sách riêng của khách.',
    'Chỉ được nói một sản phẩm "hết hàng" khi function trả về stock_status = out_of_stock hoặc total_available = 0.',
    'Nếu stock_status = unknown hoặc không có total_available, phải nói chưa xác minh được tồn kho thay vì tự kết luận còn hàng hay hết hàng.',
    'Nếu function trả về requires_auth hoặc không có dữ liệu, hãy nói rõ điều đó và hướng dẫn ngắn gọn bước tiếp theo.',
  ].join('\n\n');
