import { UserPreference } from '../entities/UserPreference';

/**
 * User Behavior Event Types
 */
export enum BehaviorType {
  VIEW = 'view',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  REVIEW = 'review',
  WISHLIST = 'wishlist',
  SEARCH = 'search',
}

/**
 * User Behavior Log DTO
 */
export interface UserBehaviorLog {
  userId: number;
  productId?: number;
  categoryId?: number;
  behaviorType: BehaviorType;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Repository Interface (Port): IUserBehaviorRepository
 * Defines the contract for tracking and analyzing user behavior.
 */
export interface IUserBehaviorRepository {
  /**
   * Log a user behavior event
   */
  logBehavior(log: UserBehaviorLog): Promise<void>;

  /**
   * Get user behavior history
   */
  getBehaviorHistory(
    userId: number,
    limit: number,
    behaviorTypes?: BehaviorType[]
  ): Promise<UserBehaviorLog[]>;

  /**
   * Derive user preferences from behavior history
   */
  deriveUserPreferences(userId: number): Promise<UserPreference>;

  /**
   * Get popular products based on recent behavior
   */
  getPopularProducts(limit: number, categoryId?: number): Promise<number[]>;

  /**
   * Get users with similar behavior patterns
   */
  findSimilarUsers(userId: number, limit: number): Promise<number[]>;
}
