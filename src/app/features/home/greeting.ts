/** Time-of-day greeting (local hours) and the display name used in it. */
import type { TKey } from '@/i18n/index';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'night';
}

export const GREETING_KEY: Record<DayPart, TKey> = {
  morning: 'app.homeGreetingMorning',
  afternoon: 'app.homeGreetingAfternoon',
  evening: 'app.homeGreetingEvening',
  night: 'app.homeGreetingNight',
};

/** First word of the display name, or the local part of the email as a fallback. */
export function greetingName(displayName: string | null | undefined, email: string): string {
  const name = (displayName ?? '').trim();
  if (name) return name.split(/\s+/)[0] ?? name;
  const local = email.split('@')[0] ?? '';
  return local || email;
}
