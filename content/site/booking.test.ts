import { describe, expect, it } from 'vitest';
import { BOOKING } from './booking';

/**
 * Guards on the slot links, because the failure they prevent is silent and lands after payment.
 *
 * Nothing here is about the code — `scheduleUrl` is a string the owner pastes in from Google
 * Calendar, and the two ways that paste goes wrong both produce a screen that looks completely
 * fine. A client picks «60 мин», pays 3 500 ₽, taps «Выбрать время», and is shown a page offering
 * thirty minutes. Nobody finds out until the session starts.
 */
/** The rule, as a function, so it can be shown to catch something before it is aimed at real data. */
function duplicateSlotLinks(urls: readonly (string | undefined)[]): boolean {
  const set = urls.filter((u): u is string => Boolean(u));
  return new Set(set).size !== set.length;
}

describe('BOOKING slot links', () => {
  /*
   * Both `scheduleUrl` fields are empty today, so every assertion below passes over an empty list
   * and proves nothing about the rule. This one aims it at a fixture instead: the guard is only
   * worth having if it fires on the paste it exists to catch, and it will sit here unexercised
   * until the owner fills the links in.
   */
  it('the duplicate rule fires on the paste it exists to catch', () => {
    const same = 'https://calendar.app.google/abc';
    expect(duplicateSlotLinks([same, same])).toBe(true);
    expect(duplicateSlotLinks([same, 'https://calendar.app.google/xyz'])).toBe(false);
    // Two empty fields are the state of the file today, and are not a duplicate.
    expect(duplicateSlotLinks([undefined, undefined])).toBe(false);
  });

  it('never gives two lengths the same slot page', () => {
    /*
     * A Google Calendar appointment schedule carries ONE duration, fixed on the schedule. So the
     * half-hour and the hour are two schedules with two links, and the same link on both means one
     * of them is wrong — the commonest way to paste this in, and invisible on screen.
     *
     * This does not fire on the shared `BOOKING.scheduleUrl`: a single page that asks the visitor
     * to choose a length is a different, valid arrangement, and it lives in that field.
     */
    expect(duplicateSlotLinks(BOOKING.options.map((o) => o.scheduleUrl))).toBe(false);
  });

  it('only ever holds absolute https links', () => {
    // `paymentTarget` drops anything else, so a wrong-shaped link does not throw — the button
    // simply stops being drawn, and the screen quietly falls back to «напиши тренеру».
    const all = [...BOOKING.options.map((o) => o.scheduleUrl), BOOKING.scheduleUrl];
    for (const url of all) {
      if (!url) continue;
      expect(url, url).toMatch(/^https:\/\//);
    }
  });

  it('keeps a payment link and a slot link apart on the same option', () => {
    // They are different steps — pay, then choose a time — and pasting the payform link into both
    // would send somebody who has already paid back to the payment page.
    for (const o of BOOKING.options) {
      if (!o.scheduleUrl) continue;
      expect(Object.values(o.paymentUrl)).not.toContain(o.scheduleUrl);
    }
  });
});
