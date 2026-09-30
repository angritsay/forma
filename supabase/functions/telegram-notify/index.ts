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
 * `status` уже `sent`, второй раз не берётся, а пачку запуск забирает себе (0059: `skip locked`
 * и аренда на пять минут) — два запуска, наложившиеся друг на друга, одну строку не шлют дважды.
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
import {
  accessWarningEnd,
  clientFailure,
  messageFor,
  plainText,
  toLocale,
  type Locale,
} from './copy.ts';
import {
  ADMIN_KINDS,
  adminFailure,
  adminMessage,
  parseTopics,
  stripLinks,
  type AdminRow,
} from './admin.ts';

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

/** A read that may come from either of two calls (the 0059 claim, or the read before it). */
interface Read {
  data: unknown;
  error: unknown;
}

/**
 * Whether a row's new state was written. A write that failed is the one failure here that can
 * send a message twice — the row is still `pending`, and its lease (0059) runs out — so the run
 * stops at the first one instead of sending more it may not be able to record.
 */
async function recorded(write: PromiseLike<{ error: unknown }>, queue: string): Promise<boolean> {
  const { error } = await write;
  if (!error) return true;
  const e = error as PgError;
  console.error(`telegram-notify: could not record a ${queue} row`, e.code, e.message);
  return false;
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
  appUrl: string,
): Promise<{ sent: number; failed: number; unrecorded: number }> {
  const chatId = Deno.env.get('TELEGRAM_ADMIN_CHAT') ?? '';
  if (!chatId.trim()) return { sent: 0, failed: 0, unrecorded: 0 };

  const botToken = (Deno.env.get('TELEGRAM_ADMIN_BOT_TOKEN') ?? '').trim() || fallbackToken;

  const topics = parseTopics(Deno.env.get('TELEGRAM_ADMIN_TOPICS') ?? '');

  /*
   * The batch is claimed (0059): locked with `skip locked` and leased in one statement, so a run
   * that overlaps this one sends none of it again. Only kinds this deploy can word are taken —
   * an unknown one stays in the queue without taking a place in the batch. A database without
   * 0059 answers `PGRST202`, and then the plain read, filtered the same way.
   */
  let read: Read = await admin.rpc('admin_outbox_claim', { p_kinds: ADMIN_KINDS, p_limit: BATCH });
  if (read.error && (read.error as PgError).code === 'PGRST202') {
    read = await admin
      .from('admin_outbox')
      .select('id, topic, kind, params, attempts, dedupe_key')
      .eq('status', 'pending')
      .in('kind', [...ADMIN_KINDS])
      .order('created_at', { ascending: true })
      .limit(BATCH);
  }
  const { data, error } = read;

  if (error) {
    const e = error as PgError;
    // Не 500 на весь запуск: рассылка людям к этой таблице отношения не имеет и должна уйти.
    console.error('telegram-notify: could not read admin_outbox', e.code, e.message);
    return { sent: 0, failed: 0, unrecorded: 0 };
  }

  const rows = (data ?? []) as unknown as AdminQueueRow[];
  let sent = 0;
  let failed = 0;
  let unrecorded = 0;

  for (const row of rows) {
    // Со ссылкой прямо на экран админки (0044): платёж, отчёты клуба или человек.
    const text = adminMessage(row, appUrl);
    if (!text) {
      // Only on the fallback read of a database without 0059, or ADMIN_KINDS out of step.
      console.warn(`telegram-notify: unknown admin kind ${row.kind}; left in the queue`);
      continue;
    }

    const threadId = topics[row.topic];
    if (threadId === undefined) {
      console.warn(`telegram-notify: no thread id for topic ${row.topic}; sending to the group`);
    }

    const done = (status: string, lastError?: string) =>
      recorded(
        admin
          .from('admin_outbox')
          .update({
            status,
            attempts: row.attempts + 1,
            last_error: lastError ? lastError.slice(0, 500) : null,
          })
          .eq('id', row.id),
        'admin',
      );

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
      failed += 1;
      if (!(await done(giveUp ? 'failed' : 'pending', String(e)))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    if (res.ok) {
      sent += 1;
      if (!(await done('sent'))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    /*
     * Остальные отказы — в очередь до следующего запуска, и `failed` только после
     * `ADMIN_MAX_ATTEMPTS` попыток (`admin.ts`). Раньше 400 и 403 сразу хоронили строку: «тема
     * удалена», «бота выгнали» — это чинится руками, и сообщение о деньгах должно этого дождаться.
     */
    const giveUp = adminFailure(res.status, answer, row.attempts + 1, true) === 'give_up';
    failed += 1;
    if (!(await done(giveUp ? 'failed' : 'pending', `${res.status} ${answer}`))) {
      unrecorded += 1;
      break;
    }

    // 429 — телеграм просит подождать. Долбить его остальной пачкой значит продлить запрет.
    if (res.status === 429) break;
  }

  return { sent, failed, unrecorded };
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
  /*
   * Claimed, not just read (0059): the same rows as `telegram_outbox_due`, locked with `skip
   * locked` and leased in one statement, so an overlapping run never sends them a second time.
   * Without 0059 the claim is `PGRST202`, and the plain due list is the next best thing.
   */
  let read: Read = await admin.rpc('telegram_outbox_claim', { p_limit: BATCH });
  if (read.error && (read.error as PgError).code === 'PGRST202') {
    read = await admin.rpc('telegram_outbox_due', { p_limit: BATCH });
  }
  const { data, error } = read;
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

/**
 * Whether an access warning (0054) has become moot: its moment (`end`, from `accessWarningEnd`)
 * has passed, or the person now has a live subscription that runs past it — a renewal for
 * `subscription_ending`, a new subscription for `club_trial_tomorrow`. `null` when the lookup
 * failed; the caller then leaves the row for the next run.
 */
async function accessWarningMoot(
  admin: SupabaseClient,
  row: Row,
  end: number,
  now: number,
): Promise<boolean | null> {
  if (end <= now) return true;
  if (!row.email) return true;
  const { data, error } = await admin
    .from('subscriptions')
    .select('id')
    .eq('email', row.email)
    .in('status', ['active', 'cancelled'])
    .gt('expires_at', new Date(end).toISOString())
    .limit(1);
  if (error) {
    const e = error as PgError;
    console.error('telegram-notify: could not check the subscription', e.code);
    return null;
  }
  return (data ?? []).length > 0;
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
  const admins = await drainAdmin(admin, botToken, appUrl);

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
  let blocked = 0;
  let unrecorded = 0;
  /**
   * Chats that answered 403 in this run. A later row to the same chat is left pending, untouched:
   * its lease runs out, and from then on the blocked flag keeps it out of the batch.
   */
  const blockedChats = new Set<number>();

  for (const row of rows) {
    const done = (status: string, lastError?: string) =>
      recorded(
        admin
          .from('telegram_outbox')
          .update({
            status,
            attempts: row.attempts + 1,
            last_error: lastError ? lastError.slice(0, 500) : null,
          })
          .eq('id', row.id),
        'client',
      );

    // Просрочено — уже не новость. Так же уходят те, у кого телеграма нет вовсе:
    // владелец про них — «Это нормально».
    if (new Date(row.expires_at).getTime() < now) {
      skipped += 1;
      if (!(await done('skipped'))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    const who = row.chat;
    if (who === null) {
      // Ждёт: человек может открыть приложение из телеграма завтра, и тогда дойдёт.
      continue;
    }
    if (blockedChats.has(who.id)) continue;

    /*
     * An access warning (0054) is checked again right before it goes: it may have waited for the
     * person to link Telegram, and in the meantime the moment passed or they renewed. Either way
     * «the club is open until…» would now be wrong, so the row is dropped, not sent. A failed
     * lookup leaves the row for the next run: the row's own TTL still ends it.
     */
    const end = accessWarningEnd(row);
    if (end !== null) {
      const moot = await accessWarningMoot(admin, row, end, now);
      if (moot === null) continue;
      if (moot) {
        skipped += 1;
        if (!(await done('skipped', 'no longer due'))) {
          unrecorded += 1;
          break;
        }
        continue;
      }
    }

    const message = messageFor(row, who.locale, now);
    if (!message) {
      console.error('telegram-notify: unknown kind', row.kind);
      skipped += 1;
      if (!(await done('skipped', `unknown kind ${row.kind}`))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    /** `plain`: the same words with no markup — the second try after a 400 (`clientFailure`). */
    const send = (plain: boolean) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: who.id,
          text: plain ? plainText(message.text) : message.text,
          parse_mode: plain ? undefined : 'HTML',
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

    let res: Response;
    let body = '';
    try {
      res = await send(false);
      if (!res.ok) {
        body = await res.text().catch(() => '');
        if (clientFailure(res.status, row.attempts + 1, false) === 'retry_plain') {
          res = await send(true);
          body = res.ok ? '' : await res.text().catch(() => '');
        }
      }
    } catch (e) {
      // A network error counts towards the same limit as a refusal: it is not a free retry forever.
      const giveUp = clientFailure(0, row.attempts + 1, true) === 'give_up';
      failed += 1;
      if (!(await done(giveUp ? 'failed' : 'pending', String(e)))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    if (res.ok) {
      sent += 1;
      if (!(await done('sent'))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    const verdict = clientFailure(res.status, row.attempts + 1, true);

    /*
     * 403 — человек заблокировал бота или удалил чат. Это ответ, а не сбой: повторять нечего.
     * Строка уходит в `skipped`, а профиль помечается (0059), и следующие строки этому человеку
     * очередь больше не предлагает — до тех пор, пока он снова не напишет боту.
     */
    if (verdict === 'blocked') {
      skipped += 1;
      blocked += 1;
      blockedChats.add(who.id);
      const { error: flagError } = await admin.rpc('telegram_set_blocked', {
        p_telegram_id: who.id,
        p_blocked: true,
      });
      if (flagError) {
        const fe = flagError as PgError;
        // Without 0059 there is nothing to flag; the row is still skipped, as before.
        if (fe.code !== 'PGRST202') {
          console.error('telegram-notify: could not flag a blocked chat', fe.code);
        }
      }
      if (!(await done('skipped', body))) {
        unrecorded += 1;
        break;
      }
      continue;
    }

    // Остальное (429, 5xx, 400 и после простого текста) — ещё раз в следующий запуск.
    failed += 1;
    if (!(await done(verdict === 'give_up' ? 'failed' : 'pending', `${res.status} ${body}`))) {
      unrecorded += 1;
      break;
    }
    // 429 — телеграм просит подождать; остальная пачка подождёт следующего запуска.
    if (res.status === 429) break;
  }

  console.log(
    `telegram-notify: sent ${sent}, skipped ${skipped} (blocked ${blocked}), failed ${failed}, unrecorded ${unrecorded}; admin sent ${admins.sent}, failed ${admins.failed}, unrecorded ${admins.unrecorded}`,
  );

  /*
   * A row that went out and could not be marked will go out again once its lease runs out: that
   * is worth a red run, not a green one with a number in it nobody reads.
   */
  if (unrecorded + admins.unrecorded > 0) {
    return reply(500, {
      ok: false,
      stage: 'record',
      sent,
      skipped,
      failed,
      blocked,
      admin: admins,
    });
  }
  return reply(200, { ok: true, stage: 'done', sent, skipped, failed, blocked, admin: admins });
});
