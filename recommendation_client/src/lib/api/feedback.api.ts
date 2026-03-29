import apiClient from './apiClient';

export type CreateCustomerFeedbackPayload = {
  fullName: string;
  phoneNumber: string;
  message: string;
};

export const feedbackApi = {
  async sendCustomerFeedback(payload: CreateCustomerFeedbackPayload): Promise<{ sent: boolean }> {
    return await apiClient.post<{ sent: boolean }>('/feedback/customer-message', payload);
  },
};
