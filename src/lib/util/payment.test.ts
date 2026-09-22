import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_PATH,
  checkoutPath,
  needsManualCheckout,
  payHost,
  payHref,
  payRoute,
  paymentTarget,
  withEmail,
} from './payment';

const TILL = 'https://pay.example.com/p/1';

describe('paymentTarget', () => {
  it('accepts only absolute https links', () => {
    expect(paymentTarget('https://pay.example.com/p/1')?.href).toBe('https://pay.example.com/p/1');
    expect(paymentTarget('http://pay.example.com/p/1')).toBeNull();
    expect(paymentTarget('/pay')).toBeNull();
    expect(paymentTarget('javascript:alert(1)')).toBeNull();
    expect(paymentTarget('')).toBeNull();
    expect(paymentTarget(undefined)).toBeNull();
  });
});

describe('withEmail', () => {
  it('adds the email under both parameter names without touching the rest', () => {
    const target = paymentTarget('https://pay.example.com/p/1?utm=x')!;
    expect(withEmail(target, 'a+b@example.com')).toBe(
      'https://pay.example.com/p/1?utm=x&email=a%2Bb%40example.com&customer_email=a%2Bb%40example.com',
    );
  });
  it('replaces an email already in the link', () => {
    const target = paymentTarget('https://pay.example.com/p/1?email=old@example.com')!;
    expect(withEmail(target, 'new@example.com')).toBe(
      'https://pay.example.com/p/1?email=new%40example.com&customer_email=new%40example.com',
    );
  });
});

describe('payRoute', () => {
  it('sends the Russian reader to the till and everybody else to the instructions', () => {
    expect(payRoute('ru', TILL)).toEqual({ kind: 'external', url: new URL(TILL) });
    expect(payRoute('en', TILL)).toEqual({ kind: 'manual', href: checkoutPath('en') });
    expect(needsManualCheckout('ru')).toBe(false);
    expect(needsManualCheckout('en')).toBe(true);
    expect(checkoutPath('en')).toContain(`/en${CHECKOUT_PATH}`);
  });

  /*
   * Ссылка на кассу — признак того, что вещь вообще продаётся. Нет её — и английский читатель
   * должен получить тот же запасной путь, что русский, а не инструкцию, как заплатить за то,
   * чего нет. Этот случай легко потерять: язык проверяется первым в любой наивной реализации.
   */
  it('has no route in any language when nothing is on sale', () => {
    for (const url of [undefined, '', 'http://pay.example.com/p/1', '/pay']) {
      expect(payRoute('ru', url)).toBeNull();
      expect(payRoute('en', url)).toBeNull();
    }
  });
});

describe('payHref and payHost', () => {
  it('appends the email to the till, because that is what ties a payment to a person', () => {
    const route = payRoute('ru', TILL)!;
    expect(payHref(route, 'a@example.com')).toContain('customer_email=a%40example.com');
    expect(payHref(route)).toBe(TILL);
  });

  /* Своей же странице почта в адресе не нужна — там её просят вписать в комментарий к переводу,
     а ссылку с чужим адресом в строке ещё и перешлют. */
  it('never puts the email in our own address', () => {
    const route = payRoute('en', TILL)!;
    expect(payHref(route, 'a@example.com')).toBe(checkoutPath('en'));
    expect(payHref(route, 'a@example.com')).not.toContain('@');
  });

  /* Хост называется в подписи «сейчас откроется …», и назвать там свой же сайт — ошибка. */
  it('names the host only when the buyer really leaves for another site', () => {
    expect(payHost(payRoute('ru', TILL)!)).toBe('pay.example.com');
    expect(payHost(payRoute('en', TILL)!)).toBeNull();
  });
});
