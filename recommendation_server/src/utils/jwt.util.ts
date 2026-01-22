import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_EXPIRES_IN: any = process.env.ACCESS_TOKEN_EXPIRES_IN || '30m';
const REFRESH_EXPIRES_IN: any = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';


export const JwtUtils = {
  generateAccessToken(payload: string | object | Buffer): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  },

  generateRefreshToken(payload: string | object | Buffer): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  },

  verifyAccessToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
  },

  verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_SECRET);
  }
};
