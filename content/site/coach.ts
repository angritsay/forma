/**
 * Coach profile. Shown on /about, in course pages and in JSON-LD (Person). Fill in real data.
 * Until the owner provides them, `name` stays a role label so nothing invented is published.
 */
import type { L10n } from '@/content/schema';

export const COACH = {
  /** Display name (fill in the coach's real name). */
  name: { ru: 'Тренер Forma', en: 'Forma coach' } satisfies L10n,
  role: { ru: 'Тренер по кроссфиту', en: 'CrossFit coach' } satisfies L10n,
  /** 2–3 sentence bio (fill in). Avoid claims that cannot be backed. */
  bio: {
    ru: 'Тренер по кроссфиту и функциональным тренировкам. Ведёт домашние программы, в которых нагрузка подстраивается под уровень и самочувствие ученика.',
    en: 'CrossFit and functional-training coach. Runs home programs where the load adapts to the athlete’s level and how they feel.',
  } satisfies L10n,
  /** Certifications / credentials, one per line (fill in; leave empty rather than invent). */
  credentials: [] as L10n[],
  /** Photo path under /public (optional). */
  photo: '',
  /** Public profile links (optional). */
  links: [] as { label: string; url: string }[],
} as const;
