import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BOOKING } from './booking';

/**
 * The booking core (supabase/migrations/0055_booking_core.sql) restates two numbers of this
 * content in SQL, because a migration cannot import TypeScript: the lead time the screen quotes
 * («хоть за 15 минут») and the length of each option. If the two drift, the screen promises a
 * slot the database refuses, or a paid hour is booked as thirty minutes. So the migration is read
 * here and held to the content.
 */
const SQL = readFileSync('supabase/migrations/0055_booking_core.sql', 'utf8');

/** The body of a one-line SQL function: `… function public.<name>(…) … as $$ <body> $$;`. */
function bodyOf(name: string): string {
  const m = new RegExp(
    `function public\\.${name}\\([^)]*\\)[\\s\\S]*?as \\$\\$([\\s\\S]*?)\\$\\$;`,
  ).exec(SQL);
  expect(m, `public.${name} is in 0055`).not.toBeNull();
  return m![1]!;
}

describe('0055 booking core against content/site/booking.ts', () => {
  it('uses BOOKING.leadTimeMin as the lead time', () => {
    expect(bodyOf('booking_lead_time')).toContain(`interval '${BOOKING.leadTimeMin} minutes'`);
  });

  it('knows every option, with its length', () => {
    const body = bodyOf('booking_option_minutes');
    for (const option of BOOKING.options) {
      expect(body, option.id).toContain(`when '${option.id}' then return ${option.durationMin};`);
    }
    // And no option the content does not sell.
    const known = [...body.matchAll(/when '([a-z]+)' then/g)].map((m) => m[1]);
    expect(known.sort()).toEqual(BOOKING.options.map((o) => o.id).sort());
  });

  it('keeps every length on the 30-minute grid', () => {
    for (const option of BOOKING.options) {
      expect(option.durationMin % 30, option.id).toBe(0);
    }
  });
});
