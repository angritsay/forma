import { describe, expect, it } from 'vitest';
import { dict as en } from './en/index';
import { dict as ru } from './ru/index';
import { plural, t } from './index';

describe('i18n dictionaries', () => {
  it('have the same namespaces and keys in ru and en', () => {
    const enNs = Object.keys(en).sort();
    const ruNs = Object.keys(ru).sort();
    expect(ruNs).toEqual(enNs);
    for (const ns of enNs) {
      const enKeys = Object.keys((en as Record<string, Record<string, string>>)[ns]!).sort();
      const ruKeys = Object.keys((ru as Record<string, Record<string, string>>)[ns]!).sort();
      expect(ruKeys, `namespace "${ns}" key mismatch`).toEqual(enKeys);
    }
  });

  it('have no empty strings', () => {
    for (const d of [en, ru]) {
      for (const [ns, table] of Object.entries(d)) {
        for (const [k, v] of Object.entries(table as Record<string, string>)) {
          expect(v.trim().length, `${ns}.${k} is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('interpolates params and falls back to en', () => {
    expect(t('en', 'common.minutesShort', { n: 12 })).toBe('12 min');
    expect(t('ru', 'common.minutesShort', { n: 12 })).toBe('12 мин');
  });

  it('pluralizes russian correctly', () => {
    const f = { one: 'день', few: 'дня', many: 'дней' };
    expect(plural('ru', 1, f)).toBe('день');
    expect(plural('ru', 3, f)).toBe('дня');
    expect(plural('ru', 5, f)).toBe('дней');
    expect(plural('ru', 11, f)).toBe('дней');
    expect(plural('ru', 21, f)).toBe('день');
    expect(plural('en', 1, { one: 'day', many: 'days' })).toBe('day');
    expect(plural('en', 2, { one: 'day', many: 'days' })).toBe('days');
  });
});
