'use client';

import React, { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { chatbotApi, type ChatbotHistoryContent, type ChatbotMessage } from '@/lib/api/chatbot.api';

type WidgetMessage = ChatbotMessage & {
  id: string;
};

type MessageBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

const HISTORY_LIMIT = 8;
const CHATBOT_ERROR_REPLY =
  'Xin lỗi, chatbot đang bận hoặc chưa được cấu hình hoàn chỉnh. Bạn vui lòng thử lại sau nhé.';

const buildWidgetMessage = (
  role: ChatbotMessage['role'],
  content: string,
  id = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): WidgetMessage => ({
  id,
  role,
  content,
});

const INITIAL_MESSAGE = buildWidgetMessage(
  'assistant',
  'Xin chào! Tôi là trợ lý TechNova. Bạn cần tư vấn sản phẩm, giao hàng hay thanh toán?',
  'welcome',
);

const shouldHideChatbot = (pathname: string | null) => {
  if (!pathname) {
    return false;
  }

  return pathname.startsWith('/admin');
};

const BULLET_PATTERN = /^[-*•]\s+(.*)$/;
const INLINE_FORMATTING_PATTERN =
  /(\*\*[^*]+\*\*|\[[^[\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)|https?:\/\/[^\s)]+[^\s).,!?;:]|\/product\/[^\s).,!?;:]+)/g;
const MARKDOWN_LINK_PATTERN = /^\[([^[\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/;

const renderLinkNode = (href: string, label: string, key: string) => {
  const className = 'font-medium text-amber-700 underline underline-offset-4 transition hover:text-amber-600';

  if (href.startsWith('/')) {
    return (
      <Link key={key} href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a key={key} href={href} className={className} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
};

const parseMessageBlocks = (content: string): MessageBlock[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: MessageBlock[] = [];
  let listItems: string[] = [];

  const flushListItems = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({ type: 'list', items: listItems });
    listItems = [];
  };

  for (const line of lines) {
    const bulletMatch = line.match(BULLET_PATTERN);

    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushListItems();
    blocks.push({ type: 'paragraph', text: line });
  }

  flushListItems();
  return blocks;
};

const renderInlineFormatting = (text: string) => {
  const segments = text.split(INLINE_FORMATTING_PATTERN).filter(Boolean);

  return segments.map((segment, index) => {
    const boldMatch = segment.match(/^\*\*([^*]+)\*\*$/);
    const markdownLinkMatch = segment.match(MARKDOWN_LINK_PATTERN);

    if (boldMatch) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-stone-900">
          {boldMatch[1]}
        </strong>
      );
    }

    if (markdownLinkMatch) {
      return renderLinkNode(markdownLinkMatch[2], markdownLinkMatch[1], `${segment}-${index}`);
    }

    if (segment.startsWith('/product/') || segment.startsWith('http://') || segment.startsWith('https://')) {
      return renderLinkNode(segment, segment, `${segment}-${index}`);
    }

    return <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>;
  });
};

const renderAssistantMessage = (content: string) => {
  const blocks = parseMessageBlocks(content);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`list-item-${index}-${itemIndex}`}>{renderInlineFormatting(item)}</li>
            ))}
          </ul>
        ) : (
          <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
            {renderInlineFormatting(block.text)}
          </p>
        ),
      )}
    </div>
  );
};

export function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<WidgetMessage[]>([INITIAL_MESSAGE]);
  const [historyContents, setHistoryContents] = useState<ChatbotHistoryContent[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const recentHistory = useMemo(
    () =>
      messages
        .filter((message) => message.id !== INITIAL_MESSAGE.id)
        .slice(-HISTORY_LIMIT)
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [isOpen, messages]);

  const appendMessage = useCallback((role: ChatbotMessage['role'], content: string) => {
    setMessages((currentMessages) => [...currentMessages, buildWidgetMessage(role, content)]);
  }, []);

  const handleComposerKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextMessage = inputValue.trim();
      if (!nextMessage || isSending) {
        return;
      }

      appendMessage('user', nextMessage);
      setInputValue('');
      setIsOpen(true);
      setIsSending(true);

      try {
        const response = await chatbotApi.sendMessage({
          message: nextMessage,
          history: recentHistory,
          historyContents,
        });

        appendMessage('assistant', response.reply);
        setHistoryContents(response.historyContents ?? []);
      } catch {
        appendMessage('assistant', CHATBOT_ERROR_REPLY);
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, historyContents, inputValue, isSending, recentHistory],
  );

  if (shouldHideChatbot(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-stone-950 px-4 py-3 text-stone-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">TechNova Assistant</p>
                <p className="text-xs text-stone-300">Hỗ trợ mua sắm với Gemini</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-stone-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={scrollContainerRef}
            className="max-h-[26rem] space-y-3 overflow-y-auto bg-stone-50 px-4 py-4"
          >
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';

              return (
                <article
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    isAssistant
                      ? 'mr-auto bg-white text-stone-700'
                      : 'ml-auto bg-amber-500 text-stone-950'
                  }`}
                >
                  {isAssistant ? (
                    renderAssistantMessage(message.content)
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </article>
              );
            })}

            {isSending ? (
              <div className="mr-auto flex max-w-[85%] items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang soạn phản hồi...
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-stone-200 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-stone-200 px-3 py-2 focus-within:border-amber-500">
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Hỏi về sản phẩm, giao hàng, thanh toán..."
                className="min-h-[2.75rem] max-h-28 flex-1 resize-none bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                rows={1}
              />
              <button
                type="submit"
                disabled={isSending || inputValue.trim().length === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white shadow-xl transition hover:scale-[1.03] hover:bg-stone-800"
        aria-label={isOpen ? 'Ẩn chatbot' : 'Mở chatbot'}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
