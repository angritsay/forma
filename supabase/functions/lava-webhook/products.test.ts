import { describe, expect, it } from 'vitest';
import { keyFor, parseProductMap } from './products';

/** Секрет в том виде, в каком его заполняет владелец: курс — товаром, подписка — тарифом. */
const RAW = JSON.stringify({
  prod_course: 'course:start',
  prod_tier: { '19': 'plan:monthly', '79': 'plan:annual' },
});

describe('parseProductMap', () => {
  it('reads both shapes at once', () => {
    const map = parseProductMap(RAW);
    expect(map['prod_course']).toBe('course:start');
    expect(map['prod_tier']).toEqual({ '19': 'plan:monthly', '79': 'plan:annual' });
  });

  /*
   * Кривой секрет не должен валить уведомление: без карты платёж уходит в журнал непривязанным и
   * ждёт выдачи руками. Потерять его — хуже, чем не понять, что куплено.
   */
  it('answers an empty map rather than throwing', () => {
    expect(parseProductMap('')).toEqual({});
    expect(parseProductMap('{не json')).toEqual({});
    expect(parseProductMap('[1,2]')).toEqual({});
    expect(parseProductMap('"строка"')).toEqual({});
  });

  it('drops entries it cannot use, and keeps the rest', () => {
    const map = parseProductMap(
      JSON.stringify({ ok: 'course:start', num: 5, empty: {}, bad: { '19': 7 } }),
    );
    expect(map).toEqual({ ok: 'course:start' });
  });
});

describe('keyFor', () => {
  const map = parseProductMap(RAW);

  it('takes a plain product at its word, whatever the amount', () => {
    expect(keyFor(map, 'prod_course', 29)).toBe('course:start');
    expect(keyFor(map, 'prod_course', null)).toBe('course:start');
  });

  /*
   * Ради этого всё и сделано. Тариф lava.top держит месяц и год под одним `product.id`, а периода
   * в уведомлении нет — различает только сумма. Один ключ на оба периода открывал бы год тому, кто
   * заплатил за месяц.
   */
  it('tells the month from the year inside one tier', () => {
    expect(keyFor(map, 'prod_tier', 19)).toBe('plan:monthly');
    expect(keyFor(map, 'prod_tier', 79)).toBe('plan:annual');
  });

  it('does not care how the amount is written', () => {
    expect(keyFor(map, 'prod_tier', 19.0)).toBe('plan:monthly');
    expect(keyFor(map, 'prod_tier', 78.999)).toBe('plan:annual');
  });

  /*
   * Незнакомая цена — не повод угадать ближайшую. Пустой ответ отправит платёж в журнал
   * непривязанным, и владелец свяжет его руками, зная сумму.
   */
  it('refuses to guess an unknown price or an unknown product', () => {
    expect(keyFor(map, 'prod_tier', 49)).toBe('');
    expect(keyFor(map, 'prod_tier', null)).toBe('');
    expect(keyFor(map, 'somebody_elses_product', 19)).toBe('');
  });
});
