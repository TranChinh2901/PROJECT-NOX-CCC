import { Repository } from 'typeorm';
import {
  IProductFeatureRepository,
  ProductFeature as DomainProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { Product } from '../../../products/entity/product';
import { AppDataSource } from '@/config/database.config';

/**
 * Adapter: TypeORM Product Feature Repository
 *
 * Provides product features from the products table.
 * In a production system, this might query a separate analytics database
 * or a materialized view optimized for recommendations.
 */
export class TypeORMProductFeatureRepository implements IProductFeatureRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }

  async getById(productId: number): Promise<DomainProductFeature | null> {
    const product = await this.repository.findOne({
      where: { id: productId },
      relations: ['category', 'brand', 'reviews'],
    });

    if (!product) return null;

    return this.toDomainFeature(product);
  }

  async getByIds(productIds: number[]): Promise<DomainProductFeature[]> {
    const products = await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .whereInIds(productIds)
      .getMany();

    return products.map((p) => this.toDomainFeature(p));
  }

  async getByCategory(categoryId: number, limit: number): Promise<DomainProductFeature[]> {
    const products = await this.repository.find({
      where: { category_id: categoryId },
      relations: ['category', 'brand', 'reviews'],
      take: limit,
    });

    return products.map((p) => this.toDomainFeature(p));
  }

  async getFallbackProducts(limit: number, categoryId?: number): Promise<DomainProductFeature[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
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
    return products.map((product) => this.toDomainFeature(product));
  }

  async findSimilar(productId: number, limit: number): Promise<DomainProductFeature[]> {
    // Get the target product first
    const targetProduct = await this.repository.findOne({
      where: { id: productId },
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

    return similarProducts.map((p) => this.toDomainFeature(p));
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
  private toDomainFeature(product: Product): DomainProductFeature {
    // Calculate average rating and review count
    const reviews = product.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      productId: product.id,
      categoryId: product.category_id || 0,
      brandId: product.brand_id || null,
      price: Number(product.base_price || 0),
      avgRating,
      reviewCount: reviews.length,
      purchaseCount: 0, // TODO: Calculate from orders
    };
  }
}
