const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const parseAllowedOrigins = (): string[] =>
  (process.env.CORS_ORIGIN || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isLocalDevelopmentOrigin = (origin: string): boolean => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

export const isRequestOriginAllowed = (origin?: string): boolean => {
  if (!origin) {
    return true;
  }

  return parseAllowedOrigins().includes(origin) || isLocalDevelopmentOrigin(origin);
};
