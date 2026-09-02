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

  it('addresses the athlete informally in Russian (no «Вы»)', () => {
    for (const m of collect()) expect(m.ru).not.toMatch(/\bВы\b|\bВас\b|\bВам\b/);
  });
});
