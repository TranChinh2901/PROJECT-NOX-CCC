import apiClient from './apiClient';

export type ChatbotRole = 'user' | 'assistant';

export type ChatbotMessage = {
  role: ChatbotRole;
  content: string;
};

export type ChatbotHistoryPart = {
  text?: string;
  thoughtSignature?: string;
  functionCall?: {
    id?: string;
    name: string;
    args?: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    id?: string;
    response?: Record<string, unknown>;
  };
};

export type ChatbotHistoryContent = {
  role: 'user' | 'model';
  parts: ChatbotHistoryPart[];
};

export type ChatbotReply = {
  reply: string;
  model: string;
  configured: boolean;
  historyContents: ChatbotHistoryContent[];
};

export const chatbotApi = {
  sendMessage: (payload: {
    message: string;
    history?: ChatbotMessage[];
    historyContents?: ChatbotHistoryContent[];
  }): Promise<ChatbotReply> => {
    return apiClient.post<ChatbotReply>('/chatbot/message', payload);
  },
};
