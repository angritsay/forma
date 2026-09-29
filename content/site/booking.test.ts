import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BOOKING } from './booking';

/**
 * Guards on the two lengths, because the failures they prevent are silent and land after payment.
 *
 * Since the cutover the time is picked in the app and the payment confirms the held slot (0055).
 * Prodamus tells the lengths apart by the amount paid alone (`SESSION_PRICES` in
 * `prodamus-webhook`), so two lengths at one price would confirm whichever hold the webhook
 * guessed, and a price changed here but not there would leave every payment unclaimed.
 */
describe('BOOKING options', () => {
  it('prices every length differently in roubles', () => {
    const rub = BOOKING.options.map((o) => o.price.rub);
    expect(new Set(rub).size).toBe(rub.length);
  });

  it('matches the default amounts the Prodamus webhook routes by', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../../supabase/functions/prodamus-webhook/index.ts', import.meta.url)),
      'utf8',
    );
    for (const o of BOOKING.options) {
      const m = new RegExp(
        `\\b${o.id}: Number\\(Deno\\.env\\.get\\('\\w+'\\) \\?\\? '(\\d+)'\\)`,
      ).exec(src);
      expect(m?.[1], o.id).toBe(String(o.price.rub));
    }
  });

  it('only ever holds absolute https payment links', () => {
    // `paymentTarget` drops anything else, so a wrong-shaped link does not throw — the button
    // simply stops being drawn.
    for (const o of BOOKING.options) {
      for (const url of Object.values(o.paymentUrl)) {
        if (!url) continue;
        expect(url, url).toMatch(/^https:\/\//);
      }
    }
  });
});
