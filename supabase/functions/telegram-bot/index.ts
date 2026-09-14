/**
 * Telegram → the Mini App: answer `/start` with a greeting and a button that opens Forma.
 *
 * Deploy:  supabase functions deploy telegram-bot --no-verify-jwt
 * Secrets: supabase secrets set TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… MINI_APP_URL=…
 * Then point Telegram at it once:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook
 *     ?url=https://<project>.functions.supabase.co/telegram-bot
 *     &secret_token=<TELEGRAM_WEBHOOK_SECRET>
 *
 * Why this exists at all: the menu button and the `t.me/<bot>/<app>` link already open the app, and
 * they cover every case but the first one — a person opens the chat, taps **Start**, and a bot with
 * no program behind it is silent. That silence is the only thing this function is here to fix.
 *
 * The door is guarded by the header Telegram echoes back from `setWebhook`: only Telegram knows the
 * secret, so anything without it is not Telegram. The bot token never leaves the function's
 * environment — it is a secret in Supabase, never in this repository, which is public.
 *
 * Every path answers 200 once it is past the guard, including the paths that do nothing. Telegram
 * retries a non-2xx, and there is nothing here worth retrying.
 *
 * ONE FILE ON PURPOSE. This used to import its pure half from `./update.ts`, which is the better
 * shape for a codebase and the wrong one for how this function actually gets deployed: the Supabase
 * dashboard's editor is where it is pasted, a second file has to be added there by hand, and
 * forgetting to fails the build with «Module not found "…/update.ts"». Everything above the request
 * path is exported and free of `Deno`, so it is still unit-tested in `index.test.ts`; only the
 * serve call at the bottom touches the runtime, and it is guarded so importing this file outside
 * Deno is safe.
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

const DEFAULT_APP_URL = 'https://forma-app.co/app/';

function reply(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return reply(405, 'method not allowed');

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    console.error('telegram-bot: TELEGRAM_BOT_TOKEN is not set');
    return reply(500, 'not configured');
  }

  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (secret) {
    if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
      return reply(403, 'bad secret');
    }
  } else {
    // Without it the URL is the only thing standing between the bot and anyone who guesses it.
    console.warn(
      'telegram-bot: TELEGRAM_WEBHOOK_SECRET is not set; the webhook is unauthenticated',
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return reply(400, 'unreadable body');
  }

  const copy = {
    greeting: Deno.env.get('TELEGRAM_GREETING') ?? DEFAULT_COPY.greeting,
    buttonText: Deno.env.get('TELEGRAM_BUTTON_TEXT') ?? DEFAULT_COPY.buttonText,
  };
  const answer = replyFor(update, copy);
  if (!answer) return reply(200, 'ignored');

  const appUrl = Deno.env.get('MINI_APP_URL') ?? DEFAULT_APP_URL;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sendMessageBody(answer, appUrl)),
  });
  if (!res.ok) {
    // Logged, not retried: a message Telegram refused once it will refuse again.
    console.error('telegram-bot: sendMessage failed', res.status, await res.text());
  }
  return reply(200, 'ok');
}

// Guarded so the unit tests can import this file: outside Deno there is nothing to serve.
if (typeof Deno !== 'undefined') Deno.serve(handleRequest);
