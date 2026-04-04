import 'reflect-metadata';
import { chatbotMessageHandler } from '../../../src/routes/chatbot';
import { createMockRequest, createMockResponse } from '../../helpers/express.mock';
import * as chatbot from '../../../src/utils/chatbot/chatbot';
import { HttpStatusCode } from '../../../src/constants/status-code';
import authService from '../../../src/modules/auth/auth.service';
import { RoleType } from '../../../src/modules/auth/enum/auth.enum';

jest.mock('../../../src/utils/chatbot/chatbot', () => ({
  CHATBOT_MAX_MESSAGE_LENGTH: 2000,
  generateChatbotReply: jest.fn(),
  sanitizeConversationHistory: jest.fn((history) => (Array.isArray(history) ? history : [])),
}));

jest.mock('../../../src/modules/auth/auth.service', () => ({
  __esModule: true,
  default: {
    verifyToken: jest.fn(),
  },
}));

describe('chatbotMessageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(authService.verifyToken).mockReturnValue(null);
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
        'Chatbot hiện chưa sẵn sàng vì server chưa được cấu hình GEMINI_API_KEY. Vui lòng thêm API key rồi thử lại.',
      model: 'gemini-3-flash-preview',
    });

    await chatbotMessageHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configured: false,
          model: 'gemini-3-flash-preview',
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
      model: 'gemini-3-flash-preview',
      configured: true,
    });

    await chatbotMessageHandler(req, res);

    expect(chatbot.sanitizeConversationHistory).toHaveBeenCalledWith([{ role: 'assistant', content: 'Chào bạn!' }]);
    expect(chatbot.generateChatbotReply).toHaveBeenCalledWith({
      message: 'Tư vấn giúp tôi một laptop mỏng nhẹ',
      history: [{ role: 'assistant', content: 'Chào bạn!' }],
      userId: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configured: true,
          reply: 'Bạn có thể tham khảo dòng ultrabook 14 inch.',
          model: 'gemini-3-flash-preview',
        }),
      }),
    );
  });

  it('passes authenticated user id into chatbot generation when a bearer token is present', async () => {
    const req = createMockRequest({
      body: {
        message: 'Don hang cua toi dang o dau?',
      },
      headers: {
        authorization: 'Bearer valid-token',
      },
    });
    const res = createMockResponse();

    jest.mocked(authService.verifyToken).mockReturnValue({
      id: 42,
      email: 'buyer@example.com',
      role: RoleType.USER,
    });
    jest.mocked(chatbot.generateChatbotReply).mockResolvedValue({
      reply: 'Đơn hàng gần nhất của bạn đang được xử lý.',
      model: 'gemini-3-flash-preview',
      configured: true,
    });

    await chatbotMessageHandler(req, res);

    expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(chatbot.generateChatbotReply).toHaveBeenCalledWith({
      message: 'Don hang cua toi dang o dau?',
      history: [],
      userId: 42,
    });
  });
});
