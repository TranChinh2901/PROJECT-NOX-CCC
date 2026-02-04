/**
 * Value Object: RecommendationScore
 * Represents the confidence score of a recommendation (0.0 to 1.0).
 * Immutable and validates domain constraints.
 */
export class RecommendationScore {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): RecommendationScore {
    if (value < 0 || value > 1) {
      throw new Error(`Invalid RecommendationScore: ${value}. Must be between 0.0 and 1.0.`);
    }
    return new RecommendationScore(value);
  }

  static zero(): RecommendationScore {
    return new RecommendationScore(0);
  }

  static max(): RecommendationScore {
    return new RecommendationScore(1);
  }

  isAboveThreshold(threshold: number): boolean {
    return this.value >= threshold;
  }

  toNumber(): number {
    return this.value;
  }

  toString(): string {
    return `${(this.value * 100).toFixed(2)}%`;
  }
}
