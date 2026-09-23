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
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { messageFor, toLocale, type Locale } from './copy.ts';
import { adminFailure, adminMessage, parseTopics, stripLinks, type AdminRow } from './admin.ts';

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

/** После скольких неудач подряд строка людям признаётся безнадёжной. У канала свой счёт (`admin.ts`). */
const MAX_ATTEMPTS = 5;

const DEFAULT_APP_URL = 'https://forma-app.co/app/';

interface Row {
  id: string;
  /** `null` у строки, адресованной прямо в чат (`chat_id`, 0045): ответ на обращение в бота. */
  email: string | null;
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
  admin: SupabaseClient,
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

    const send = (body: string) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: threadId,
          text: body,
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
      });

    let res: Response;
    let answer = '';
    try {
      res = await send(text);
      if (!res.ok) {
        answer = await res.text().catch(() => '');
        /*
         * Разметка или ссылка не понравились телеграму — сразу ещё раз, без ссылок. Это почти
         * всегда `tg://user?id=…` у человека, запретившего находить себя по id: сообщение о нём
         * важнее ссылки на него, а строка «Ответить» без ссылки всё равно называет, кому.
         */
        if (adminFailure(res.status, answer, row.attempts + 1, false) === 'retry_plain') {
          res = await send(stripLinks(text));
          answer = res.ok ? '' : await res.text().catch(() => '');
        }
      }
    } catch (e) {
      const giveUp = adminFailure(0, '', row.attempts + 1, true) === 'give_up';
      await done(giveUp ? 'failed' : 'pending', String(e));
      failed += 1;
      continue;
    }

    if (res.ok) {
      await done('sent');
      sent += 1;
      continue;
    }

    /*
     * Остальные отказы — в очередь до следующего запуска, и `failed` только после
     * `ADMIN_MAX_ATTEMPTS` попыток (`admin.ts`). Раньше 400 и 403 сразу хоронили строку: «тема
     * удалена», «бота выгнали» — это чинится руками, и сообщение о деньгах должно этого дождаться.
     */
    const giveUp = adminFailure(res.status, answer, row.attempts + 1, true) === 'give_up';
    await done(giveUp ? 'failed' : 'pending', `${res.status} ${answer}`);
    failed += 1;

    // 429 — телеграм просит подождать. Долбить его остальной пачкой значит продлить запрет.
    if (res.status === 429) break;
  }

  return { sent, failed };
}

/** Строка очереди людям вместе с тем, куда и на каком языке её слать; `chat: null` — некуда. */
interface DueRow extends Row {
  chat: { id: number; locale: Locale } | null;
}

type Due = { rows: DueRow[] } | { stage: string; code: string };

/**
 * Что отправлять в этот запуск.
 *
 * С 0043 отбор делает база (`telegram_outbox_due`): только строки, у адресата которых есть
 * телеграм. Раньше функция брала 50 самых ранних строк и уже потом искала получателей — и строки
 * людей без телеграма, которых большинство, занимали всю пачку, пока не истекут. Сообщение
 * человеку с телеграмом при этом стояло за ними до трёх дней.
 *
 * База без 0043 (функция выложена раньше миграции) отвечает `PGRST202`, и тогда — прежний путь:
 * пачка по времени и поиск получателей по адресам. Хуже, но работает.
 */
async function loadDue(admin: SupabaseClient): Promise<Due> {
  const { data, error } = await admin.rpc('telegram_outbox_due', { p_limit: BATCH });
  if (!error) {
    const rows = (data ?? []) as (Row & { telegram_id: number; locale: unknown })[];
    return {
      rows: rows.map((r) => ({ ...r, chat: { id: r.telegram_id, locale: toLocale(r.locale) } })),
    };
  }
  const e = error as PgError;
  if (e.code !== 'PGRST202') {
    console.error('telegram-notify: could not read the queue', e.code, e.message);
    return { stage: 'read', code: e.code ?? '' };
  }

  const { data: legacy, error: legacyError } = await admin
    .from('telegram_outbox')
    .select('id, email, kind, params, attempts, expires_at')
    .eq('status', 'pending')
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(BATCH);
  if (legacyError) {
    const le = legacyError as PgError;
    console.error('telegram-notify: could not read the queue', le.code, le.message);
    return { stage: 'read', code: le.code ?? '' };
  }
  const rows = (legacy ?? []) as Row[];
  if (rows.length === 0) return { rows: [] };

  const emails = [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e))];
  const { data: people, error: peopleError } = await admin
    .from('profiles')
    .select('email, telegram_id, locale')
    .in('email', emails)
    .not('telegram_id', 'is', null);
  /*
   * Отказ здесь не глотается: иначе он читался бы как «никому не привязан телеграм», строки ждали
   * бы вечно, а счётчики показывали бы ноль отправленных и ноль ошибок.
   */
  if (peopleError) {
    const pe = peopleError as PgError;
    console.error('telegram-notify: could not read profiles', pe.code, pe.message);
    return { stage: 'recipients', code: pe.code ?? '' };
  }
  const chat = new Map<string, { id: number; locale: Locale }>();
  for (const p of (people ?? []) as { email: string; telegram_id: number; locale: unknown }[]) {
    chat.set(p.email.toLowerCase(), { id: p.telegram_id, locale: toLocale(p.locale) });
  }
  return {
    rows: rows.map((r) => ({ ...r, chat: (r.email && chat.get(r.email.toLowerCase())) || null })),
  };
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

  /*
   * Истёкшие — одним запросом и первыми. Раньше они гасились по одной внутри пачки, а значит
   * сначала занимали в ней место: пятьдесят просроченных строк людей без телеграма означали
   * запуск, который не отправил никому ничего.
   */
  let skipped = 0;
  const { data: expired, error: expireError } = await admin
    .from('telegram_outbox')
    .update({ status: 'skipped', last_error: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (expireError) {
    const e = expireError as PgError;
    console.error('telegram-notify: could not expire old rows', e.code, e.message);
  } else {
    skipped += (expired ?? []).length;
  }

  const due = await loadDue(admin);
  if ('stage' in due) {
    return reply(500, { ok: false, stage: due.stage, code: due.code, admin: admins });
  }
  const rows = due.rows;
  if (rows.length === 0) {
    return reply(200, {
      ok: true,
      stage: 'done',
      sent: 0,
      skipped,
      failed: 0,
      admin: admins,
    });
  }

  const now = Date.now();
  let sent = 0;
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

    const who = row.chat;
    if (who === null) {
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
          /*
           * Ответ на обращение цитирует вопрос (0045). Если человек его удалил, телеграм без
           * `allow_sending_without_reply` отказал бы всему сообщению — а ответ важнее цитаты.
           */
          reply_parameters: message.replyTo
            ? { message_id: message.replyTo, allow_sending_without_reply: true }
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
    // 429 — телеграм просит подождать; остальная пачка подождёт следующего запуска.
    if (res.status === 429) break;
  }

  console.log(
    `telegram-notify: sent ${sent}, skipped ${skipped}, failed ${failed}; admin sent ${admins.sent}, failed ${admins.failed}`,
  );
  return reply(200, { ok: true, stage: 'done', sent, skipped, failed, admin: admins });
});
