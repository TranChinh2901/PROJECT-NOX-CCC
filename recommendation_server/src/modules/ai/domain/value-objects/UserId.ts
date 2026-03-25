/**
 * Value Object: UserId
 * Immutable identifier for users in the recommendation domain.
 * Enforces type safety and encapsulates validation logic.
 */
export class UserId {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): UserId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid UserId: ${value}. Must be a positive integer.`);
    }
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toNumber(): number {
    return this.value;
  }

  toString(): string {
    return `UserId(${this.value})`;
  }
}
