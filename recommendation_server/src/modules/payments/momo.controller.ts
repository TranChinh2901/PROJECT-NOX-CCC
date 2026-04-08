import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import momoService, { MomoIpnPayload } from './momo.service';

class MomoController {
  async createPayment(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null,
      }).sendResponse(res);
    }

    const orderId = Number(req.body?.order_id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return new AppResponse({
        message: 'Valid order_id is required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null,
      }).sendResponse(res);
    }

    const momoPayment = await momoService.createPayment({ userId, orderId });

    return new AppResponse({
      message: 'MoMo payment session created',
      statusCode: HttpStatusCode.OK,
      data: momoPayment,
    }).sendResponse(res);
  }

  async ipn(req: Request, res: Response) {
    const payload = req.body as MomoIpnPayload;
    const ack = await momoService.handleIpn(payload);

    return res.status(HttpStatusCode.OK).json({
      partnerCode: payload?.partnerCode || '',
      requestId: payload?.requestId || '',
      orderId: payload?.orderId || '',
      resultCode: ack.resultCode,
      message: ack.message,
    });
  }

  async confirmReturn(req: Request, res: Response) {
    const payload = req.body as MomoIpnPayload;
    const ack = await momoService.handleIpn(payload);

    return new AppResponse({
      message: ack.message,
      statusCode: ack.resultCode === 0 ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST,
      data: ack,
    }).sendResponse(res);
  }
}

export default new MomoController();
