import { Repository } from 'typeorm';
import {
  IProductFeatureRepository,
  ProductFeature as DomainProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { Product } from '../../../products/entity/product';
import { AppDataSource } from '@/config/database.config';
import { IsNull } from 'typeorm';
import { OrderItem } from '@/modules/orders/entity/order-item';
import { Order } from '@/modules/orders/entity/order';
import { OrderStatus } from '@/modules/orders/enum/order.enum';
import { ProductVariant } from '@/modules/products/entity/product-variant';

/**
 * Adapter: TypeORM Product Feature Repository
 *
 * Provides product features from the products table.
 * In a production system, this might query a separate analytics database
 * or a materialized view optimized for recommendations.
 */
export class TypeORMProductFeatureRepository implements IProductFeatureRepository {
  private repository: Repository<Product>;
  private orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  async getById(productId: number): Promise<DomainProductFeature | null> {
    const product = await this.repository
      .createQueryBuilder('product')
      .addSelect('product.embedding')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.id = :productId', { productId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL')
      .getOne();

    if (!product) return null;

    const purchaseCounts = await this.loadPurchaseCountsByProductIds([product.id]);
    return this.toDomainFeature(product, purchaseCounts.get(product.id) ?? 0);
  }

  async getByIds(productIds: number[]): Promise<DomainProductFeature[]> {
    const products = await this.repository
      .createQueryBuilder('product')
      .addSelect('product.embedding')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .whereInIds(productIds)
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const purchaseCounts = await this.loadPurchaseCountsByProductIds(products.map((p) => p.id));
    return products.map((p) => this.toDomainFeature(p, purchaseCounts.get(p.id) ?? 0));
  }

  async getByCategory(categoryId: number, limit: number): Promise<DomainProductFeature[]> {
    const products = await this.repository
      .createQueryBuilder('product')
      .addSelect('product.embedding')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL')
      .limit(limit)
      .getMany();

    if (products.length === 0) {
      return [];
    }

    const purchaseCounts = await this.loadPurchaseCountsByProductIds(products.map((p) => p.id));
    return products.map((p) => this.toDomainFeature(p, purchaseCounts.get(p.id) ?? 0));
  }

  async getFallbackProducts(limit: number, categoryId?: number): Promise<DomainProductFeature[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .addSelect('product.embedding')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL')
      .orderBy('product.is_featured', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .limit(limit);

    if (categoryId) {
      queryBuilder.andWhere('product.category_id = :categoryId', { categoryId });
    }

    const products = await queryBuilder.getMany();
    if (products.length === 0) {
      return [];
    }

    const purchaseCounts = await this.loadPurchaseCountsByProductIds(products.map((p) => p.id));
    return products.map((product) =>
      this.toDomainFeature(product, purchaseCounts.get(product.id) ?? 0)
    );
  }

  async findSimilar(productId: number, limit: number): Promise<DomainProductFeature[]> {
    // Get the target product first
    const targetProduct = await this.repository.findOne({
      where: { id: productId, is_active: true, deleted_at: IsNull() },
      relations: ['category', 'brand', 'reviews'],
    });

    if (!targetProduct) return [];

    // Find similar products (same category, similar price range)
    const targetPrice = Number(targetProduct.base_price || 0);
    const priceMin = targetPrice * 0.7;
    const priceMax = targetPrice * 1.3;

    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.category_id = :categoryId', {
        categoryId: targetProduct.category_id,
      })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL')
      .limit(limit);

    if (targetPrice > 0) {
      queryBuilder
        .andWhere('product.base_price BETWEEN :priceMin AND :priceMax', { priceMin, priceMax })
        .orderBy('ABS(product.base_price - :targetPrice)', 'ASC')
        .setParameter('targetPrice', targetPrice);
    } else {
      queryBuilder.orderBy('product.created_at', 'DESC');
    }

    const similarProducts = await queryBuilder.getMany();

    if (similarProducts.length === 0) {
      return [];
    }

    const purchaseCounts = await this.loadPurchaseCountsByProductIds(
      similarProducts.map((p) => p.id)
    );
    return similarProducts.map((p) => this.toDomainFeature(p, purchaseCounts.get(p.id) ?? 0));
  }

  async updateStatistics(
    productId: number,
    updates: Partial<DomainProductFeature>
  ): Promise<void> {
    void productId;
    void updates;
    // Product statistics in this schema are derived from related tables (reviews/orders),
    // so there is no dedicated product column to update here.
  }

  /**
   * Map TypeORM Product entity to domain ProductFeature
   */
  private toDomainFeature(product: Product, purchaseCount = 0): DomainProductFeature {
    // Calculate average rating and review count
    const reviews = product.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    const featureVector = this.toEmbeddingVector(product.embedding);
    const feature: DomainProductFeature = {
      productId: product.id,
      categoryId: product.category_id || 0,
      brandId: product.brand_id || null,
      price: Number(product.base_price || 0),
      avgRating,
      reviewCount: reviews.length,
      purchaseCount,
    };

    return featureVector ? { ...feature, featureVector } : feature;
  }

  private toEmbeddingVector(value: unknown): number[] | undefined {
    const candidate = typeof value === 'string' ? this.parseEmbeddingString(value) : value;

    if (!Array.isArray(candidate)) {
      return undefined;
    }

    const vector = candidate.map((item) => Number(item));

    return vector.length > 0 && vector.every(Number.isFinite) ? vector : undefined;
  }

  private parseEmbeddingString(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private async loadPurchaseCountsByProductIds(productIds: number[]): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const rows = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('variant.product_id', 'product_id')
      .addSelect('COALESCE(SUM(orderItem.quantity), 0)', 'purchase_count')
      .innerJoin(ProductVariant, 'variant', 'variant.id = orderItem.variant_id')
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
        }
      )
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('variant.deleted_at IS NULL')
      .groupBy('variant.product_id')
      .getRawMany<{ product_id: string; purchase_count: string }>();

    return new Map(
      rows.map((row) => [Number(row.product_id), Number(row.purchase_count) || 0])
    );
  }
}
