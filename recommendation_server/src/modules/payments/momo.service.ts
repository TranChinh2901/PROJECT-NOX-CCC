import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';
import { loadedEnv } from '@/config/load-env';
import { AppDataSource } from '@/config/database.config';
import { Order } from '@/modules/orders/entity/order';
import { OrderStatusHistory } from '@/modules/orders/entity/order-status-history';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/modules/orders/enum/order.enum';

interface CreateMomoPaymentInput {
  userId: number;
  orderId: number;
}

interface MomoCreateResponse {
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  resultCode?: number;
  message?: string;
}

export interface MomoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

const MOMO_REQUEST_TYPE = 'payWithMethod';

class MomoService {
  private ensureMomoConfig() {
    const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl } = loadedEnv.momo;

    if (!partnerCode || !accessKey || !secretKey || !endpoint || !redirectUrl || !ipnUrl) {
      throw new AppError(
        'MoMo sandbox is not configured on server',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.PAYMENT_FAILED
      );
    }

    return {
      partnerCode,
      accessKey,
      secretKey,
      endpoint: endpoint.replace(/\/$/, ''),
      redirectUrl,
      ipnUrl,
    };
  }

  private sign(rawSignature: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  }

  async createPayment({ userId, orderId }: CreateMomoPaymentInput) {
    const momoConfig = this.ensureMomoConfig();

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId, user_id: userId } });

    if (!order) {
      throw new AppError('Order not found', HttpStatusCode.NOT_FOUND, ErrorCode.ORDER_NOT_FOUND);
    }

    if (order.payment_method !== PaymentMethod.E_WALLET) {
      throw new AppError(
        'Order payment method is not configured for MoMo wallet',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (order.payment_status === PaymentStatus.PAID) {
      throw new AppError('Order is already paid', HttpStatusCode.CONFLICT, ErrorCode.CONFLICT);
    }

    const amount = Math.round(Number(order.total_amount));
    const requestId = `MOMO_${order.id}_${Date.now()}`;
    const momoOrderId = String(order.id);
    const orderInfo = `Thanh toan don hang ${order.order_number}`;
    const extraData = Buffer.from(
      JSON.stringify({ orderId: order.id, orderNumber: order.order_number }),
      'utf8'
    ).toString('base64');

    const rawSignature = [
      `accessKey=${momoConfig.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${momoConfig.ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${momoConfig.partnerCode}`,
      `redirectUrl=${momoConfig.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${MOMO_REQUEST_TYPE}`,
    ].join('&');

    const signature = this.sign(rawSignature, momoConfig.secretKey);

    const payload = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      extraData,
      requestType: MOMO_REQUEST_TYPE,
      lang: 'vi',
      signature,
    };

    try {
      const { data } = await axios.post<MomoCreateResponse>(`${momoConfig.endpoint}/create`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      if (Number(data?.resultCode) !== 0 || !data?.payUrl) {
        throw new AppError(
          data?.message || 'MoMo rejected payment request',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.PAYMENT_FAILED
        );
      }

      return {
        order_id: order.id,
        order_number: order.order_number,
        pay_url: data.payUrl,
        deeplink: data.deeplink || null,
        qr_code_url: data.qrCodeUrl || null,
        request_id: requestId,
        request_type: MOMO_REQUEST_TYPE,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to create MoMo payment request',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.PAYMENT_FAILED,
        error
      );
    }
  }

  private buildIpnRawSignature(payload: MomoIpnPayload, accessKey: string): string {
    return [
      `accessKey=${accessKey}`,
      `amount=${payload.amount}`,
      `extraData=${payload.extraData || ''}`,
      `message=${payload.message}`,
      `orderId=${payload.orderId}`,
      `orderInfo=${payload.orderInfo}`,
      `orderType=${payload.orderType}`,
      `partnerCode=${payload.partnerCode}`,
      `payType=${payload.payType}`,
      `requestId=${payload.requestId}`,
      `responseTime=${payload.responseTime}`,
      `resultCode=${payload.resultCode}`,
      `transId=${payload.transId}`,
    ].join('&');
  }

  async handleIpn(payload: MomoIpnPayload): Promise<{ resultCode: number; message: string }> {
    const momoConfig = this.ensureMomoConfig();

    const rawSignature = this.buildIpnRawSignature(payload, momoConfig.accessKey);
    const expectedSignature = this.sign(rawSignature, momoConfig.secretKey);

    if (!payload.signature || expectedSignature !== payload.signature) {
      return {
        resultCode: 1,
        message: 'Invalid signature',
      };
    }

    const numericOrderId = Number(payload.orderId);
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      return {
        resultCode: 1,
        message: 'Invalid order id',
      };
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: numericOrderId } });

    if (!order) {
      return {
        resultCode: 1,
        message: 'Order not found',
      };
    }

    await AppDataSource.transaction(async manager => {
      const orderInTx = await manager.getRepository(Order).findOne({ where: { id: numericOrderId } });
      if (!orderInTx) return;

      const isPaymentSuccess = Number(payload.resultCode) === 0;
      const paymentNote = `MoMo tx=${payload.transId}, request=${payload.requestId}, result=${payload.resultCode}`;
      const oldInternalNotes = orderInTx.internal_notes || '';
      const nextInternalNotes = oldInternalNotes
        ? `${oldInternalNotes}\n${paymentNote}`
        : paymentNote;

      if (isPaymentSuccess) {
        orderInTx.payment_status = PaymentStatus.PAID;

        if (orderInTx.status === OrderStatus.PENDING) {
          const previousStatus = orderInTx.status;
          orderInTx.status = OrderStatus.CONFIRMED;

          const statusHistory = manager.getRepository(OrderStatusHistory).create({
            order_id: orderInTx.id,
            status: OrderStatus.CONFIRMED,
            previous_status: previousStatus,
            notes: 'MoMo payment confirmed',
            changed_by: 'system',
          });
          await manager.save(statusHistory);
        }
      } else if (orderInTx.payment_status !== PaymentStatus.PAID) {
        orderInTx.payment_status = PaymentStatus.FAILED;
      }

      orderInTx.internal_notes = nextInternalNotes;
      await manager.save(orderInTx);
    });

    return {
      resultCode: 0,
      message: 'Success',
    };
  }
}

export default new MomoService();
