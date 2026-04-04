import OpenAI from 'openai';
import { loadedEnv } from '@/config/load-env';

export type ChatbotMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GenerateChatbotReplyParams = {
  message: string;
  history?: ChatbotMessage[];
  config?: Partial<ChatbotConfig>;
};

export type ChatbotReply = {
  reply: string;
  model: string;
  configured: boolean;
};

type OpenAIResponseContent = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAIResponseContent[];
};

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: OpenAIOutputItem[];
};

type OpenAIInputMessage = {
  role: ChatbotMessage['role'];
  content: Array<{
    type: 'input_text';
    text: string;
  }>;
};

export type ChatbotConfig = {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  chatbotInstructions: string;
};

const OFFICIAL_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-5.4-mini';
const MAX_HISTORY_MESSAGES = 10;
export const CHATBOT_MAX_MESSAGE_LENGTH = 2000;
export const CHATBOT_NOT_CONFIGURED_REPLY =
  'Chatbot hiện chưa sẵn sàng vì server chưa được cấu hình OPENAI_API_KEY. Vui lòng thêm API key rồi thử lại.';
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

  const trimmedBaseUrl = normalizedValue.replace(/\/$/, '');
  return trimmedBaseUrl === OFFICIAL_OPENAI_BASE_URL ? undefined : trimmedBaseUrl;
};

const resolveChatbotConfig = (config?: Partial<ChatbotConfig>): ChatbotConfig => ({
  apiKey: config?.apiKey ?? loadedEnv.openai.apiKey?.trim(),
  model: config?.model ?? loadedEnv.openai.model ?? DEFAULT_MODEL,
  baseUrl: normalizeBaseUrl(config?.baseUrl ?? loadedEnv.openai.baseUrl),
  chatbotInstructions:
    config?.chatbotInstructions ?? loadedEnv.openai.chatbotInstructions ?? DEFAULT_SYSTEM_PROMPT,
});

export const createOpenAIClient = (config: Pick<ChatbotConfig, 'apiKey' | 'baseUrl'>): OpenAI => {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  return new OpenAI({
    apiKey: config.apiKey,
    timeout: 30000,
    ...(baseUrl ? { baseURL: baseUrl } : {}),
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

export const buildConversationInput = (history: ChatbotMessage[], message: string): OpenAIInputMessage[] =>
  [...history, { role: 'user' as const, content: message }].map((entry) => ({
    role: entry.role,
    content: [{ type: 'input_text', text: entry.content }],
  }));

export const extractOutputText = (payload: OpenAIResponsesPayload): string => {
  const directText = payload.output_text?.trim();
  if (directText) {
    return directText;
  }

  const outputText = (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text?.trim() || '')
    .filter(Boolean)
    .join('\n\n')
    .trim();

  if (!outputText) {
    throw new Error('OpenAI response did not include assistant text');
  }

  return outputText;
};

export const generateChatbotReply = async ({
  message,
  history = [],
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
  const client = createOpenAIClient({
    apiKey: resolvedConfig.apiKey,
    baseUrl: resolvedConfig.baseUrl,
  });
  const response = await client.responses.create({
    model: resolvedConfig.model,
    instructions: resolvedConfig.chatbotInstructions,
    input: buildConversationInput(conversationHistory, sanitizedMessage),
  });

  return {
    reply: extractOutputText(response as OpenAIResponsesPayload),
    model: resolvedConfig.model,
    configured: true,
  };
};
