import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  canonicalize,
  DEFAULT_COURSE_PRICES_RUB,
  DEFAULT_PLAN_PRICES_RUB,
  DEFAULT_SESSION_PRICES_RUB,
  encode,
  intentForRoute,
  parseForm,
  parsePriceList,
  planForAmount,
  paymentDisposition,
  readPayment,
  routeAmount,
  sessionForAmount,
  sessionOptionOf,
  sign,
  signatureMatches,
} from './verify';
import { COURSES } from '@/content/registry';
import { BOOKING } from '@content/site/booking';
import { PLANS } from '@content/site/plans';

describe('parseForm', () => {
  it('builds the nested tree PHP would build from bracket keys', () => {
    const tree = parseForm(
      new URLSearchParams(
        'order_id=42&sum=1990.00&customer_email=A@Example.com&products[0][name]=Forma&products[0][price]=1990&subscription[id]=7',
      ),
    );
    expect(tree).toEqual({
      order_id: '42',
      sum: '1990.00',
      customer_email: 'A@Example.com',
      products: { 0: { name: 'Forma', price: '1990' } },
      subscription: { id: '7' },
    });
  });
});

describe('canonicalize + encode', () => {
  it('sorts keys at every level and keeps unicode and slashes as they are', () => {
    const tree = parseForm(
      new URLSearchParams('b=2&a[y]=1&a[x]=%D0%9C%D0%B5%D1%81%D1%8F%D1%86&url=https://x/y'),
    );
    expect(canonicalize(tree)).toEqual({ a: { x: 'Месяц', y: '1' }, b: '2', url: 'https://x/y' });
    expect(encode(tree)).toBe('{"a":{"x":"Месяц","y":"1"},"b":"2","url":"https://x/y"}');
  });
});

describe('sign + signatureMatches', () => {
  it('is deterministic, key-order independent, and compared in constant time', async () => {
    const a = parseForm(new URLSearchParams('sum=1990&customer_email=a@example.com&order_id=1'));
    const b = parseForm(new URLSearchParams('order_id=1&customer_email=a@example.com&sum=1990'));
    const sa = await sign(a, 'secret');
    const sb = await sign(b, 'secret');
    expect(sa).toBe(sb);
    expect(sa).toMatch(/^[0-9a-f]{64}$/);
    expect(signatureMatches(sa, sa)).toBe(true);
    expect(signatureMatches(sa, sa.slice(0, -1) + (sa.endsWith('0') ? '1' : '0'))).toBe(false);
    expect(signatureMatches(sa, null)).toBe(false);
    expect(await sign(a, 'other')).not.toBe(sa);
  });
});

describe('planForAmount', () => {
  const prices = { monthly: 1990, annual: 9990 };
  it('maps the two plan prices and nothing else', () => {
    expect(planForAmount('1990.00', prices)).toBe('monthly');
    expect(planForAmount('9990', prices)).toBe('annual');
    expect(planForAmount('3990.00', prices)).toBeNull();
    expect(planForAmount(undefined, prices)).toBeNull();
    expect(planForAmount('abc', prices)).toBeNull();
  });
  /* Умолчания функции — цены тарифов из контента, как их видит покупатель. */
  it('defaults to the plan prices the site shows', () => {
    for (const plan of PLANS) {
      expect(DEFAULT_PLAN_PRICES_RUB[plan.id], plan.id).toBe(plan.price.rub);
      expect(planForAmount(String(plan.price.rub), DEFAULT_PLAN_PRICES_RUB)).toBe(plan.id);
    }
  });

  /* index.ts берёт умолчания отсюда, а не держит свои числа рядом с секретами. */
  it('is what index.ts falls back to', () => {
    const src = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
    expect(src).toContain("Deno.env.get('PLAN_MONTHLY_RUB') ?? DEFAULT_PLAN_PRICES_RUB.monthly");
    expect(src).toContain("Deno.env.get('PLAN_ANNUAL_RUB') ?? DEFAULT_PLAN_PRICES_RUB.annual");
    expect(src).toContain("Deno.env.get('SESSION_HALF_RUB') ?? DEFAULT_SESSION_PRICES_RUB.half");
    expect(src).toContain("Deno.env.get('SESSION_HOUR_RUB') ?? DEFAULT_SESSION_PRICES_RUB.hour");
    expect(src).toContain(
      "parsePriceList(Deno.env.get('COURSE_PRICES_RUB'), DEFAULT_COURSE_PRICES_RUB)",
    );
  });
});

describe('sessionForAmount', () => {
  const prices = { half: 2500, hour: 3500 };

  it('maps the two session prices and nothing else', () => {
    expect(sessionForAmount('2500.00', prices)).toBe('half');
    expect(sessionForAmount('3500', prices)).toBe('hour');
    expect(sessionForAmount('3990.00', prices)).toBeNull();
    expect(sessionForAmount(undefined, prices)).toBeNull();
    expect(sessionForAmount('abc', prices)).toBeNull();
  });

  /*
   * Тот самый тест, на котором держится вся развилка.
   *
   * Prodamus не говорит, за что заплатили, — различает только сумма. Пока цена занятия ни с чем не
   * совпадает, это безопасно; в день, когда курс поставят в 2 500 ₽, оплата курса начнёт
   * засчитываться как занятие, курс не откроется, и выглядеть это будет как «покупка не дошла».
   * Поэтому цены сверяются с настоящими, из контента, а не с переписанными сюда числами.
   */
  it('keeps the session prices clear of every course and plan price', () => {
    const sessions = BOOKING.options.map((o) => o.price.rub);
    const others = [...COURSES.map((c) => c.price.rub), ...PLANS.map((p) => p.price.rub)];
    for (const rub of sessions) {
      for (const other of others) {
        expect(Math.abs(rub - other) >= 1, `${rub} ₽ collides with ${other} ₽`).toBe(true);
      }
    }
  });

  /*
   * И сами цены — те, что напечатаны на экране брони. Сверяются настоящие умолчания, которые
   * читает index.ts, а не копия чисел в этом файле: копия прошла бы и после того, как умолчание
   * в функции разошлось с экраном.
   */
  it('defaults to the prices the booking screen shows', () => {
    for (const option of BOOKING.options) {
      expect(DEFAULT_SESSION_PRICES_RUB[option.id], option.id).toBe(option.price.rub);
      expect(sessionForAmount(String(option.price.rub), DEFAULT_SESSION_PRICES_RUB)).toBe(
        option.id,
      );
    }
    expect(Object.keys(DEFAULT_SESSION_PRICES_RUB).sort()).toEqual(
      BOOKING.options.map((o) => o.id).sort(),
    );
  });
});

describe('readPayment', () => {
  it('normalises the email and keeps the order id for idempotency', () => {
    expect(
      readPayment(
        parseForm(
          new URLSearchParams(
            'customer_email=%20Sub@Example.com&sum=1990&payment_status=success&order_id=o-1',
          ),
        ),
      ),
    ).toEqual({ email: 'sub@example.com', sum: '1990', status: 'success', ref: 'o-1' });
    expect(readPayment(parseForm(new URLSearchParams('sum=1990')))).toBeNull();
  });

  it('keeps a paid order without an address, so it is recorded rather than lost (0057)', () => {
    const payment = readPayment(
      parseForm(new URLSearchParams('sum=2990&payment_status=success&order_id=o-2')),
    );
    expect(payment).toEqual({ email: '', sum: '2990', status: 'success', ref: 'o-2' });
    expect(paymentDisposition(payment!)).toBe('unaddressed');
  });
});

describe('paymentDisposition', () => {
  const base = { email: 'a@example.com', sum: '2990', ref: 'o-1' };
  it('applies a success, and a notification with no status at all', () => {
    expect(paymentDisposition({ ...base, status: 'success' })).toBe('apply');
    expect(paymentDisposition({ ...base, status: undefined })).toBe('apply');
  });
  it('sends every other status to the owner, with or without an address', () => {
    expect(paymentDisposition({ ...base, status: 'order_canceled' })).toBe('reversal');
    expect(paymentDisposition({ ...base, email: '', status: 'order_denied' })).toBe('reversal');
  });
});

describe('routeAmount', () => {
  const prices = {
    plans: DEFAULT_PLAN_PRICES_RUB,
    sessions: DEFAULT_SESSION_PRICES_RUB,
    courses: DEFAULT_COURSE_PRICES_RUB,
  };

  it('keeps the old order: plan, then session, then course', () => {
    expect(routeAmount('7990', prices)).toEqual({ kind: 'plan', plan: 'annual' });
    expect(routeAmount('3500.00', prices)).toEqual({ kind: 'session', session: 'hour' });
    expect(routeAmount('2990', prices)).toEqual({ kind: 'course' });
  });

  /*
   * Раньше всё, что не тариф и не занятие, открывало ожидающий заказ этой почты — за любые деньги.
   * Незнакомая сумма теперь ничего не открывает: платёж ложится в журнал непривязанным.
   */
  it('opens nothing for an amount that is no price we sell', () => {
    expect(routeAmount('100', prices)).toEqual({ kind: 'unknown' });
    expect(routeAmount('2991', prices)).toEqual({ kind: 'unknown' });
    expect(routeAmount(undefined, prices)).toEqual({ kind: 'unknown' });
    expect(routeAmount('не число', prices)).toEqual({ kind: 'unknown' });
  });

  /* Занятие — `session`, незнакомое — `course`: у журнала нет вида «неизвестно». */
  it('names the intent each route is recorded under', () => {
    expect(intentForRoute({ kind: 'plan', plan: 'monthly' })).toBe('monthly');
    expect(intentForRoute({ kind: 'session', session: 'half' })).toBe('session');
    expect(intentForRoute({ kind: 'course' })).toBe('course');
    expect(intentForRoute({ kind: 'unknown' })).toBe('course');
  });
});

describe('course prices', () => {
  it('reads a list from the secret, and falls back when it is empty or broken', () => {
    expect(parsePriceList('2990, 3990', [1])).toEqual([2990, 3990]);
    expect(parsePriceList('', [1])).toEqual([1]);
    expect(parsePriceList(undefined, [1])).toEqual([1]);
    expect(parsePriceList('abc,-5', [1])).toEqual([1]);
  });

  /*
   * Цены курсов живут в контенте, а функция — отдельно от сборки. Курс по новой цене без правки
   * здесь молча уходил бы в «не привязан», поэтому списки сверяются.
   */
  it('covers every paid course we sell', () => {
    const missing = COURSES.filter(
      (c) => c.price.rub > 0 && !DEFAULT_COURSE_PRICES_RUB.includes(c.price.rub),
    ).map((c) => `${c.id}:${c.price.rub}`);
    expect(missing).toEqual([]);
  });
});

/* Обработчик здесь не запускается (`Deno.serve`); ветки 0043 и 0055 проверяются по тексту. */
describe('index.ts', () => {
  const src = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
  const branch = (marker: string) => src.slice(src.indexOf(marker), src.indexOf(marker) + 400);

  /*
   * 0055: a session payment confirms the payer's hold. It is recorded unapplied first (the RPC
   * marks it applied when it books), and it never reaches the course branch.
   */
  it('records a session, then confirms its hold, before any course is applied', () => {
    const session = src.indexOf('if (option) {');
    expect(session).toBeGreaterThan(0);
    expect(session).toBeLessThan(src.indexOf("rpc('apply_course_payment'"));
    const body = src.slice(session, src.indexOf("rpc('apply_course_payment'"));
    expect(body.indexOf('await record(false)')).toBeGreaterThan(0);
    expect(body.indexOf('await record(false)')).toBeLessThan(
      body.indexOf("rpc('apply_session_payment'"),
    );
    expect(body).toContain('p_option: option');
    // The ledger row's id, so a payment without an order number still lands on its booking.
    expect(body).toContain('const paymentId = await record(false)');
    expect(body).toContain('p_payment_id: paymentId');
  });

  it('stops an unknown amount before any course is applied', () => {
    const unknown = src.indexOf("if (route.kind === 'unknown')");
    expect(unknown).toBeGreaterThan(0);
    expect(unknown).toBeLessThan(src.indexOf("rpc('apply_course_payment'"));
    expect(branch("if (route.kind === 'unknown')")).toContain('await record(false)');
  });
});

/*
 * The session branch of the webhook (0055): which hold a payment confirms is decided by the
 * option the amount names, so every option the booking screen sells must be reachable by its own
 * price, and nothing else may name one.
 */
describe('sessionOptionOf', () => {
  const prices = {
    plans: DEFAULT_PLAN_PRICES_RUB,
    sessions: DEFAULT_SESSION_PRICES_RUB,
    courses: DEFAULT_COURSE_PRICES_RUB,
  };

  it('names the option for a session price, and nothing for anything else', () => {
    expect(sessionOptionOf(routeAmount('2500.00', prices))).toBe('half');
    expect(sessionOptionOf(routeAmount('3500', prices))).toBe('hour');
    expect(sessionOptionOf(routeAmount('1990', prices))).toBeNull();
    expect(sessionOptionOf(routeAmount('3990', prices))).toBeNull();
    expect(sessionOptionOf(routeAmount('100', prices))).toBeNull();
    expect(sessionOptionOf(routeAmount(undefined, prices))).toBeNull();
  });

  it('reaches every option the booking screen sells, by its own price', () => {
    for (const option of BOOKING.options) {
      expect(sessionOptionOf(routeAmount(String(option.price.rub), prices)), option.id).toBe(
        option.id,
      );
    }
  });
});
