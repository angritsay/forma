/**
 * Per-person feature flags (0049, `feature_flags`).
 *
 * A flag is a key the admin switches on for one person on their page (/admin/people/<email>);
 * a row in the table means «on», no row means «off». The database checks only the key's shape,
 * so this list is where a flag comes into existence: add a key here and its label in both
 * dictionaries (`flagLabel…`), and it shows up as a switch on every person's page.
 *
 *   - `coach_nastia` — the owner's own card beside Sergey's on the «Тренер» tab.
 */
import type { TKey } from '@/i18n/index';

export const FLAGS = ['coach_nastia'] as const;

export type Flag = (typeof FLAGS)[number];

/** The admin's name for each flag, as an i18n key. */
export const FLAG_LABEL: Record<Flag, TKey> = {
  coach_nastia: 'app.flagLabelCoachNastia',
};

export function isFlag(value: string): value is Flag {
  return (FLAGS as readonly string[]).includes(value);
}
