import { describe, expect, it } from 'vitest';
import type { L10n } from '@/content/schema';
import {
  ACHIEVEMENT_COPY,
  ADAPT_REASON,
  LEVEL_TITLES,
  PRESCRIBE_NOTE,
  RECOMMEND_REASON,
  SAFETY_NOTE,
} from './messages';

function collect(): L10n[] {
  const out: L10n[] = [
    SAFETY_NOTE,
    ...LEVEL_TITLES,
    ...Object.values(ADAPT_REASON),
    ...Object.values(RECOMMEND_REASON),
    ...Object.values(PRESCRIBE_NOTE),
  ];
  for (const c of Object.values(ACHIEVEMENT_COPY)) out.push(c.title, c.description);
  return out;
}

describe('messages', () => {
  it('every text has a non-empty RU and EN version', () => {
    for (const m of collect()) {
      expect(m.ru.trim().length).toBeGreaterThan(0);
      expect(m.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('RU texts are actually Russian and EN texts are not', () => {
    for (const m of collect()) {
      expect(m.ru).toMatch(/[А-Яа-яЁё]/);
      expect(m.en).not.toMatch(/[А-Яа-яЁё]/);
    }
  });

  /**
   * JS `\b` only knows ASCII word characters, so a Cyrillic word boundary has to be spelled out
   * with Unicode property escapes — otherwise the assertion silently matches nothing.
   */
  const word = (w: string) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'iu');

  it('addresses the athlete informally in Russian (no «Вы»)', () => {
    expect(word('вы').test('Вы молодец')).toBe(true);
    expect(word('вы').test('Выполни подход')).toBe(false);
    for (const m of collect())
      for (const w of ['вы', 'вас', 'вам']) expect(word(w).test(m.ru), m.ru).toBe(false);
  });

  it('uses no gendered verb or adjective forms about the athlete', () => {
    // Masculine past tense / short adjectives would read wrong for half of the audience.
    const gendered = ['успел', 'готов', 'смог', 'сделал', 'начал', 'устал', 'прошёл', 'набрал'];
    for (const m of collect())
      for (const g of gendered) expect(word(g).test(m.ru), `${g} in “${m.ru}”`).toBe(false);
  });
});
