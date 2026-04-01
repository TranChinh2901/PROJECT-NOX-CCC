import axios from 'axios';
import { loadedEnv } from '@/config/load-env';

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
      type?: string;
      title?: string;
      username?: string;
    };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    text?: string;
  };
  my_chat_member?: {
    chat?: {
      id?: number;
      type?: string;
      title?: string;
      username?: string;
    };
  };
};

const uniqById = <T extends { id?: number }>(items: T[]): T[] => {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    if (typeof item.id !== 'number') continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
};

async function main() {
  const botToken = loadedEnv.telegram.botToken?.trim();
  if (!botToken) {
    console.error('Missing TELEGRAM_BOT_TOKEN in .env');
    process.exitCode = 1;
    return;
  }

  const baseUrl = `https://api.telegram.org/bot${botToken}`;

  const webhook = await axios.get(`${baseUrl}/getWebhookInfo`).then((r) => r.data);
  const webhookUrl: string | undefined = webhook?.result?.url;
  if (webhookUrl) {
    console.log('Webhook is set:', webhookUrl);
    console.log('If getUpdates returns empty, you may need to deleteWebhook.');
  } else {
    console.log('Webhook: not set');
  }

  const updates = await axios
    .get(`${baseUrl}/getUpdates`, {
      params: {
        offset: 0,
        limit: 100,
        allowed_updates: ['message', 'my_chat_member'],
      },
    })
    .then((r) => r.data);

  const result: TelegramUpdate[] = updates?.result ?? [];
  if (!Array.isArray(result) || result.length === 0) {
    console.log('\nNo updates found.');
    console.log('Steps:');
    console.log('1) Add the bot to your group');
    console.log('2) In the group, send a command like /start or /ping (or mention the bot)');
    console.log('3) Run this script again: npm run telegram:chatids');
    return;
  }

  const chats = uniqById(
    result
      .map((u) => u.message?.chat || u.my_chat_member?.chat)
      .filter(Boolean) as Array<{ id?: number; type?: string; title?: string; username?: string }>,
  );

  console.log('\nDetected chats (use the group chat id for TELEGRAM_GROUP_CHAT_ID):');
  for (const chat of chats) {
    const name = chat.title || chat.username || '';
    console.log(`- id=${chat.id} type=${chat.type}${name ? ` name=${name}` : ''}`);
  }
}

main().catch((err) => {
  console.error('Failed to query Telegram:', err?.response?.data || err);
  process.exitCode = 1;
});
