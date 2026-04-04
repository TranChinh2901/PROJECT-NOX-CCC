import { GoogleGenAI } from '@google/genai';
import { loadedEnv } from '@/config/load-env';
import {
  buildChatbotSystemInstruction,
  executeChatbotFunctionCall,
  getChatbotFunctionDeclarations,
  type ChatbotFunctionCall,
} from '@/utils/chatbot/chatbot-context';

export type ChatbotMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GenerateChatbotReplyParams = {
  message: string;
  history?: ChatbotMessage[];
  userId?: number;
  config?: Partial<ChatbotConfig>;
};

export type ChatbotReply = {
  reply: string;
  model: string;
  configured: boolean;
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

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const MAX_HISTORY_MESSAGES = 10;
const MAX_FUNCTION_CALL_ROUNDS = 4;
export const CHATBOT_MAX_MESSAGE_LENGTH = 2000;
export const CHATBOT_NOT_CONFIGURED_REPLY =
  'Chatbot hiện chưa sẵn sàng vì server chưa được cấu hình GEMINI_API_KEY. Vui lòng thêm API key rồi thử lại.';
const DEFAULT_SYSTEM_PROMPT = [
  'Bạn là trợ lý mua sắm của TechNova, một cửa hàng công nghệ cao cấp.',
  'Nhiệm vụ của bạn là trả lời ngắn gọn, hữu ích, thân thiện bằng tiếng Việt.',
  'Bạn có thể hỗ trợ về sản phẩm, gợi ý mua sắm, khuyến mại, vận chuyển, thanh toán và đổi trả.',
  'Nếu không biết chắc thông tin tồn kho hoặc trạng thái đơn hàng, hãy nói rõ giới hạn và đề nghị khách liên hệ hỗ trợ.',
  'Không bịa thông tin cá nhân, chính sách nội bộ, hay dữ liệu thời gian thực mà hệ thống chưa cung cấp.',
].join(' ');

const normalizeMessage = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, CHATBOT_MAX_MESSAGE_LENGTH) : '';

const normalizeBaseUrl = (value: string | undefined): string | undefined => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return normalizedValue.replace(/\/$/, '');
};

const resolveChatbotConfig = (config?: Partial<ChatbotConfig>): ChatbotConfig => ({
  apiKey: config?.apiKey ?? loadedEnv.gemini.apiKey?.trim(),
  model: config?.model ?? loadedEnv.gemini.model ?? DEFAULT_MODEL,
  baseUrl: normalizeBaseUrl(config?.baseUrl ?? loadedEnv.gemini.baseUrl),
  chatbotInstructions:
    config?.chatbotInstructions ?? loadedEnv.gemini.chatbotInstructions ?? DEFAULT_SYSTEM_PROMPT,
});

export const createGeminiClient = (config: Pick<ChatbotConfig, 'apiKey' | 'baseUrl'>): GoogleGenAI => {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  return new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: {
      timeout: 30000,
      ...(baseUrl ? { baseUrl } : {}),
    },
  });
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

export const generateChatbotReply = async ({
  message,
  history = [],
  userId,
  config,
}: GenerateChatbotReplyParams): Promise<ChatbotReply> => {
  const resolvedConfig = resolveChatbotConfig(config);

  if (!resolvedConfig.apiKey) {
    return {
      reply: CHATBOT_NOT_CONFIGURED_REPLY,
      model: resolvedConfig.model,
      configured: false,
    };
  }

  const sanitizedMessage = normalizeMessage(message);
  if (!sanitizedMessage) {
    throw new Error('A non-empty message is required');
  }

  const conversationHistory = sanitizeConversationHistory(history);
  const client = createGeminiClient({
    apiKey: resolvedConfig.apiKey,
    baseUrl: resolvedConfig.baseUrl,
  });
  const baseContents = buildConversationInput(conversationHistory, sanitizedMessage);
  let contents: Array<Record<string, unknown>> = [...baseContents];
  let response: GeminiGenerateContentResponse | undefined;

  for (let round = 0; round < MAX_FUNCTION_CALL_ROUNDS; round += 1) {
    response = (await client.models.generateContent({
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

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length === 0) {
      break;
    }

    const assistantContent = getAssistantToolContent(response);
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

  if (!response) {
    throw new Error('Gemini did not return a response');
  }

  return {
    reply: extractOutputText(response),
    model: resolvedConfig.model,
    configured: true,
  };
};
