import { describe, expect, it } from 'vitest';
import { needsForeignTill, payHost, payHref, payRoute, paymentTarget, withEmail } from './payment';

const TILL = 'https://pay.example.com/p/1';
const FOREIGN = 'https://lava.top/product/abc';

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
  it('sends the rouble reader to Prodamus and everybody else to lava.top', () => {
    expect(payRoute('ru', TILL, FOREIGN)).toEqual({ kind: 'external', url: new URL(TILL) });
    expect(payRoute('en', TILL, FOREIGN)).toEqual({ kind: 'external', url: new URL(FOREIGN) });
    expect(needsForeignTill('ru')).toBe(false);
    expect(needsForeignTill('en')).toBe(true);
  });

  /*
   * Ссылка на рублёвую кассу — признак того, что вещь продаётся вообще. Нет её — значит не
   * продаётся никому, и английский читатель получает тот же запасной путь, что русский, а не
   * ссылку на товар, которого нет. Случай легко потерять: язык проверяется первым в любой
   * наивной реализации.
   */
  it('has no route in any language when nothing is on sale', () => {
    for (const url of [undefined, '', 'http://pay.example.com/p/1', '/pay']) {
      expect(payRoute('ru', url, FOREIGN)).toBeNull();
      expect(payRoute('en', url, FOREIGN)).toBeNull();
    }
  });

  /*
   * Товар ещё не заведён в lava.top. Отправить англичанина в рублёвую кассу значило бы вернуть
   * ровно ту стену, ради которой вторая касса и появилась, поэтому маршрута нет — и кнопка ведёт
   * к адресу поддержки, как любая ненастроенная оплата в этом продукте.
   */
  it('refuses to fall back to the rouble till when lava has no such product', () => {
    for (const foreign of [undefined, null, '', 'http://lava.top/x']) {
      expect(payRoute('en', TILL, foreign)).toBeNull();
    }
    expect(payRoute('ru', TILL, null)).toEqual({ kind: 'external', url: new URL(TILL) });
  });
});

describe('payHref and payHost', () => {
  it('appends the email, because that is what ties a payment to a person', () => {
    const route = payRoute('ru', TILL, null)!;
    expect(payHref(route, 'a@example.com')).toContain('customer_email=a%40example.com');
    expect(payHref(route)).toBe(TILL);
  });

  /* Хост называется в подписи «сейчас откроется …», и он разный у двух касс. */
  it('names whichever till the buyer is actually going to', () => {
    expect(payHost(payRoute('ru', TILL, FOREIGN)!)).toBe('pay.example.com');
    expect(payHost(payRoute('en', TILL, FOREIGN)!)).toBe('lava.top');
  });
});
