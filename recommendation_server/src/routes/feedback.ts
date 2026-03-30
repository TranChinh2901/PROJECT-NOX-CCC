import { Router } from 'express';
import axios from 'axios';
import { AppResponse } from '@/common/success.response';
import { loadedEnv } from '@/config/load-env';
import { HttpStatusCode } from '@/constants/status-code';
import { asyncHandle } from '@/utils/handle-error';

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

    const botToken = loadedEnv.telegram.botToken?.trim();
    const chatId = loadedEnv.telegram.chatId?.trim();

    if (!botToken || !chatId) {
      return new AppResponse({
        message: 'Telegram chưa được cấu hình trên server',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        data: null,
      }).sendResponse(res);
    }

    const telegramMessage = [
      '📩 Y KIEN KHACH HANG',
      `Ho ten: ${fullName}`,
      `So dien thoai: ${phoneNumber}`,
      `Noi dung: ${message}`,
    ].join('\n');

    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: telegramMessage,
      disable_web_page_preview: true,
    });

    return new AppResponse({
      message: 'Đã gửi ý kiến tới Telegram',
      statusCode: HttpStatusCode.OK,
      data: { sent: true },
    }).sendResponse(res);
  }),
);

export default router;
