/**
 * What the bot says back, decided away from the network so it can be tested.
 *
 * The bot is deliberately almost nothing: Telegram's menu button and the direct `t.me/<bot>/<app>`
 * link already open the Mini App, and the only gap they leave is the very first moment — a person
 * taps **Start** in a fresh chat, and a bot with no program behind it says nothing at all. This
 * module closes that gap and no more. Every private message gets the same greeting with a button
 * that launches the app, because someone typing "привет" at a training bot wants the same thing
 * the person who typed `/start` wanted.
 */

/** The slice of Telegram's Update we read. Everything else is ignored on purpose. */
export interface TelegramUpdate {
  message?: {
    chat?: { id?: number; type?: string };
    text?: string;
  };
}

export interface BotReply {
  chatId: number;
  text: string;
  /** Label on the button that opens the Mini App. */
  buttonText: string;
}

export interface BotCopy {
  greeting: string;
  buttonText: string;
}

export const DEFAULT_COPY: BotCopy = {
  greeting:
    'Форма — домашний кроссфит с Сергеем Титовым.\n\n' +
    'Тренировки идут прямо здесь, в Telegram: видео, счётчик и серия дней.\n\n' +
    'Нажми кнопку ниже, чтобы открыть приложение.',
  buttonText: 'Открыть Форму',
};

/**
 * The reply an update deserves, or null for the updates that are not a person writing to the bot.
 *
 * Groups and channels are left alone: a `web_app` button only launches from a private chat anyway,
 * and a bot that answers every message in a group chat is a bot people remove.
 */
export function replyFor(update: TelegramUpdate, copy: BotCopy = DEFAULT_COPY): BotReply | null {
  const message = update.message;
  const chatId = message?.chat?.id;
  if (typeof chatId !== 'number') return null;
  if (message?.chat?.type !== 'private') return null;
  if (typeof message.text !== 'string' || message.text.trim() === '') return null;
  return { chatId, text: copy.greeting, buttonText: copy.buttonText };
}

/**
 * The `sendMessage` payload for a reply.
 *
 * An inline `web_app` button rather than a reply-keyboard one: it sits under the greeting where it
 * was sent, so it is still there after the person scrolls, and it does not replace the keyboard.
 */
export function sendMessageBody(reply: BotReply, appUrl: string): Record<string, unknown> {
  return {
    chat_id: reply.chatId,
    text: reply.text,
    reply_markup: {
      inline_keyboard: [[{ text: reply.buttonText, web_app: { url: appUrl } }]],
    },
  };
}
