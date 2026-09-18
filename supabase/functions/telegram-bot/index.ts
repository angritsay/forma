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
  /** Label on the button that opens the course page on the site, or '' for no such button. */
  siteButtonText: string;
  /** Picture above the greeting, or '' to send the greeting as plain text. */
  photoUrl: string;
}

export interface BotCopy {
  greeting: string;
  buttonText: string;
  siteButtonText: string;
  photoUrl: string;
}

/**
 * The first thing anyone sees of Forma.
 *
 * It names the three things the product actually is, one short line each, in the order of what
 * they cost: a course you buy once, a club you subscribe to, an hour of the coach's own time.
 * That order is also the order of commitment, so somebody skimming stops at the first line that
 * describes them.
 *
 * The club line says no partner, because the club has none: «каждый сам за себя». It used to
 * promise one, which is the worst kind of wrong in a greeting — a promise the first screen breaks.
 *
 * The three lines match the app's three tabs on purpose — «Курсы · Клуб · Тренер». A greeting that
 * promises a shape the app does not have is a greeting that has to be re-learned on arrival, and
 * this one used to do exactly that: it described a single course and nothing else, because it was
 * written before the club and the one-to-one sessions existed.
 *
 * The numbers are the course’s own (`content/courses/start.ts`: twenty workouts,
 * a video on every movement). Do not round them up here — this is the one place where a claim is
 * made to somebody who has not paid yet.
 *
 * Two buttons, because the two people who tap **Start** want different things: one is ready to
 * open the app, the other is still deciding and wants to read. Sending both to the same place
 * serves neither.
 *
 * No Markdown anywhere in here. Telegram would need every «.», «-» and «(» escaped, and a caption
 * that fails to parse is a caption nobody sees.
 */
export const DEFAULT_COPY: BotCopy = {
  greeting:
    'Форма — домашний кроссфит с Сергеем Титовым.\n\n' +
    'Курсы. Двадцать тренировок по 15–20 минут, видео на каждое движение. ' +
    'Нагрузка подстраивается под тебя.\n\n' +
    'Клуб маленьких шагов. Одно небольшое задание в день и общая таблица за неделю. ' +
    'Тому, кто наверху, достаётся час с тренером.\n\n' +
    'Тренировка один на один. Разбор техники и план на следующие недели — с Сергеем, ' +
    'онлайн, по видеосвязи.',
  buttonText: 'Открыть приложение',
  siteButtonText: 'Почитать на сайте',
  photoUrl: 'https://forma-app.co/og/default.png',
};

/**
 * Where the site explains Forma to somebody who has not bought anything yet.
 *
 * The home page rather than the beginner course's page, which is where this pointed while the
 * greeting described one course. The greeting now names the club and the one-to-one sessions too,
 * and a «Почитать на сайте» that lands on a single course page answers a third of what was just
 * promised. `TELEGRAM_SITE_URL` overrides it without a deploy.
 */
const DEFAULT_SITE_URL = 'https://forma-app.co/';

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
  return {
    chatId,
    text: copy.greeting,
    buttonText: copy.buttonText,
    siteButtonText: copy.siteButtonText,
    photoUrl: copy.photoUrl,
  };
}

/**
 * The buttons under the greeting, one per row so neither is the small one.
 *
 * Inline rather than a reply keyboard: they stay under the message where they were sent, so they
 * are still there after the person scrolls, and they do not take over the keyboard. The second row
 * is dropped when there is no label for it — a bot with an empty button is worse than a bot with
 * one button.
 */
export function keyboard(reply: BotReply, appUrl: string, siteUrl: string) {
  const rows: { text: string; web_app?: { url: string }; url?: string }[][] = [
    [{ text: reply.buttonText, web_app: { url: appUrl } }],
  ];
  if (reply.siteButtonText && siteUrl) rows.push([{ text: reply.siteButtonText, url: siteUrl }]);
  return { inline_keyboard: rows };
}

/** The `sendMessage` payload: the greeting as text, for when there is no picture to send. */
export function sendMessageBody(
  reply: BotReply,
  appUrl: string,
  siteUrl: string = DEFAULT_SITE_URL,
): Record<string, unknown> {
  return {
    chat_id: reply.chatId,
    text: reply.text,
    reply_markup: keyboard(reply, appUrl, siteUrl),
  };
}

/** The `sendPhoto` payload: the same greeting as the caption, under the picture. */
export function sendPhotoBody(
  reply: BotReply,
  appUrl: string,
  siteUrl: string = DEFAULT_SITE_URL,
): Record<string, unknown> {
  return {
    chat_id: reply.chatId,
    photo: reply.photoUrl,
    caption: reply.text,
    reply_markup: keyboard(reply, appUrl, siteUrl),
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

  const copy: BotCopy = {
    greeting: Deno.env.get('TELEGRAM_GREETING') ?? DEFAULT_COPY.greeting,
    buttonText: Deno.env.get('TELEGRAM_BUTTON_TEXT') ?? DEFAULT_COPY.buttonText,
    siteButtonText: Deno.env.get('TELEGRAM_SITE_BUTTON_TEXT') ?? DEFAULT_COPY.siteButtonText,
    photoUrl: Deno.env.get('TELEGRAM_PHOTO_URL') ?? DEFAULT_COPY.photoUrl,
  };
  const answer = replyFor(update, copy);
  if (!answer) return reply(200, 'ignored');

  const appUrl = Deno.env.get('MINI_APP_URL') ?? DEFAULT_APP_URL;
  const siteUrl = Deno.env.get('TELEGRAM_SITE_URL') ?? DEFAULT_SITE_URL;

  const call = (method: string, body: Record<string, unknown>) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  /*
   * The picture first, the words alone if the picture will not go.
   *
   * Telegram fetches the photo by URL from its own servers, so it can refuse for reasons that have
   * nothing to do with this function: the file moved, the deploy that generates it has not run, the
   * host is slow. None of those are a reason for someone who tapped **Start** to get silence, and
   * the greeting is the whole point — so a refused photo falls through to the same text, same
   * buttons, no picture.
   */
  let res = answer.photoUrl
    ? await call('sendPhoto', sendPhotoBody(answer, appUrl, siteUrl))
    : await call('sendMessage', sendMessageBody(answer, appUrl, siteUrl));

  if (!res.ok && answer.photoUrl) {
    console.error(
      'telegram-bot: sendPhoto failed, falling back to text',
      res.status,
      await res.text(),
    );
    res = await call('sendMessage', sendMessageBody(answer, appUrl, siteUrl));
  }
  if (!res.ok) {
    // Logged, not retried: a message Telegram refused once it will refuse again.
    console.error('telegram-bot: sendMessage failed', res.status, await res.text());
  }
  return reply(200, 'ok');
}

// Guarded so the unit tests can import this file: outside Deno there is nothing to serve.
if (typeof Deno !== 'undefined') Deno.serve(handleRequest);
