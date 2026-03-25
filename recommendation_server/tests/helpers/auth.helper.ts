import jwt, { SignOptions } from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET || 'test_access_secret_key_12345678';
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_key_87654321';

export function generateTestAccessToken(
  userId: number,
  email: string,
  role: string = 'USER',
): string {
  const payload = {
    id: userId,
    email,
    role,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '30m' } as any);
}

export function generateTestRefreshToken(userId: number, email: string): string {
  const payload = {
    id: userId,
    email,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' } as any);
}

export function generateExpiredToken(): string {
  const payload = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '-1h' } as any);
}

export function generateMalformedToken(): string {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid';
}

export function generateTokenWithRole(
  userId: number,
  email: string,
  role: string,
  expiresIn: string = '30m',
): string {
  const payload = {
    id: userId,
    email,
    role,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn } as any);
}

export function verifyTestToken(token: string): any {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function verifyTestRefreshToken(token: string): any {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
