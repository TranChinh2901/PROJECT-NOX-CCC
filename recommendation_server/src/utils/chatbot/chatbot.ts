import { loadedEnv } from '@/config/load-env';
import {
  buildChatbotSystemInstruction,
  executeChatbotFunctionCall,
  getChatbotFunctionDeclarations,
  type ChatbotFunctionCall,
} from '@/utils/chatbot/chatbot-context';
import {
  createGeminiClient,
  DEFAULT_GEMINI_MODEL,
  normalizeChatbotBaseUrl,
} from '@/utils/chatbot/chatbot-sdk';

export { createGeminiClient } from '@/utils/chatbot/chatbot-sdk';

export type ChatbotMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatbotConversationPart = {
  text?: string;
  thoughtSignature?: string;
  functionCall?: ChatbotFunctionCall;
  functionResponse?: {
    name: string;
    id?: string;
    response?: Record<string, unknown>;
  };
};

export type ChatbotConversationContent = {
  role: 'user' | 'model';
  parts: ChatbotConversationPart[];
};

export type GenerateChatbotReplyParams = {
  message: string;
  history?: ChatbotMessage[];
  historyContents?: ChatbotConversationContent[];
  userId?: number;
  config?: Partial<ChatbotConfig>;
};

export type ChatbotReply = {
  reply: string;
  model: string;
  configured: boolean;
  historyContents: ChatbotConversationContent[];
};

type GeminiTextPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    role?: 'model';
    parts?: Array<
      GeminiTextPart & {
        functionCall?: ChatbotFunctionCall;
      }
    >;
  };
};

type GeminiGenerateContentResponse = {
  text?: string;
  functionCalls?: ChatbotFunctionCall[];
  candidates?: GeminiCandidate[];
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiTextPart[];
};

export type ChatbotConfig = {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  chatbotInstructions: string;
};

const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;
const MAX_HISTORY_MESSAGES = 10;
const MAX_FUNCTION_CALL_ROUNDS = 4;
const MAX_GEMINI_RETRIES = 1;
export const CHATBOT_MAX_MESSAGE_LENGTH = 2000;
export const CHATBOT_NOT_CONFIGURED_REPLY =
  'Chatbot hiện chưa sẵn sàng vì server chưa được cấu hình GEMINI_API_KEY. Vui lòng thêm API key rồi thử lại.';
export const CHATBOT_TEMPORARY_UNAVAILABLE_REPLY =
  'Chatbot đang phản hồi chậm từ phía Gemini. Bạn vui lòng thử lại sau ít phút hoặc gửi câu hỏi ngắn hơn.';
const DEFAULT_SYSTEM_PROMPT = [
  'Bạn là trợ lý mua sắm của TechNova, một cửa hàng công nghệ cao cấp.',
  'Nhiệm vụ của bạn là trả lời ngắn gọn, hữu ích, thân thiện bằng tiếng Việt.',
  'Bạn có thể hỗ trợ về sản phẩm, gợi ý mua sắm, khuyến mại, vận chuyển, thanh toán và đổi trả.',
  'Nếu không biết chắc thông tin tồn kho hoặc trạng thái đơn hàng, hãy nói rõ giới hạn và đề nghị khách liên hệ hỗ trợ.',
  'Không bịa thông tin cá nhân, chính sách nội bộ, hay dữ liệu thời gian thực mà hệ thống chưa cung cấp.',
].join(' ');

const normalizeMessage = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, CHATBOT_MAX_MESSAGE_LENGTH) : '';

const resolveChatbotConfig = (config?: Partial<ChatbotConfig>): ChatbotConfig => ({
  apiKey: config?.apiKey ?? loadedEnv.gemini.apiKey?.trim(),
  model: config?.model ?? loadedEnv.gemini.model ?? DEFAULT_MODEL,
  baseUrl: normalizeChatbotBaseUrl(config?.baseUrl ?? loadedEnv.gemini.baseUrl),
  chatbotInstructions:
    config?.chatbotInstructions ?? loadedEnv.gemini.chatbotInstructions ?? DEFAULT_SYSTEM_PROMPT,
});

const isTransientGeminiError = (error: unknown): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const normalizedMessage = errorMessage.toLowerCase();
  const errorWithStatus = error as { status?: number; code?: number | string };
  const status = typeof errorWithStatus?.status === 'number'
    ? errorWithStatus.status
    : typeof errorWithStatus?.code === 'number'
      ? errorWithStatus.code
      : undefined;

  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 503 ||
    status === 504 ||
    normalizedMessage.includes('deadline_exceeded') ||
    normalizedMessage.includes('deadline expired') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('aborted')
  );
};

export const sanitizeConversationHistory = (history: unknown): ChatbotMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item) => {
      const role =
        item && typeof item === 'object' && (item as { role?: unknown }).role === 'assistant'
          ? 'assistant'
          : 'user';
      const content = normalizeMessage(item && typeof item === 'object' ? (item as { content?: unknown }).content : '');

      if (!content) {
        return null;
      }

      return { role, content } satisfies ChatbotMessage;
    })
    .filter((item): item is ChatbotMessage => item !== null)
    .slice(-MAX_HISTORY_MESSAGES);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const sanitizeConversationPart = (part: unknown): ChatbotConversationPart | null => {
  if (!isPlainObject(part)) {
    return null;
  }

  const text = normalizeMessage(part.text);
  const thoughtSignature = typeof part.thoughtSignature === 'string' ? part.thoughtSignature.trim() : '';
  const functionCall = isPlainObject(part.functionCall) && typeof part.functionCall.name === 'string'
    ? {
        id: typeof part.functionCall.id === 'string' ? part.functionCall.id : undefined,
        name: part.functionCall.name,
        args: isPlainObject(part.functionCall.args) ? part.functionCall.args : undefined,
      }
    : undefined;
  const functionResponse = isPlainObject(part.functionResponse) && typeof part.functionResponse.name === 'string'
    ? {
        name: part.functionResponse.name,
        id: typeof part.functionResponse.id === 'string' ? part.functionResponse.id : undefined,
        response: isPlainObject(part.functionResponse.response) ? part.functionResponse.response : undefined,
      }
    : undefined;

  if (!text && !thoughtSignature && !functionCall && !functionResponse) {
    return null;
  }

  return {
    ...(text ? { text } : {}),
    ...(thoughtSignature ? { thoughtSignature } : {}),
    ...(functionCall ? { functionCall } : {}),
    ...(functionResponse ? { functionResponse } : {}),
  };
};

export const sanitizeConversationContents = (historyContents: unknown): ChatbotConversationContent[] => {
  if (!Array.isArray(historyContents)) {
    return [];
  }

  const sanitizedContents = historyContents
    .map((item) => {
      if (!isPlainObject(item)) {
        return null;
      }

      const role = item.role === 'model' ? 'model' : item.role === 'user' ? 'user' : null;
      if (!role) {
        return null;
      }

      const parts = Array.isArray(item.parts)
        ? item.parts
            .map((part) => sanitizeConversationPart(part))
            .filter((part): part is ChatbotConversationPart => part !== null)
        : [];

      if (parts.length === 0) {
        return null;
      }

      return {
        role,
        parts,
      } satisfies ChatbotConversationContent;
    })
    .filter((item): item is ChatbotConversationContent => item !== null)
    .slice(-(MAX_HISTORY_MESSAGES * 2));

  const alternatingContents: ChatbotConversationContent[] = [];

  for (const content of sanitizedContents) {
    if (alternatingContents.length === 0 && content.role !== 'user') {
      continue;
    }

    const previousContent = alternatingContents[alternatingContents.length - 1];
    if (previousContent?.role === content.role) {
      continue;
    }

    alternatingContents.push(content);
  }

  return alternatingContents;
};

export const buildConversationInput = (history: ChatbotMessage[], message: string): GeminiContent[] =>
  [...history, { role: 'user' as const, content: message }].map((entry) => ({
    role: entry.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: entry.content }],
  }));

export const extractOutputText = (payload: GeminiGenerateContentResponse): string => {
  const directText = payload.text?.trim();
  if (directText) {
    return directText;
  }

  const outputText = ((payload.candidates as GeminiCandidate[]) || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text?.trim() || '')
    .filter(Boolean)
    .join('\n\n')
    .trim();

  if (!outputText) {
    throw new Error('Gemini response did not include assistant text');
  }

  return outputText;
};

const getAssistantToolContent = (payload: GeminiGenerateContentResponse) => {
  const candidateContent = payload.candidates?.[0]?.content;
  if (candidateContent) {
    return candidateContent;
  }

  if (!payload.functionCalls?.length) {
    return undefined;
  }

  return {
    role: 'model' as const,
    parts: payload.functionCalls.map((functionCall) => ({
      functionCall,
    })),
  };
};

const getModelResponseContent = (payload: GeminiGenerateContentResponse): ChatbotConversationContent => {
  const candidateContent = payload.candidates?.[0]?.content;
  if (candidateContent?.parts?.length) {
    return {
      role: 'model',
      parts: candidateContent.parts
        .map((part) => sanitizeConversationPart(part))
        .filter((part): part is ChatbotConversationPart => part !== null),
    };
  }

  const outputText = extractOutputText(payload);
  return {
    role: 'model',
    parts: [{ text: outputText }],
  };
};

export const generateChatbotReply = async ({
  message,
  history = [],
  historyContents = [],
  userId,
  config,
}: GenerateChatbotReplyParams): Promise<ChatbotReply> => {
  const resolvedConfig = resolveChatbotConfig(config);

  if (!resolvedConfig.apiKey) {
    return {
      reply: CHATBOT_NOT_CONFIGURED_REPLY,
      model: resolvedConfig.model,
      configured: false,
      historyContents: [],
    };
  }

  const sanitizedMessage = normalizeMessage(message);
  if (!sanitizedMessage) {
    throw new Error('A non-empty message is required');
  }

  const conversationHistory = sanitizeConversationHistory(history);
  const persistedHistoryContents = sanitizeConversationContents(historyContents);
  const client = createGeminiClient({
    apiKey: resolvedConfig.apiKey,
    baseUrl: resolvedConfig.baseUrl,
  });
  const userTurn: ChatbotConversationContent = {
    role: 'user',
    parts: [{ text: sanitizedMessage }],
  };
  const baseContents = persistedHistoryContents.length > 0
    ? [...persistedHistoryContents, userTurn]
    : buildConversationInput(conversationHistory, sanitizedMessage);
  let contents: Array<Record<string, unknown>> = [...baseContents];
  let response: GeminiGenerateContentResponse | undefined;

  try {
    for (let round = 0; round < MAX_FUNCTION_CALL_ROUNDS; round += 1) {
      let lastError: unknown;
      let generatedResponse: GeminiGenerateContentResponse | undefined;

      for (let attempt = 0; attempt <= MAX_GEMINI_RETRIES; attempt += 1) {
        try {
          generatedResponse = (await client.models.generateContent({
            model: resolvedConfig.model,
            contents,
            config: {
              systemInstruction: buildChatbotSystemInstruction(resolvedConfig.chatbotInstructions),
              tools: [
                {
                  functionDeclarations: getChatbotFunctionDeclarations() as any,
                },
              ],
            },
          })) as GeminiGenerateContentResponse;
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (attempt >= MAX_GEMINI_RETRIES || !isTransientGeminiError(error)) {
            throw error;
          }
        }
      }

      if (!generatedResponse && lastError) {
        throw lastError;
      }

      if (!generatedResponse) {
        throw new Error('Gemini did not return a response');
      }

      response = generatedResponse;
      const currentResponse = generatedResponse;

      const functionCalls = currentResponse.functionCalls ?? [];
      if (functionCalls.length === 0) {
        break;
      }

      const assistantContent = getAssistantToolContent(currentResponse);
      if (!assistantContent) {
        break;
      }

      const functionResponseParts = await Promise.all(
        functionCalls.map(async (functionCall) => ({
          functionResponse: {
            name: functionCall.name,
            response: await executeChatbotFunctionCall(functionCall, { userId }),
            ...(functionCall.id ? { id: functionCall.id } : {}),
          },
        })),
      );

      contents = [
        ...contents,
        assistantContent as Record<string, unknown>,
        {
          role: 'user',
          parts: functionResponseParts,
        },
      ];
    }
  } catch (error) {
    if (isTransientGeminiError(error)) {
      return {
        reply: CHATBOT_TEMPORARY_UNAVAILABLE_REPLY,
        model: resolvedConfig.model,
        configured: true,
        historyContents: [],
      };
    }

    throw error;
  }

  if (!response) {
    throw new Error('Gemini did not return a response');
  }

  return {
    reply: extractOutputText(response),
    model: resolvedConfig.model,
    configured: true,
    historyContents: sanitizeConversationContents([
      ...(contents as ChatbotConversationContent[]),
      getModelResponseContent(response),
    ]),
  };
};
