/**
 * lava.top → Supabase: открыть курс или продлить подписку, когда пришли деньги не в рублях.
 *
 * Deploy:  supabase functions deploy lava-webhook --no-verify-jwt
 * Secrets: supabase secrets set LAVA_WEBHOOK_SECRET=… LAVA_PRODUCTS=… WEBHOOK_TOKEN=…
 *          (SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY даёт платформа)
 * Адрес в кабинете lava.top: https://<project>.functions.supabase.co/lava-webhook?token=<WEBHOOK_TOKEN>
 *
 * ## Зачем он вообще
 *
 * До него у платящих не в рублях был ручной путь: перевод на PayPal, почта в комментарии, доступ
 * руками. Владелец: «давай подключим лава топ вместо всех приколов с пейпалом и инструкциями».
 * Вся разница — в этом файле: он превращает оплату в открытый доступ без участия человека.
 *
 * ## Дверь охраняют две проверки
 *
 * Токен в адресе (его знает только lava.top) и подпись HMAC в заголовке `signature` (её может
 * сделать только она же). Любая не сошлась — 403 и ничего не записано. Ровно та же пара, что у
 * `prodamus-webhook`, и по той же причине: адрес функции публичен, а открывать доступ по
 * «кто-то постучался» нельзя.
 *
 * ## Что открывать — сказано в самом уведомлении
 *
 * И это главное отличие от Prodamus. Короткая ссылка Prodamus теряет параметры, поэтому там
 * приходится угадывать: сумма — это тариф, а всё остальное сопоставляется с единственным
 * ожидающим заказом. lava.top присылает `product.id`, то есть говорит прямо, что купили.
 *
 * Сопоставление «товар в lava.top → что это у нас» лежит в секрете `LAVA_PRODUCTS` — JSON вида
 * `{"<product id>": "course:start", "<product id>": "plan:annual"}`, те же ключи, что в
 * `content/site/payments.ts`. Секретом, а не в коде, потому что функция живёт отдельно от сборки
 * сайта: переименовали товар в кабинете — поправили секрет, не дожидаясь выкладки.
 *
 * ## Идемпотентность
 *
 * `contractId` — номер контракта в lava.top, он же уезжает в `provider_ref`. Обе применяющие
 * функции (`apply_subscription_payment`, `apply_course_payment`) идемпотентны по нему, так что
 * уведомление, доставленное дважды, откроет доступ один раз. lava.top повторяет доставку при
 * ошибке, и это единственное, что делает повторы безопасными.
 *
 * ## Почта та, что человек ввёл в кассе
 *
 * Та же беда, что с Prodamus, и то же лекарство: платёж, не сошедшийся ни с одним заказом,
 * записывается в журнал через `record_payment()` и ждёт, пока владелец свяжет его с человеком
 * («Оплатил(а) с другой почты?» и `claim_payment()`, 0020). Деньги не теряются никогда.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { grantsAccess, hmacHex, parseHook, signatureMatches } from './verify.ts';
import { keyFor, parseProductMap, type ProductMap } from './products.ts';

const TOKEN = Deno.env.get('WEBHOOK_TOKEN') ?? '';
const SECRET = Deno.env.get('LAVA_WEBHOOK_SECRET') ?? '';

/** Что продаёт каждый товар lava.top. Форма секрета — в `products.ts`. */
function productMap(): ProductMap {
  const raw = Deno.env.get('LAVA_PRODUCTS') ?? '';
  const map = parseProductMap(raw);
  if (raw.trim() && Object.keys(map).length === 0) {
    // Кривой секрет не должен валить каждое уведомление: без карты товаров платёж всё равно
    // попадёт в журнал и будет ждать выдачи руками.
    console.error('lava-webhook: LAVA_PRODUCTS is empty or not valid JSON');
  }
  return map;
}

const reply = (status: number, text: string) => new Response(text, { status });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'method not allowed');

  // Первая дверь: токен в адресе.
  const url = new URL(req.url);
  if (!TOKEN || url.searchParams.get('token') !== TOKEN) return reply(403, 'forbidden');

  /*
   * Сырое тело, а не разобранный объект: подпись считается по тому тексту, который приехал.
   * Разобрать и собрать обратно почти наверняка даст другие пробелы и другой порядок ключей, и
   * подпись перестанет сходиться на совершенно правильном уведомлении.
   */
  const body = await req.text();

  // Вторая дверь: подпись.
  if (!SECRET) {
    console.error('lava-webhook: LAVA_WEBHOOK_SECRET is not set; refusing everything');
    return reply(403, 'forbidden');
  }
  const got = req.headers.get('signature') ?? '';
  if (!signatureMatches(await hmacHex(SECRET, body), got)) {
    console.warn('lava-webhook: signature mismatch');
    return reply(403, 'forbidden');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return reply(400, 'not json');
  }
  const hook = parseHook(parsed);
  if (!hook) return reply(400, 'not a lava notification');

  /*
   * Событие, которое ничего не открывает, — это 200 и тишина. Отказ в оплате ничего не меняет, а
   * `subscription.cancelled` означает «больше не продлевать»: доступ живёт до конца оплаченного
   * периода, и отбирать его сейчас значило бы забрать неделю, за которую заплатили. 4xx здесь был
   * бы хуже вдвойне — lava.top повторяет доставку на ошибках, и повторять нечего.
   */
  if (!grantsAccess(hook.eventType)) return reply(200, `ignored: ${hook.eventType}`);

  const email = (hook.buyer.email ?? '').trim().toLowerCase();
  if (!email) {
    console.warn(`lava-webhook: ${hook.eventType} without a buyer email (${hook.contractId})`);
    return reply(200, 'ignored: no email');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const paidAt = hook.timestamp ?? new Date().toISOString();
  /*
   * Сумма участвует наравне с товаром: тариф в lava.top держит месяц и год под одним `product.id`,
   * а периода в уведомлении нет вовсе (`products.ts`).
   */
  const amount = typeof hook.amount === 'number' ? hook.amount : null;
  const what = keyFor(productMap(), hook.product.id ?? '', amount);
  const plan = what.startsWith('plan:') ? what.slice('plan:'.length) : '';
  if (!what) {
    console.warn(
      `lava-webhook: product ${hook.product.id ?? '(none)'} at ${amount ?? '?'} is not in LAVA_PRODUCTS`,
    );
  }

  /*
   * Журнал — до выдачи и отдельно от неё: сбой выдачи не должен ещё и терять запись о платеже.
   * Никогда не фатален, ровно как в `prodamus-webhook`.
   */
  async function record(applied: boolean): Promise<void> {
    const { error } = await supabase.rpc('record_payment', {
      p_email: email,
      p_amount: typeof hook!.amount === 'number' ? hook!.amount : null,
      p_provider_ref: hook!.contractId,
      p_paid_at: paidAt,
      p_intent: plan || 'course',
      p_applied: applied,
    });
    if (error) console.warn('lava-webhook: record_payment failed', error.message);
  }

  if (plan) {
    const { error } = await supabase.rpc('apply_subscription_payment', {
      p_email: email,
      p_plan: plan,
      p_provider_ref: hook.contractId,
      p_paid_at: paidAt,
    });
    if (error) {
      console.error('lava-webhook: apply_subscription_payment failed', error.message);
      await record(false);
      return reply(500, 'could not apply the payment');
    }
    await record(true);
    return reply(200, `ok: ${plan} for ${email}`);
  }

  /*
   * Курс. `apply_course_payment()` ищет единственный ожидающий заказ этой почты — тот, что пишут
   * и форма на сайте, и шторка разблокировки, прежде чем отправить человека платить.
   *
   * Товар из уведомления здесь пока не используется, и это осознанно: открыть **названный** курс
   * умеет только админка, а у функции нет и не будет прав админа. Зато `product.id` попал в
   * журнал через `p_intent`, так что при ручной выдаче видно, что именно куплено, — этого у
   * Prodamus не было вовсе.
   */
  const { data: activated, error } = await supabase.rpc('apply_course_payment', {
    p_email: email,
    p_provider_ref: hook.contractId,
    p_paid_at: paidAt,
  });
  if (error) {
    console.error('lava-webhook: apply_course_payment failed', error.message);
    await record(false);
    return reply(500, 'could not apply the payment');
  }
  if (!activated) {
    await record(false);
    console.warn(
      `lava-webhook: ${email} paid and no single pending order matches it; recorded as unclaimed (contract ${hook.contractId})`,
    );
    return reply(200, 'ignored: recorded, waiting to be claimed');
  }
  await record(true);
  return reply(200, `ok: course activated for ${email}`);
});
