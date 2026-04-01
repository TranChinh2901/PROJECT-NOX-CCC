import axios from 'axios';
import { loadedEnv } from '@/config/load-env';

const defaultMaxTelegramTextLength = 3500;

const getChatIdsFromEnv = (): string[] => {
  const groupChatId = loadedEnv.telegram.groupChatId?.trim();
  if (groupChatId) return [groupChatId];

  const chatIdRaw = loadedEnv.telegram.chatId?.trim() || '';
  return chatIdRaw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export const truncateTelegramText = (text: string, maxLength = defaultMaxTelegramTextLength): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}… (đã rút gọn)`;
};

export const sendTelegramMessage = async (text: string) => {
  const botToken = loadedEnv.telegram.botToken?.trim();
  const chatIds = getChatIdsFromEnv();

  if (!botToken || chatIds.length === 0) {
    throw new Error('Telegram chưa được cấu hình trên server');
  }

  const safeText = truncateTelegramText(text);

  await Promise.all(
    chatIds.map((chat_id) =>
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id,
        text: safeText,
        disable_web_page_preview: true,
      }),
    ),
  );

  return { sentTo: chatIds };
};
