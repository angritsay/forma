import { describe, expect, it } from 'vitest';
import { escapeHtml, messageFor } from './copy';

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

  /*
   * Неизвестный вид — это строка из будущей миграции, доехавшая до старой функции. Ронять на ней
   * всю рассылку нельзя, поэтому null, а не исключение.
   */
  it('answers null for a kind it does not know', () => {
    expect(messageFor({ kind: 'weekly_winner', params: {} })).toBeNull();
    expect(messageFor({ kind: '', params: {} })).toBeNull();
  });

  it('keeps every message inside Telegram limits', () => {
    for (const kind of ['course_paid', 'subscription_paid', 'workout_assigned']) {
      const m = messageFor({ kind, params: { title: 'х'.repeat(500) } });
      expect(m).not.toBeNull();
      expect(m!.text.length).toBeLessThan(4096);
    }
  });
});
