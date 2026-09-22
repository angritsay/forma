import { describe, expect, it } from 'vitest';
import { grantsAccess, hmacHex, parseHook, signatureMatches } from './verify';

/** Уведомление той формы, что описана в их SDK. */
const HOOK = {
  eventType: 'payment.success',
  product: { id: 'prod_42', title: 'Старт' },
  contractId: 'contract_7',
  buyer: { email: 'A@Example.com' },
  amount: 19.9,
  currency: 'USD',
  status: 'completed',
  timestamp: '2026-09-22T12:00:00Z',
};

describe('hmacHex', () => {
  it('signs the exact text it is given', async () => {
    const a = await hmacHex('secret', '{"a":1}');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    // Тот же текст — та же подпись; другой секрет — другая.
    expect(await hmacHex('secret', '{"a":1}')).toBe(a);
    expect(await hmacHex('other', '{"a":1}')).not.toBe(a);
  });

  /*
   * Ради этого подпись и считается по сырому телу: разобрать и собрать JSON обратно даёт другой
   * текст — другие пробелы, другой порядок ключей, — и подпись перестанет сходиться на
   * совершенно правильном уведомлении.
   */
  it('gives a different digest for the same JSON formatted differently', async () => {
    const raw = '{"a":1, "b":2}';
    expect(await hmacHex('s', raw)).not.toBe(await hmacHex('s', JSON.stringify(JSON.parse(raw))));
  });
});

describe('signatureMatches', () => {
  it('accepts the same digest in any case and with stray spaces', () => {
    expect(signatureMatches('abcd', 'ABCD')).toBe(true);
    expect(signatureMatches('abcd', ' abcd ')).toBe(true);
  });

  it('refuses anything else, including an empty header', () => {
    expect(signatureMatches('abcd', 'abce')).toBe(false);
    expect(signatureMatches('abcd', 'abc')).toBe(false);
    expect(signatureMatches('abcd', '')).toBe(false);
    expect(signatureMatches('', '')).toBe(false);
  });
});

describe('parseHook', () => {
  it('reads the fields the handler acts on', () => {
    const hook = parseHook(HOOK);
    expect(hook?.eventType).toBe('payment.success');
    expect(hook?.product.id).toBe('prod_42');
    expect(hook?.contractId).toBe('contract_7');
    expect(hook?.buyer.email).toBe('A@Example.com');
    expect(hook?.amount).toBe(19.9);
  });

  /*
   * Придираться к полям, которых мы не читаем, значит отвергать правильные уведомления из-за
   * того, что lava.top добавила себе ещё одно поле или перестала слать необязательное.
   */
  it('accepts a notification with only what is needed, and with extra fields', () => {
    expect(parseHook({ eventType: 'payment.success', contractId: 'c1' })).not.toBeNull();
    expect(parseHook({ ...HOOK, somethingNew: true })).not.toBeNull();
  });

  it('refuses what is not a notification at all', () => {
    expect(parseHook(null)).toBeNull();
    expect(parseHook('payment.success')).toBeNull();
    expect(parseHook({ product: { id: 'x' } })).toBeNull(); // без eventType
    expect(parseHook({ eventType: 'payment.success' })).toBeNull(); // без contractId
  });
});

describe('grantsAccess', () => {
  it('opens on a payment and on a renewal', () => {
    expect(grantsAccess('payment.success')).toBe(true);
    expect(grantsAccess('subscription.recurring.payment.success')).toBe(true);
  });

  /*
   * Отмена подписки — это «больше не продлевать», а не «забрать сейчас»: оплаченный период
   * дожить должен. Отказ в оплате не меняет ничего.
   */
  it('opens nothing on a failure or a cancellation', () => {
    expect(grantsAccess('payment.failed')).toBe(false);
    expect(grantsAccess('subscription.recurring.payment.failed')).toBe(false);
    expect(grantsAccess('subscription.cancelled')).toBe(false);
  });
});
