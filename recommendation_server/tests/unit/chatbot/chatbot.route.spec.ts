import 'reflect-metadata';
import { chatbotMessageHandler } from '../../../src/routes/chatbot';
import { createMockRequest, createMockResponse } from '../../helpers/express.mock';
import * as chatbot from '../../../src/utils/chatbot/chatbot';
import { HttpStatusCode } from '../../../src/constants/status-code';

jest.mock('../../../src/utils/chatbot/chatbot', () => ({
  CHATBOT_MAX_MESSAGE_LENGTH: 2000,
  generateChatbotReply: jest.fn(),
  sanitizeConversationHistory: jest.fn((history) => (Array.isArray(history) ? history : [])),
}));

describe('chatbotMessageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns BAD_REQUEST when message is missing', async () => {
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    await chatbotMessageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'message là bắt buộc',
        data: null,
      }),
    );
  });

  it('returns a graceful placeholder reply when chatbot config is missing', async () => {
    const req = createMockRequest({ body: { message: 'Xin chào' } });
    const res = createMockResponse();

    jest.mocked(chatbot.generateChatbotReply).mockResolvedValue({
      configured: false,
      reply:
        'Chatbot hiện chưa sẵn sàng vì server chưa được cấu hình OPENAI_API_KEY. Vui lòng thêm API key rồi thử lại.',
      model: 'gpt-5.4-mini',
    });

    await chatbotMessageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configured: false,
          model: 'gpt-5.4-mini',
        }),
      }),
    );
  });

  it('returns assistant reply when chatbot is configured', async () => {
    const req = createMockRequest({
      body: {
        message: 'Tư vấn giúp tôi một laptop mỏng nhẹ',
        history: [{ role: 'assistant', content: 'Chào bạn!' }],
      },
    });
    const res = createMockResponse();

    jest.mocked(chatbot.generateChatbotReply).mockResolvedValue({
      reply: 'Bạn có thể tham khảo dòng ultrabook 14 inch.',
      model: 'gpt-5.4-mini',
      configured: true,
    });

    await chatbotMessageHandler(req, res);

    expect(chatbot.sanitizeConversationHistory).toHaveBeenCalledWith([{ role: 'assistant', content: 'Chào bạn!' }]);
    expect(chatbot.generateChatbotReply).toHaveBeenCalledWith({
      message: 'Tư vấn giúp tôi một laptop mỏng nhẹ',
      history: [{ role: 'assistant', content: 'Chào bạn!' }],
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configured: true,
          reply: 'Bạn có thể tham khảo dòng ultrabook 14 inch.',
          model: 'gpt-5.4-mini',
        }),
      }),
    );
  });
});
