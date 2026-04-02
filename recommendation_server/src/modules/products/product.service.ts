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
    const soldCountMap = await this.loadSoldCountMap(products.map((product) => product.id));

    const formattedProducts = products.map(product => this.formatProductResponse(product, soldCountMap.get(product.id) ?? 0));

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

    const soldCountMap = await this.loadSoldCountMap([product.id]);

    return {
      ...this.formatProductResponse(product, soldCountMap.get(product.id) ?? 0),
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

    const soldCountMap = await this.loadSoldCountMap(products.map((product) => product.id));
    return products.map(product => this.formatProductResponse(product, soldCountMap.get(product.id) ?? 0));
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

    const soldCountMap = await this.loadSoldCountMap(relatedProducts.map((relatedProduct) => relatedProduct.id));
    return relatedProducts.map((relatedProduct) => this.formatProductResponse(relatedProduct, soldCountMap.get(relatedProduct.id) ?? 0));
  }

  async searchProducts(query: string, limit: number = 20) {
    if (!query || query.trim().length < 2) {
      return { data: [], suggestions: [] };
    }

    const products = await this.productRepository.find({
      where: { is_active: true },
      relations: ['category', 'brand', 'variants', 'images']
    });

    const fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'short_description', weight: 1.5 },
        { name: 'sku', weight: 1.2 },
        { name: 'brand.name', weight: 1.5 },
        { name: 'category.name', weight: 1.3 },
        { name: 'variants.color', weight: 0.8 },
        { name: 'variants.size', weight: 0.8 },
        { name: 'variants.material', weight: 0.8 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2
    });

    const searchResults = fuse.search(query.trim());
    
    const limitedResults = searchResults.slice(0, limit);
    const matchedProducts = limitedResults.map((result: { item: Product }) => result.item);

    const suggestions = Array.from(
      new Set(searchResults.slice(0, 5).map((result: { item: Product }) => result.item.name))
    );

    const soldCountMap = await this.loadSoldCountMap(matchedProducts.map((product) => product.id));

    return {
      data: matchedProducts.map((product: Product) => this.formatProductResponse(product, soldCountMap.get(product.id) ?? 0)),
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

  private formatProductResponse(product: Product, soldCount: number = 0) {
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
