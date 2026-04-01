import { Router } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import { getVNTime } from '@/helpers/format-datetime';
import { asyncHandle } from '@/utils/handle-error';
import { sendTelegramMessage, truncateTelegramText } from '@/utils/telegram';

const router = Router();

type FeedbackRequestBody = {
  fullName?: string;
  phoneNumber?: string;
  message?: string;
};

router.post(
  '/customer-message',
  asyncHandle(async (req, res) => {
    const body = (req.body || {}) as FeedbackRequestBody;

    const fullName = body.fullName?.trim() || '';
    const phoneNumber = body.phoneNumber?.trim() || '';
    const message = body.message?.trim() || '';

    if (!fullName || !phoneNumber || message.length < 8) {
      return new AppResponse({
        message: 'fullName, phoneNumber và message (>= 8 ký tự) là bắt buộc',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null,
      }).sendResponse(res);
    }

    const normalizedMessage = truncateTelegramText(message);

    const telegramMessage = [
      '🔔 THÔNG BÁO TECHNOVA',
      'Bạn vừa nhận được một góp ý mới từ khách hàng.',
      '',
      `🕒 Thời gian: ${getVNTime()}`,
      `👤 Họ tên: ${fullName}`,
      `📞 Số điện thoại: ${phoneNumber}`,
      '',
      '📝 Nội dung:',
      normalizedMessage,
      '',
      '— TechNova • Feedback Bot',
    ].join('\n');

    try {
      await sendTelegramMessage(telegramMessage);
    } catch (error) {
      return new AppResponse({
        message: 'Telegram chưa được cấu hình trên server',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        data: null,
      }).sendResponse(res);
    }

    return new AppResponse({
      message: 'Đã gửi ý kiến tới Telegram',
      statusCode: HttpStatusCode.OK,
      data: { sent: true },
    }).sendResponse(res);
  }),
);

export default router;
