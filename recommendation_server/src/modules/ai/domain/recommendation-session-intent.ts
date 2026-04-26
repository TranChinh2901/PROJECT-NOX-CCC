import { Recommendation } from './entities/Recommendation';
import {
  BehaviorType,
  UserBehaviorLog,
} from './repositories/IUserBehaviorRepository';
import { ProductFeature } from './repositories/IProductFeatureRepository';

export type SessionIntentProfile = {
  categoryWeights: Map<number, number>;
  brandWeights: Map<number, number>;
  priceRangeMin: number;
  priceRangeMax: number;
  signalCount: number;
};

const MAX_SESSION_INTENT_BOOST = 0.2;
const CATEGORY_BOOST = 0.1;
const BRAND_BOOST = 0.06;
const PRICE_BOOST = 0.04;
const PRICE_RANGE_TOLERANCE = 0.15;

const roundMetric = (value: number): number => Number(value.toFixed(6));

const getBehaviorWeight = (behaviorType: BehaviorType): number => {
  switch (behaviorType) {
    case BehaviorType.SEARCH:
      return 1.2;
    case BehaviorType.VIEW:
      return 1;
    default:
      return 0;
  }
};

const addWeightedSignal = (
  weights: Map<number, number>,
  id: number | null | undefined,
  weight: number
): void => {
  if (!id || weight <= 0) {
    return;
  }

  weights.set(id, (weights.get(id) ?? 0) + weight);
};

const getMetadataNumber = (
  metadata: Record<string, any> | undefined,
  key: string
): number | undefined => {
  const value = metadata?.[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const createEmptySessionIntent = (): SessionIntentProfile => ({
  categoryWeights: new Map(),
  brandWeights: new Map(),
  priceRangeMin: 0,
  priceRangeMax: Number.MAX_SAFE_INTEGER,
  signalCount: 0,
});

export const buildSessionIntentProfile = (
  logs: UserBehaviorLog[],
  productFeatures: ProductFeature[]
): SessionIntentProfile => {
  const featureByProductId = new Map(
    productFeatures.map((feature) => [feature.productId, feature])
  );
  const categoryWeights = new Map<number, number>();
  const brandWeights = new Map<number, number>();
  const prices: number[] = [];
  let signalCount = 0;

  logs.forEach((log, index) => {
    const behaviorWeight = getBehaviorWeight(log.behaviorType);
    if (behaviorWeight <= 0) {
      return;
    }

    const recencyWeight = Math.max(0.25, 1 - index * 0.05);
    const weight = behaviorWeight * recencyWeight;
    const productFeature = log.productId ? featureByProductId.get(log.productId) : undefined;
    const categoryId =
      productFeature?.categoryId ??
      log.categoryId ??
      getMetadataNumber(log.metadata, 'categoryId');
    const brandId =
      productFeature?.brandId ??
      getMetadataNumber(log.metadata, 'brandId');
    const price =
      productFeature?.price ??
      getMetadataNumber(log.metadata, 'price');

    addWeightedSignal(categoryWeights, categoryId, weight);
    addWeightedSignal(brandWeights, brandId, weight);

    if (price && price > 0) {
      prices.push(price);
    }

    if (categoryId || brandId || price) {
      signalCount += 1;
    }
  });

  if (signalCount === 0) {
    return createEmptySessionIntent();
  }

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : Number.MAX_SAFE_INTEGER;

  return {
    categoryWeights,
    brandWeights,
    priceRangeMin: minPrice > 0 ? roundMetric(minPrice * (1 - PRICE_RANGE_TOLERANCE)) : 0,
    priceRangeMax:
      maxPrice < Number.MAX_SAFE_INTEGER
        ? roundMetric(maxPrice * (1 + PRICE_RANGE_TOLERANCE))
        : Number.MAX_SAFE_INTEGER,
    signalCount,
  };
};

export const hasSessionIntent = (intent: SessionIntentProfile): boolean =>
  intent.signalCount > 0;

const normalizeWeight = (weights: Map<number, number>, id: number | null): number => {
  if (!id || !weights.has(id)) {
    return 0;
  }

  const maxWeight = Math.max(...weights.values(), 0);
  return maxWeight > 0 ? (weights.get(id) ?? 0) / maxWeight : 0;
};

export const calculateSessionIntentBoost = (
  intent: SessionIntentProfile,
  productFeature: ProductFeature
): number => {
  if (!hasSessionIntent(intent)) {
    return 0;
  }

  let boost = 0;
  boost += normalizeWeight(intent.categoryWeights, productFeature.categoryId) * CATEGORY_BOOST;
  boost += normalizeWeight(intent.brandWeights, productFeature.brandId) * BRAND_BOOST;

  if (
    productFeature.price >= intent.priceRangeMin &&
    productFeature.price <= intent.priceRangeMax
  ) {
    boost += PRICE_BOOST;
  }

  return Number(Math.min(boost, MAX_SESSION_INTENT_BOOST).toFixed(6));
};

export const applySessionIntentBoost = (
  recommendations: Recommendation[],
  featureByProductId: Map<number, ProductFeature>,
  intent: SessionIntentProfile
): Recommendation[] => {
  if (!hasSessionIntent(intent)) {
    return recommendations;
  }

  return recommendations
    .map((recommendation) => {
      const feature = featureByProductId.get(recommendation.productId);
      const boost = feature ? calculateSessionIntentBoost(intent, feature) : 0;

      if (boost <= 0) {
        return {
          recommendation,
          boost,
        };
      }

      const boostedScore = Math.min(1, recommendation.score.toNumber() + boost);

      return {
        recommendation: Recommendation.create(
          recommendation.productId,
          Number(boostedScore.toFixed(6)),
          `${recommendation.reason}; matches recent session intent`
        ),
        boost,
      };
    })
    .sort((left, right) => {
      const scoreDelta =
        right.recommendation.score.toNumber() - left.recommendation.score.toNumber();
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const boostDelta = right.boost - left.boost;
      if (boostDelta !== 0) {
        return boostDelta;
      }

      return left.recommendation.productId - right.recommendation.productId;
    })
    .map(({ recommendation }) => recommendation);
};
