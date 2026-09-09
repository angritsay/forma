import { describe, expect, it } from 'vitest';
import {
  canonicalize,
  encode,
  parseForm,
  planForAmount,
  readPayment,
  sign,
  signatureMatches,
} from './verify';

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
