import { planCatalogSearch } from '../../../src/utils/chatbot/chatbot-query-planner';
import {
  createGeminiClient,
  resolveGeminiRuntimeConfig,
} from '../../../src/utils/chatbot/chatbot-sdk';

jest.mock('../../../src/utils/chatbot/chatbot-sdk', () => ({
  createGeminiClient: jest.fn(),
  resolveGeminiRuntimeConfig: jest.fn(),
}));

const mockedCreateGeminiClient = jest.mocked(createGeminiClient);
const mockedResolveGeminiRuntimeConfig = jest.mocked(resolveGeminiRuntimeConfig);

const categories = [
  {
    id: 2,
    name: 'PC - Màn Hình - Màn Hình',
    slug: 'pc-man-hinh-man-hinh',
    leafName: 'Màn Hình',
  },
  {
    id: 3,
    name: 'PC - Màn Hình - PC Gaming',
    slug: 'pc-man-hinh-pc-gaming',
    leafName: 'PC Gaming',
  },
];

describe('chatbot query planner', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedResolveGeminiRuntimeConfig.mockReturnValue({
      apiKey: 'test-key',
      model: 'gemini-3-flash-preview',
      baseUrl: undefined,
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('uses Gemini structured output to build a catalog search plan', async () => {
    const generateContent = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        rewrittenQuery: 'man hinh gaming 27 inch dell',
        matchedCategoryNames: ['PC - Màn Hình - Màn Hình'],
        brands: ['Dell'],
        requiredTerms: ['27 inch'],
        preferredTerms: ['gaming'],
        avoidTerms: ['pc gaming'],
        strictCategory: true,
        strictBrand: true,
        confidence: 0.93,
      }),
    });

    mockedCreateGeminiClient.mockReturnValue({
      models: {
        generateContent,
      },
    } as never);

    const result = await planCatalogSearch('tôi đang tìm màn hình chơi game Dell 27 inch', categories);

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-flash-preview',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
          responseJsonSchema: expect.any(Object),
        }),
      }),
    );
    expect(result).toEqual({
      rewrittenQuery: 'man hinh gaming 27 inch dell',
      matchedCategoryIds: [2],
      matchedCategoryNames: ['PC - Màn Hình - Màn Hình'],
      brands: ['Dell'],
      requiredTerms: ['27 inch'],
      preferredTerms: ['gaming'],
      avoidTerms: ['pc gaming'],
      strictCategory: true,
      strictBrand: true,
      confidence: 0.93,
    });
  });

  it('falls back to heuristics when Gemini planning fails', async () => {
    mockedCreateGeminiClient.mockReturnValue({
      models: {
        generateContent: jest.fn().mockRejectedValue(new Error('Gemini unavailable')),
      },
    } as never);

    const result = await planCatalogSearch('tôi đang tìm màn hình chơi game', categories);

    expect(result.rewrittenQuery).toBe('man hinh gaming');
    expect(result.matchedCategoryIds).toEqual([2]);
    expect(result.matchedCategoryNames).toEqual(['PC - Màn Hình - Màn Hình']);
    expect(result.strictCategory).toBe(true);
  });
});
