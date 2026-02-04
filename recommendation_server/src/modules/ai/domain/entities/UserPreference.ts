/**
 * Domain Entity: UserPreference
 * Encapsulates user preferences learned from behavior.
 */
export class UserPreference {
  readonly userId: number;
  readonly preferredCategories: number[];
  readonly preferredBrands: number[];
  readonly priceRangeMin: number;
  readonly priceRangeMax: number;
  readonly lastUpdated: Date;

  private constructor(
    userId: number,
    preferredCategories: number[],
    preferredBrands: number[],
    priceRangeMin: number,
    priceRangeMax: number,
    lastUpdated: Date
  ) {
    this.userId = userId;
    this.preferredCategories = preferredCategories;
    this.preferredBrands = preferredBrands;
    this.priceRangeMin = priceRangeMin;
    this.priceRangeMax = priceRangeMax;
    this.lastUpdated = lastUpdated;
  }

  static create(
    userId: number,
    preferredCategories: number[] = [],
    preferredBrands: number[] = [],
    priceRangeMin: number = 0,
    priceRangeMax: number = Number.MAX_SAFE_INTEGER
  ): UserPreference {
    if (priceRangeMin < 0 || priceRangeMax < priceRangeMin) {
      throw new Error('Invalid price range');
    }

    return new UserPreference(
      userId,
      preferredCategories,
      preferredBrands,
      priceRangeMin,
      priceRangeMax,
      new Date()
    );
  }

  /**
   * Business rule: User prefers a category if it's in their preferences
   */
  prefersCategory(categoryId: number): boolean {
    return this.preferredCategories.includes(categoryId);
  }

  /**
   * Business rule: User prefers a brand if it's in their preferences
   */
  prefersBrand(brandId: number): boolean {
    return this.preferredBrands.includes(brandId);
  }

  /**
   * Business rule: Check if price is within user's preferred range
   */
  isInPriceRange(price: number): boolean {
    return price >= this.priceRangeMin && price <= this.priceRangeMax;
  }

  /**
   * Business rule: Preferences are stale after 30 days
   */
  isStale(maxAgeDays: number = 30): boolean {
    const ageMs = Date.now() - this.lastUpdated.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > maxAgeDays;
  }
}
