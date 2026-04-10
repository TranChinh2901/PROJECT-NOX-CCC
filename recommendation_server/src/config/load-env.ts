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

const toPort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const loadedEnv = {
  port: toPort(process.env.PORT, 5000),
  db: {
    type: firstDefinedOr("mariadb", process.env.DATABASE_TYPE, process.env.DB_TYPE) as "mysql" | "mariadb",
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
    productImagesFolder: firstDefinedOr("products", process.env.CLOUDINARY_PRODUCT_IMAGES_FOLDER),
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    productImagesBucket: firstDefinedOr("product-images", process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS),
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: process.env.MOMO_ENDPOINT,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  gemini: {
    apiKey: firstDefined(process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY),
    model: firstDefinedOr('gemini-3-flash-preview', process.env.GEMINI_MODEL),
    baseUrl: firstDefined(process.env.GEMINI_BASE_URL)?.replace(/\/$/, ''),
    chatbotInstructions: firstDefinedOr(
      [
        'Bạn là trợ lý mua sắm AI của TechNova.',
        'Hãy trả lời ngắn gọn, hữu ích và thân thiện bằng tiếng Việt mặc định.',
        'Chỉ khẳng định những gì bạn biết từ ngữ cảnh hội thoại hiện tại; nếu thiếu dữ liệu cụ thể về tồn kho, giá hoặc đơn hàng, hãy nói rõ giới hạn đó.',
        'Ưu tiên hỗ trợ về sản phẩm công nghệ, gợi ý mua hàng, chính sách mua sắm, vận chuyển và hỗ trợ sau bán.',
      ].join(' '),
      process.env.GEMINI_CHATBOT_INSTRUCTIONS,
    ),
  },
  recommendation: {
    schedulerEnabled: firstDefinedOr('false', process.env.RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED) === 'true',
    refreshIntervalMinutes: toNumber(process.env.RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES, 360),
    runOnStart: firstDefinedOr('false', process.env.RECOMMENDATION_PIPELINE_RUN_ON_START) === 'true',
    days: toNumber(process.env.RECOMMENDATION_PIPELINE_LOOKBACK_DAYS, 180),
    topK: toNumber(process.env.RECOMMENDATION_PIPELINE_TOP_K, 20),
    topN: toNumber(process.env.RECOMMENDATION_PIPELINE_TOP_N, 10),
    ttlHours: toNumber(process.env.RECOMMENDATION_PIPELINE_TTL_HOURS, 24),
    algorithm: firstDefinedOr('offline_model', process.env.RECOMMENDATION_PIPELINE_ALGORITHM),
  },
};
