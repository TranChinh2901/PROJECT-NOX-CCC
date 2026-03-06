import dotenv from "dotenv";

dotenv.config();

const firstDefined = (...values: Array<string | undefined>): string | undefined =>
  values.find((value) => value !== undefined && value !== "");

const firstDefinedOr = (fallback: string, ...values: Array<string | undefined>): string =>
  firstDefined(...values) ?? fallback;

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const loadedEnv = {
  port: firstDefined(process.env.PORT, "5000"),
  db: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    accessSecret: firstDefinedOr("access_secret", process.env.ACCESS_TOKEN_SECRET, process.env.JWT_SECRET),
    refreshSecret: firstDefinedOr("refresh_secret", process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_SECRET),
    accessExpiresIn: firstDefinedOr("30m", process.env.ACCESS_TOKEN_EXPIRES_IN, process.env.ACCESS_EXPIRES_IN),
    refreshExpiresIn: firstDefinedOr("7d", process.env.REFRESH_TOKEN_EXPIRES_IN, process.env.REFRESH_EXPIRES_IN),
  },
  cloudinary: {
    name: process.env.CLOUD_NAME,
    key: process.env.CLOUD_KEY,
    secret: process.env.CLOUD_SECRET,
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: process.env.MOMO_ENDPOINT,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL,
  },
};
