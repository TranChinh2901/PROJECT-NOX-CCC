import { createGeminiClient, resolveGeminiRuntimeConfig } from '@/utils/chatbot/chatbot-sdk';
import { loadedEnv } from '@/config/load-env';

export type StorefrontSearchCategoryOption = {
  id: number;
  name: string;
  leafName: string;
};

export type StorefrontSearchPlan = {
  rewrittenQuery: string;
  categoryIds: number[];
  brandNames: string[];
  queryVariants: string[];
  requiredTerms: string[];
  preferredTerms: string[];
  avoidTerms: string[];
  strictCategory: boolean;
  strictBrand: boolean;
  confidence: number;
};

type GeminiStorefrontSearchPlan = {
  rewrittenQuery?: unknown;
  matchedCategoryNames?: unknown;
  brandNames?: unknown;
  queryVariants?: unknown;
  requiredTerms?: unknown;
  preferredTerms?: unknown;
  avoidTerms?: unknown;
  strictCategory?: unknown;
  strictBrand?: unknown;
  confidence?: unknown;
};

const MAX_ARRAY_VALUES = 8;
const DEFAULT_STOREFRONT_TIMEOUT_MS = 1200;
const DEFAULT_STOREFRONT_MIN_CONFIDENCE = 0.7;
const CONVERSATIONAL_HINTS = ['phu hop', 'nen mua', 'cho cong viec', 'cho hoc tap', 'cho gaming', 'cho stream', 'cho creator'];

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/đ/gi, (char) => (char === 'Đ' ? 'D' : 'd'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeArray = (value: unknown): string[] =>
  Array.from(
    new Set(
      Array.isArray(value)
        ? value
            .map((item) => normalizeText(item))
            .filter(Boolean)
            .slice(0, MAX_ARRAY_VALUES)
        : [],
    ),
  );

const toBoolean = (value: unknown): boolean => value === true;

const toConfidence = (value: unknown): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(1, numericValue));
};

const timeoutAfter = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    return await Promise.race<T | null>([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const shouldAttemptGeminiPlanning = (query: string, categoryMatchedByHeuristics: boolean): boolean => {
  if (!loadedEnv.gemini.storefrontSearchEnabled || categoryMatchedByHeuristics) {
    return false;
  }

  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || normalizedQuery.length < 4) {
    return false;
  }

  const tokenCount = normalizedQuery.split(' ').length;
  return tokenCount >= 3 || CONVERSATIONAL_HINTS.some((hint) => normalizedQuery.includes(hint));
};

const buildResponseSchema = (categories: StorefrontSearchCategoryOption[]) => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    rewrittenQuery: { type: 'string' },
    matchedCategoryNames: {
      type: 'array',
      items: {
        type: 'string',
        enum: categories.map((category) => category.name),
      },
      maxItems: Math.min(MAX_ARRAY_VALUES, categories.length),
    },
    brandNames: { type: 'array', items: { type: 'string' }, maxItems: MAX_ARRAY_VALUES },
    queryVariants: { type: 'array', items: { type: 'string' }, maxItems: MAX_ARRAY_VALUES },
    requiredTerms: { type: 'array', items: { type: 'string' }, maxItems: MAX_ARRAY_VALUES },
    preferredTerms: { type: 'array', items: { type: 'string' }, maxItems: MAX_ARRAY_VALUES },
    avoidTerms: { type: 'array', items: { type: 'string' }, maxItems: MAX_ARRAY_VALUES },
    strictCategory: { type: 'boolean' },
    strictBrand: { type: 'boolean' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'rewrittenQuery',
    'matchedCategoryNames',
    'brandNames',
    'queryVariants',
    'requiredTerms',
    'preferredTerms',
    'avoidTerms',
    'strictCategory',
    'strictBrand',
    'confidence',
  ],
});

const buildPrompt = (query: string, categories: StorefrontSearchCategoryOption[]): string =>
  [
    'You help a Vietnamese electronics storefront broaden ambiguous or conversational searches.',
    'Return JSON only.',
    'Your job is to suggest category names from the provided list, a concise rewritten query, and optional ranking hints.',
    'Do not invent categories. Keep rewrites short and retrieval-oriented.',
    'If the user clearly needs a product family, set strictCategory=true.',
    'AVAILABLE_CATEGORIES:',
    ...categories.map((category) => `- ${category.name} (leaf: ${category.leafName})`),
    `USER_QUERY: ${query}`,
  ].join('\n');

const parseGeminiPlan = (
  payload: GeminiStorefrontSearchPlan,
  categories: StorefrontSearchCategoryOption[],
  originalQuery: string,
): StorefrontSearchPlan => {
  const categoryIdByNormalizedName = new Map(
    categories.flatMap((category) => [
      [normalizeText(category.name), category.id] as const,
      [normalizeText(category.leafName), category.id] as const,
    ]),
  );
  const categoryIds = Array.from(
    new Set(
      normalizeArray(payload.matchedCategoryNames)
        .map((name) => categoryIdByNormalizedName.get(name))
        .filter((value): value is number => Number.isInteger(value)),
    ),
  );

  return {
    rewrittenQuery: String(payload.rewrittenQuery ?? '').trim() || originalQuery.trim(),
    categoryIds,
    brandNames: normalizeArray(payload.brandNames),
    queryVariants: normalizeArray(payload.queryVariants),
    requiredTerms: normalizeArray(payload.requiredTerms),
    preferredTerms: normalizeArray(payload.preferredTerms),
    avoidTerms: normalizeArray(payload.avoidTerms),
    strictCategory: toBoolean(payload.strictCategory),
    strictBrand: toBoolean(payload.strictBrand),
    confidence: toConfidence(payload.confidence),
  };
};

export const maybePlanStorefrontSearch = async (
  query: string,
  categories: StorefrontSearchCategoryOption[],
  options: { categoryMatchedByHeuristics: boolean },
): Promise<StorefrontSearchPlan | null> => {
  if (!shouldAttemptGeminiPlanning(query, options.categoryMatchedByHeuristics) || categories.length === 0) {
    return null;
  }

  const runtimeConfig = resolveGeminiRuntimeConfig();
  if (!runtimeConfig.apiKey) {
    return null;
  }

  try {
    const client = createGeminiClient({
      apiKey: runtimeConfig.apiKey,
      baseUrl: runtimeConfig.baseUrl,
    });

    const response = await timeoutAfter(
      client.models.generateContent({
        model: runtimeConfig.model,
        contents: buildPrompt(query, categories),
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: buildResponseSchema(categories),
        },
      }),
      loadedEnv.gemini.storefrontSearchTimeoutMs ?? DEFAULT_STOREFRONT_TIMEOUT_MS,
    );

    const responseText = response?.text?.trim();
    if (!responseText) {
      return null;
    }

    const plan = parseGeminiPlan(JSON.parse(responseText) as GeminiStorefrontSearchPlan, categories, query);
    if (plan.confidence < (loadedEnv.gemini.storefrontSearchMinConfidence ?? DEFAULT_STOREFRONT_MIN_CONFIDENCE)) {
      return null;
    }

    return plan;
  } catch (error) {
    console.warn('Storefront Gemini search planning failed, falling back to deterministic search:', error);
    return null;
  }
};
