import { describe, expect, it } from 'vitest';
import {
  canonicalize,
  encode,
  parseForm,
  planForAmount,
  readPayment,
  sessionForAmount,
  sign,
  signatureMatches,
} from './verify';
import { BOOKING } from '@content/site/booking';
import { COURSES } from '@/content/registry';
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

  /* И сами цены — те, что напечатаны на экране брони, а не забытые умолчания функции. */
  it('defaults to the prices the booking screen shows', () => {
    const half = BOOKING.options.find((o) => o.id === 'half');
    const hour = BOOKING.options.find((o) => o.id === 'hour');
    expect(sessionForAmount(String(half?.price.rub), prices)).toBe('half');
    expect(sessionForAmount(String(hour?.price.rub), prices)).toBe('hour');
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
});
