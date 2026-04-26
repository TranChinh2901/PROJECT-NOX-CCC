import { Repository } from 'typeorm';
import {
  IUserBehaviorRepository,
  UserBehaviorLog as DomainUserBehaviorLog,
  BehaviorType,
} from '../../domain/repositories/IUserBehaviorRepository';
import { UserPreference } from '../../domain/entities/UserPreference';
import { UserBehaviorLog } from '../../../ai/entity/user-behavior-log';
import { AppDataSource } from '@/config/database.config';
import { UserActionType } from '../../../ai/enum/user-behavior.enum';
import { UserSession } from '@/modules/users/entity/user-session';
import { DeviceType } from '@/modules/users/enum/user-session.enum';
import { getRecommendationActionWeight } from '../../domain/recommendation-action-weights';

/**
 * Adapter: TypeORM User Behavior Repository
 *
 * Maps between domain models and TypeORM persistence entities.
 */
export class TypeORMUserBehaviorRepository implements IUserBehaviorRepository {
  private repository: Repository<UserBehaviorLog>;
  private sessionRepository: Repository<UserSession>;
  private readonly nonImpressionViewClause =
    "(log.action_type != :viewAction OR JSON_UNQUOTE(JSON_EXTRACT(log.metadata, '$.event')) IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(log.metadata, '$.event')) != :impressionEvent)";

  constructor() {
    this.repository = AppDataSource.getRepository(UserBehaviorLog);
    this.sessionRepository = AppDataSource.getRepository(UserSession);
  }

  async logBehavior(log: DomainUserBehaviorLog): Promise<void> {
    const session = await this.resolveSession(log.userId, log.timestamp);

    const entity = this.repository.create({
      user_id: log.userId,
      product_id: log.productId,
      action_type: this.mapBehaviorTypeToAction(log.behaviorType),
      metadata: log.metadata as any,
      created_at: log.timestamp,
      session_id: session.id,
      device_type: session.device_type,
      page_url: '',
    });

    await this.repository.save(entity);
  }

  async getBehaviorHistory(
    userId: number,
    limit: number,
    behaviorTypes?: BehaviorType[]
  ): Promise<DomainUserBehaviorLog[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('log')
      .where('log.user_id = :userId', { userId })
      .orderBy('log.created_at', 'DESC')
      .limit(limit);

    if (behaviorTypes && behaviorTypes.length > 0) {
      const actionTypes = behaviorTypes.map((bt) => this.mapBehaviorTypeToAction(bt));
      queryBuilder.andWhere('log.action_type IN (:...actionTypes)', { actionTypes });
    }

    queryBuilder.andWhere(this.nonImpressionViewClause, {
      viewAction: UserActionType.VIEW,
      impressionEvent: 'impression',
    });

    const logs = await queryBuilder.getMany();

    const behaviorHistory: DomainUserBehaviorLog[] = [];

    for (const log of logs) {
      const behaviorType = this.mapActionToBehaviorType(log.action_type);

      if (!behaviorType) {
        continue;
      }

      behaviorHistory.push({
        userId: log.user_id!,
        productId: log.product_id,
        categoryId: undefined, // TODO: Join with product to get category
        behaviorType,
        metadata: log.metadata as any,
        timestamp: log.created_at,
      });
    }

    return behaviorHistory;
  }

  async deriveUserPreferences(userId: number): Promise<UserPreference> {
    // Get user's recent behavior (last 90 days)
    const recentLogs = await this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('log.user_id = :userId', { userId })
      .andWhere('log.created_at >= :since', {
        since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      })
      .andWhere(this.nonImpressionViewClause, {
        viewAction: UserActionType.VIEW,
        impressionEvent: 'impression',
      })
      .orderBy('log.created_at', 'DESC')
      .limit(500)
      .getMany();

    // Extract categories and brands from behavior
    const categoryMap = new Map<number, number>();
    const brandMap = new Map<number, number>();
    const prices: number[] = [];

    for (const log of recentLogs) {
      if (log.product) {
        const signalWeight = this.getPreferenceWeight(log.action_type);

        // Count category occurrences
        const categoryId = (log.product as any).category_id;
        if (categoryId) {
          categoryMap.set(categoryId, (categoryMap.get(categoryId) || 0) + signalWeight);
        }

        // Count brand occurrences
        const brandId = (log.product as any).brand_id;
        if (brandId) {
          brandMap.set(brandId, (brandMap.get(brandId) || 0) + signalWeight);
        }

        // Track prices
        const basePrice = Number((log.product as any).base_price);
        if (Number.isFinite(basePrice) && basePrice > 0) {
          for (let index = 0; index < signalWeight; index += 1) {
            prices.push(basePrice);
          }
        }
      }
    }

    // Get top categories (sorted by frequency)
    const preferredCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryId]) => categoryId);

    // Get top brands (sorted by frequency)
    const preferredBrands = Array.from(brandMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brandId]) => brandId);

    // Calculate price range (25th to 75th percentile)
    let priceRangeMin = 0;
    let priceRangeMax = Number.MAX_SAFE_INTEGER;

    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      const p25 = Math.floor(prices.length * 0.25);
      const p75 = Math.floor(prices.length * 0.75);
      priceRangeMin = prices[p25] || 0;
      priceRangeMax = prices[p75] || Number.MAX_SAFE_INTEGER;
    }

    return UserPreference.create(
      userId,
      preferredCategories,
      preferredBrands,
      priceRangeMin,
      priceRangeMax
    );
  }

  async getPopularProducts(limit: number, categoryId?: number): Promise<number[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('log')
      .select('log.product_id', 'productId')
      .addSelect('COUNT(*)', 'count')
      .where('log.product_id IS NOT NULL')
      .andWhere('log.created_at >= :since', {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      })
      .andWhere(this.nonImpressionViewClause, {
        viewAction: UserActionType.VIEW,
        impressionEvent: 'impression',
      })
      .groupBy('log.product_id')
      .orderBy('count', 'DESC')
      .limit(limit);

    if (categoryId) {
      queryBuilder
        .leftJoin('log.product', 'product')
        .andWhere('product.category_id = :categoryId', { categoryId });
    }

    const results = await queryBuilder.getRawMany();
    return results.map((r) => r.productId);
  }

  async findSimilarUsers(userId: number, limit: number): Promise<number[]> {
    // Simplified: Find users who interacted with same products
    const userProducts = await this.repository
      .createQueryBuilder('log')
      .select('DISTINCT log.product_id')
      .where('log.user_id = :userId', { userId })
      .andWhere('log.product_id IS NOT NULL')
      .andWhere(this.nonImpressionViewClause, {
        viewAction: UserActionType.VIEW,
        impressionEvent: 'impression',
      })
      .getRawMany();

    const productIds = userProducts.map((p) => p.product_id);

    if (productIds.length === 0) {
      return [];
    }

    const similarUsers = await this.repository
      .createQueryBuilder('log')
      .select('log.user_id', 'userId')
      .addSelect('COUNT(DISTINCT log.product_id)', 'commonProducts')
      .where('log.product_id IN (:...productIds)', { productIds })
      .andWhere('log.user_id != :userId', { userId })
      .andWhere('log.user_id IS NOT NULL')
      .andWhere(this.nonImpressionViewClause, {
        viewAction: UserActionType.VIEW,
        impressionEvent: 'impression',
      })
      .groupBy('log.user_id')
      .orderBy('commonProducts', 'DESC')
      .limit(limit)
      .getRawMany();

    return similarUsers.map((u) => u.userId);
  }

  /**
   * Map domain BehaviorType to persistence UserActionType
   */
  private mapBehaviorTypeToAction(behaviorType: BehaviorType): UserActionType {
    const mapping: Record<BehaviorType, UserActionType> = {
      [BehaviorType.VIEW]: UserActionType.VIEW,
      [BehaviorType.ADD_TO_CART]: UserActionType.ADD_TO_CART,
      [BehaviorType.PURCHASE]: UserActionType.PURCHASE,
      [BehaviorType.REVIEW]: UserActionType.REVIEW_VIEW,
      [BehaviorType.WISHLIST]: UserActionType.WISHLIST_ADD,
      [BehaviorType.SEARCH]: UserActionType.SEARCH,
    };

    return mapping[behaviorType];
  }

  /**
   * Map persistence UserActionType to domain BehaviorType
   */
  private mapActionToBehaviorType(actionType: UserActionType): BehaviorType | null {
    const mapping: Partial<Record<UserActionType, BehaviorType | null>> = {
      [UserActionType.VIEW]: BehaviorType.VIEW,
      [UserActionType.CLICK]: BehaviorType.VIEW,
      [UserActionType.ADD_TO_CART]: BehaviorType.ADD_TO_CART,
      [UserActionType.REMOVE_FROM_CART]: null,
      [UserActionType.PURCHASE]: BehaviorType.PURCHASE,
      [UserActionType.SEARCH]: BehaviorType.SEARCH,
      [UserActionType.WISHLIST_ADD]: BehaviorType.WISHLIST,
      [UserActionType.REVIEW_VIEW]: BehaviorType.REVIEW,
    };

    return mapping[actionType] ?? null;
  }

  private getPreferenceWeight(actionType: UserActionType): number {
    return getRecommendationActionWeight(actionType);
  }

  private async resolveSession(userId: number, startedAt: Date): Promise<UserSession> {
    const existingSession = await this.sessionRepository.findOne({
      where: { user_id: userId, is_active: true },
      order: { started_at: 'DESC' },
    });

    if (existingSession) {
      return existingSession;
    }

    const session = this.sessionRepository.create({
      user_id: userId,
      session_token: `behavior-${userId}-${startedAt.getTime()}`,
      device_type: DeviceType.UNKNOWN,
      started_at: startedAt,
      is_active: true,
    });

    return this.sessionRepository.save(session);
  }
}
