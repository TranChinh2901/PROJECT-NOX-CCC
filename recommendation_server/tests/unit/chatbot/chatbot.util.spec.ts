import { GoogleGenAI } from '@google/genai';
import {
  CHATBOT_NOT_CONFIGURED_REPLY,
  buildConversationInput,
  createGeminiClient,
  extractOutputText,
  generateChatbotReply,
  sanitizeConversationHistory,
} from '../../../src/utils/chatbot/chatbot';
import * as chatbotContext from '../../../src/utils/chatbot/chatbot-context';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  __esModule: true,
  GoogleGenAI: jest.fn().mockImplementation(({ apiKey, httpOptions }) => ({
    apiKey,
    httpOptions,
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

jest.mock('../../../src/utils/chatbot/chatbot-context', () => ({
  getChatbotFunctionDeclarations: jest.fn().mockReturnValue([{ name: 'search_products' }]),
  executeChatbotFunctionCall: jest.fn().mockResolvedValue({
    products: [{ id: 10, name: 'Dell UltraSharp 27' }],
  }),
  buildChatbotSystemInstruction: jest.fn((instructions: string) => instructions),
}));

const MockedGoogleGenAI = GoogleGenAI as unknown as jest.Mock;
const mockedGetChatbotFunctionDeclarations = jest.mocked(chatbotContext.getChatbotFunctionDeclarations);
const mockedExecuteChatbotFunctionCall = jest.mocked(chatbotContext.executeChatbotFunctionCall);
const mockedBuildChatbotSystemInstruction = jest.mocked(chatbotContext.buildChatbotSystemInstruction);

describe('chatbot util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedGoogleGenAI.mockClear();
    mockGenerateContent.mockReset();
    mockedGetChatbotFunctionDeclarations.mockReturnValue([{ name: 'search_products' } as never]);
    mockedExecuteChatbotFunctionCall.mockResolvedValue({
      products: [{ id: 10, name: 'Dell UltraSharp 27' }],
    } as never);
    mockedBuildChatbotSystemInstruction.mockImplementation((instructions: string) => instructions);
  });

  it('sanitizes conversation history and keeps the latest supported messages', () => {
    const sanitized = sanitizeConversationHistory([
      { role: 'assistant', content: '  Xin chào  ' },
      { role: 'system', content: 'ignored role becomes user' },
      { role: 'user', content: '' },
      { role: 'user', content: 'Tôi cần tư vấn' },
    ]);

    expect(sanitized).toEqual([
      { role: 'assistant', content: 'Xin chào' },
      { role: 'user', content: 'ignored role becomes user' },
      { role: 'user', content: 'Tôi cần tư vấn' },
    ]);
  });

  it('builds Gemini contents from the conversation history', () => {
    expect(
      buildConversationInput([{ role: 'assistant', content: 'Chào bạn' }], 'Tôi muốn mua tai nghe'),
    ).toEqual([
      {
        role: 'model',
        parts: [{ text: 'Chào bạn' }],
      },
      {
        role: 'user',
        parts: [{ text: 'Tôi muốn mua tai nghe' }],
      },
    ]);
  });

  it('extracts output text from the direct text field', () => {
    expect(extractOutputText({ text: 'Đây là câu trả lời.' })).toBe('Đây là câu trả lời.');
  });

  it('extracts output text from candidate parts when text is absent', () => {
    expect(
      extractOutputText({
        candidates: [
          {
            content: {
              parts: [{ text: 'Đây là phản hồi từ candidate parts.' }],
            },
          },
        ],
      }),
    ).toBe('Đây là phản hồi từ candidate parts.');
  });

  it('returns a graceful placeholder reply when the Gemini key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      generateChatbotReply({
        message: 'Chatbot có hoạt động không?',
        config: {
          apiKey: '',
          model: 'gemini-3-flash-preview',
          chatbotInstructions: 'Bạn là trợ lý mua sắm.',
        },
      }),
    ).resolves.toEqual({
      reply: CHATBOT_NOT_CONFIGURED_REPLY,
      model: 'gemini-3-flash-preview',
      configured: false,
    });

    expect(MockedGoogleGenAI).not.toHaveBeenCalled();
  });

  it('creates Gemini client without overriding the base URL by default', () => {
    createGeminiClient({
      apiKey: 'test-key',
      baseUrl: undefined,
    });

    expect(MockedGoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: {
        timeout: 30000,
      },
    });
  });

  it('allows an optional custom base URL override when one is explicitly configured', () => {
    createGeminiClient({
      apiKey: 'test-key',
      baseUrl: 'https://proxy.example.com',
    });

    expect(MockedGoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: {
        baseUrl: 'https://proxy.example.com',
        timeout: 30000,
      },
    });
  });

  it('calls Gemini generateContent through the official SDK and returns reply text', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Bạn nên xem mẫu laptop mỏng nhẹ 14 inch.',
    });

    await expect(
      generateChatbotReply({
        message: 'Tư vấn laptop đi học',
        history: [{ role: 'assistant', content: 'Chào bạn!' }],
        config: {
          apiKey: 'test-key',
          model: 'gemini-3-flash-preview',
          chatbotInstructions: 'Bạn là trợ lý mua sắm.',
        },
      }),
    ).resolves.toEqual({
      reply: 'Bạn nên xem mẫu laptop mỏng nhẹ 14 inch.',
      model: 'gemini-3-flash-preview',
      configured: true,
    });

    expect(MockedGoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: {
        timeout: 30000,
      },
    });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-flash-preview',
        contents: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            parts: expect.arrayContaining([
              expect.objectContaining({ text: 'Tư vấn laptop đi học' }),
            ]),
          }),
        ]),
        config: {
          systemInstruction: 'Bạn là trợ lý mua sắm.',
          tools: [{ functionDeclarations: [{ name: 'search_products' }] }],
        },
      }),
    );
    expect(mockedGetChatbotFunctionDeclarations).toHaveBeenCalled();
  });

  it('executes Gemini function calls and returns the follow-up text response', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({
        functionCalls: [
          {
            id: 'call-1',
            name: 'search_products',
            args: {
              query: 'màn hình Dell 27 inch',
            },
          },
        ],
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'call-1',
                    name: 'search_products',
                    args: {
                      query: 'màn hình Dell 27 inch',
                    },
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        text: 'Bạn có thể tham khảo Dell UltraSharp 27 vì phù hợp nhu cầu văn phòng.',
      });

    await expect(
      generateChatbotReply({
        message: 'Tư vấn màn hình Dell 27 inch',
        config: {
          apiKey: 'test-key',
          model: 'gemini-3-flash-preview',
          chatbotInstructions: 'Bạn là trợ lý mua sắm.',
        },
        userId: 42,
      }),
    ).resolves.toEqual({
      reply: 'Bạn có thể tham khảo Dell UltraSharp 27 vì phù hợp nhu cầu văn phòng.',
      model: 'gemini-3-flash-preview',
      configured: true,
    });

    expect(mockedExecuteChatbotFunctionCall).toHaveBeenCalledWith(
      {
        id: 'call-1',
        name: 'search_products',
        args: {
          query: 'màn hình Dell 27 inch',
        },
      },
      { userId: 42 },
    );
    expect(mockGenerateContent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        contents: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            parts: expect.arrayContaining([
              expect.objectContaining({
                functionResponse: expect.objectContaining({
                  name: 'search_products',
                  id: 'call-1',
                }),
              }),
            ]),
          }),
        ]),
      }),
    );
  });
});
