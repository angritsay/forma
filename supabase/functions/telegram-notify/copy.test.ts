import { describe, expect, it } from 'vitest';
import {
  accessWarningEnd,
  clientFailure,
  escapeHtml,
  MAX_ATTEMPTS,
  messageFor,
  plainText,
  plural,
  toLocale,
} from './copy';

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
    expect(messageFor({ kind: 'club_breakfast', params: {} })).toBeNull();
    expect(messageFor({ kind: '', params: {} })).toBeNull();
  });

  it('keeps every message inside Telegram limits', () => {
    for (const kind of [
      'course_paid',
      'subscription_paid',
      'workout_assigned',
      'weekly_winner',
      'referral_reward',
      'duo_nudge',
      'club_task',
      'club_reminder',
      'club_recap',
      'subscription_ending',
      'club_trial_tomorrow',
      'session_confirmed',
      'session_reminder',
      'session_moved',
      'session_cancelled',
    ]) {
      for (const locale of ['ru', 'en'] as const) {
        const m = messageFor(
          {
            kind,
            params: {
              title: 'х'.repeat(500),
              prize: 'х'.repeat(500),
              note: 'х'.repeat(500),
              name: 'х'.repeat(500),
              days: 30,
              streak: 999999,
              points: 999999,
              week: 999999,
              coach: 'х'.repeat(500),
              minutes: 999999,
              starts_at: '2026-10-02T11:30:00Z',
              from_starts_at: '2026-10-01T11:30:00Z',
              expires_at: '2026-10-02T11:30:00Z',
              join_url: `https://example.com/${'x'.repeat(500)}`,
            },
          },
          locale,
        );
        expect(m).not.toBeNull();
        expect(m!.text.length).toBeLessThan(4096);
      }
    }
  });
});

describe('the referral reward (0051)', () => {
  it('tells the one who invited and the one who came, each their own line', () => {
    const owner = messageFor({ kind: 'referral_reward', params: { role: 'owner', days: 30 } });
    expect(owner?.text).toBe('<b>Друг оплатил клуб — тебе +30 дней 🎁</b>');
    expect(owner?.buttonText).toBe('Открыть приложение');
    const friend = messageFor({ kind: 'referral_reward', params: { role: 'friend', days: 30 } });
    expect(friend?.text).toBe('<b>Тебя позвали в клуб — тебе +30 дней 🎁</b>');
  });

  /* Лимит за год: подруга своё получила, позвавшей — спасибо без обещания дней. */
  it('thanks rather than promises when the inviter’s year is used up', () => {
    const m = messageFor({ kind: 'referral_reward', params: { role: 'owner', days: 0 } });
    expect(m?.text).toContain('спасибо');
    expect(m?.text).not.toContain('+');
  });

  it('says the same in English', () => {
    const m = messageFor({ kind: 'referral_reward', params: { role: 'friend', days: 30 } }, 'en');
    expect(m?.text).toBe('<b>A friend invited you to the club — 30 days on us 🎁</b>');
    expect(m?.buttonText).toBe('Open the app');
  });
});

describe('the duo nudge (0051)', () => {
  it('names the partner as the board does', () => {
    const m = messageFor({ kind: 'duo_nudge', params: { name: 'Аня' } });
    expect(m?.text).toBe('<b>Аня уже сделал(а) задание — твоя очередь</b>');
    expect(messageFor({ kind: 'duo_nudge', params: { name: 'Anna' } }, 'en')?.text).toBe(
      '<b>Anna has done today’s task — your turn</b>',
    );
  });

  /* Имя пишет человек: экранируется, а пустое заменяется словом. */
  it('escapes the name and survives its absence', () => {
    expect(messageFor({ kind: 'duo_nudge', params: { name: '<b>x</b>' } })?.text).toContain(
      '&lt;b&gt;x&lt;/b&gt;',
    );
    expect(messageFor({ kind: 'duo_nudge', params: {} })?.text).toContain('Напарник уже');
    expect(messageFor({ kind: 'duo_nudge', params: { name: 7 } }, 'en')?.text).toContain(
      'Your partner has',
    );
  });
});

describe('the language of the person being written to', () => {
  const KINDS = [
    'course_paid',
    'subscription_paid',
    'workout_assigned',
    'weekly_winner',
    'referral_reward',
    'duo_nudge',
    'club_task',
    'club_reminder',
    'club_recap',
    'subscription_ending',
    'club_trial_tomorrow',
    'session_confirmed',
    'session_reminder',
    'session_moved',
    'session_cancelled',
  ];

  it('writes English to someone who chose English', () => {
    const m = messageFor({ kind: 'course_paid', params: {} }, 'en');
    expect(m?.text).toContain('the course is open');
    // Кнопка в приложении подписана дословно так — человек пойдёт искать её глазами.
    expect(m?.text).toContain('Paid from another email?');
    expect(m?.buttonText).toBe('Open the app');
  });

  it('translates every kind, leaving no Russian behind', () => {
    for (const kind of KINDS) {
      const m = messageFor(
        {
          kind,
          params: {
            title: 'Morning legs',
            prize: 'An hour',
            streak: 3,
            week: 2,
            expires_at: '2026-10-02T11:30:00Z',
            starts_at: '2026-10-02T11:30:00Z',
            coach: 'Сергей',
            coach_en: 'Sergey',
            minutes: 30,
          },
        },
        'en',
      );
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

describe('the club’s daily touches (0052)', () => {
  it('names the task and its points in the morning, and says what to do', () => {
    const m = messageFor({
      kind: 'club_task',
      params: { title: '20 приседаний', points: 12, day: 3 },
    });
    expect(m?.text).toBe(
      'Задание на сегодня: <b>20 приседаний</b> · 12 баллов\n\nСделай — и отметь в приложении.',
    );
    expect(m?.buttonText).toBe('Открыть Forma');
  });

  it('declines the points, and drops them at zero', () => {
    expect(messageFor({ kind: 'club_task', params: { title: 'x', points: 1 } })?.text).toContain(
      '· 1 балл\n',
    );
    expect(messageFor({ kind: 'club_task', params: { title: 'x', points: 3 } })?.text).toContain(
      '· 3 балла',
    );
    expect(messageFor({ kind: 'club_task', params: { title: 'x', points: 21 } })?.text).toContain(
      '· 21 балл\n',
    );
    // «Доброе утро» и день отдыха стоят ноль — и «· 0 баллов» читается как насмешка.
    const rest = messageFor({ kind: 'club_task', params: { title: 'Отдых', points: 0 } });
    expect(rest?.text).toBe('Задание на сегодня: <b>Отдых</b>\n\nСделай — и отметь в приложении.');
  });

  /* Название пишет тренер, и однажды оно приедет со знаком «<». */
  it('escapes the title the coach typed', () => {
    const m = messageFor({
      kind: 'club_task',
      params: { title: '<b>20</b> приседаний & вода', points: 5 },
    });
    expect(m?.text).toContain('<b>&lt;b&gt;20&lt;/b&gt; приседаний &amp; вода</b>');
    expect(m?.text).not.toContain('<b><b>');
  });

  it('uses the English title for an English reader when the coach wrote one', () => {
    const params = { title: '20 приседаний', title_en: '20 squats', points: 12 };
    expect(messageFor({ kind: 'club_task', params }, 'en')?.text).toBe(
      'Today’s task: <b>20 squats</b> · 12 points\n\nDo it — and tick it off in the app.',
    );
    // Без английской половины — русское название, как у тренировки (чужие слова не переводятся).
    expect(
      messageFor({ kind: 'club_task', params: { title: '20 приседаний', points: 1 } }, 'en')?.text,
    ).toContain('<b>20 приседаний</b> · 1 point');
    expect(messageFor({ kind: 'club_task', params }, 'ru')?.text).toContain('<b>20 приседаний</b>');
  });

  it('sends nothing for a task without a title', () => {
    expect(messageFor({ kind: 'club_task', params: { title: '  ', points: 5 } })).toBeNull();
    expect(messageFor({ kind: 'club_task', params: null })).toBeNull();
  });

  it('reminds about the streak that is about to break, in the right plural', () => {
    expect(messageFor({ kind: 'club_reminder', params: { streak: 1 } })?.text).toBe(
      '<b>Сегодня ещё нет отметки. Серия 1 день — сгорит в полночь 🔥</b>',
    );
    expect(messageFor({ kind: 'club_reminder', params: { streak: 3 } })?.text).toContain(
      'Серия 3 дня —',
    );
    expect(messageFor({ kind: 'club_reminder', params: { streak: 12 } })?.text).toContain(
      'Серия 12 дней —',
    );
    expect(messageFor({ kind: 'club_reminder', params: { streak: '5' } })?.text).toContain(
      'Серия 5 дней —',
    );
    expect(messageFor({ kind: 'club_reminder', params: { streak: 1 } }, 'en')?.text).toBe(
      '<b>No tick today yet. Your streak of 1 day burns out at midnight 🔥</b>',
    );
    expect(messageFor({ kind: 'club_reminder', params: { streak: 4 } }, 'en')?.text).toContain(
      'streak of 4 days',
    );
  });

  /*
   * The points deadline is the round's own (audit item 8): the time the row carries, in the zone
   * the row names — never a clock typed into the copy.
   */
  it('names the points deadline the row carries, in its zone', () => {
    const moscow = { streak: 2, due: '22:00:00', late_counts: false, tz: 'Europe/Moscow' };
    expect(messageFor({ kind: 'club_reminder', params: moscow })?.text).toContain(
      '\n\nБаллы — до 22:00 по Москве.',
    );
    expect(messageFor({ kind: 'club_reminder', params: moscow }, 'en')?.text).toContain(
      '\n\nPoints count until 22:00 Moscow time.',
    );
    // A coach moved the time: the message follows it.
    expect(
      messageFor({ kind: 'club_reminder', params: { ...moscow, due: '21:30' } })?.text,
    ).toContain('Баллы — до 21:30 по Москве.');
    // Another zone is named, not converted.
    expect(
      messageFor({ kind: 'club_reminder', params: { ...moscow, tz: 'Europe/London' } }, 'en')?.text,
    ).toContain('Points count until 22:00 (Europe/London).');
  });

  it('says nothing about a deadline it cannot vouch for', () => {
    const base = { streak: 2, due: '22:00', late_counts: false, tz: 'Europe/Moscow' };
    for (const params of [
      { ...base, late_counts: true }, // a late proof still scores
      { ...base, late_counts: undefined },
      { ...base, due: undefined },
      { ...base, due: '25:00' },
      { ...base, tz: undefined },
      { ...base, tz: '<b>' },
    ]) {
      const text = messageFor({ kind: 'club_reminder', params })?.text ?? '';
      expect(text).toContain('Серия 2 дня');
      expect(text).not.toContain('Баллы');
    }
  });

  /* Серии нет — напоминать не о чем; база такое не кладёт, но старая строка может. */
  it('sends no reminder without a streak', () => {
    expect(messageFor({ kind: 'club_reminder', params: { streak: 0 } })).toBeNull();
    expect(messageFor({ kind: 'club_reminder', params: {} })).toBeNull();
    expect(messageFor({ kind: 'club_reminder', params: { streak: 'many' } })).toBeNull();
  });

  it('closes the week with place, points, tasks and streak', () => {
    const m = messageFor({
      kind: 'club_recap',
      params: { week: 2, place: 3, points: 41, done: 5, total: 7, streak: 5 },
    });
    expect(m?.text).toBe(
      '<b>Неделя 2: 41 балл, 5 из 7 заданий, место 3. Серия 5 дней 🔥. Новая неделя — в понедельник.</b>',
    );
    expect(m?.buttonText).toBe('Открыть Forma');
    const en = messageFor(
      {
        kind: 'club_recap',
        params: { week: 2, place: 1, points: 1, done: 1, total: 1, streak: 1 },
      },
      'en',
    );
    expect(en?.text).toBe(
      '<b>Week 2: 1 point, 1 of 1 task, place 1. Streak 1 day 🔥. A new week starts Monday.</b>',
    );
  });

  it('omits the place and the streak when there is none to name', () => {
    const m = messageFor({
      kind: 'club_recap',
      params: { week: 4, place: null, points: 0, done: 0, total: 1, streak: 0 },
    });
    expect(m?.text).toBe(
      '<b>Неделя 4: 0 баллов, 0 из 1 задания. Новая неделя — в понедельник.</b>',
    );
    expect(m?.text).not.toContain('место');
    expect(m?.text).not.toContain('Серия');
  });

  it('still says something when the numbers are missing', () => {
    const m = messageFor({ kind: 'club_recap', params: {} });
    expect(m?.text).toBe('<b>0 баллов, 0 из 0 заданий. Новая неделя — в понедельник.</b>');
  });
});

describe('access running out (0054)', () => {
  it('names the last day of the club and says renewal is by hand', () => {
    // 21:30 UTC is already the 3rd in Moscow: the date is the Moscow calendar's.
    const m = messageFor({
      kind: 'subscription_ending',
      params: { expires_at: '2026-10-02T21:30:00Z' },
    });
    expect(m?.text).toBe(
      '<b>Клуб открыт до 3 октября</b>\n\n' +
        'Автопродления нет: чтобы остаться в клубе, продли подписку в приложении.',
    );
    expect(m?.buttonText).toBe('Открыть приложение');
    const en = messageFor(
      { kind: 'subscription_ending', params: { expires_at: '2026-10-02T21:30:00Z' } },
      'en',
    );
    expect(en?.text).toContain('<b>The club is open until 3 October</b>');
    expect(en?.text).toContain('no auto-renewal');
    // Annual plans exist (0005): the copy names no period.
    expect(en?.text).not.toMatch(/month|year/);
    expect(m?.text).not.toMatch(/месяц|год/);
  });

  it('sends nothing without a readable date', () => {
    for (const expires_at of [undefined, '', 'soon', 42]) {
      expect(messageFor({ kind: 'subscription_ending', params: { expires_at } })).toBeNull();
    }
  });

  it('warns about the last day of the free week', () => {
    const m = messageFor({
      kind: 'club_trial_tomorrow',
      params: { ends_at: '2026-10-02T09:00:00Z' },
    });
    expect(m?.text).toBe(
      '<b>Завтра заканчивается пробная неделя клуба</b>\n\n' +
        'Чтобы остаться в клубе, оформи подписку в приложении.',
    );
    expect(messageFor({ kind: 'club_trial_tomorrow', params: null }, 'en')?.text).toContain(
      'Your free week in the club ends tomorrow',
    );
  });
});

describe('accessWarningEnd', () => {
  it('reads the moment each access warning is about', () => {
    expect(
      accessWarningEnd({
        kind: 'subscription_ending',
        params: { expires_at: '2026-10-02T21:30:00Z' },
      }),
    ).toBe(Date.parse('2026-10-02T21:30:00Z'));
    expect(
      accessWarningEnd({
        kind: 'club_trial_tomorrow',
        params: { ends_at: '2026-10-02T09:00:00Z' },
      }),
    ).toBe(Date.parse('2026-10-02T09:00:00Z'));
  });

  it('is null for other kinds and for a missing or unreadable time', () => {
    expect(
      accessWarningEnd({ kind: 'club_task', params: { expires_at: '2026-10-02T21:30:00Z' } }),
    ).toBeNull();
    expect(accessWarningEnd({ kind: 'club_trial_tomorrow', params: null })).toBeNull();
    expect(
      accessWarningEnd({ kind: 'subscription_ending', params: { expires_at: 'soon' } }),
    ).toBeNull();
    // The other kind's field does not count.
    expect(
      accessWarningEnd({
        kind: 'subscription_ending',
        params: { ends_at: '2026-10-02T09:00:00Z' },
      }),
    ).toBeNull();
  });
});

describe('coach sessions (0054)', () => {
  const base = {
    starts_at: '2026-10-02T11:30:00Z',
    minutes: 30,
    coach: 'Сергей',
    coach_en: 'Sergey',
    tz: 'Europe/Moscow',
    join_url: 'https://telemost.yandex.ru/j/123?a=1&b=2',
  };

  it('confirms with who, how long, when in Moscow time, the link and the 24-hour rule', () => {
    const m = messageFor({ kind: 'session_confirmed', params: base });
    expect(m?.text).toBe(
      [
        '<b>Встреча с тренером подтверждена</b>',
        'Сергей · 30 минут · 2 октября, 14:30 МСК',
        '<a href="https://telemost.yandex.ru/j/123?a=1&amp;b=2">Ссылка на созвон</a>',
        'Перенести время можно в приложении не позже чем за 24 часа. Позже — напиши тренеру.',
      ].join('\n\n'),
    );
    expect(m?.buttonText).toBe('Открыть приложение');
  });

  it('says the same in English, with the coach’s English name', () => {
    const m = messageFor({ kind: 'session_confirmed', params: { ...base, minutes: 60 } }, 'en');
    expect(m?.text).toContain('<b>Your session with the coach is confirmed</b>');
    expect(m?.text).toContain('Sergey · 60 minutes · 2 October, 14:30 Moscow time');
    expect(m?.text).toContain('up to 24 hours ahead');
  });

  it('picks the reminder headline by how far ahead it is', () => {
    const day = messageFor({ kind: 'session_reminder', params: { ...base, hours_before: 24 } });
    expect(day?.text).toContain('<b>Завтра встреча с тренером</b>');
    const hour = messageFor({ kind: 'session_reminder', params: { ...base, hours_before: 1 } });
    expect(hour?.text).toContain('<b>Через час встреча с тренером</b>');
    expect(hour?.text).toContain('Ссылка на созвон');
    expect(hour?.text).not.toContain('24 часа');
    const other = messageFor({ kind: 'session_reminder', params: base }, 'en');
    expect(other?.text).toContain('<b>Your session with the coach is coming up</b>');
  });

  /* 0056: the hour-before reminder lives 90 minutes, so a late run may send it close to or after
     the start; the headline must not say «через час» then. */
  it('does not say «in an hour» when the sender is late', () => {
    const start = Date.parse(base.starts_at);
    const params = { ...base, hours_before: 1 };
    const on = messageFor({ kind: 'session_reminder', params }, 'ru', start - 60 * 60_000);
    expect(on?.text).toContain('<b>Через час встреча с тренером</b>');
    const late = messageFor({ kind: 'session_reminder', params }, 'ru', start - 20 * 60_000);
    expect(late?.text).toContain('<b>Скоро встреча с тренером</b>');
    const after = messageFor({ kind: 'session_reminder', params }, 'en', start + 10 * 60_000);
    expect(after?.text).toContain('<b>Your session with the coach has started</b>');
    expect(after?.text).toContain('href=');
  });

  it('names the new time and the old one when a session moves', () => {
    const m = messageFor({
      kind: 'session_moved',
      params: { ...base, from_starts_at: '2026-10-01T15:00:00Z' },
    });
    expect(m?.text).toContain('<b>Встреча перенесена</b>');
    expect(m?.text).toContain('2 октября, 14:30 МСК');
    expect(m?.text).toContain('Было: 1 октября, 18:00 МСК');
  });

  it('cancels without a link and points to the coach', () => {
    const m = messageFor({ kind: 'session_cancelled', params: base });
    expect(m?.text).toContain('<b>Встреча отменена</b>');
    expect(m?.text).not.toContain('<a ');
    expect(m?.text).toContain('напиши тренеру');
  });

  it('prints another zone by name', () => {
    const m = messageFor({ kind: 'session_confirmed', params: { ...base, tz: 'Asia/Dubai' } });
    expect(m?.text).toContain('2 октября, 15:30 Asia/Dubai');
    const bad = messageFor({ kind: 'session_confirmed', params: { ...base, tz: 'Mars/Base' } });
    expect(bad?.text).toContain('14:30 МСК');
  });

  it('escapes the coach’s name and drops a link that is not https', () => {
    const m = messageFor({
      kind: 'session_confirmed',
      params: { ...base, coach: '<b>С</b>', join_url: 'javascript:alert(1)' },
    });
    expect(m?.text).toContain('&lt;b&gt;С&lt;/b&gt;');
    expect(m?.text).not.toContain('<a ');
    const http = messageFor({
      kind: 'session_confirmed',
      params: { ...base, join_url: 'http://example.com/"x' },
    });
    expect(http?.text).not.toContain('<a ');
    const quote = messageFor({
      kind: 'session_confirmed',
      params: { ...base, join_url: 'https://example.com/a"b' },
    });
    expect(quote?.text).not.toContain('a"b');
  });

  it('falls back to a word for the coach and leaves out a missing length', () => {
    const m = messageFor({ kind: 'session_confirmed', params: { starts_at: base.starts_at } });
    expect(m?.text).toContain('Тренер · 2 октября, 14:30 МСК');
  });

  it('sends nothing without a start time', () => {
    for (const kind of [
      'session_confirmed',
      'session_reminder',
      'session_moved',
      'session_cancelled',
    ]) {
      expect(messageFor({ kind, params: { ...base, starts_at: 'later' } })).toBeNull();
      expect(messageFor({ kind, params: null })).toBeNull();
    }
  });
});

describe('plural', () => {
  it('picks the Russian form by the last digits and the English by one', () => {
    const f = { one: 'день', few: 'дня', many: 'дней' };
    expect([1, 2, 5, 11, 12, 21, 22, 25, 101, 111].map((n) => plural('ru', n, f))).toEqual([
      'день',
      'дня',
      'дней',
      'дней',
      'дней',
      'день',
      'дня',
      'дней',
      'день',
      'дней',
    ]);
    expect(plural('en', 1, { one: 'day', many: 'days' })).toBe('day');
    expect(plural('en', 0, { one: 'day', many: 'days' })).toBe('days');
  });
});

describe('plainText', () => {
  it('drops the tags and undoes the escapes', () => {
    expect(plainText('<b>Курс открыт</b>\n\nA &amp; B &lt;3')).toBe('Курс открыт\n\nA & B <3');
  });

  // In a session message the address is the point: without markup it must still be there.
  it('keeps a link as its words and its address', () => {
    expect(plainText('<a href="https://meet.example/x">Ссылка на встречу</a>')).toBe(
      'Ссылка на встречу: https://meet.example/x',
    );
  });

  it('turns every real message into text Telegram cannot refuse to parse', () => {
    const m = messageFor({ kind: 'course_paid', params: { courseId: 'base' } });
    const plain = plainText(m!.text);
    expect(plain).not.toMatch(/<[a-z/]/i);
    expect(plain).toContain('курс открыт');
  });
});

describe('clientFailure', () => {
  it('tries the words without markup once after a 400', () => {
    expect(clientFailure(400, 1, false)).toBe('retry_plain');
    expect(clientFailure(400, 1, true)).toBe('retry');
  });

  it('reads a 403 as a blocked chat, whatever the count', () => {
    expect(clientFailure(403, 1, false)).toBe('blocked');
    expect(clientFailure(403, MAX_ATTEMPTS, true)).toBe('blocked');
  });

  // A network error used to be retried forever: it counts like any other failure now.
  it('gives up on a network error at the same limit', () => {
    expect(clientFailure(0, MAX_ATTEMPTS - 1, true)).toBe('retry');
    expect(clientFailure(0, MAX_ATTEMPTS, true)).toBe('give_up');
    expect(clientFailure(502, MAX_ATTEMPTS, true)).toBe('give_up');
  });
});
