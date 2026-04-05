import { GoogleGenAI } from '@google/genai';
import { loadedEnv } from '@/config/load-env';

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
export const GEMINI_REQUEST_TIMEOUT_MS = 60000;

export const normalizeChatbotBaseUrl = (value: string | undefined): string | undefined => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return normalizedValue.replace(/\/$/, '');
};

export const createGeminiClient = (config: {
  apiKey?: string;
  baseUrl?: string;
}): GoogleGenAI => {
  const baseUrl = normalizeChatbotBaseUrl(config.baseUrl);

  return new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: {
      timeout: GEMINI_REQUEST_TIMEOUT_MS,
      ...(baseUrl ? { baseUrl } : {}),
    },
  });
};

export const resolveGeminiRuntimeConfig = () => ({
  apiKey: loadedEnv.gemini.apiKey?.trim(),
  model: loadedEnv.gemini.model ?? DEFAULT_GEMINI_MODEL,
  baseUrl: normalizeChatbotBaseUrl(loadedEnv.gemini.baseUrl),
});
