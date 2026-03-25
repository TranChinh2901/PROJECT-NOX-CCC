import apiClient from './apiClient';

export interface CreateMomoPaymentResponse {
  order_id: number;
  order_number: string;
  pay_url: string;
  deeplink: string | null;
  qr_code_url: string | null;
  request_id: string;
  request_type: string;
}

export const paymentApi = {
  async createMomoPayment(orderId: number): Promise<CreateMomoPaymentResponse> {
    return await apiClient.post<CreateMomoPaymentResponse>('/payments/momo/create', {
      order_id: orderId,
    });
  },
};
