import { UserActionType } from '../enum/user-behavior.enum';

export type WeightedRecommendationActionType =
  | UserActionType.VIEW
  | UserActionType.CLICK
  | UserActionType.REVIEW_VIEW
  | UserActionType.ADD_TO_CART
  | UserActionType.WISHLIST_ADD
  | UserActionType.PURCHASE;

export const RECOMMENDATION_ACTION_WEIGHTS: Readonly<
  Record<WeightedRecommendationActionType, number>
> = {
  [UserActionType.VIEW]: 1,
  [UserActionType.CLICK]: 1,
  [UserActionType.REVIEW_VIEW]: 2,
  [UserActionType.ADD_TO_CART]: 3,
  [UserActionType.WISHLIST_ADD]: 4,
  [UserActionType.PURCHASE]: 6,
} as const;

export const SUPPORTED_RECOMMENDATION_ACTION_TYPES = Object.keys(
  RECOMMENDATION_ACTION_WEIGHTS
) as WeightedRecommendationActionType[];

const recommendationActionWeightLookup: Readonly<Partial<Record<UserActionType, number>>> =
  RECOMMENDATION_ACTION_WEIGHTS;

export const getRecommendationActionWeight = (actionType: UserActionType): number =>
  recommendationActionWeightLookup[actionType] ?? 1;
