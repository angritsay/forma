import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import {
  clearDuoInvite,
  DUO_INVITE_KEY,
  inviteLink,
  isInviteToken,
  pendingDuoInvite,
  redeemFailure,
  shareFailure,
  stashDuoInvite,
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
    expect(stashStartParam(null, store)).toBe(false);
    expect(stashStartParam('promo_spring', store)).toBe(false);
    expect(stashStartParam('duo_short', store)).toBe(false);
    expect(pendingDuoInvite(store)).toBeNull();
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
