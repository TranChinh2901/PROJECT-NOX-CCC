import { Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import orderService, { CreateOrderDto } from './order.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { PaymentMethod } from './enum/order.enum';
import { getVNTime } from '@/helpers/format-datetime';
import { logger } from '@/utils/logger';
import { sendTelegramMessage, truncateTelegramText } from '@/utils/telegram';

const formatVnd = (value: unknown): string => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return String(value ?? '');
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberValue);
};

const formatRecipient = (address: any): { fullname: string; phone: string } => {
  if (!address || typeof address !== 'object') return { fullname: '', phone: '' };
  const fullname = address.fullname ? String(address.fullname).trim() : '';
  const phone = address.phone ? String(address.phone).trim() : '';
  return { fullname, phone };
};

const formatAddressOnlyLines = (address: any): string[] => {
  if (!address || typeof address !== 'object') return [];

  const secondary = [
    address.address,
    address.street,
    address.ward,
    address.district,
    address.city,
    address.country,
    address.postal_code,
  ]
    .filter(Boolean)
    .map(String);

  return secondary.map((value) => value.trim()).filter(Boolean);
};

const buildOrderPlacedTelegramMessage = (order: any): string => {
  const orderNumber = order?.order_number ?? order?.id ?? '';
  const createdAt = order?.created_at ? getVNTime(order.created_at) : getVNTime();
  const recipient = formatRecipient(order?.shipping_address);
  const shippingAddressLines = formatAddressOnlyLines(order?.shipping_address);
  const paymentMethod = order?.payment_method ?? '';
  const totalAmount = formatVnd(order?.total_amount);
  const notes = order?.notes ? truncateTelegramText(String(order.notes), 800) : '';

  const items: any[] = Array.isArray(order?.items) ? order.items : [];
  const itemLines = items.slice(0, 12).map((item) => {
    const quantity = item?.quantity ?? '';
    const name = item?.product?.name || item?.product_snapshot?.product_name || 'Sản phẩm';
    const sku = item?.variant?.sku || item?.product_snapshot?.variant_sku || '';
    const skuPart = sku ? ` • SKU: ${sku}` : '';
    return `- ${name}${skuPart} × ${quantity}`;
  });

  const moreItemsCount = items.length - itemLines.length;
  if (moreItemsCount > 0) itemLines.push(`… và ${moreItemsCount} sản phẩm khác`);

  return [
    '🛒 ĐƠN HÀNG ĐẶT THÀNH CÔNG • TECHNOVA',
    '',
    `🕒 Thời gian: ${createdAt}`,
    `🧾 Mã đơn: ${orderNumber}`,
    `💳 Thanh toán: ${paymentMethod}`,
    `💰 Tổng tiền: ${totalAmount}`,
    '',
    recipient.fullname ? `👤 Người nhận: ${recipient.fullname}` : undefined,
    recipient.phone ? `📞 SĐT: ${recipient.phone}` : undefined,
    recipient.fullname || recipient.phone ? '' : undefined,
    '📦 Địa chỉ giao hàng:',
    shippingAddressLines.length ? shippingAddressLines.join('\n') : '(chưa có)',
    notes ? '' : undefined,
    notes ? `🗒️ Ghi chú: ${notes}` : undefined,
    '',
    '🧺 Sản phẩm:',
    itemLines.length ? itemLines.join('\n') : '(không có)',
    '',
    '— TechNova • Order Bot',
  ]
    .filter((line): line is string => typeof line === 'string')
    .join('\n');
};

class OrderController {
  async createOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const { cart_id, shipping_address, billing_address, payment_method, notes } = req.body;

    if (!cart_id || !shipping_address || !payment_method) {
      return new AppResponse({
        message: 'Cart ID, shipping address, and payment method are required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const validPaymentMethods = Object.values(PaymentMethod);
    if (!validPaymentMethods.includes(payment_method)) {
      return new AppResponse({
        message: `Invalid payment method. Valid options: ${validPaymentMethods.join(', ')}`,
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const orderData: CreateOrderDto = {
      cart_id: parseInt(cart_id),
      shipping_address,
      billing_address,
      payment_method: payment_method as PaymentMethod,
      notes
    };

    const order = await orderService.createOrder(userId, orderData);

    void (async () => {
      try {
        const telegramMessage = buildOrderPlacedTelegramMessage(order);
        await sendTelegramMessage(telegramMessage);
      } catch (error: any) {
        logger.error(
          `Telegram order notification failed: ${error?.response?.data?.description || error?.message || String(error)}`,
        );
      }
    })();

    return new AppResponse({
      message: 'Order created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: order
    }).sendResponse(res);
  }

  async getOrderById(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return new AppResponse({
        message: 'Invalid order ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const order = await orderService.getOrderById(orderId, userId);

    return new AppResponse({
      message: 'Order retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: order
    }).sendResponse(res);
  }

  async getUserOrders(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const options = {
      status: req.query.status as any,
      payment_status: req.query.payment_status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const orders = await orderService.getUserOrders(userId, options);

    return new AppResponse({
      message: 'Orders retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: orders
    }).sendResponse(res);
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return new AppResponse({
        message: 'Authentication required',
        statusCode: HttpStatusCode.UNAUTHORIZED,
        data: null
      }).sendResponse(res);
    }

    const orderId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(orderId)) {
      return new AppResponse({
        message: 'Invalid order ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const result = await orderService.cancelOrder(userId, orderId, reason);

    return new AppResponse({
      message: result.message,
      statusCode: HttpStatusCode.OK,
      data: { order_id: result.order_id }
    }).sendResponse(res);
  }
}

export default new OrderController();
