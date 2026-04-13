import { maybePlanStorefrontSearch } from '../../../src/modules/products/product-search-planner';
import { createGeminiClient, resolveGeminiRuntimeConfig } from '../../../src/utils/chatbot/chatbot-sdk';
import { loadedEnv } from '../../../src/config/load-env';

jest.mock('../../../src/utils/chatbot/chatbot-sdk', () => ({
  createGeminiClient: jest.fn(),
  resolveGeminiRuntimeConfig: jest.fn(),
}));

jest.mock('../../../src/config/load-env', () => ({
  loadedEnv: {
    gemini: {
      storefrontSearchEnabled: true,
      storefrontSearchTimeoutMs: 50,
      storefrontSearchMinConfidence: 0.7,
    },
  },
}));

const mockedCreateGeminiClient = jest.mocked(createGeminiClient);
const mockedResolveGeminiRuntimeConfig = jest.mocked(resolveGeminiRuntimeConfig);
const mockedLoadedEnv = loadedEnv as {
  gemini: {
    storefrontSearchEnabled: boolean;
    storefrontSearchTimeoutMs: number;
    storefrontSearchMinConfidence: number;
  };
};

const categories = [
  { id: 1, name: 'PC Gaming', leafName: 'PC Gaming' },
  { id: 2, name: 'Tai Nghe', leafName: 'Tai Nghe' },
];

describe('product storefront search planner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadedEnv.gemini.storefrontSearchEnabled = true;
    mockedLoadedEnv.gemini.storefrontSearchTimeoutMs = 50;
    mockedLoadedEnv.gemini.storefrontSearchMinConfidence = 0.7;
    mockedResolveGeminiRuntimeConfig.mockReturnValue({
      apiKey: 'test-key',
      model: 'gemini-3-flash-preview',
      embeddingModel: 'gemini-embedding-2-preview',
      embeddingOutputDimensionality: undefined,
      baseUrl: undefined,
    });
  });

  it('does not call Gemini when heuristics already matched a category', async () => {
    const result = await maybePlanStorefrontSearch('tai nghe cho làm việc', categories, {
      categoryMatchedByHeuristics: true,
    });

    expect(result).toBeNull();
    expect(mockedCreateGeminiClient).not.toHaveBeenCalled();
  });

  it('returns null when Gemini confidence is below the storefront threshold', async () => {
    mockedCreateGeminiClient.mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: JSON.stringify({
            rewrittenQuery: 'pc creator stream gaming',
            matchedCategoryNames: ['PC Gaming'],
            brandNames: [],
            queryVariants: ['pc stream creator'],
            requiredTerms: [],
            preferredTerms: ['stream'],
            avoidTerms: [],
            strictCategory: true,
            strictBrand: false,
            confidence: 0.5,
          }),
        }),
      },
    } as never);

    const result = await maybePlanStorefrontSearch('máy nào phù hợp để stream game', categories, {
      categoryMatchedByHeuristics: false,
    });

    expect(result).toBeNull();
  });

  it('returns a parsed storefront plan when Gemini responds with high confidence', async () => {
    mockedCreateGeminiClient.mockReturnValue({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: JSON.stringify({
            rewrittenQuery: 'pc creator stream gaming',
            matchedCategoryNames: ['PC Gaming'],
            brandNames: ['noxpc'],
            queryVariants: ['pc stream creator'],
            requiredTerms: [],
            preferredTerms: ['stream', 'creator'],
            avoidTerms: [],
            strictCategory: true,
            strictBrand: false,
            confidence: 0.92,
          }),
        }),
      },
    } as never);

    const result = await maybePlanStorefrontSearch('máy nào phù hợp để stream game', categories, {
      categoryMatchedByHeuristics: false,
    });

    expect(result).toEqual({
      rewrittenQuery: 'pc creator stream gaming',
      categoryIds: [1],
      brandNames: ['noxpc'],
      queryVariants: ['pc stream creator'],
      requiredTerms: [],
      preferredTerms: ['stream', 'creator'],
      avoidTerms: [],
      strictCategory: true,
      strictBrand: false,
      confidence: 0.92,
    });
  });
});
