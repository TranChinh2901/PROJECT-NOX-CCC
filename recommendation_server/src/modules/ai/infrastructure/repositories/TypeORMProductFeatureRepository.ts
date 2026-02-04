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

  async findSimilar(productId: number, limit: number): Promise<DomainProductFeature[]> {
    // Get the target product first
    const targetProduct = await this.repository.findOne({
      where: { id: productId },
      relations: ['category', 'brand'],
    });

    if (!targetProduct) return [];

    // Find similar products (same category, similar price range)
    const priceMin = (targetProduct as any).price * 0.7;
    const priceMax = (targetProduct as any).price * 1.3;

    const similarProducts = await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .where('product.category_id = :categoryId', {
        categoryId: (targetProduct as any).category_id,
      })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.price BETWEEN :priceMin AND :priceMax', { priceMin, priceMax })
      .orderBy('product.average_rating', 'DESC')
      .limit(limit)
      .getMany();

    return similarProducts.map((p) => this.toDomainFeature(p));
  }

  async updateStatistics(
    productId: number,
    updates: Partial<DomainProductFeature>
  ): Promise<void> {
    const updateData: any = {};

    if (updates.avgRating !== undefined) {
      updateData.average_rating = updates.avgRating;
    }

    if (updates.reviewCount !== undefined) {
      updateData.review_count = updates.reviewCount;
    }

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(productId, updateData);
    }
  }

  /**
   * Map TypeORM Product entity to domain ProductFeature
   */
  private toDomainFeature(product: Product): DomainProductFeature {
    // Calculate average rating and review count
    const reviews = (product as any).reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      productId: product.id,
      categoryId: (product as any).category_id || 0,
      brandId: (product as any).brand_id || null,
      price: (product as any).price || 0,
      avgRating,
      reviewCount: reviews.length,
      purchaseCount: 0, // TODO: Calculate from orders
    };
  }
}
