import { Not, Repository } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { ProductImage } from "@/modules/products/entity/product-image";
import { Category } from "@/modules/products/entity/category";
import { Brand } from "@/modules/products/entity/brand";
import { Review } from "@/modules/reviews/entity/review";
import { Inventory } from "@/modules/inventory/entity/inventory";
import { Order } from "@/modules/orders/entity/order";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { OrderStatus } from "@/modules/orders/enum/order.enum";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import Fuse from "fuse.js";
import { maybePlanStorefrontSearch } from "@/modules/products/product-search-planner";
import { getEmbedding } from "@/utils/chatbot/chatbot-embeddings";

export interface ProductFilterOptions {
  category_id?: number;
  brand_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductSearchContext {
  categoryIds?: number[];
  brandNames?: string[];
  queryVariants?: string[];
  queryTokens?: string[];
  distinctiveQueryTokens?: string[];
  enforceQueryTokenMatch?: boolean;
  requiredTerms?: string[];
  preferredTerms?: string[];
  avoidTerms?: string[];
  strictCategory?: boolean;
  strictBrand?: boolean;
  queryEmbedding?: number[];
}

type SearchableProductEntry = {
  product: Product;
  leafCategoryName: string;
  normalizedLeafCategoryName: string;
  normalizedBrandName: string;
  searchText: string;
};

const isMissingProductEmbeddingColumnError = (error: unknown) => {
  const candidate = error as {
    code?: string;
    message?: string;
    sqlMessage?: string;
    driverError?: {
      code?: string;
      message?: string;
      sqlMessage?: string;
    };
  };
  const message = [
    candidate.message,
    candidate.sqlMessage,
    candidate.driverError?.message,
    candidate.driverError?.sqlMessage,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    candidate.code === 'ER_BAD_FIELD_ERROR' ||
    candidate.driverError?.code === 'ER_BAD_FIELD_ERROR' ||
    message.includes('product.embedding') ||
    (message.includes('Unknown column') && message.includes('embedding'))
  );
};

type SearchCategoryNode = {
  id: number;
  parentId: number | null;
  normalizedName: string;
  normalizedLeafName: string;
  normalizedAliases: string[];
  normalizedLineageNames: string[];
  normalizedLineagePath: string;
};

type TaxonomyMatchResult = {
  categoryIds: number[];
  matchedByAliasOnly: boolean;
};

const SEARCH_NOISE_PREFIXES = [
  'toi dang tim',
  'toi can tim',
  'toi muon tim',
  'toi muon mua',
  'toi dang can',
  'toi can',
  'minh dang tim',
  'minh can tim',
  'minh can',
  'em dang tim',
  'em can tim',
  'em can',
  'cho minh xem',
  'cho toi xem',
  'cho minh',
  'cho toi',
  'tim cho toi',
  'can mua',
];

const SEARCH_QUERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bchoi game\b/g, 'gaming'],
  [/\bdanh choi game\b/g, 'gaming'],
  [/\bcho game\b/g, 'gaming'],
];

const STATIC_CATEGORY_ALIASES: Record<string, string[]> = {
  'dien thoai': ['smartphone', 'phone', 'mobile', 'cellphone'],
  laptop: ['may tinh', 'may tinh xach tay', 'notebook', 'computer'],
  macbook: ['may tinh', 'laptop apple'],
  'pc gaming': ['may tinh', 'gaming pc', 'desktop', 'pc', 'may bo', 'computer'],
  'pc van phong': ['may tinh', 'desktop van phong', 'pc van phong', 'may bo van phong'],
  'mini pc': ['may tinh', 'mini computer', 'mini desktop'],
  'may tinh bang': ['tablet'],
  'tai nghe': ['headphone', 'headset', 'earbuds', 'airpods', 'nghe nhac', 'am nhac', 'thiet bi nghe nhac'],
  loa: ['speaker', 'loa bluetooth', 'nghe nhac', 'am nhac', 'thiet bi nghe nhac'],
  'dong ho thong minh': ['smartwatch', 'watch'],
  'sac pin du phong': ['charger', 'cu sac', 'power bank', 'pin du phong'],
  'man hinh': ['monitor', 'display', 'screen'],
};

const NON_DISTINCTIVE_QUERY_TOKENS = new Set([
  'may',
  'san',
  'pham',
  'thiet',
  'bi',
  'cong',
  'nghe',
  'cho',
  'toi',
  'tim',
  'mua',
]);

const normalizeSearchText = (value: unknown): string =>
  String(value ?? '')
    .replace(/đ/gi, (char) => (char === 'Đ' ? 'D' : 'd'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getLeafCategoryName = (value: string | null | undefined): string => {
  const categoryName = value?.trim();
  if (!categoryName) {
    return '';
  }

  const parts = categoryName.split(' - ').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? categoryName;
};

const stripSearchNoisePrefix = (query: string): string => {
  let nextQuery = query.trim();

  while (nextQuery) {
    const matchedPrefix = SEARCH_NOISE_PREFIXES.find((prefix) => nextQuery.startsWith(`${prefix} `));
    if (!matchedPrefix) {
      break;
    }

    nextQuery = nextQuery.slice(matchedPrefix.length).trim();
  }

  return nextQuery;
};

const applySearchQueryReplacements = (query: string): string =>
  SEARCH_QUERY_REPLACEMENTS.reduce(
    (currentQuery, [pattern, replacement]) => currentQuery.replace(pattern, replacement).trim(),
    query,
  );

const buildSearchQueryVariants = (query: string, matchedLeafCategories: string[]): string[] => {
  const normalizedQuery = normalizeSearchText(query);
  const strippedQuery = stripSearchNoisePrefix(normalizedQuery);
  const replacedQuery = applySearchQueryReplacements(strippedQuery || normalizedQuery);

  return Array.from(
    new Set(
      [
        normalizedQuery,
        strippedQuery,
        replacedQuery,
        ...matchedLeafCategories,
      ].filter((value): value is string => Boolean(value && value.length >= 2)),
    ),
  );
};

const normalizeSearchValues = (values: string[] | undefined): string[] =>
  Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeSearchText(value))
        .filter((value) => value.length >= 2),
    ),
  );

const buildSearchQueryTokens = (query: string): string[] =>
  Array.from(
    new Set(
      normalizeSearchText(query)
        .split(' ')
        .map((value) => value.trim())
        .filter((value) => value.length >= 2),
    ),
  );

const buildDistinctiveSearchTokens = (query: string): string[] =>
  buildSearchQueryTokens(query).filter((value) => !NON_DISTINCTIVE_QUERY_TOKENS.has(value));

const searchableTextContainsTerm = (searchableText: string, term: string): boolean => {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) {
    return false;
  }

  return ` ${searchableText} `.includes(` ${normalizedTerm} `);
};

const buildCategorySearchNodeMap = (categories: Category[]): Map<number, SearchCategoryNode> => {
  const normalizedBaseNodes = new Map(
    categories.map((category) => [
      category.id,
      {
        id: category.id,
        parentId: category.parent_id ?? null,
        normalizedName: normalizeSearchText(category.name),
        normalizedLeafName: normalizeSearchText(getLeafCategoryName(category.name)),
        normalizedAliases: Array.from(
          new Set(
            [
              ...(STATIC_CATEGORY_ALIASES[normalizeSearchText(category.name)] ?? []),
              ...(STATIC_CATEGORY_ALIASES[normalizeSearchText(getLeafCategoryName(category.name))] ?? []),
            ]
              .map((alias) => normalizeSearchText(alias))
              .filter((alias) => alias.length >= 2),
          ),
        ),
      },
    ]),
  );
  const lineageCache = new Map<number, string[]>();

  const collectLineageNames = (categoryId: number, visited: Set<number> = new Set()): string[] => {
    const cachedLineage = lineageCache.get(categoryId);
    if (cachedLineage) {
      return cachedLineage;
    }

    const categoryNode = normalizedBaseNodes.get(categoryId);
    if (!categoryNode || visited.has(categoryId)) {
      return [];
    }

    const nextVisited = new Set(visited).add(categoryId);
    const parentLineage = categoryNode.parentId !== null
      ? collectLineageNames(categoryNode.parentId, nextVisited)
      : [];
    const lineage = Array.from(
      new Set(
        [...parentLineage, categoryNode.normalizedName, categoryNode.normalizedLeafName].filter(
          (value) => value.length >= 2,
        ),
      ),
    );

    lineageCache.set(categoryId, lineage);

    return lineage;
  };

  return new Map(
    categories.map((category) => {
      const normalizedBaseNode = normalizedBaseNodes.get(category.id)!;
      const normalizedLineageNames = collectLineageNames(category.id);

      return [
        category.id,
        {
          ...normalizedBaseNode,
          normalizedLineageNames,
          normalizedLineagePath: normalizedLineageNames.join(' ').trim(),
        },
      ];
    }),
  );
};

const collectDescendantCategoryIds = (
  categoryNodeMap: Map<number, SearchCategoryNode>,
  matchedCategoryIds: number[],
): number[] => {
  const childIdsByParentId = new Map<number, number[]>();

  for (const categoryNode of categoryNodeMap.values()) {
    if (categoryNode.parentId === null) {
      continue;
    }

    const childIds = childIdsByParentId.get(categoryNode.parentId) ?? [];
    childIds.push(categoryNode.id);
    childIdsByParentId.set(categoryNode.parentId, childIds);
  }

  const descendantIds = new Set<number>(matchedCategoryIds);
  const queue = [...matchedCategoryIds];

  while (queue.length > 0) {
    const currentCategoryId = queue.shift();
    if (currentCategoryId === undefined) {
      continue;
    }

    for (const childCategoryId of childIdsByParentId.get(currentCategoryId) ?? []) {
      if (descendantIds.has(childCategoryId)) {
        continue;
      }

      descendantIds.add(childCategoryId);
      queue.push(childCategoryId);
    }
  }

  return Array.from(descendantIds);
};

const collectTaxonomyMatchedCategoryIds = (
  categoryNodeMap: Map<number, SearchCategoryNode>,
  normalizedQuery: string,
): TaxonomyMatchResult => {
  const directlyMatchedCategoryIds = Array.from(categoryNodeMap.values())
    .filter((categoryNode) =>
      [categoryNode.normalizedName, categoryNode.normalizedLeafName].some(
        (value) => value.length >= 2 && normalizedQuery.includes(value),
      ),
    )
    .map((categoryNode) => categoryNode.id);
  const aliasMatchedCategoryIds = directlyMatchedCategoryIds.length > 0
    ? []
    : Array.from(categoryNodeMap.values())
        .filter((categoryNode) =>
          categoryNode.normalizedAliases.some(
            (alias) => alias.length >= 2 && normalizedQuery.includes(alias),
          ),
        )
        .map((categoryNode) => categoryNode.id);
  const matchedCategoryIds = directlyMatchedCategoryIds.length > 0
    ? directlyMatchedCategoryIds
    : aliasMatchedCategoryIds;

  if (matchedCategoryIds.length === 0) {
    return {
      categoryIds: [],
      matchedByAliasOnly: false,
    };
  }

  const directlyMatchedCategoryIdSet = new Set(matchedCategoryIds);
  const childIdsByParentId = new Map<number, number[]>();

  for (const categoryNode of categoryNodeMap.values()) {
    if (categoryNode.parentId === null) {
      continue;
    }

    const childIds = childIdsByParentId.get(categoryNode.parentId) ?? [];
    childIds.push(categoryNode.id);
    childIdsByParentId.set(categoryNode.parentId, childIds);
  }

  const hasDirectlyMatchedDescendant = (categoryId: number): boolean => {
    const queue = [...(childIdsByParentId.get(categoryId) ?? [])];

    while (queue.length > 0) {
      const childCategoryId = queue.shift();
      if (childCategoryId === undefined) {
        continue;
      }

      if (directlyMatchedCategoryIdSet.has(childCategoryId)) {
        return true;
      }

      queue.push(...(childIdsByParentId.get(childCategoryId) ?? []));
    }

    return false;
  };

  const preferredMatchedCategoryIds = matchedCategoryIds.filter(
    (categoryId) => !hasDirectlyMatchedDescendant(categoryId),
  );

  return {
    categoryIds: collectDescendantCategoryIds(categoryNodeMap, preferredMatchedCategoryIds),
    matchedByAliasOnly: directlyMatchedCategoryIds.length === 0 && aliasMatchedCategoryIds.length > 0,
  };
};

const buildSearchableProductEntry = (
  product: Product,
  categoryNode?: SearchCategoryNode,
): SearchableProductEntry => {
  const leafCategoryName = getLeafCategoryName(product.category?.name);
  const searchTextParts = [
    product.name,
    product.description,
    product.short_description,
    product.sku,
    product.brand?.name,
    product.category?.name,
    leafCategoryName,
    categoryNode?.normalizedLineagePath,
    ...(categoryNode?.normalizedLineageNames ?? []),
    ...(product.variants ?? []).flatMap((variant) => [variant.color, variant.size, variant.material]),
  ]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);

  return {
    product,
    leafCategoryName,
    normalizedLeafCategoryName: normalizeSearchText(leafCategoryName),
    normalizedBrandName: normalizeSearchText(product.brand?.name),
    searchText: Array.from(new Set(searchTextParts)).join(' '),
  };
};

const collectMatchingLeafCategories = (
  entries: SearchableProductEntry[],
  normalizedQuery: string,
): string[] =>
  Array.from(
    new Set(
      entries
        .map((entry) => entry.normalizedLeafCategoryName)
        .filter((leafCategoryName) => leafCategoryName.length >= 2 && normalizedQuery.includes(leafCategoryName)),
    ),
  );

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const runSearch = (
  entries: SearchableProductEntry[],
  queryVariants: string[],
  limit: number,
  context?: ProductSearchContext,
): SearchableProductEntry[] => {
  if (entries.length === 0 || queryVariants.length === 0) {
    return [];
  }

  const fuse = new Fuse(entries, {
    keys: [
      { name: 'searchText', weight: 3 },
      { name: 'normalizedLeafCategoryName', weight: 1.75 },
    ],
    threshold: 0.55,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const bestMatchesByProductId = new Map<number, { entry: SearchableProductEntry; score: number }>();
  const requiredTerms = normalizeSearchValues(context?.requiredTerms);
  const preferredTerms = normalizeSearchValues(context?.preferredTerms);
  const avoidTerms = normalizeSearchValues(context?.avoidTerms);
  const preferredBrands = normalizeSearchValues(context?.brandNames);
  const queryTokens = normalizeSearchValues(context?.queryTokens);
  const distinctiveQueryTokens = normalizeSearchValues(context?.distinctiveQueryTokens);

  for (const queryVariant of queryVariants) {
    const searchResults = fuse.search(queryVariant);

    for (const result of searchResults) {
      const productId = result.item.product.id;
      let nextScore = result.score ?? Number.POSITIVE_INFINITY;
      const searchableText = result.item.searchText;
      const matchedQueryTokens = queryTokens.filter((term) => searchableTextContainsTerm(searchableText, term)).length;

      const missingRequiredTerms = requiredTerms.filter((term) => !searchableTextContainsTerm(searchableText, term)).length;
      const matchedPreferredTerms = preferredTerms.filter((term) => searchableTextContainsTerm(searchableText, term)).length;
      const matchedAvoidTerms = avoidTerms.filter((term) => searchableTextContainsTerm(searchableText, term)).length;
      const brandMatched = preferredBrands.includes(result.item.normalizedBrandName);

      const matchedDistinctiveQueryTokens = distinctiveQueryTokens.filter((term) => searchableTextContainsTerm(searchableText, term)).length;

      if (
        context?.enforceQueryTokenMatch !== false &&
        distinctiveQueryTokens.length > 0 &&
        matchedDistinctiveQueryTokens === 0
      ) {
        continue;
      }

      if (
        context?.strictCategory &&
        context.enforceQueryTokenMatch !== false &&
        queryTokens.length > 0 &&
        matchedQueryTokens === 0
      ) {
        continue;
      }

      nextScore += missingRequiredTerms * 0.35;
      nextScore -= matchedPreferredTerms * 0.08;
      nextScore += matchedAvoidTerms * 0.2;
      nextScore += Math.max(0, queryTokens.length - matchedQueryTokens) * 0.04;

      if (brandMatched) {
        nextScore -= 0.12;
      }

      const currentBest = bestMatchesByProductId.get(productId);

      if (!currentBest || nextScore < currentBest.score) {
        bestMatchesByProductId.set(productId, {
          entry: result.item,
          score: nextScore,
        });
      }
    }
  }

  const hasTextualMatches = bestMatchesByProductId.size > 0;

  // 2. Semantic search
  if (context?.queryEmbedding) {
    for (const entry of entries) {
      if (!entry.product.embedding) continue;
      
      const sim = cosineSimilarity(context.queryEmbedding, entry.product.embedding);
      if (sim > 0.65) {
        const productId = entry.product.id;
        const searchableText = entry.searchText;
        const matchedQueryTokens = queryTokens.filter((term) => searchableTextContainsTerm(searchableText, term)).length;
        const missingRequiredTerms = requiredTerms.filter((term) => !searchableTextContainsTerm(searchableText, term)).length;
        const matchedPreferredTerms = preferredTerms.filter((term) => searchableTextContainsTerm(searchableText, term)).length;
        const matchedAvoidTerms = avoidTerms.filter((term) => searchableTextContainsTerm(searchableText, term)).length;
        const brandMatched = preferredBrands.includes(entry.normalizedBrandName);

        const matchedDistinctiveQueryTokens = distinctiveQueryTokens.filter((term) => searchableTextContainsTerm(searchableText, term)).length;

        if (
          hasTextualMatches &&
          context?.enforceQueryTokenMatch !== false &&
          queryTokens.length > 0 &&
          matchedQueryTokens === 0 &&
          matchedDistinctiveQueryTokens === 0
        ) {
          continue;
        }

        if (sim < 0.75) {
          if (
            context?.enforceQueryTokenMatch !== false &&
            distinctiveQueryTokens.length > 0 &&
            matchedDistinctiveQueryTokens === 0
          ) {
            continue;
          }

          if (
            context?.strictCategory &&
            context.enforceQueryTokenMatch !== false &&
            queryTokens.length > 0 &&
            matchedQueryTokens === 0
          ) {
            continue;
          }
        }

        let nextScore = (1.0 - sim) * 2; 
        nextScore += missingRequiredTerms * 0.35;
        nextScore -= matchedPreferredTerms * 0.08;
        nextScore += matchedAvoidTerms * 0.2;
        nextScore += Math.max(0, queryTokens.length - matchedQueryTokens) * 0.04;

        if (brandMatched) {
          nextScore -= 0.12;
        }

        const currentBest = bestMatchesByProductId.get(productId);

        if (!currentBest || nextScore < currentBest.score) {
          bestMatchesByProductId.set(productId, {
            entry,
            score: nextScore,
          });
        }
      }
    }
  }

  return Array.from(bestMatchesByProductId.values())
    .sort((left, right) => left.score - right.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
};

export class ProductService {
  private productRepository: Repository<Product>;
  private productVariantRepository: Repository<ProductVariant>;
  private productImageRepository: Repository<ProductImage>;
  private categoryRepository: Repository<Category>;
  private brandRepository: Repository<Brand>;
  private reviewRepository: Repository<Review>;
  private inventoryRepository: Repository<Inventory>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.productVariantRepository = AppDataSource.getRepository(ProductVariant);
    this.productImageRepository = AppDataSource.getRepository(ProductImage);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.brandRepository = AppDataSource.getRepository(Brand);
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
  }

  async getAllProducts(options: ProductFilterOptions = {}) {
    const {
      category_id,
      brand_id,
      min_price,
      max_price,
      search,
      is_featured,
      is_active = true,
      sort = 'newest',
      page = 1,
      limit = 20
    } = options;

    let queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images');

    if (is_active !== undefined) {
      queryBuilder = queryBuilder.andWhere('product.is_active = :is_active', { is_active });
    }

    if (category_id) {
      const childCategories = await this.categoryRepository.find({
        select: ['id'],
        where: { parent_id: category_id, is_active: true }
      });
      const categoryIds = [category_id, ...childCategories.map(cat => cat.id)];

      queryBuilder = queryBuilder.andWhere('product.category_id IN (:...categoryIds)', { categoryIds });
    }

    if (brand_id) {
      queryBuilder = queryBuilder.andWhere('product.brand_id = :brand_id', { brand_id });
    }

    if (min_price !== undefined) {
      queryBuilder = queryBuilder.andWhere('product.base_price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder = queryBuilder.andWhere('product.base_price <= :max_price', { max_price });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search OR product.sku LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (is_featured !== undefined) {
      queryBuilder = queryBuilder.andWhere('product.is_featured = :is_featured', { is_featured });
    }

    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    switch (sort) {
      case 'price_asc':
        queryBuilder = queryBuilder.orderBy('product.base_price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.orderBy('product.base_price', 'DESC');
        break;
      case 'popular':
        queryBuilder = queryBuilder.orderBy('product.created_at', 'DESC');
        break;
      case 'newest':
      default:
        queryBuilder = queryBuilder.orderBy('product.created_at', 'DESC');
        break;
    }

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const products = await queryBuilder.getMany();
    const productIds = products.map((product) => product.id);
    const [soldCountMap, stockQuantityMap] = await Promise.all([
      this.loadSoldCountMap(productIds),
      this.loadStockQuantityMap(productIds),
    ]);

    const formattedProducts = products.map((product) =>
      this.formatProductResponse(
        product,
        soldCountMap.get(product.id) ?? 0,
        stockQuantityMap.get(product.id) ?? 0,
      ),
    );

    return {
      data: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand', 'variants', 'images']
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    const reviews = await this.reviewRepository.find({
      where: { product_id: id, is_approved: true },
      select: ['rating']
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const variantsWithInventory = await Promise.all(
      product.variants?.map(async (variant) => {
        const inventory = await this.inventoryRepository.find({
          where: { variant_id: variant.id },
          relations: ['warehouse']
        });

        return {
          ...variant,
          inventory: inventory.map(inv => ({
            warehouse_id: inv.warehouse_id,
            quantity_available: inv.quantity_available,
            quantity_reserved: inv.quantity_reserved,
            quantity_total: inv.quantity_total
          }))
        };
      }) || []
    );

    const [soldCountMap, stockQuantityMap] = await Promise.all([
      this.loadSoldCountMap([product.id]),
      this.loadStockQuantityMap([product.id]),
    ]);

    return {
      ...this.formatProductResponse(
        product,
        soldCountMap.get(product.id) ?? 0,
        stockQuantityMap.get(product.id) ?? 0,
      ),
      variants: variantsWithInventory,
      reviews_summary: {
        total_reviews: reviews.length,
        average_rating: Number(averageRating.toFixed(1))
      }
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'brand', 'variants', 'images']
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    return this.getProductById(product.id);
  }

  async getFeaturedProducts(limit: number = 10) {
    const products = await this.productRepository.find({
      where: { is_featured: true, is_active: true },
      relations: ['category', 'brand', 'variants', 'images'],
      take: limit,
      order: { created_at: 'DESC' }
    });

    const productIds = products.map((product) => product.id);
    const [soldCountMap, stockQuantityMap] = await Promise.all([
      this.loadSoldCountMap(productIds),
      this.loadStockQuantityMap(productIds),
    ]);

    return products.map((product) =>
      this.formatProductResponse(
        product,
        soldCountMap.get(product.id) ?? 0,
        stockQuantityMap.get(product.id) ?? 0,
      ),
    );
  }

  async getRelatedProducts(productId: number, limit: number = 8) {
    const product = await this.productRepository.findOne({
      where: { id: productId }
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    const relatedProducts = await this.productRepository.find({
      where: {
        category_id: product.category_id,
        id: Not(productId),
        is_active: true
      },
      relations: ['category', 'brand', 'variants', 'images'],
      take: limit,
      order: {
        is_featured: 'DESC',
        created_at: 'DESC'
      }
    });

    const productIds = relatedProducts.map((relatedProduct) => relatedProduct.id);
    const [soldCountMap, stockQuantityMap] = await Promise.all([
      this.loadSoldCountMap(productIds),
      this.loadStockQuantityMap(productIds),
    ]);

    return relatedProducts.map((relatedProduct) =>
      this.formatProductResponse(
        relatedProduct,
        soldCountMap.get(relatedProduct.id) ?? 0,
        stockQuantityMap.get(relatedProduct.id) ?? 0,
      ),
    );
  }

  async searchProducts(query: string, limit: number = 20) {
    return this.searchProductsWithContext(query, limit);
  }

  async searchProductsWithContext(query: string, limit: number = 20, context: ProductSearchContext = {}) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return { data: [], suggestions: [] };
    }

    let queryEmbedding: number[] | undefined;
    try {
      queryEmbedding = await getEmbedding(query);
    } catch (e) {
      // Gracefully continue without semantic search if API key missing or network fails
    }

    const buildProductSearchQuery = () =>
      this.productRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('product.images', 'images')
        .where('product.is_active = :isActive', { isActive: true });

    let products: Product[];
    try {
      const productQuery = buildProductSearchQuery();

      if (queryEmbedding) {
        productQuery.addSelect('product.embedding');
      }

      products = await productQuery.getMany();
    } catch (error) {
      if (!queryEmbedding || !isMissingProductEmbeddingColumnError(error)) {
        throw error;
      }

      queryEmbedding = undefined;
      products = await buildProductSearchQuery().getMany();
    }

    const categories = (
      await this.categoryRepository.find({
        where: { is_active: true },
      })
    ) ?? [];
    const categoryNodeMap = buildCategorySearchNodeMap(categories);

    const searchableEntries = products.map((product) =>
      buildSearchableProductEntry(product, categoryNodeMap.get(product.category?.id ?? -1)),
    );
    const explicitCategoryIds = Array.from(new Set((context.categoryIds ?? []).filter((value) => Number.isInteger(value))));
    const taxonomyMatch = explicitCategoryIds.length > 0
      ? { categoryIds: [], matchedByAliasOnly: false }
      : collectTaxonomyMatchedCategoryIds(categoryNodeMap, normalizedQuery);
    const preferredCategoryIds = explicitCategoryIds.length > 0
      ? explicitCategoryIds
      : taxonomyMatch.categoryIds;
    const explicitBrandNames = normalizeSearchValues(context.brandNames);
    const matchedLeafCategories = preferredCategoryIds.length > 0
      ? searchableEntries
          .filter((entry) => preferredCategoryIds.includes(entry.product.category?.id ?? -1))
          .map((entry) => entry.normalizedLeafCategoryName)
      : collectMatchingLeafCategories(searchableEntries, normalizedQuery);
    const categoryPreferredEntries = preferredCategoryIds.length > 0
      ? searchableEntries.filter((entry) => preferredCategoryIds.includes(entry.product.category?.id ?? -1))
      : matchedLeafCategories.length > 0
        ? searchableEntries.filter((entry) => matchedLeafCategories.includes(entry.normalizedLeafCategoryName))
        : searchableEntries;
    const brandPreferredEntries = explicitBrandNames.length > 0
      ? categoryPreferredEntries.filter((entry) => explicitBrandNames.includes(entry.normalizedBrandName))
      : categoryPreferredEntries;
    const plannedSearchContext = explicitCategoryIds.length === 0 && preferredCategoryIds.length === 0
      ? await maybePlanStorefrontSearch(
          query,
          categories.map((category) => ({
            id: category.id,
            name: category.name,
            leafName: getLeafCategoryName(category.name),
          })),
          { categoryMatchedByHeuristics: preferredCategoryIds.length > 0 },
        )
      : null;
    const plannedCategoryIds = plannedSearchContext?.categoryIds ?? [];
    const effectiveCategoryIds = preferredCategoryIds.length > 0 ? preferredCategoryIds : plannedCategoryIds;
    const effectiveMatchedLeafCategories = effectiveCategoryIds.length > 0
      ? searchableEntries
          .filter((entry) => effectiveCategoryIds.includes(entry.product.category?.id ?? -1))
          .map((entry) => entry.normalizedLeafCategoryName)
      : matchedLeafCategories;
    const effectiveCategoryPreferredEntries = effectiveCategoryIds.length > 0
      ? searchableEntries.filter((entry) => effectiveCategoryIds.includes(entry.product.category?.id ?? -1))
      : categoryPreferredEntries;
    const effectiveBrandPreferredEntries = explicitBrandNames.length > 0
      ? effectiveCategoryPreferredEntries.filter((entry) => explicitBrandNames.includes(entry.normalizedBrandName))
      : effectiveCategoryPreferredEntries;
    const preferredEntries = effectiveBrandPreferredEntries.length > 0
      ? effectiveBrandPreferredEntries
      : context.strictBrand || plannedSearchContext?.strictBrand
        ? []
        : effectiveCategoryPreferredEntries;
    const strictCategory = context.strictCategory || preferredCategoryIds.length > 0 || Boolean(plannedSearchContext?.strictCategory && plannedCategoryIds.length > 0);
    const normalizedSearchQuery = applySearchQueryReplacements(stripSearchNoisePrefix(normalizedQuery) || normalizedQuery);
    const queryTokens = buildSearchQueryTokens(query);
    const distinctiveQueryTokens = buildDistinctiveSearchTokens(normalizedSearchQuery);
    const enforceQueryTokenMatch = !taxonomyMatch.matchedByAliasOnly;
    const queryVariants = Array.from(
      new Set([
        ...buildSearchQueryVariants(query, effectiveMatchedLeafCategories),
        ...normalizeSearchValues(context.queryVariants),
        plannedSearchContext?.rewrittenQuery,
        ...(plannedSearchContext?.queryVariants ?? []),
      ].filter((value): value is string => Boolean(value))),
    );
    const rankedEntries = runSearch(preferredEntries, queryVariants, limit, {
      ...context,
      brandNames: [...(context.brandNames ?? []), ...(plannedSearchContext?.brandNames ?? [])],
      requiredTerms: [...(context.requiredTerms ?? []), ...(plannedSearchContext?.requiredTerms ?? [])],
      preferredTerms: [...(context.preferredTerms ?? []), ...(plannedSearchContext?.preferredTerms ?? [])],
      avoidTerms: [...(context.avoidTerms ?? []), ...(plannedSearchContext?.avoidTerms ?? [])],
      queryTokens,
      distinctiveQueryTokens,
      enforceQueryTokenMatch,
      strictCategory,
      queryEmbedding,
    });
    
    const fallbackEntries = (rankedEntries.length > 0 || preferredEntries === searchableEntries || strictCategory)
      ? rankedEntries
      : runSearch(searchableEntries, queryVariants, limit, {
          ...context,
          brandNames: [...(context.brandNames ?? []), ...(plannedSearchContext?.brandNames ?? [])],
          requiredTerms: [...(context.requiredTerms ?? []), ...(plannedSearchContext?.requiredTerms ?? [])],
          preferredTerms: [...(context.preferredTerms ?? []), ...(plannedSearchContext?.preferredTerms ?? [])],
          avoidTerms: [...(context.avoidTerms ?? []), ...(plannedSearchContext?.avoidTerms ?? [])],
          queryTokens,
          distinctiveQueryTokens,
          enforceQueryTokenMatch,
          strictCategory: false,
          queryEmbedding,
        });
    const matchedProducts = fallbackEntries.map((entry) => entry.product);

    const suggestions = Array.from(
      new Set(fallbackEntries.slice(0, 5).map((entry) => entry.product.name))
    );

    const productIds = matchedProducts.map((product) => product.id);
    const [soldCountMap, stockQuantityMap] = await Promise.all([
      this.loadSoldCountMap(productIds),
      this.loadStockQuantityMap(productIds),
    ]);

    return {
      data: matchedProducts.map((product: Product) =>
        this.formatProductResponse(
          product,
          soldCountMap.get(product.id) ?? 0,
          stockQuantityMap.get(product.id) ?? 0,
        ),
      ),
      suggestions
    };
  }

  private async loadSoldCountMap(productIds: number[]): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const soldRows = await this.productVariantRepository
      .createQueryBuilder('variant')
      .select('variant.product_id', 'product_id')
      .addSelect('COALESCE(SUM(orderItem.quantity), 0)', 'sold_count')
      .innerJoin(OrderItem, 'orderItem', 'orderItem.variant_id = variant.id')
      .innerJoin(
        Order,
        'order',
        'order.id = orderItem.order_id AND order.deleted_at IS NULL AND order.status IN (:...eligibleStatuses)',
        {
          eligibleStatuses: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
      )
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('variant.deleted_at IS NULL')
      .groupBy('variant.product_id')
      .getRawMany<{ product_id: string; sold_count: string }>();

    return new Map(
      soldRows.map((row) => [Number(row.product_id), Number(row.sold_count) || 0]),
    );
  }

  private async loadStockQuantityMap(productIds: number[]): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const stockRows = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select('variant.product_id', 'product_id')
      .addSelect('COALESCE(SUM(inventory.quantity_available), 0)', 'stock_quantity')
      .innerJoin(ProductVariant, 'variant', 'variant.id = inventory.variant_id')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('variant.deleted_at IS NULL')
      .groupBy('variant.product_id')
      .getRawMany<{ product_id: string; stock_quantity: string }>();

    return new Map(
      stockRows.map((row) => [Number(row.product_id), Number(row.stock_quantity) || 0]),
    );
  }

  private formatProductResponse(
    product: Product,
    soldCount: number = 0,
    stockQuantity: number = 0,
  ) {
    const primaryImage = product.images?.find(img => img.is_primary)?.image_url ||
      product.images?.[0]?.image_url || null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      short_description: product.short_description,
      base_price: product.base_price,
      compare_at_price: product.compare_at_price,
      cost_price: product.cost_price,
      weight_kg: product.weight_kg,
      stock_quantity: stockQuantity,
      is_active: product.is_active,
      is_featured: product.is_featured,
      sold_count: soldCount,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug
      } : null,
      primary_image: primaryImage,
      images: product.images?.map(img => ({
        id: img.id,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        color_code: variant.color_code,
        material: variant.material,
        price_adjustment: variant.price_adjustment,
        final_price: variant.final_price,
        is_active: variant.is_active
      })) || [],
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }
}

export default new ProductService();
