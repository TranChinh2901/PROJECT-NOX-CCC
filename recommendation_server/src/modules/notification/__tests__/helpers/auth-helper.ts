/**
 * Authentication Helper for Tests
 * Generates JWT tokens for authenticated requests
 */
import jwt from 'jsonwebtoken';

export interface TestUser {
  id: number;
  email: string;
  role: string;
}

export class AuthHelper {
  private static readonly SECRET =
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    'test-secret-key';
  private static readonly EXPIRES_IN = '1h';

  static generateToken(user: TestUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.SECRET,
      { expiresIn: this.EXPIRES_IN }
    );
  }

  static generateExpiredToken(user: TestUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.SECRET,
      { expiresIn: '-1h' }
    );
  }

  static generateInvalidToken(): string {
    return 'invalid.token.here';
  }

  static createTestUser(overrides?: Partial<TestUser>): TestUser {
    return {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      ...overrides,
    };
  }

  static createAdminUser(overrides?: Partial<TestUser>): TestUser {
    return {
      id: 999,
      email: 'admin@example.com',
      role: 'admin',
      ...overrides,
    };
  }
}
