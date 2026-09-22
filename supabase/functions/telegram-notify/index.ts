/**
 * Очередь → телеграм: разослать то, что накопилось в `telegram_outbox` (0027).
 *
 * Deploy:  supabase functions deploy telegram-notify --no-verify-jwt
 * Secrets: TELEGRAM_BOT_TOKEN уже стоит (от `deploy-bot`); NOTIFY_TOKEN — свой, для двери.
 * Запускается по расписанию: .github/workflows/telegram-notify.yml, раз в 10 минут.
 *
 * **Дверь — токен в адресе**, как у `prodamus-webhook`. Звонящий — наш же workflow, и `--no-verify-jwt`
 * здесь потому, что у расписания нет сессии человека. Без секрета функция отказывает всем: URL
 * функции не пароль (он виден в логах деплоя), а за этой дверью стоит рассылка от имени тренера.
 *
 * **Отправляет, но ничего не решает.** Кому и по какому поводу писать — решили триггеры в базе;
 * здесь только «взять готовое и отнести». Поэтому повторный запуск безвреден: строка, у которой
 * `status` уже `sent`, второй раз не берётся.
 *
 * **Никакой параллельности.** Телеграм разрешает около 30 сообщений в секунду, а порядок здесь
 * не важен вовсе; последовательная отправка пачкой в 50 строк проще и никогда не упрётся в лимит.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { messageFor } from './copy.ts';

/** Сколько строк за один запуск. При раз в 10 минут это с огромным запасом. */
const BATCH = 50;

/** После скольких неудач подряд строка признаётся безнадёжной. */
const MAX_ATTEMPTS = 5;

const DEFAULT_APP_URL = 'https://forma-app.co/app/';

interface Row {
  id: string;
  email: string;
  kind: string;
  params: Record<string, unknown> | null;
  attempts: number;
  expires_at: string;
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { ok: false });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const gate = Deno.env.get('NOTIFY_TOKEN');
  if (!botToken || !gate) {
    console.error('telegram-notify: TELEGRAM_BOT_TOKEN or NOTIFY_TOKEN is not set');
    return reply(503, { ok: false });
  }
  if (new URL(req.url).searchParams.get('token') !== gate) return reply(403, { ok: false });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const appUrl = Deno.env.get('MINI_APP_URL') ?? DEFAULT_APP_URL;

  const { data, error } = await admin
    .from('telegram_outbox')
    .select('id, email, kind, params, attempts, expires_at')
    .eq('status', 'pending')
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error('telegram-notify: could not read the queue', error.message);
    return reply(500, { ok: false });
  }
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return reply(200, { ok: true, sent: 0, skipped: 0, failed: 0 });

  /*
   * Адреса пачкой, одним запросом.
   *
   * Получателя ищем здесь, а не в момент повода: покупка живёт на почте и приходит раньше
   * регистрации, так что на момент записи привязки могло не быть вовсе (0027).
   */
  const emails = [...new Set(rows.map((r) => r.email))];
  const { data: people } = await admin
    .from('profiles')
    .select('email, telegram_id')
    .in('email', emails)
    .not('telegram_id', 'is', null);

  const chat = new Map<string, number>();
  for (const p of (people ?? []) as { email: string; telegram_id: number }[]) {
    chat.set(p.email.toLowerCase(), p.telegram_id);
  }

  const now = Date.now();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const done = (status: string, lastError?: string) =>
      admin
        .from('telegram_outbox')
        .update({
          status,
          attempts: row.attempts + 1,
          last_error: lastError ? lastError.slice(0, 500) : null,
        })
        .eq('id', row.id);

    // Просрочено — уже не новость. Так же уходят те, у кого телеграма нет вовсе:
    // владелец про них — «Это нормально».
    if (new Date(row.expires_at).getTime() < now) {
      await done('skipped');
      skipped += 1;
      continue;
    }

    const chatId = chat.get(row.email.toLowerCase());
    if (chatId === undefined) {
      // Ждёт: человек может открыть приложение из телеграма завтра, и тогда дойдёт.
      continue;
    }

    const message = messageFor(row);
    if (!message) {
      console.error('telegram-notify: unknown kind', row.kind);
      await done('skipped', `unknown kind ${row.kind}`);
      skipped += 1;
      continue;
    }

    let res: Response;
    try {
      res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message.text,
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          reply_markup: message.buttonText
            ? { inline_keyboard: [[{ text: message.buttonText, web_app: { url: appUrl } }]] }
            : undefined,
        }),
      });
    } catch (e) {
      await done('pending', String(e));
      failed += 1;
      continue;
    }

    if (res.ok) {
      await done('sent');
      sent += 1;
      continue;
    }

    /*
     * 403 — человек заблокировал бота или удалил чат. Это ответ, а не сбой: повторять нечего,
     * и держать такую строку в очереди значит долбиться в закрытую дверь каждые десять минут.
     */
    const body = await res.text().catch(() => '');
    if (res.status === 403) {
      await done('skipped', body);
      skipped += 1;
      continue;
    }

    // Остальное (429, 5xx, обрыв) — повод попробовать ещё раз в следующий запуск.
    const giveUp = row.attempts + 1 >= MAX_ATTEMPTS;
    await done(giveUp ? 'failed' : 'pending', body);
    failed += 1;
  }

  console.log(`telegram-notify: sent ${sent}, skipped ${skipped}, failed ${failed}`);
  return reply(200, { ok: true, sent, skipped, failed });
});
