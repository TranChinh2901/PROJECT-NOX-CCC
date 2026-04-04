import { Request, Response, Router } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import { asyncHandle } from '@/utils/handle-error';
import { CHATBOT_MAX_MESSAGE_LENGTH, generateChatbotReply, sanitizeConversationHistory } from '@/utils/chatbot/chatbot';

type ChatbotRequestBody = {
  message?: string;
  history?: unknown;
};

const router = Router();

const getMessageFromBody = (body: ChatbotRequestBody): string =>
  typeof body.message === 'string' ? body.message.trim() : '';

export const chatbotMessageHandler = async (req: Request, res: Response): Promise<Response> => {
  const body = (req.body || {}) as ChatbotRequestBody;
  const message = getMessageFromBody(body);

  if (!message) {
    return new AppResponse({
      message: 'message là bắt buộc',
      statusCode: HttpStatusCode.BAD_REQUEST,
      data: null,
    }).sendResponse(res);
  }

  if (message.length > CHATBOT_MAX_MESSAGE_LENGTH) {
    return new AppResponse({
      message: `message không được vượt quá ${CHATBOT_MAX_MESSAGE_LENGTH} ký tự`,
      statusCode: HttpStatusCode.BAD_REQUEST,
      data: null,
    }).sendResponse(res);
  }

  const history = sanitizeConversationHistory(body.history);
  const result = await generateChatbotReply({ message, history });

  return new AppResponse({
    message: result.configured
      ? 'Chatbot phản hồi thành công'
      : 'OpenAI chatbot chưa được cấu hình trên server',
    statusCode: HttpStatusCode.OK,
    data: result,
  }).sendResponse(res);
};

router.post('/message', asyncHandle(chatbotMessageHandler));

export default router;
