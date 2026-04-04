import OpenAI from 'openai';
import {
  CHATBOT_NOT_CONFIGURED_REPLY,
  buildConversationInput,
  createOpenAIClient,
  extractOutputText,
  generateChatbotReply,
  sanitizeConversationHistory,
} from '../../../src/utils/chatbot/chatbot';

const mockResponsesCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ apiKey, baseURL, timeout }) => ({
    apiKey,
    baseURL,
    timeout,
    responses: {
      create: mockResponsesCreate,
    },
  })),
}));

const MockedOpenAI = OpenAI as unknown as jest.Mock;

describe('chatbot util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedOpenAI.mockClear();
    mockResponsesCreate.mockReset();
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

  it('builds structured conversation input for the Responses API', () => {
    expect(
      buildConversationInput([{ role: 'assistant', content: 'Chào bạn' }], 'Tôi muốn mua tai nghe'),
    ).toEqual([
      {
        role: 'assistant',
        content: [{ type: 'input_text', text: 'Chào bạn' }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: 'Tôi muốn mua tai nghe' }],
      },
    ]);
  });

  it('extracts output text from the direct output_text field', () => {
    expect(extractOutputText({ output_text: 'Đây là câu trả lời.' })).toBe('Đây là câu trả lời.');
  });

  it('extracts output text from output content items when output_text is absent', () => {
    expect(
      extractOutputText({
        output: [
          {
            content: [
              { type: 'output_text', text: 'Đây là phản hồi từ output content.' },
            ],
          },
        ],
      }),
    ).toBe('Đây là phản hồi từ output content.');
  });

  it('returns a graceful placeholder reply when the OpenAI key is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      generateChatbotReply({
        message: 'Chatbot có hoạt động không?',
        config: {
          apiKey: '',
          model: 'gpt-5.4-mini',
          chatbotInstructions: 'Bạn là trợ lý mua sắm.',
        },
      }),
    ).resolves.toEqual({
      reply: CHATBOT_NOT_CONFIGURED_REPLY,
      model: 'gpt-5.4-mini',
      configured: false,
    });

    expect(MockedOpenAI).not.toHaveBeenCalled();
  });

  it('creates OpenAI client without overriding the base URL by default', () => {
    createOpenAIClient({
      apiKey: 'test-key',
      baseUrl: undefined,
    });

    expect(MockedOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      timeout: 30000,
    });
  });

  it('ignores the official default base URL when it is passed explicitly', () => {
    createOpenAIClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
    });

    expect(MockedOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      timeout: 30000,
    });
  });

  it('allows an optional custom base URL override when one is explicitly configured', () => {
    createOpenAIClient({
      apiKey: 'test-key',
      baseUrl: 'https://proxy.example.com/v1',
    });

    expect(MockedOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://proxy.example.com/v1',
      timeout: 30000,
    });
  });

  it('calls OpenAI Responses API through the official SDK and returns reply text', async () => {
    mockResponsesCreate.mockResolvedValue({
      output_text: 'Bạn nên xem mẫu laptop mỏng nhẹ 14 inch.',
    });

    await expect(
      generateChatbotReply({
        message: 'Tư vấn laptop đi học',
        history: [{ role: 'assistant', content: 'Chào bạn!' }],
        config: {
          apiKey: 'test-key',
          model: 'gpt-5.4-mini',
          chatbotInstructions: 'Bạn là trợ lý mua sắm.',
        },
      }),
    ).resolves.toEqual({
      reply: 'Bạn nên xem mẫu laptop mỏng nhẹ 14 inch.',
      model: 'gpt-5.4-mini',
      configured: true,
    });

    expect(MockedOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      timeout: 30000,
    });
    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
        input: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({ text: 'Tư vấn laptop đi học' }),
            ]),
          }),
        ]),
      }),
    );
  });
});
