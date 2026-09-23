import { describe, expect, it } from 'vitest';
import {
  ADMIN_MAX_ATTEMPTS,
  ADMIN_TOPICS,
  adminFailure,
  adminMessage,
  escapeHtml,
  moscowTime,
  parseTopics,
  stripLinks,
  TOPIC_TITLES,
} from './admin';

const row = (kind: string, params: Record<string, unknown> = {}) => ({
  topic: 'courses',
  kind,
  params,
});

describe('adminMessage', () => {
  /*
   * Главное свойство: незнакомый повод — это `null`, а не «событие». База может обогнать функцию
   * (миграцию применили, функцию не передеплоили), и написать в канал заглушку значило бы
   * сообщить о деньгах, не сказав о них ничего.
   */
  it('answers null for a kind it does not know', () => {
    expect(adminMessage(row('something_new'))).toBeNull();
  });

  it('names the till in words, not in column values', () => {
    const paid = adminMessage(
      row('course_paid', { courseId: 'start', email: 'a@b.co', source: 'lava' }),
    );
    expect(paid).toContain('lava.top');
    expect(paid).toContain('start');
    expect(paid).toContain('a@b.co');
    expect(adminMessage(row('course_paid', { source: 'prodamus' }))).toContain('Prodamus');
    // Пустая касса не притворяется Prodamus: старые строки её не несут (0038).
    expect(adminMessage(row('course_paid', { source: '' }))).toContain('неизвестно');
  });

  /* Пустое поле не печатается вовсе: «Заказ: » в журнале хуже отсутствующей строки. */
  it('drops the fields that have nothing in them', () => {
    const text = adminMessage(row('session_paid', { email: 'a@b.co', amount: '', ref: '' }))!;
    expect(text).toContain('a@b.co');
    expect(text).not.toContain('Сумма');
    expect(text).not.toContain('Заказ');
  });

  /* Ровно то сообщение, ради которого канал и заводится. */
  it('says outright that an unclaimed payment opened nothing', () => {
    const text = adminMessage(
      row('payment_unclaimed', { email: 'a@b.co', amount: '2990.00', intent: 'course' }),
    )!;
    expect(text).toContain('Платёж не привязан');
    expect(text).toContain('курс');
    expect(text).toContain('Доступ не открылся');
  });

  it('translates the plan and the intent out of database words', () => {
    expect(adminMessage(row('club_paid', { plan: 'annual' }))).toContain('год');
    expect(adminMessage(row('payment_unclaimed', { intent: 'session' }))).toContain(
      'занятие с тренером',
    );
  });

  /*
   * Адрес человека печатается как есть — но через `escapeHtml`, потому что сообщение уходит с
   * `parse_mode: HTML`, и один «<» в чужой строке съел бы всё сообщение целиком.
   */
  it('escapes what people typed', () => {
    const text = adminMessage(row('signup', { email: '<b>a</b>@b.co', locale: 'ru' }))!;
    expect(text).toContain('&lt;b&gt;a&lt;/b&gt;@b.co');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  /* Каждый вид, который ставят триггеры 0040, должен что-то печатать. */
  it('has a text for every kind the database can enqueue', () => {
    const kinds = [
      'signup',
      'course_paid',
      'course_refunded',
      'club_paid',
      'club_renewed',
      'club_cancelled',
      'duo_paired',
      'proof_resubmitted',
      'session_paid',
      'session_booked',
      'session_moved',
      'session_cancelled',
      'payment_unclaimed',
      'claim_no_order',
      'support_message',
      'channel_ready',
    ];
    for (const kind of kinds) {
      expect(adminMessage(row(kind)), kind).not.toBeNull();
    }
  });
});

describe('support_message', () => {
  const support = (params: Record<string, unknown>) =>
    adminMessage({ topic: 'support', kind: 'support_message', params })!;

  it('quotes what the person wrote and says who wrote it', () => {
    const text = support({
      source: 'telegram',
      name: 'Аня К',
      username: 'anya_k',
      tgId: '777001',
      locale: 'ru',
      account: 'no',
      text: 'Колено болит — можно заниматься?',
    });
    expect(text).toMatch(/^<b>Обращение в бот<\/b>/);
    expect(text).toContain('Имя: Аня К');
    expect(text).toContain('Аккаунт в приложении: нет');
    expect(text).toContain('Язык: русский');
    expect(text).toContain('<blockquote>Колено болит — можно заниматься?</blockquote>');
  });

  /* Ради этой строки сообщение и нужно: без неё тренер не знает, куда ответить. */
  it('links the chat by @username when there is one', () => {
    const text = support({ source: 'telegram', username: '@anya_k', tgId: '777001', text: 'x' });
    expect(text).toContain('<a href="https://t.me/anya_k">@anya_k</a>');
    expect(text).not.toContain('tg://');
  });

  it('falls back to a tg://user link, then to the address', () => {
    expect(support({ source: 'telegram', tgId: '777001', text: 'x' })).toContain(
      '<a href="tg://user?id=777001">',
    );
    const app = support({ source: 'app', email: 'a@b.co', text: 'x' });
    expect(app).toMatch(/^<b>Обращение из приложения<\/b>/);
    expect(app).toContain('Ответить на почту: a@b.co');
    // Из приложения аккаунт есть всегда — строка про него там лишняя.
    expect(app).not.toContain('Аккаунт в приложении');
  });

  /*
   * Всё, что попадает в href, проверено по форме. Сообщение уходит с parse_mode HTML, и кривой id
   * или имя с кавычкой сломали бы разметку, а с ней — всё сообщение.
   */
  it('never puts an unchecked value into a link', () => {
    const text = support({
      source: 'telegram',
      username: 'x" onclick="y',
      tgId: '12a"><b>',
      text: 'x',
    });
    expect(text).not.toContain('href');
    expect(text).not.toContain('onclick');
  });

  it('escapes the message itself', () => {
    expect(support({ source: 'app', text: '<script>1 & 2</script>' })).toContain(
      '<blockquote>&lt;script&gt;1 &amp; 2&lt;/script&gt;</blockquote>',
    );
  });

  it('says there is an attachment to look at in the chat', () => {
    expect(support({ source: 'telegram', attachment: 'photo', text: 'смотри' })).toContain(
      'Вложение: фото — открой чат',
    );
  });

  it('names where in the app it was written from', () => {
    expect(support({ source: 'app', context: 'Персональная тренировка', text: 'x' })).toContain(
      'Откуда: Персональная тренировка',
    );
  });
});

describe('moscowTime', () => {
  it('shifts UTC by three hours and says so', () => {
    expect(moscowTime('2026-09-23T07:30:00.000Z')).toBe('23.09 10:30 МСК');
    // Через полночь — вместе с датой, иначе тренер придёт не в тот день.
    expect(moscowTime('2026-09-23T22:15:00.000Z')).toBe('24.09 01:15 МСК');
  });

  /* Не дата — отдаём как есть: выдумывать время в сообщении о встрече нельзя. */
  it('returns anything it cannot read unchanged', () => {
    expect(moscowTime('not a date')).toBe('not a date');
  });
});

describe('TOPIC_TITLES', () => {
  it('names every topic, and only the topics', () => {
    expect(Object.keys(TOPIC_TITLES).sort()).toEqual([...ADMIN_TOPICS].sort());
    for (const topic of ADMIN_TOPICS) {
      expect(TOPIC_TITLES[topic].length, topic).toBeGreaterThan(0);
    }
  });
});

describe('parseTopics', () => {
  it('reads the JSON the setup job prints', () => {
    expect(parseTopics('{"signups":2,"courses":3}')).toEqual({ signups: 2, courses: 3 });
    // Телеграм отдаёт id числом, но через секрет он легко приезжает строкой.
    expect(parseTopics('{"club":"7"}')).toEqual({ club: 7 });
  });

  /*
   * Кривой секрет — пустая карта, а не отказ. Сообщение тогда уходит в группу без темы: это видно
   * и поправимо одной правкой, в отличие от очереди, которая молча не разгребается.
   */
  it('answers an empty map rather than throwing', () => {
    expect(parseTopics('')).toEqual({});
    expect(parseTopics('not json')).toEqual({});
    expect(parseTopics('[1,2]')).toEqual({});
    expect(parseTopics('null')).toEqual({});
  });

  it('drops what cannot be a thread id, and keeps the rest', () => {
    expect(parseTopics('{"a":0,"b":-3,"c":"x","d":5}')).toEqual({ d: 5 });
  });
});

describe('money', () => {
  /* «19» без валюты в канале читается как рубли, а lava.top берёт доллары и евро (0043). */
  it('prints the currency beside the amount when it is known', () => {
    expect(
      adminMessage(
        row('payment_unclaimed', { amount: '19.00', currency: 'USD', intent: 'monthly' }),
      ),
    ).toContain('Сумма: 19.00 USD');
    expect(adminMessage(row('session_paid', { amount: '3500.00' }))).toContain('Сумма: 3500.00');
  });

  it('says who came for a payment with no order behind it', () => {
    const text = adminMessage(
      row('claim_no_order', {
        email: 'me@b.co',
        payEmail: 'work@b.co',
        amount: '2990.00',
        currency: 'RUB',
        ref: 'R-1',
        provider: 'prodamus',
      }),
    )!;
    expect(text).toContain('заказа нет');
    expect(text).toContain('me@b.co');
    expect(text).toContain('work@b.co');
    expect(text).toContain('2990.00 RUB');
    expect(text).toContain('Prodamus');
  });
});

describe('adminFailure', () => {
  /*
   * Ссылка `tg://user?id=…` бывает запрещена настройками человека, и телеграм отказывает всему
   * сообщению. Сразу — ещё раз без ссылок, один раз.
   */
  it('retries once without links when Telegram rejects the markup or a link', () => {
    const parse = 'Bad Request: can\'t parse entities: Unsupported start tag "x"';
    expect(adminFailure(400, parse, 1, false)).toBe('retry_plain');
    expect(adminFailure(400, 'Bad Request: invalid URL', 1, false)).toBe('retry_plain');
    // Второй раз без ссылок уже не пробуют: это та же строка в следующий запуск.
    expect(adminFailure(400, parse, 1, true)).toBe('retry');
  });

  /* Раньше 400 и 403 сразу делали строку `failed`: сообщение о деньгах терялось на первой ошибке. */
  it('keeps the row for the next run on 429, 5xx, 400 and 403', () => {
    for (const status of [429, 500, 502, 400, 403, 0]) {
      expect(
        adminFailure(status, 'Bad Request: message thread not found', 1, true),
        String(status),
      ).toBe('retry');
    }
  });

  it('gives up only after the last attempt', () => {
    expect(adminFailure(500, '', ADMIN_MAX_ATTEMPTS - 1, true)).toBe('retry');
    expect(adminFailure(500, '', ADMIN_MAX_ATTEMPTS, true)).toBe('give_up');
    expect(adminFailure(403, '', ADMIN_MAX_ATTEMPTS, true)).toBe('give_up');
  });
});

describe('stripLinks', () => {
  it('keeps the words and drops the link', () => {
    expect(stripLinks('Ответить: <a href="tg://user?id=5">открыть чат</a>')).toBe(
      'Ответить: открыть чат',
    );
    expect(stripLinks('<b>Обращение</b>\n<a href="https://t.me/x">@x</a>')).toBe(
      '<b>Обращение</b>\n@x',
    );
  });
});
