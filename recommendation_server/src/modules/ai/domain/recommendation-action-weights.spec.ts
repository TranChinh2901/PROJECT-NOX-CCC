import { UserActionType } from '../enum/user-behavior.enum';
import {
  getRecommendationActionWeight,
  RECOMMENDATION_ACTION_WEIGHTS,
  SUPPORTED_RECOMMENDATION_ACTION_TYPES,
} from './recommendation-action-weights';

describe('recommendation action weights', () => {
  it('defines the canonical signal strength used by online and offline recommendation paths', () => {
    expect(RECOMMENDATION_ACTION_WEIGHTS).toEqual({
      [UserActionType.VIEW]: 1,
      [UserActionType.CLICK]: 1,
      [UserActionType.REVIEW_VIEW]: 2,
      [UserActionType.ADD_TO_CART]: 3,
      [UserActionType.WISHLIST_ADD]: 4,
      [UserActionType.PURCHASE]: 6,
    });
    expect(SUPPORTED_RECOMMENDATION_ACTION_TYPES).toEqual([
      UserActionType.VIEW,
      UserActionType.CLICK,
      UserActionType.REVIEW_VIEW,
      UserActionType.ADD_TO_CART,
      UserActionType.WISHLIST_ADD,
      UserActionType.PURCHASE,
    ]);
  });

  it('falls back to a neutral weight for unsupported action types', () => {
    expect(getRecommendationActionWeight(UserActionType.SEARCH)).toBe(1);
    expect(getRecommendationActionWeight(UserActionType.REMOVE_FROM_CART)).toBe(1);
  });
});
