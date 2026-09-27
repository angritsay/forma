import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import {
  clearDuoInvite,
  clearReferral,
  DUO_INVITE_KEY,
  inviteLink,
  isInviteToken,
  isReferralCode,
  pendingDuoInvite,
  pendingReferral,
  redeemFailure,
  REFERRAL_KEY,
  referralLink,
  shareFailure,
  stashDuoInvite,
  stashReferral,
  stashStartParam,
} from './duoInvite';

function memory(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const TOKEN = 'Ab3_-xYz0123456789abcdEF';

describe('invite token', () => {
  it('accepts the shape club_invite_create issues and nothing else', () => {
    expect(isInviteToken(TOKEN)).toBe(true);
    expect(isInviteToken('short')).toBe(false);
    expect(isInviteToken('has space in it 1234')).toBe(false);
    expect(isInviteToken('x'.repeat(65))).toBe(false);
    expect(isInviteToken(undefined)).toBe(false);
  });

  it('is kept through login and onboarding, then cleared', () => {
    const store = memory();
    expect(pendingDuoInvite(store)).toBeNull();
    expect(stashDuoInvite(TOKEN, store)).toBe(true);
    expect(store.getItem(DUO_INVITE_KEY)).toBe(TOKEN);
    expect(pendingDuoInvite(store)).toBe(TOKEN);
    clearDuoInvite(store);
    expect(pendingDuoInvite(store)).toBeNull();
  });

  it('does not stash a malformed token', () => {
    const store = memory();
    expect(stashDuoInvite('../../etc', store)).toBe(false);
    expect(pendingDuoInvite(store)).toBeNull();
  });

  it('survives storage being unavailable', () => {
    expect(stashDuoInvite(TOKEN, null)).toBe(false);
    expect(pendingDuoInvite(null)).toBeNull();
    expect(() => clearDuoInvite(null)).not.toThrow();
  });
});

describe('redeemFailure', () => {
  it('names each refusal of club_invite_redeem', () => {
    const cases: Record<string, string> = {
      invite_expired: 'app.duoRedeemExpired',
      invite_own: 'app.duoRedeemOwn',
      invite_used: 'app.duoRedeemUsed',
      invite_not_found: 'app.duoRedeemNotFound',
      no_subscription: 'app.duoRedeemNoSubscription',
      no_club: 'app.duoRedeemNoClub',
      inviter_not_in_club: 'app.duoRedeemInviterGone',
    };
    for (const [code, key] of Object.entries(cases)) {
      expect(redeemFailure(new AppError('validation', code))).toEqual({
        message: key,
        retry: false,
      });
    }
  });

  it('offers a retry only for the network', () => {
    expect(redeemFailure(new AppError('network', 'Failed to fetch'))).toEqual({
      message: 'common.errorOffline',
      retry: true,
    });
    expect(redeemFailure(new Error('boom')).message).toBe('app.duoRedeemFailed');
  });
});

describe('invite through the Mini App', () => {
  const WEB = 'https://forma-app.co/app/#/duo/' + TOKEN;

  it('builds a startapp link when the Mini App link is configured', () => {
    expect(inviteLink(TOKEN, WEB, 'https://t.me/forma_training_bot/app')).toBe(
      `https://t.me/forma_training_bot/app?startapp=duo_${TOKEN}`,
    );
    expect(inviteLink(TOKEN, WEB, 'https://t.me/forma_training_bot/app/')).toBe(
      `https://t.me/forma_training_bot/app?startapp=duo_${TOKEN}`,
    );
  });

  it('keeps the web link when nothing (or nonsense) is configured', () => {
    expect(inviteLink(TOKEN, WEB, '')).toBe(WEB);
    expect(inviteLink(TOKEN, WEB, undefined)).toBe(WEB);
    expect(inviteLink(TOKEN, WEB, 'https://t.me/forma_training_bot')).toBe(WEB);
    expect(inviteLink(TOKEN, WEB, 'https://evil.example/x/y')).toBe(WEB);
  });

  it('stashes a duo_ start parameter once per session', () => {
    const store = memory();
    expect(stashStartParam(`duo_${TOKEN}`, store)).toBe(true);
    expect(pendingDuoInvite(store)).toBe(TOKEN);
    clearDuoInvite(store);
    // The webview reloads with the same launch data: an invite already taken is not taken again.
    expect(stashStartParam(`duo_${TOKEN}`, store)).toBe(false);
    expect(pendingDuoInvite(store)).toBeNull();
  });

  it('ignores other start parameters', () => {
    const store = memory();
    const local = memory();
    expect(stashStartParam(null, store, local)).toBe(false);
    expect(stashStartParam('promo_spring', store, local)).toBe(false);
    expect(stashStartParam('duo_short', store, local)).toBe(false);
    expect(pendingDuoInvite(store)).toBeNull();
    expect(pendingReferral(local)).toBeNull();
  });
});

/* «Позови друга» (0051): код едет через `?startapp=ref_<код>` или `#/ref/<код>`. */
describe('referral code', () => {
  const CODE = 'a1b2c3d4';
  const WEB = 'https://forma-app.co/app/#/ref/' + CODE;

  it('accepts the shape referral_codes.code has and nothing else', () => {
    expect(isReferralCode(CODE)).toBe(true);
    expect(isReferralCode('A1B2C3D4')).toBe(false);
    expect(isReferralCode('short')).toBe(false);
    expect(isReferralCode('a1b2c3d4e')).toBe(false);
    expect(isReferralCode(undefined)).toBe(false);
  });

  it('waits in its own long-lived cell until it is attached, then goes', () => {
    const local = memory();
    expect(pendingReferral(local)).toBeNull();
    expect(stashReferral(CODE, local)).toBe(true);
    expect(local.getItem(REFERRAL_KEY)).toBe(CODE);
    expect(pendingReferral(local)).toBe(CODE);
    clearReferral(local);
    expect(pendingReferral(local)).toBeNull();
  });

  /* Первый код побеждает — как первичный ключ на `referrals.referred_email`. */
  it('keeps the first code when a second link is opened', () => {
    const local = memory();
    expect(stashReferral(CODE, local)).toBe(true);
    expect(stashReferral('zzzzzzzz', local)).toBe(false);
    expect(pendingReferral(local)).toBe(CODE);
  });

  it('does not stash a malformed code and survives storage being unavailable', () => {
    const local = memory();
    expect(stashReferral('../../etc', local)).toBe(false);
    expect(pendingReferral(local)).toBeNull();
    expect(stashReferral(CODE, null)).toBe(false);
    expect(pendingReferral(null)).toBeNull();
    expect(() => clearReferral(null)).not.toThrow();
  });

  it('is stashed from a ref_ start parameter, away from the duo cell', () => {
    const store = memory();
    const local = memory();
    expect(stashStartParam(`ref_${CODE}`, store, local)).toBe(true);
    expect(pendingReferral(local)).toBe(CODE);
    expect(pendingDuoInvite(store)).toBeNull();
    // The webview reloads with the same launch data: the same code is simply already there.
    expect(stashStartParam(`ref_${CODE}`, store, local)).toBe(false);
    expect(pendingReferral(local)).toBe(CODE);
    expect(stashStartParam('ref_bad', store, local)).toBe(false);
  });

  it('builds a startapp link when the Mini App link is configured, the web link otherwise', () => {
    expect(referralLink(CODE, WEB, 'https://t.me/forma_training_bot/app')).toBe(
      `https://t.me/forma_training_bot/app?startapp=ref_${CODE}`,
    );
    expect(referralLink(CODE, WEB, 'https://t.me/forma_training_bot/app/')).toBe(
      `https://t.me/forma_training_bot/app?startapp=ref_${CODE}`,
    );
    expect(referralLink(CODE, WEB, '')).toBe(WEB);
    expect(referralLink(CODE, WEB, undefined)).toBe(WEB);
    expect(referralLink(CODE, WEB, 'https://evil.example/x/y')).toBe(WEB);
  });
});

describe('share failures', () => {
  it('stays quiet when the share sheet was closed', () => {
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    expect(shareFailure(abort)).toBeNull();
  });

  it('says why otherwise', () => {
    expect(shareFailure(new AppError('validation', 'no_club_access'))).toBe(
      'app.duoInviteNoAccess',
    );
    expect(shareFailure(new AppError('network', 'Failed to fetch'))).toBe('common.errorOffline');
    expect(shareFailure(new Error('NotAllowedError'))).toBe('common.errorGeneric');
  });
});
