/** Date helpers. "Local date" = YYYY-MM-DD in the user's timezone; the unit the training count uses. */
import type { Locale } from '@/content/schema';

/**
 * Short weekday label ("Mon" / "пн") for a local date; noon avoids timezone drift.
 *
 * It used to live next to the home screen's week figures, which is where it was first needed. The
 * figures moved to the reports tab and the helper stayed behind, imported by three charts out of a
 * component nothing rendered any more — so it is here, with the rest of the date arithmetic.
 */
export function weekdayLabel(locale: Locale, isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })
    .format(d)
    .replace(/\.$/, '');
}

export function toLocalDateIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(
    ...((fromIso.split('-').map(Number) as [number, number, number]).map((v, i) =>
      i === 1 ? v - 1 : v,
    ) as [number, number, number]),
  );
  const b = Date.UTC(
    ...((toIso.split('-').map(Number) as [number, number, number]).map((v, i) =>
      i === 1 ? v - 1 : v,
    ) as [number, number, number]),
  );
  return Math.round((b - a) / 86_400_000);
}

/** ISO week start (Monday) for a local date. */
export function weekStart(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // Monday = 0
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

export function hoursSince(iso: string, nowIso: string): number {
  return (new Date(nowIso).getTime() - new Date(iso).getTime()) / 3_600_000;
}
