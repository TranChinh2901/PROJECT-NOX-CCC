import { Request, Response, Router } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import authService from '@/modules/auth/auth.service';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { asyncHandle } from '@/utils/handle-error';
import {
  CHATBOT_MAX_MESSAGE_LENGTH,
  CHATBOT_TEMPORARY_UNAVAILABLE_REPLY,
  generateChatbotReply,
  sanitizeConversationContents,
  sanitizeConversationHistory,
} from '@/utils/chatbot/chatbot';

type ChatbotRequestBody = {
  message?: string;
  history?: unknown;
  historyContents?: unknown;
};

const router = Router();

const getMessageFromBody = (body: ChatbotRequestBody): string =>
  typeof body.message === 'string' ? body.message.trim() : '';

const attachOptionalUser = (req: AuthenticatedRequest): void => {
  if (req.user) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return;
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return;
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role as RoleType,
  };
};

export const chatbotMessageHandler = async (req: Request, res: Response): Promise<Response> => {
  const authenticatedRequest = req as AuthenticatedRequest;
  attachOptionalUser(authenticatedRequest);

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
  const historyContents = sanitizeConversationContents(body.historyContents);
  let result;

  try {
    result = await generateChatbotReply({
      message,
      history,
      historyContents,
      userId: authenticatedRequest.user?.id,
    });
  } catch (error) {
    console.error('Chatbot request failed:', error);
    result = {
      reply: CHATBOT_TEMPORARY_UNAVAILABLE_REPLY,
      model: 'gemini-3-flash',
      configured: true,
      historyContents: [],
    };
  }

  return new AppResponse({
    message: result.configured
      ? 'Chatbot phản hồi thành công'
      : 'Gemini chatbot chưa được cấu hình trên server',
    statusCode: HttpStatusCode.OK,
    data: result,
  }).sendResponse(res);
};

router.post('/message', asyncHandle(chatbotMessageHandler));

export default router;
