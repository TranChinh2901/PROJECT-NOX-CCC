import { createGeminiClient, resolveGeminiRuntimeConfig } from '@/utils/chatbot/chatbot-sdk';

export type CatalogCategoryOption = {
  id: number;
  name: string;
  slug: string;
  leafName: string;
};

export type CatalogSearchPlan = {
  rewrittenQuery: string;
  matchedCategoryIds: number[];
  matchedCategoryNames: string[];
  brands: string[];
  requiredTerms: string[];
  preferredTerms: string[];
  avoidTerms: string[];
  strictCategory: boolean;
  strictBrand: boolean;
  confidence: number;
};

type GeminiCatalogSearchPlan = {
  rewrittenQuery?: unknown;
  matchedCategoryNames?: unknown;
  brands?: unknown;
  requiredTerms?: unknown;
  preferredTerms?: unknown;
  avoidTerms?: unknown;
  strictCategory?: unknown;
  strictBrand?: unknown;
  confidence?: unknown;
};

const QUERY_NOISE_PREFIXES = [
  'toi dang tim',
  'toi can tim',
  'toi muon tim',
  'toi muon mua',
  'toi dang can',
  'toi can',
  'minh dang tim',
  'minh can tim',
  'minh can',
  'em dang tim',
  'em can tim',
  'em can',
  'cho minh xem',
  'cho toi xem',
  'cho minh',
  'cho toi',
  'tim cho toi',
  'can mua',
];

const QUERY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bchoi game\b/g, 'gaming'],
  [/\bdanh choi game\b/g, 'gaming'],
  [/\bcho game\b/g, 'gaming'],
];

const STATIC_CATEGORY_ALIASES: Record<string, string[]> = {
  'màn hình': ['monitor', 'display', 'screen'],
  'pc gaming': ['gaming pc', 'desktop gaming'],
  'laptop gaming': ['gaming laptop'],
  'điện thoại gaming': ['gaming phone'],
  'đồng hồ thông minh': ['smartwatch', 'watch'],
  'tai nghe': ['headphone', 'earbuds', 'tai nghe'],
  loa: ['speaker'],
  ipad: ['tablet apple'],
  'tablet android': ['android tablet'],
};

const MAX_ARRAY_VALUES = 8;

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/đ/gi, (char) => (char === 'Đ' ? 'D' : 'd'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getLeafCategoryName = (value: string): string => {
  const parts = value
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[parts.length - 1] ?? value;
};

const stripNoisePrefixes = (value: string): string => {
  let nextValue = value;

  while (nextValue) {
    const matchedPrefix = QUERY_NOISE_PREFIXES.find((prefix) => nextValue.startsWith(`${prefix} `));
    if (!matchedPrefix) {
      break;
    }

    nextValue = nextValue.slice(matchedPrefix.length).trim();
  }

  return nextValue;
};

const rewriteQuery = (query: string): string =>
  QUERY_REPLACEMENTS.reduce((currentValue, [pattern, replacement]) => currentValue.replace(pattern, replacement).trim(), query);

const normalizeArray = (value: unknown): string[] =>
  Array.from(
    new Set(
      Array.isArray(value)
        ? value
            .map((item) => String(item ?? '').trim())
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

const buildCategoryAliasMap = (categories: CatalogCategoryOption[]) =>
  new Map(
    categories.map((category) => [
      category.id,
      Array.from(
        new Set(
          [
            normalizeText(category.name),
            normalizeText(category.leafName),
            ...(STATIC_CATEGORY_ALIASES[normalizeText(category.leafName)] ?? []),
          ].map((alias) => normalizeText(alias)).filter(Boolean),
        ),
      ),
    ]),
  );

const buildFallbackCatalogSearchPlan = (
  query: string,
  categories: CatalogCategoryOption[],
): CatalogSearchPlan => {
  const normalizedQuery = normalizeText(query);
  const cleanedQuery = rewriteQuery(stripNoisePrefixes(normalizedQuery) || normalizedQuery);
  const categoryAliases = buildCategoryAliasMap(categories);
  const matchedCategories = categories.filter((category) => {
    const aliases = categoryAliases.get(category.id) ?? [];
    return aliases.some((alias) => alias.length >= 2 && cleanedQuery.includes(alias));
  });

  return {
    rewrittenQuery: cleanedQuery || query.trim(),
    matchedCategoryIds: matchedCategories.map((category) => category.id),
    matchedCategoryNames: matchedCategories.map((category) => category.name),
    brands: [],
    requiredTerms: [],
    preferredTerms: [],
    avoidTerms: [],
    strictCategory: matchedCategories.length > 0,
    strictBrand: false,
    confidence: matchedCategories.length > 0 ? 0.55 : 0,
  };
};

const buildResponseSchema = (categories: CatalogCategoryOption[]) => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    rewrittenQuery: {
      type: 'string',
      description: 'A short rewritten product-search query optimized for catalog matching.',
    },
    matchedCategoryNames: {
      type: 'array',
      description: 'The most relevant categories from the provided catalog list.',
      items: {
        type: 'string',
        enum: categories.map((category) => category.name),
      },
      maxItems: Math.min(MAX_ARRAY_VALUES, categories.length),
    },
    brands: {
      type: 'array',
      description: 'Explicit brand constraints mentioned by the customer.',
      items: { type: 'string' },
      maxItems: MAX_ARRAY_VALUES,
    },
    requiredTerms: {
      type: 'array',
      description: 'Hard constraints that should strongly affect retrieval.',
      items: { type: 'string' },
      maxItems: MAX_ARRAY_VALUES,
    },
    preferredTerms: {
      type: 'array',
      description: 'Soft preferences, use-cases, or ranking hints.',
      items: { type: 'string' },
      maxItems: MAX_ARRAY_VALUES,
    },
    avoidTerms: {
      type: 'array',
      description: 'Terms or product types the customer wants to avoid.',
      items: { type: 'string' },
      maxItems: MAX_ARRAY_VALUES,
    },
    strictCategory: {
      type: 'boolean',
      description: 'True when search should stay inside the chosen categories and avoid adjacent categories.',
    },
    strictBrand: {
      type: 'boolean',
      description: 'True when the user clearly requires an explicit brand.',
    },
    confidence: {
      type: 'number',
      description: 'Confidence from 0 to 1 for the category and filter interpretation.',
      minimum: 0,
      maximum: 1,
    },
  },
  required: ['rewrittenQuery', 'matchedCategoryNames', 'brands', 'requiredTerms', 'preferredTerms', 'avoidTerms', 'strictCategory', 'strictBrand', 'confidence'],
});

const buildPrompt = (query: string, categories: CatalogCategoryOption[]): string =>
  [
    'You normalize Vietnamese ecommerce product-search queries for a catalog retrieval system.',
    'Return JSON only.',
    'Use structured-output best practices: keep the rewrite concise, pick categories only from the provided list, and separate hard constraints from soft preferences.',
    'If the user clearly names a product family, set strictCategory=true so adjacent categories do not override it.',
    'If the user clearly names a brand, set strictBrand=true.',
    'Use preferredTerms for use cases like gaming, office, học tập, creator, travel, etc.',
    'AVAILABLE_CATEGORIES:',
    ...categories.map((category) => `- ${category.name} (leaf: ${category.leafName})`),
    `USER_QUERY: ${query}`,
  ].join('\n');

const parseGeminiCatalogSearchPlan = (
  payload: GeminiCatalogSearchPlan,
  categories: CatalogCategoryOption[],
  originalQuery: string,
): CatalogSearchPlan => {
  const categoryNameSet = new Set(categories.map((category) => category.name));
  const matchedCategoryNames = normalizeArray(payload.matchedCategoryNames).filter((name) => categoryNameSet.has(name));
  const matchedCategoryIds = categories
    .filter((category) => matchedCategoryNames.includes(category.name))
    .map((category) => category.id);

  return {
    rewrittenQuery: String(payload.rewrittenQuery ?? '').trim() || originalQuery.trim(),
    matchedCategoryIds,
    matchedCategoryNames,
    brands: normalizeArray(payload.brands),
    requiredTerms: normalizeArray(payload.requiredTerms),
    preferredTerms: normalizeArray(payload.preferredTerms),
    avoidTerms: normalizeArray(payload.avoidTerms),
    strictCategory: toBoolean(payload.strictCategory),
    strictBrand: toBoolean(payload.strictBrand),
    confidence: toConfidence(payload.confidence),
  };
};

const requestGeminiCatalogSearchPlan = async (
  query: string,
  categories: CatalogCategoryOption[],
): Promise<CatalogSearchPlan | null> => {
  const runtimeConfig = resolveGeminiRuntimeConfig();
  if (!runtimeConfig.apiKey || categories.length === 0) {
    return null;
  }

  const client = createGeminiClient({
    apiKey: runtimeConfig.apiKey,
    baseUrl: runtimeConfig.baseUrl,
  });

  const response = await client.models.generateContent({
    model: runtimeConfig.model,
    contents: buildPrompt(query, categories),
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseJsonSchema: buildResponseSchema(categories),
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    return null;
  }

  return parseGeminiCatalogSearchPlan(JSON.parse(responseText) as GeminiCatalogSearchPlan, categories, query);
};

export const planCatalogSearch = async (
  query: string,
  categories: CatalogCategoryOption[],
): Promise<CatalogSearchPlan> => {
  try {
    const geminiPlan = await requestGeminiCatalogSearchPlan(query, categories);
    if (geminiPlan) {
      return geminiPlan;
    }
  } catch (error) {
    console.warn('Falling back to heuristic catalog search planning:', error);
  }

  return buildFallbackCatalogSearchPlan(query, categories);
};
