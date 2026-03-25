import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { loadedEnv } from "@/config/load-env";

const JWT_SECRET: Secret = loadedEnv.jwt.accessSecret;
const REFRESH_SECRET: Secret = loadedEnv.jwt.refreshSecret;
const ACCESS_EXPIRES_IN: any = loadedEnv.jwt.accessExpiresIn;
const REFRESH_EXPIRES_IN: any = loadedEnv.jwt.refreshExpiresIn;


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
