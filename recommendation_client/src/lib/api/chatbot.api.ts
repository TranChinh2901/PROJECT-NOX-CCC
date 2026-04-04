import apiClient from './apiClient';

export type ChatbotRole = 'user' | 'assistant';

export type ChatbotMessage = {
  role: ChatbotRole;
  content: string;
};

export type ChatbotReply = {
  reply: string;
  model: string;
  configured: boolean;
};

export const chatbotApi = {
  sendMessage: (payload: {
    message: string;
    history?: ChatbotMessage[];
  }): Promise<ChatbotReply> => {
    return apiClient.post<ChatbotReply>('/chatbot/message', payload);
  },
};
