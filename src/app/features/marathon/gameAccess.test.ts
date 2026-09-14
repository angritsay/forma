import { describe, expect, it } from 'vitest';
import { GAME_TRIAL_DAYS, gameAccess, newestActivation, trialDaysLeft } from './gameAccess';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-14T12:00:00Z');
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

describe('trialDaysLeft', () => {
  it('counts the whole days left, rounding up', () => {
    expect(trialDaysLeft(ago(0), NOW)).toBe(GAME_TRIAL_DAYS);
    expect(trialDaysLeft(ago(6.5), NOW)).toBe(1);
  });

  it('never reads zero while access still works', () => {
    // One minute of the week left is still a day on the card: a countdown that hits zero while
    // the game is open is a lie the athlete notices.
    expect(trialDaysLeft(new Date(NOW - (GAME_TRIAL_DAYS * DAY - 60_000)).toISOString(), NOW)).toBe(
      1,
    );
  });

  it('is over on the seventh day', () => {
    expect(trialDaysLeft(ago(GAME_TRIAL_DAYS), NOW)).toBeNull();
    expect(trialDaysLeft(ago(30), NOW)).toBeNull();
  });

  it('has nothing to count without a purchase, or with an unreadable date', () => {
    expect(trialDaysLeft(null, NOW)).toBeNull();
    expect(trialDaysLeft('never', NOW)).toBeNull();
  });
});

describe('gameAccess', () => {
  const base = { subscriptionLive: false, newestPurchaseAt: null, now: NOW, gated: true };

  it('opens for everyone while the subscription is not on sale', () => {
    expect(gameAccess({ ...base, gated: false })).toEqual({ allowed: true, reason: 'open' });
  });

  it('opens on a live subscription, and counts nothing down', () => {
    expect(gameAccess({ ...base, subscriptionLive: true })).toEqual({
      allowed: true,
      reason: 'subscription',
    });
  });

  it('opens on a fresh course, with the days left', () => {
    expect(gameAccess({ ...base, newestPurchaseAt: ago(2) })).toEqual({
      allowed: true,
      reason: 'trial',
      trialDaysLeft: 5,
    });
  });

  it('closes once the week is up and nothing was bought', () => {
    expect(gameAccess({ ...base, newestPurchaseAt: ago(8) })).toEqual({
      allowed: false,
      reason: 'locked',
    });
  });

  it('prefers the subscription over an expired trial', () => {
    expect(gameAccess({ ...base, subscriptionLive: true, newestPurchaseAt: ago(90) }).reason).toBe(
      'subscription',
    );
  });
});

describe('newestActivation', () => {
  it('takes the latest activation, which is the trial that runs longest', () => {
    expect(newestActivation([{ activatedAt: ago(30) }, { activatedAt: ago(1) }])).toBe(ago(1));
  });

  it('ignores what was never activated', () => {
    expect(newestActivation([{ activatedAt: null }, { activatedAt: ago(3) }])).toBe(ago(3));
    expect(newestActivation([{ activatedAt: null }])).toBeNull();
    expect(newestActivation([])).toBeNull();
  });
});
