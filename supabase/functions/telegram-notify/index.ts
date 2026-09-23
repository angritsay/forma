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
 *
 * ## Отказ говорит, где именно
 *
 * Ответ на любом пути несёт `stage` и, если он есть, `code` от Postgres. Логи edge-функций
 * читаются в дашборде, то есть не с телефона, — а это единственная машинка в проекте, которая
 * работает сама и потому ломается молча. `{ok: false}` без подробностей означает «иди смотреть
 * логи», чего владелец сделать не может.
 *
 * **Код, а не сообщение.** `PGRST205`, `42501` — это пять символов, по которым причина ищется
 * однозначно, и в них не бывает ни адреса, ни текста. Страницу запуска в публичном репозитории
 * видно всем и навсегда.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { messageFor, toLocale, type Locale } from './copy.ts';
import { adminMessage, parseTopics, type AdminRow } from './admin.ts';

/** Сколько строк за один запуск. При раз в 10 минут это с огромным запасом. */
const BATCH = 50;

/**
 * Очередь владельца (0040) — вторая, и разгребается тем же запуском.
 *
 * Общего у двух очередей ровно одно: расписание, токен и дверь. Всё остальное разное — получатель,
 * срок жизни строки, язык, — поэтому таблицы две, а функция одна. Заводить второй cron и второй
 * секрет ради того же самого значило бы удвоить количество мест, где рассылка может встать молча.
 */
interface AdminQueueRow extends AdminRow {
  id: string;
  attempts: number;
}

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

interface PgError {
  code?: string;
  message?: string;
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * Разгрести очередь владельца: `admin_outbox` → темы группы.
 *
 * Отличий от рассылки людям три, и все три — про то, что получатель известен заранее.
 *
 * **Срока нет.** Покупка трёхдневной давности всё так же требует, чтобы её увидели, поэтому здесь
 * нет ни `expires_at`, ни статуса `skipped`.
 *
 * **Неизвестная тема — не потеря.** Если id темы нет в секрете, сообщение уходит в ту же группу
 * без `message_thread_id`, то есть в «General». Это заметно и поправимо; молча удалить строку про
 * деньги — нет.
 *
 * **Незнакомый вид остаётся в очереди.** `adminMessage` отвечает `null`, когда база обогнала
 * функцию: строка ждёт следующей выкладки вместо того, чтобы превратиться в пустое сообщение.
 *
 * **Пишет служебный бот, а не клиентский.** Владелец: «а мы можем второго бота как раз
 * использовать под админку?» — да, и это лучше: клиентскому боту нечего делать во внутренней
 * группе, а отозванный или перевыпущенный токен одного не гасит второй контур. Все возражения
 * против второго бота касались его как **входа для клиентов** (подпись мини-аппа, рассылка
 * покупателям); служебный отправитель в одну закрытую группу ни того, ни другого не трогает.
 *
 * `TELEGRAM_ADMIN_BOT_TOKEN` необязателен: без него пишет основной бот, как раньше.
 */
async function drainAdmin(
  admin: ReturnType<typeof createClient>,
  fallbackToken: string,
): Promise<{ sent: number; failed: number }> {
  const chatId = Deno.env.get('TELEGRAM_ADMIN_CHAT') ?? '';
  if (!chatId.trim()) return { sent: 0, failed: 0 };

  const botToken = (Deno.env.get('TELEGRAM_ADMIN_BOT_TOKEN') ?? '').trim() || fallbackToken;

  const topics = parseTopics(Deno.env.get('TELEGRAM_ADMIN_TOPICS') ?? '');

  const { data, error } = await admin
    .from('admin_outbox')
    .select('id, topic, kind, params, attempts')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    const e = error as PgError;
    // Не 500 на весь запуск: рассылка людям к этой таблице отношения не имеет и должна уйти.
    console.error('telegram-notify: could not read admin_outbox', e.code, e.message);
    return { sent: 0, failed: 0 };
  }

  const rows = (data ?? []) as unknown as AdminQueueRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const text = adminMessage(row);
    if (!text) {
      console.warn(`telegram-notify: unknown admin kind ${row.kind}; left in the queue`);
      continue;
    }

    const threadId = topics[row.topic];
    if (threadId === undefined) {
      console.warn(`telegram-notify: no thread id for topic ${row.topic}; sending to the group`);
    }

    const done = (status: string, lastError?: string) =>
      admin
        .from('admin_outbox')
        .update({
          status,
          attempts: row.attempts + 1,
          last_error: lastError ? lastError.slice(0, 500) : null,
        })
        .eq('id', row.id);

    let res: Response;
    try {
      res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: threadId,
          text,
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
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
     * 400 здесь — почти всегда «тема удалена» или «бота выгнали», и повторять это десять минут
     * подряд бессмысленно. Строка становится `failed` с телом ответа в `last_error`, потому что
     * ответ телеграма и есть объяснение.
     */
    const body = await res.text().catch(() => '');
    const giveUp = res.status === 400 || res.status === 403 || row.attempts + 1 >= MAX_ATTEMPTS;
    await done(giveUp ? 'failed' : 'pending', body);
    failed += 1;
  }

  return { sent, failed };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { ok: false });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const gate = Deno.env.get('NOTIFY_TOKEN');
  if (!botToken || !gate) {
    console.error('telegram-notify: TELEGRAM_BOT_TOKEN or NOTIFY_TOKEN is not set');
    return reply(503, { ok: false, stage: 'config' });
  }
  if (new URL(req.url).searchParams.get('token') !== gate) {
    return reply(403, { ok: false, stage: 'gate' });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const appUrl = Deno.env.get('MINI_APP_URL') ?? DEFAULT_APP_URL;

  /*
   * Очередь владельца — первой и всегда.
   *
   * Раньше отказ на чтении `telegram_outbox` (а такой уже случался — 0031, `42501`) обрывал весь
   * запуск. Пока очередь была одна, это было честно; теперь это значило бы, что сообщение о
   * неприкреплённом платеже не уходит из-за чужой таблицы.
   */
  const admins = await drainAdmin(admin, botToken);

  const { data, error } = await admin
    .from('telegram_outbox')
    .select('id, email, kind, params, attempts, expires_at')
    .eq('status', 'pending')
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(BATCH);

  if (error) {
    const e = error as PgError;
    console.error('telegram-notify: could not read the queue', e.code, e.message);
    return reply(500, { ok: false, stage: 'read', code: e.code ?? '', admin: admins });
  }
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    return reply(200, {
      ok: true,
      stage: 'done',
      sent: 0,
      skipped: 0,
      failed: 0,
      admin: admins,
    });
  }

  /*
   * Адреса пачкой, одним запросом.
   *
   * Получателя ищем здесь, а не в момент повода: покупка живёт на почте и приходит раньше
   * регистрации, так что на момент записи привязки могло не быть вовсе (0027).
   */
  const emails = [...new Set(rows.map((r) => r.email))];
  const { data: people, error: peopleError } = await admin
    .from('profiles')
    .select('email, telegram_id, locale')
    .in('email', emails)
    .not('telegram_id', 'is', null);

  /*
   * Раньше эта ошибка глоталась, и отказ читался как «никому не привязан телеграм»: строки
   * оставались ждать вечно, а счётчики показывали ноль отправленных и ноль ошибок. Тишина,
   * неотличимая от нормальной работы, — худший из возможных отказов для машинки без присмотра.
   */
  if (peopleError) {
    const e = peopleError as PgError;
    console.error('telegram-notify: could not read profiles', e.code, e.message);
    return reply(500, { ok: false, stage: 'recipients', code: e.code ?? '' });
  }

  /*
   * Куда писать и на каком языке — одно и то же место, потому что это одна строка профиля.
   * `locale` берётся здесь, а не в очереди: повод ставит триггер, который про человека ничего не
   * знает (покупка живёт на почте и приходит раньше регистрации), а язык — свойство получателя и
   * может смениться между постановкой в очередь и отправкой.
   */
  const chat = new Map<string, { id: number; locale: Locale }>();
  for (const p of (people ?? []) as { email: string; telegram_id: number; locale: unknown }[]) {
    chat.set(p.email.toLowerCase(), { id: p.telegram_id, locale: toLocale(p.locale) });
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

    const who = chat.get(row.email.toLowerCase());
    if (who === undefined) {
      // Ждёт: человек может открыть приложение из телеграма завтра, и тогда дойдёт.
      continue;
    }

    const message = messageFor(row, who.locale);
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
          chat_id: who.id,
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

  console.log(
    `telegram-notify: sent ${sent}, skipped ${skipped}, failed ${failed}; admin sent ${admins.sent}, failed ${admins.failed}`,
  );
  return reply(200, { ok: true, stage: 'done', sent, skipped, failed, admin: admins });
});
