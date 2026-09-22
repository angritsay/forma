/**
 * Мини-апп → база: привязать телеграм-аккаунт к вошедшему профилю.
 *
 * Deploy:  supabase functions deploy link-telegram
 * Secrets: TELEGRAM_BOT_TOKEN уже стоит (его ставили для telegram-bot);
 *          SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY даёт платформа.
 *
 * **Без `--no-verify-jwt`**, в отличие от вебхуков рядом: здесь звонит не чужой сервис, а наш же
 * клиент от имени вошедшего человека, и платформенная проверка токена — первая из двух дверей.
 *
 * Дверей именно две, и обе обязательны:
 *   1. JWT говорит, **чей это профиль**;
 *   2. подпись `initData` говорит, **чей это телеграм**.
 * Без второй любой вошедший мог бы назвать чужой telegram id и увести на себя чужие уведомления —
 * в том числе про оплату. Проверить подпись можно только там, где лежит токен бота; репозиторий
 * публичный, токен в нём не появится никогда, поэтому проверка тут, а не в базе.
 *
 * Ответ — всегда `{ linked: boolean }` и никогда причина отказа: наружу она работает подсказкой
 * тому, кто подбирает, а внутрь и так пишется в лог.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyInitData } from './verify.ts';
import { CORS_HEADERS, preflight } from './cors.ts';

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  /*
   * Предзапрос — раньше всего остального. Браузер спрашивает разрешения отдельным `OPTIONS`, и
   * пока на него не ответить, самого `POST` не случится вовсе (`cors.ts`).
   */
  const allowed = preflight(req.method);
  if (allowed) return allowed;

  if (req.method !== 'POST') return reply(405, { linked: false });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.error('link-telegram: TELEGRAM_BOT_TOKEN is not set');
    return reply(503, { linked: false });
  }

  const auth = req.headers.get('authorization') ?? '';
  const jwt = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!jwt) return reply(401, { linked: false });

  let initData = '';
  try {
    const body = (await req.json()) as { initData?: unknown };
    initData = typeof body.initData === 'string' ? body.initData : '';
  } catch {
    return reply(400, { linked: false });
  }
  if (!initData) return reply(400, { linked: false });

  const verified = await verifyInitData(initData, botToken);
  if (!verified) {
    console.warn('link-telegram: initData rejected');
    return reply(403, { linked: false });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Кто звонит — спрашиваем у Supabase по его же токену, а не по тому, что прислал клиент.
  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  const userId = who?.user?.id;
  if (whoErr || !userId) return reply(401, { linked: false });

  /*
   * Перенос, а не отказ.
   *
   * Тот же человек мог войти под другой почтой — и тогда его телеграм уже стоит на старом профиле.
   * Отдать ему отказ значило бы оставить уведомления уходить туда, куда он больше не заходит.
   * Поэтому сначала снимаем id со всех чужих строк, потом ставим на свою; частичный unique индекс
   * (0026) держит инвариант «один телеграм — один профиль» на случай гонки.
   */
  const { error: clearErr } = await admin
    .from('profiles')
    .update({ telegram_id: null })
    .eq('telegram_id', verified.userId)
    .neq('id', userId);
  if (clearErr) {
    console.error('link-telegram: could not release the previous owner', clearErr.message);
    return reply(500, { linked: false });
  }

  const { error: setErr } = await admin
    .from('profiles')
    .update({ telegram_id: verified.userId })
    .eq('id', userId);
  if (setErr) {
    console.error('link-telegram: could not attach', setErr.message);
    return reply(500, { linked: false });
  }

  return reply(200, { linked: true });
});
