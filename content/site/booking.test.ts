import { describe, expect, it } from 'vitest';
import { DEFAULT_SESSION_PRICES_RUB } from '../../supabase/functions/prodamus-webhook/verify';
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

  // The exported defaults themselves, which index.ts falls back to (verify.test.ts pins that).
  it('matches the default amounts the Prodamus webhook routes by', () => {
    for (const o of BOOKING.options) {
      expect(DEFAULT_SESSION_PRICES_RUB[o.id], o.id).toBe(o.price.rub);
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
