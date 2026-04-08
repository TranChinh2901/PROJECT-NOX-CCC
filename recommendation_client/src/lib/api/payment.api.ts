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

export interface MomoCallbackPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: string;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: string;
  message: string;
  payType: string;
  responseTime: string;
  extraData: string;
  signature: string;
}

export interface ConfirmMomoReturnResponse {
  resultCode: number;
  message: string;
}

export const paymentApi = {
  async createMomoPayment(orderId: number): Promise<CreateMomoPaymentResponse> {
    return await apiClient.post<CreateMomoPaymentResponse>('/payments/momo/create', {
      order_id: orderId,
    });
  },

  async confirmMomoReturn(payload: MomoCallbackPayload): Promise<ConfirmMomoReturnResponse> {
    return await apiClient.post<ConfirmMomoReturnResponse>('/payments/momo/return', payload);
  },
};
