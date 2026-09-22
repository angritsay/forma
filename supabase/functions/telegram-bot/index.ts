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
    /** Telegram's own UI language for the sender, e.g. `ru`, `en-GB`. Often absent. */
    from?: { language_code?: string };
    text?: string;
  };
}

/** Языки, на которых выходит продукт — `LOCALES` в src/content/schema.ts. */
export type Locale = 'ru' | 'en';

export interface BotReply {
  chatId: number;
  /** Which language the greeting is in — also decides which site the second button opens. */
  locale: Locale;
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
 * Which language to greet someone in, from the only thing Telegram tells us about them.
 *
 * `/start` is the one message that arrives before there is an account, so `profiles.locale` — what
 * the person actually chose — does not exist yet. All there is is `language_code`, the language of
 * their Telegram app.
 *
 * **Russian is the default, and English is opt-in by an explicit `en`.** The obvious rule («not
 * Russian → English») is wrong for this audience: Forma sells in roubles, the coach speaks Russian,
 * and a large share of the people who find it have their phone set to Ukrainian, Kazakh or
 * Belarusian and read Russian perfectly well. Greeting them in English would be the more confident
 * mistake. The list below is the countries where Russian is the common second language; everyone
 * else gets English.
 *
 * Whatever this guesses is undone by one tap: the app asks the question properly on its first
 * screen, and from then on the bot writes in whatever was answered there (telegram-notify/copy.ts).
 */
const RUSSIAN_SPEAKING = new Set([
  'ru',
  'be',
  'uk',
  'kk',
  'ky',
  'uz',
  'tg',
  'tk',
  'az',
  'hy',
  'ka',
  'mo',
]);

export function localeOf(update: TelegramUpdate): Locale {
  // `en-GB` and `en-US` both arrive; the region is not ours to read.
  const code = (update.message?.from?.language_code ?? '').toLowerCase().split('-')[0] ?? '';
  if (!code) return 'ru';
  return RUSSIAN_SPEAKING.has(code) ? 'ru' : 'en';
}

/** The same photograph in both languages — there is no text on it. */
const WELCOME_PHOTO = 'https://forma-app.co/bot/welcome.jpg';

/**
 * The first thing anyone sees of Forma, written by the owner and sent as she wrote it.
 *
 * It is the two of them saying hello and then naming the three tabs the app actually has —
 * «Курсы · Клуб · Тренер» — in that order, with the one instruction that matters at the end. A
 * greeting that promises a shape the app does not have is a greeting that has to be re-learned on
 * arrival, and this one used to do exactly that.
 *
 * **HTML, not Markdown, and that is a deliberate reversal.** This comment used to say "no Markdown
 * anywhere", for a good reason: MarkdownV2 needs every «.», «-» and «(» escaped, and a caption that
 * fails to parse is a caption nobody sees. HTML has no such trap — only `&`, `<` and `>` are
 * special, and nothing else in a sentence can break it. The owner's copy uses `<b>` and
 * `<blockquote>`, both of which Telegram supports, so `parse_mode: 'HTML'` goes on both sends.
 *
 * **The length is load-bearing.** A caption is capped at 1024 characters against a message's 4096,
 * and going over does not truncate — `sendPhoto` fails outright and the bot falls back to text,
 * silently dropping the photograph. The visible text here is 928 characters, which leaves under a
 * hundred to spare, so `index.test.ts` measures it. Anything added must come out of something else.
 *
 * The claims are the product's own: one beginner course, a video on every movement, an hour with
 * the coach for whoever is top on Sunday. This is the one place a promise is made to somebody who
 * has not paid yet, so nothing here is rounded up.
 */
export const DEFAULT_COPY: Record<Locale, BotCopy> = {
  ru: {
    greeting:
      'Привет. Это Сережа и Настя — создатели приложения <b>Forma</b> с тренировками, ' +
      'которые не захочется бросить.\n\n' +
      'Никакого зала. Всё что тебе нужно — это 15 минут и коврик.\n\n' +
      'Внутри три раздела:\n\n' +
      '🎬 <b>Курсы</b>\n' +
      'Пока что только курс для новичков, но скоро добавим ещё. На каждое движение есть видео ' +
      'и инструкции по выполнению. Попробуй во время тренировки свайп вниз чтобы перейти ' +
      'к следующему упражнению, влево — чтобы узнать технику и ограничения.\n\n' +
      '🏆 <b>Клуб маленьких шагов</b>\n' +
      'Одно небольшое задание от тренера в день, чтобы постепенно изменить твои привычки. ' +
      'Плюс общая таблица на неделю. Кто наверху в воскресенье, тот забирает час онлайн ' +
      '1-1 с Сережей.\n\n' +
      '📞 <b>Тренер</b>\n' +
      'Это персональные тренировки и консультации с Сережей — тренером, экспертом по питанию ' +
      'и создателем Forma. Можно проверить технику, собрать план на ближайшие недели ' +
      'или обсудить диету.\n\n' +
      '<blockquote>Проще всего — открыть приложение, войти и пройти первую тренировку. ' +
      'Она короткая, остальное поймёшь по ходу.</blockquote>',
    buttonText: 'Открыть приложение',
    siteButtonText: 'Почитать на сайте',
    photoUrl: WELCOME_PHOTO,
  },
  /*
   * Тот же текст по-английски, а не другой: это её приветствие, и переписывать его «под рынок»
   * значило бы пообещать другой продукт. Отличий ровно два, и оба вынужденные — «Сережа» и
   * «Настя» становятся Sergey и Nastya (иначе имена не прочитать), а подпись кнопки «Курсы»
   * совпадает с тем, как вкладка называется в английском приложении.
   *
   * Длина проверяется отдельно: подпись к фотографии обрезается на 1024 символах, и английская
   * версия имеет на это столько же прав, сколько русская.
   */
  en: {
    greeting:
      'Hi. We are Sergey and Nastya — the people behind <b>Forma</b>, an app with workouts ' +
      'you will not want to quit.\n\n' +
      'No gym. All you need is 15 minutes and a mat.\n\n' +
      'There are three sections inside:\n\n' +
      '🎬 <b>Courses</b>\n' +
      'For now just the beginner course, more are coming. Every movement has a video and ' +
      'instructions. During a workout, swipe down for the next exercise and left for the ' +
      'technique and what to watch out for.\n\n' +
      '🏆 <b>Club of small steps</b>\n' +
      'One small task from the coach every day, to change your habits gradually. Plus a shared ' +
      'table for the week. Whoever is on top on Sunday takes an hour one-to-one with Sergey.\n\n' +
      '📞 <b>Coach</b>\n' +
      'Personal sessions and consultations with Sergey — a coach, a nutrition specialist and ' +
      'the maker of Forma. Check your technique, build a plan for the coming weeks or talk ' +
      'through your diet.\n\n' +
      '<blockquote>The easiest start: open the app, sign in and do the first workout. It is ' +
      'short, and the rest makes sense as you go.</blockquote>',
    buttonText: 'Open the app',
    siteButtonText: 'Read on the site',
    photoUrl: WELCOME_PHOTO,
  },
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
 * The same page in the reader's language: Russian keeps the bare paths, English lives under
 * `/en/` (LOCALES in src/content/schema.ts). Sending an English greeting and then a button onto a
 * Russian page is the one way this could be worse than not translating the greeting at all.
 *
 * Only the site's own root is rewritten. If `TELEGRAM_SITE_URL` points somewhere else — another
 * host, a landing page — it is left exactly as given: a guess about somebody else's URL structure
 * is how a working link becomes a 404.
 */
export function siteUrlFor(locale: Locale, base: string): string {
  if (locale === 'ru' || !base) return base;
  return base === DEFAULT_SITE_URL ? `${DEFAULT_SITE_URL}en/` : base;
}

/**
 * The reply an update deserves, or null for the updates that are not a person writing to the bot.
 *
 * Groups and channels are left alone: a `web_app` button only launches from a private chat anyway,
 * and a bot that answers every message in a group chat is a bot people remove.
 */
export function replyFor(
  update: TelegramUpdate,
  copy: Record<Locale, BotCopy> = DEFAULT_COPY,
): BotReply | null {
  const message = update.message;
  const chatId = message?.chat?.id;
  if (typeof chatId !== 'number') return null;
  if (message?.chat?.type !== 'private') return null;
  if (typeof message.text !== 'string' || message.text.trim() === '') return null;
  const c = copy[localeOf(update)] ?? copy.ru;
  return {
    chatId,
    locale: localeOf(update),
    text: c.greeting,
    buttonText: c.buttonText,
    siteButtonText: c.siteButtonText,
    photoUrl: c.photoUrl,
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
    // See DEFAULT_COPY: the greeting carries <b> and <blockquote>, and HTML is the one parse mode
    // whose escaping rules a Russian sentence cannot trip over by accident.
    parse_mode: 'HTML',
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
    parse_mode: 'HTML',
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

  /*
   * Fail closed, as calendly-webhook already does.
   *
   * This used to warn and carry on, which meant that a project missing the secret ran an
   * unauthenticated endpoint: the function URL is not a credential — it appears in deploy logs,
   * in `getWebhookInfo`, and in anything that ever proxied a request to it — so anyone holding it
   * could post fabricated updates and have the coach's bot send messages to any chat id they
   * named. That is a "works today, embarrassing later" configuration, and the only safe default
   * for a door is shut.
   *
   * 503 rather than 403: nothing is wrong with the caller, the bot is not configured. Telegram
   * retries on 5xx, so the queued /start messages survive until the secret is set.
   */
  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (!secret) {
    console.error('telegram-bot: TELEGRAM_WEBHOOK_SECRET is not set; refusing every delivery');
    return reply(503, 'not configured');
  }
  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return reply(403, 'bad secret');
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return reply(400, 'unreadable body');
  }

  /*
   * Каждая настройка — своя на язык: `TELEGRAM_GREETING` правит русское приветствие,
   * `TELEGRAM_GREETING_EN` — английское. Без суффикса значит «русское», потому что эти переменные
   * уже могут стоять в проекте и раньше означали ровно это; переопределить один язык и нечаянно
   * стереть второй так нельзя. Фотография одна на оба — на ней нет текста.
   */
  const env = (name: string, locale: Locale) => Deno.env.get(locale === 'ru' ? name : `${name}_EN`);
  const copyFor = (locale: Locale): BotCopy => ({
    greeting: env('TELEGRAM_GREETING', locale) ?? DEFAULT_COPY[locale].greeting,
    buttonText: env('TELEGRAM_BUTTON_TEXT', locale) ?? DEFAULT_COPY[locale].buttonText,
    siteButtonText: env('TELEGRAM_SITE_BUTTON_TEXT', locale) ?? DEFAULT_COPY[locale].siteButtonText,
    photoUrl: Deno.env.get('TELEGRAM_PHOTO_URL') ?? DEFAULT_COPY[locale].photoUrl,
  });
  const answer = replyFor(update, { ru: copyFor('ru'), en: copyFor('en') });
  if (!answer) return reply(200, 'ignored');

  const appUrl = Deno.env.get('MINI_APP_URL') ?? DEFAULT_APP_URL;
  const siteUrl = siteUrlFor(answer.locale, Deno.env.get('TELEGRAM_SITE_URL') ?? DEFAULT_SITE_URL);

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
