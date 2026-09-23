import { describe, expect, it } from 'vitest';
import { escapeHtml, messageFor, toLocale } from './copy';

describe('escapeHtml', () => {
  it('escapes the three characters Telegram treats as HTML', () => {
    expect(escapeHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('leaves quotes and the rest of a Russian sentence alone', () => {
    expect(escapeHtml('Тренировка «Утро», 20 мин.')).toBe('Тренировка «Утро», 20 мин.');
  });
});

describe('messageFor', () => {
  it('tells a buyer the course is open and what to do if it is not', () => {
    const m = messageFor({ kind: 'course_paid', params: { courseId: 'base' } });
    expect(m?.text).toContain('курс открыт');
    // Владелец: «перезагрузи приложение, и если доступ не открылся — "Оплатил(а) с другой
    // почты" с номером заказа из чека». Обе половины обязаны быть в тексте.
    expect(m?.text).toContain('Перезагрузи приложение');
    expect(m?.text).toContain('Оплатил(а) с другой почты?');
    expect(m?.text).toContain('номер заказа из чека');
    expect(m?.buttonText).toBeTruthy();
  });

  it('says the club rather than a course for a subscription', () => {
    const m = messageFor({ kind: 'subscription_paid', params: { plan: 'monthly' } });
    expect(m?.text).toContain('клуб открыт');
    expect(m?.text).toContain('Оплатил(а) с другой почты?');
  });

  it('names the workout the coach assigned and says where it waits', () => {
    const m = messageFor({ kind: 'workout_assigned', params: { title: 'Утро на ногах' } });
    expect(m?.text).toContain('«Утро на ногах»');
    expect(m?.text).toContain('Курсы');
  });

  /* Название пишет тренер, и однажды оно приедет со знаком «<». */
  it('escapes a title that would otherwise break the HTML', () => {
    const m = messageFor({ kind: 'workout_assigned', params: { title: '<b>жир</b> & кровь' } });
    expect(m?.text).toContain('&lt;b&gt;жир&lt;/b&gt; &amp; кровь');
    expect(m?.text).not.toContain('<b>жир');
  });

  /* Название необязательное, и «выдал тебе тренировку «»» читается как сбой. */
  it('drops the quotes when the workout has no title', () => {
    for (const title of ['', '   ', undefined]) {
      const m = messageFor({ kind: 'workout_assigned', params: { title } });
      expect(m?.text).toContain('выдал тебе тренировку');
      expect(m?.text).not.toContain('«»');
    }
  });

  it('survives params that are missing or the wrong shape', () => {
    expect(messageFor({ kind: 'workout_assigned', params: null })?.text).toBeTruthy();
    expect(messageFor({ kind: 'workout_assigned', params: { title: 42 } })?.text).toBeTruthy();
  });

  it('congratulates the winner, names the prize and says what to do next', () => {
    const m = messageFor({
      kind: 'weekly_winner',
      params: { prize: 'Час с Сергеем', note: 'три дня подряд' },
    });
    expect(m?.text).toContain('Ты победил');
    expect(m?.text).toContain('Час с Сергеем');
    expect(m?.text).toContain('три дня подряд');
    // Поздравление без «что дальше» оставляет человека ждать, пока про него вспомнят.
    expect(m?.text).toContain('Напиши Сергею');
  });

  /* Приза может не быть: «ты победил» само по себе — полное сообщение. */
  it('drops the prize line when the round has no prize', () => {
    const m = messageFor({ kind: 'weekly_winner', params: { prize: '', note: '' } });
    expect(m?.text).toContain('Ты победил');
    expect(m?.text).not.toContain('Твой приз');
    expect(m?.text).not.toContain('«»');
  });

  it('escapes a prize and a note the coach typed', () => {
    const m = messageFor({
      kind: 'weekly_winner',
      params: { prize: '<b>час</b>', note: 'a & b' },
    });
    expect(m?.text).toContain('&lt;b&gt;час&lt;/b&gt;');
    expect(m?.text).toContain('a &amp; b');
  });

  /*
   * Неизвестный вид — это строка из будущей миграции, доехавшая до старой функции. Ронять на ней
   * всю рассылку нельзя, поэтому null, а не исключение.
   */
  it('answers null for a kind it does not know', () => {
    expect(messageFor({ kind: 'club_trial_tomorrow', params: {} })).toBeNull();
    expect(messageFor({ kind: '', params: {} })).toBeNull();
  });

  it('keeps every message inside Telegram limits', () => {
    for (const kind of ['course_paid', 'subscription_paid', 'workout_assigned', 'weekly_winner']) {
      for (const locale of ['ru', 'en'] as const) {
        const m = messageFor(
          {
            kind,
            params: { title: 'х'.repeat(500), prize: 'х'.repeat(500), note: 'х'.repeat(500) },
          },
          locale,
        );
        expect(m).not.toBeNull();
        expect(m!.text.length).toBeLessThan(4096);
      }
    }
  });
});

describe('the language of the person being written to', () => {
  const KINDS = ['course_paid', 'subscription_paid', 'workout_assigned', 'weekly_winner'];

  it('writes English to someone who chose English', () => {
    const m = messageFor({ kind: 'course_paid', params: {} }, 'en');
    expect(m?.text).toContain('the course is open');
    // Кнопка в приложении подписана дословно так — человек пойдёт искать её глазами.
    expect(m?.text).toContain('Paid from another email?');
    expect(m?.buttonText).toBe('Open the app');
  });

  it('translates every kind, leaving no Russian behind', () => {
    for (const kind of KINDS) {
      const m = messageFor({ kind, params: { title: 'Morning legs', prize: 'An hour' } }, 'en');
      expect(m).not.toBeNull();
      // Название тренировки и приз — чужие слова, и они не переводятся; всё остальное должно
      // быть по-английски, а кириллица в тексте означала бы забытую строку.
      expect(m!.text).not.toMatch(/[А-Яа-яЁё]/);
      expect(m!.buttonText).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  /*
   * Название тренировки тренер пишет по-русски (в конструкторе одно поле, не два), и оно едет
   * получателю как есть. Переводить его нечем, а выбрасывать — значит отправить «Sergey has set
   * you a workout» без единого признака, какую именно.
   */
  it('passes the coach’s own words through untranslated', () => {
    const m = messageFor({ kind: 'workout_assigned', params: { title: 'Утро на ногах' } }, 'en');
    expect(m?.text).toContain('Sergey has set you a workout');
    expect(m?.text).toContain('«Утро на ногах»');
  });

  it('falls back to Russian for anything it does not recognise', () => {
    // 'ru' — язык колонки по умолчанию и язык всех, кто завёлся до выбора языка.
    for (const x of ['de', '', null, undefined, 7, {}]) {
      expect(toLocale(x)).toBe('ru');
    }
    expect(toLocale('en')).toBe('en');
    expect(messageFor({ kind: 'course_paid', params: {} })?.text).toContain('курс открыт');
  });
});

describe('the coach’s reply to a support message (0045)', () => {
  it('labels the reply in the person’s language and keeps the words as written', () => {
    const ru = messageFor({ kind: 'support_reply', params: { text: 'Можно, но осторожно' } }, 'ru');
    expect(ru?.text).toBe('<b>Ответ тренера:</b>\n\nМожно, но осторожно');
    const en = messageFor({ kind: 'support_reply', params: { text: 'Можно, но осторожно' } }, 'en');
    expect(en?.text).toBe('<b>Coach’s reply:</b>\n\nМожно, но осторожно');
    // A conversation, not an occasion to open the app.
    expect(ru?.buttonText).toBe('');
  });

  it('escapes what the admin typed', () => {
    const m = messageFor({ kind: 'support_reply', params: { text: 'a <3 & <b>b</b>' } });
    expect(m?.text).toContain('a &lt;3 &amp; &lt;b&gt;b&lt;/b&gt;');
  });

  it('quotes the question only when it has a real message id', () => {
    expect(messageFor({ kind: 'support_reply', params: { text: 'x', replyTo: 77 } })?.replyTo).toBe(
      77,
    );
    for (const replyTo of [undefined, null, 0, -3, 'abc', 1.5]) {
      const m = messageFor({ kind: 'support_reply', params: { text: 'x', replyTo } });
      expect(m?.replyTo).toBeUndefined();
    }
  });

  it('sends nothing for an empty reply', () => {
    expect(messageFor({ kind: 'support_reply', params: { text: '  ' } })).toBeNull();
    expect(messageFor({ kind: 'support_reply', params: null })).toBeNull();
  });

  it('caps the reply at a thousand characters, counting an emoji as one', () => {
    const m = messageFor({ kind: 'support_reply', params: { text: '💪'.repeat(1200) } });
    const body = m!.text.split('\n\n')[1]!;
    expect(Array.from(body)).toHaveLength(1000);
  });
});
