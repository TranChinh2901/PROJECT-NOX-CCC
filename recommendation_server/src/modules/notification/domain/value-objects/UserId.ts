/**
 * Value Object: UserId
 * Represents a valid user identifier
 */
export class UserId {
  private constructor(private readonly value: number) {}

  static create(id: number): UserId {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`Invalid user ID: ${id}. Must be a positive integer.`);
    }
    return new UserId(id);
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
