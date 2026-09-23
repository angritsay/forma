import { describe, expect, it } from 'vitest';
import { COURSES } from '@/content/registry';
import { BOOKING } from './booking';
import { PLANS } from './plans';
import { LAVA_PRODUCTS, courseKey, lavaUrl, planKey, sessionKey } from './payments';

describe('LAVA_PRODUCTS', () => {
  /*
   * Ключи строятся из id курсов и тарифов, а не пишутся руками. Опечатка в ключе — это кнопка,
   * которая молча ведёт в поддержку вместо кассы: ни ошибки, ни следа.
   */
  it('keys every entry to something that actually exists', () => {
    const courseIds = new Set(COURSES.map((c) => c.id));
    const planIds = new Set<string>(PLANS.map((p) => p.id));
    const sessionIds = new Set<string>(BOOKING.options.map((o) => o.id));
    for (const key of Object.keys(LAVA_PRODUCTS)) {
      const [kind, id] = key.split(':');
      if (kind === 'course') expect(courseIds.has(id!)).toBe(true);
      else if (kind === 'plan') expect(planIds.has(id!)).toBe(true);
      else if (kind === 'session') expect(sessionIds.has(id!)).toBe(true);
      else throw new Error(`неизвестный вид ключа: ${key}`);
    }
  });

  /*
   * Обе длительности заведены — значит обе и должны быть здесь. Занятие без товара продаётся
   * только за рубли, и это видно ровно одним способом: сходить сюда и посмотреть. Цикл по
   * `BOOKING.options`, а не два выражения: появится третья длительность — тест потребует и её.
   */
  it('covers every session length the coach sells', () => {
    for (const option of BOOKING.options) {
      expect(lavaUrl(sessionKey(option.id)), option.id).not.toBeNull();
    }
  });

  /*
   * Полчаса и час — разные товары, и это стоит проверять, а не считать очевидным: скопированная
   * строка увела бы купившего час на страницу получаса, и заметили бы это по чужому счёту.
   */
  it('gives each length its own product', () => {
    const ids = BOOKING.options.map((o) => LAVA_PRODUCTS[sessionKey(o.id)]?.productId);
    expect(new Set(ids).size).toBe(BOOKING.options.length);
  });

  /* Только абсолютный https — та же проверка, что у любой платёжной ссылки в продукте. */
  it('holds absolute https links and non-empty ids', () => {
    for (const [key, p] of Object.entries(LAVA_PRODUCTS)) {
      expect(p.productUrl.startsWith('https://'), key).toBe(true);
      expect(p.productId.trim().length, key).toBeGreaterThan(0);
      expect(lavaUrl(key)).toBe(p.productUrl);
    }
  });

  /* Цены в адресе быть не может: сайт статический и публичный (docs/SETUP.md §7.1). */
  it('never carries a price in the link', () => {
    for (const [key, p] of Object.entries(LAVA_PRODUCTS)) {
      expect(/[?&](price|amount|sum)=/i.test(p.productUrl), key).toBe(false);
    }
  });

  /* Продаваемое должно быть заведено: курс в продаже и оба тарифа. */
  it('covers what the site sells', () => {
    expect(lavaUrl(courseKey('start'))).not.toBeNull();
    expect(lavaUrl(planKey('monthly'))).not.toBeNull();
    expect(lavaUrl(planKey('annual'))).not.toBeNull();
  });

  /* Незаведённое отвечает `null`, и кнопка честно уходит в поддержку. */
  it('answers null for anything not set up', () => {
    expect(lavaUrl(courseKey('athlete'))).toBeNull();
    expect(lavaUrl('plan:weekly')).toBeNull();
  });
});
