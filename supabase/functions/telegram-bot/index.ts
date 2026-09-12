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
 */
import { DEFAULT_COPY, replyFor, sendMessageBody, type TelegramUpdate } from './update.ts';

const DEFAULT_APP_URL = 'https://forma-app.co/app/';

function reply(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

Deno.serve(async (req) => {
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
});
