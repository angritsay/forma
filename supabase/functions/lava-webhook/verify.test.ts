import { describe, expect, it } from 'vitest';
import { basicMatches, grantsAccess, parseHook } from './verify';

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

describe('basicMatches', () => {
  /*
   * Так lava.top и представляется: в кабинете у вебхука выбирается Basic, логин и пароль. Подписи
   * тела она не шлёт — на неё здесь стояла проверка, и она отвергла бы каждое настоящее
   * уведомление.
   */
  const SECRET = 'forma:s3cr3t-пароль';
  /* Как это кодирует настоящий клиент: UTF-8 в байты, байты в base64. */
  const header = (login: string, pass: string) => {
    const bytes = new TextEncoder().encode(`${login}:${pass}`);
    return `Basic ${btoa(String.fromCharCode(...bytes))}`;
  };

  it('accepts the login and password from the cabinet', () => {
    expect(basicMatches(SECRET, header('forma', 's3cr3t-пароль'))).toBe(true);
  });

  it('does not care how the scheme is capitalised', () => {
    expect(basicMatches(SECRET, header('forma', 's3cr3t-пароль').toLowerCase())).toBe(false);
    expect(basicMatches(SECRET, header('forma', 's3cr3t-пароль').replace('Basic', 'basic'))).toBe(
      true,
    );
    expect(basicMatches(SECRET, `  ${header('forma', 's3cr3t-пароль')}  `)).toBe(true);
  });

  it('refuses a wrong password, a wrong login and an empty header', () => {
    expect(basicMatches(SECRET, header('forma', 'другой'))).toBe(false);
    expect(basicMatches(SECRET, header('нетакой', 's3cr3t-пароль'))).toBe(false);
    expect(basicMatches(SECRET, '')).toBe(false);
    expect(basicMatches('', header('forma', 's3cr3t-пароль'))).toBe(false);
  });

  /* Другая схема — не наш случай, и гадать по ней нечего. */
  it('refuses anything that is not Basic', () => {
    expect(basicMatches(SECRET, header('forma', 's3cr3t-пароль').replace('Basic', 'Bearer'))).toBe(
      false,
    );
    expect(basicMatches(SECRET, 'Basic не-base64!!')).toBe(false);
    expect(basicMatches(SECRET, 'Basic ')).toBe(false);
  });
});
