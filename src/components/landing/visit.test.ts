import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  REFERRAL_KEY as APP_REFERRAL_KEY,
  pendingReferral as appPendingReferral,
  stashReferral as appStashReferral,
} from '@/app/features/marathon/duoInvite';
import { parseEntryParams, SRC_KEY as APP_SRC_KEY } from '@/app/features/entry/params';
import { MY_REF_KEY } from '@/lib/referral/mine';
import {
  REFERRAL_KEY,
  SRC_KEY,
  acceptReferral,
  activeReferral,
  clubJoinWithRef,
  pendingReferral,
  reachGoal,
  referralIsThisLink,
  rememberSource,
  rememberedSource,
  slugSource,
  stashReferral,
  visitSource,
  withRef,
} from './visit';

function memory(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

describe('site and app share their storage keys', () => {
  it('uses the app keys verbatim', () => {
    expect(SRC_KEY).toBe(APP_SRC_KEY);
    expect(REFERRAL_KEY).toBe(APP_REFERRAL_KEY);
  });

  it('only writes labels the app would accept as ?src=', () => {
    for (const s of [
      visitSource('?utm_source=Instagram&utm_campaign=Spring Sale!', '/'),
      visitSource('', '/en/courses/forma-s-nulya/'),
      visitSource('?utm_source=' + 'x'.repeat(80), '/'),
    ]) {
      expect(parseEntryParams(`?src=${s}`).src).toBe(s);
    }
  });
});

describe('the referral rule matches the app', () => {
  const codes = [
    'abcd1234',
    'zzzz9999',
    'ABCD1234',
    'abcd123',
    'abcd12345',
    'abcd-123',
    '',
    undefined,
  ];

  it('stashes exactly what the app would, first code wins', () => {
    for (const first of codes) {
      for (const second of codes) {
        const site = memory();
        const app = memory();
        expect(stashReferral(first, site)).toBe(appStashReferral(first, app));
        expect(stashReferral(second, site)).toBe(appStashReferral(second, app));
        expect(pendingReferral(site)).toBe(appPendingReferral(app));
      }
    }
  });

  it('is one copy, not two', () => {
    expect(stashReferral).toBe(appStashReferral);
    expect(pendingReferral).toBe(appPendingReferral);
  });

  it('keeps the app out of the site bundle', () => {
    for (const file of ['./visit.ts', './StartForm.tsx']) {
      const src = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
      expect(src, file).not.toMatch(/from ['"]@\/app\//);
    }
    // The shared rule itself imports nothing: whatever it pulled in, every page would load.
    const pending = readFileSync(
      fileURLToPath(new URL('../../lib/referral/pending.ts', import.meta.url)),
      'utf8',
    );
    expect(pending).not.toMatch(/^import /m);
  });
});

describe('visitSource', () => {
  it('prefers the campaign', () => {
    expect(visitSource('?utm_source=Telegram&utm_campaign=start_1', '/')).toBe('telegram-start_1');
    expect(visitSource('?utm_source=vk', '/about/')).toBe('vk');
  });

  it('then a ?src= of our own', () => {
    expect(visitSource('?src=qr', '/')).toBe('qr');
  });

  it('then the landing page', () => {
    expect(visitSource('', '/')).toBe('site');
    expect(visitSource('', '/courses/forma-s-nulya/')).toBe('site-courses-forma-s-nulya');
    expect(visitSource('', '/en/')).toBe('site-en');
  });

  it('never exceeds 40 characters or ends on a dash', () => {
    const s = slugSource('a'.repeat(39) + '--b');
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('rememberSource', () => {
  it('keeps the first touch', () => {
    const store = memory();
    expect(rememberSource('qr', store)).toBe(true);
    expect(rememberSource('site', store)).toBe(false);
    expect(rememberedSource(store)).toBe('qr');
  });

  it('ignores a value that is not ours', () => {
    const store = memory();
    store.setItem(SRC_KEY, 'Hello world');
    expect(rememberedSource(store)).toBeNull();
  });
});

describe('withRef', () => {
  it('puts the code before the hash and keeps the query', () => {
    expect(withRef('/app/?lang=ru#/start', 'abcd1234')).toBe('/app/?lang=ru&ref=abcd1234#/start');
    expect(withRef('/app/#/book?len=hour', 'abcd1234')).toBe('/app/?ref=abcd1234#/book?len=hour');
    expect(withRef('/app/', 'abcd1234')).toBe('/app/?ref=abcd1234');
  });

  it('replaces a code already there', () => {
    expect(withRef('/app/?ref=zzzz9999&lang=en', 'abcd1234')).toBe('/app/?ref=abcd1234&lang=en');
  });
});

describe('clubJoinWithRef', () => {
  it('goes through the app club screen in the page language', () => {
    expect(clubJoinWithRef('/subscribe/', 'abcd1234')).toMatch(
      /\/app\/\?lang=ru&ref=abcd1234#\/marathon$/,
    );
    expect(clubJoinWithRef('/en/', 'abcd1234')).toMatch(
      /\/app\/\?lang=en&ref=abcd1234#\/marathon$/,
    );
  });
});

describe('reachGoal', () => {
  it('reports only to counters that are loaded', () => {
    const ym = vi.fn();
    const gtag = vi.fn();
    reachGoal('app_start', 12345, { ym, gtag });
    expect(ym).toHaveBeenCalledWith(12345, 'reachGoal', 'app_start');
    expect(gtag).toHaveBeenCalledWith('event', 'app_start');
    expect(() => reachGoal('app_start', 12345, {})).not.toThrow();
  });

  it('skips Metrika without an id', () => {
    const ym = vi.fn();
    reachGoal('app_start', null, { ym });
    expect(ym).not.toHaveBeenCalled();
  });
});

describe('a referral from the address bar', () => {
  it('stashes a friend’s code, first code wins', () => {
    const store = memory();
    expect(acceptReferral('abcd1234', store)).toBe('stashed');
    expect(acceptReferral('zzzz9999', store)).toBe('kept');
    expect(pendingReferral(store)).toBe('abcd1234');
    expect(acceptReferral('<script>', store)).toBe('none');
    expect(acceptReferral(null, store)).toBe('none');
  });

  it('never stashes the visitor’s own code', () => {
    const store = memory();
    store.setItem(MY_REF_KEY, 'abcd1234');
    expect(acceptReferral('abcd1234', store)).toBe('own');
    expect(pendingReferral(store)).toBeNull();
  });

  it('ignores an own code stashed before the app cached it', () => {
    const store = memory();
    store.setItem(REFERRAL_KEY, 'abcd1234');
    expect(activeReferral(store)).toBe('abcd1234');
    store.setItem(MY_REF_KEY, 'abcd1234');
    expect(activeReferral(store)).toBeNull();
  });

  it('promises the +30 only for the link whose code is the one waiting', () => {
    const store = memory();
    // Аня's link first: her code waits.
    expect(acceptReferral('aaaa1111', store)).toBe('stashed');
    expect(referralIsThisLink('aaaa1111', store)).toBe(true);
    // Маша's link later: kept, and her page must not promise the reward.
    expect(acceptReferral('bbbb2222', store)).toBe('kept');
    expect(referralIsThisLink('bbbb2222', store)).toBe(false);
    // A plain link with an old code waiting promises nothing either.
    expect(referralIsThisLink(null, store)).toBe(false);
    // Nor does the visitor's own code.
    store.setItem(MY_REF_KEY, 'aaaa1111');
    expect(referralIsThisLink('aaaa1111', store)).toBe(false);
  });
});
