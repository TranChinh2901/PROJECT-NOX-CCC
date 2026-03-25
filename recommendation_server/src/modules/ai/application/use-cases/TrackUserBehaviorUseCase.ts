import { IUserBehaviorRepository, BehaviorType } from '../../domain/repositories/IUserBehaviorRepository';

/**
 * DTO: Track User Behavior Request
 */
export interface TrackUserBehaviorRequestDTO {
  userId: number;
  behaviorType: 'view' | 'add_to_cart' | 'purchase' | 'review' | 'wishlist' | 'search';
  productId?: number;
  categoryId?: number;
  metadata?: Record<string, any>;
}

/**
 * Use Case: Track User Behavior
 *
 * This use case logs user interactions for recommendation model training.
 * It's a write operation that can be processed asynchronously.
 */
export class TrackUserBehaviorUseCase {
  constructor(
    private readonly userBehaviorRepository: IUserBehaviorRepository
  ) {}

  async execute(request: TrackUserBehaviorRequestDTO): Promise<void> {
    // Map DTO to domain enum
    const behaviorTypeMap: Record<string, BehaviorType> = {
      view: BehaviorType.VIEW,
      add_to_cart: BehaviorType.ADD_TO_CART,
      purchase: BehaviorType.PURCHASE,
      review: BehaviorType.REVIEW,
      wishlist: BehaviorType.WISHLIST,
      search: BehaviorType.SEARCH,
    };

    const behaviorType = behaviorTypeMap[request.behaviorType];

    if (!behaviorType) {
      throw new Error(`Invalid behavior type: ${request.behaviorType}`);
    }

    // Log the behavior
    await this.userBehaviorRepository.logBehavior({
      userId: request.userId,
      productId: request.productId,
      categoryId: request.categoryId,
      behaviorType,
      metadata: request.metadata,
      timestamp: new Date(),
    });
  }
}
