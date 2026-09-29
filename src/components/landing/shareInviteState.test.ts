import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inviteCopy } from '@/lib/share/inviteCopy';
import {
  initialInviteState,
  inviteReducer,
  inviteView,
  NAME_MAX,
  type InviteState,
} from './shareInviteState';

const TUESDAY = new Date('2026-09-29T09:00:00Z');
const copy = inviteCopy('ru');

function hydrated(state: InviteState, mine = { code: null, name: null } as InviteState['mine']) {
  return inviteReducer(state, { type: 'hydrate', now: TUESDAY, origin: 'https://forma.fit', mine });
}

describe('inviteReducer', () => {
  it('starts in the build’s shape: no day, nobody’s code, the build origin', () => {
    const s = initialInviteState('https://site.example');
    const v = inviteView(s, 'ru', copy);
    expect(v.date).toBeNull();
    expect(v.personal).toBe(false);
    expect(v.url).toBe('https://site.example/together/');
  });

  it('hydrates with today, the real origin and the cached name', () => {
    const s = hydrated(initialInviteState('https://site.example'), {
      code: 'abcd1234',
      name: 'Маша',
    });
    expect(s.name).toBe('Маша');
    const v = inviteView(s, 'ru', copy);
    expect(v.personal).toBe(true);
    expect(v.url).toContain('https://forma.fit/together/?d=2026-10-05&ref=abcd1234');
  });

  it('never overwrites a name the person already typed', () => {
    let s = inviteReducer(initialInviteState('https://x'), { type: 'name', value: 'Оля' });
    s = hydrated(s, { code: null, name: 'Маша' });
    expect(s.name).toBe('Оля');
  });

  it('caps the name field at the limit and flags a name it will drop', () => {
    let s = hydrated(initialInviteState('https://x'));
    s = inviteReducer(s, { type: 'name', value: 'x'.repeat(40) });
    expect(s.name).toHaveLength(NAME_MAX);
    s = inviteReducer(s, { type: 'name', value: 'Маша 2' });
    const v = inviteView(s, 'ru', copy);
    expect(v.nameRejected).toBe(true);
    expect(v.from).toBeNull();
    expect(inviteView(inviteReducer(s, { type: 'name', value: '' }), 'ru', copy).nameRejected).toBe(
      false,
    );
  });

  it('toggles the copied label and the calendar disclosure', () => {
    let s = initialInviteState('https://x');
    s = inviteReducer(s, { type: 'copied' });
    expect(s.copied).toBe('ok');
    s = inviteReducer(s, { type: 'copyReset' });
    expect(s.copied).toBe('idle');
    s = inviteReducer(s, { type: 'copyFailed' });
    expect(s.copied).toBe('failed');
    s = inviteReducer(s, { type: 'calendar' });
    expect(s.calendarOpen).toBe(true);
    s = inviteReducer(s, { type: 'calendar', open: false });
    expect(s.calendarOpen).toBe(false);
  });
});

describe('ShareInvite island', () => {
  const src = readFileSync(fileURLToPath(new URL('./ShareInvite.tsx', import.meta.url)), 'utf8');

  it('stays free of the app, the API and the dictionaries', () => {
    expect(src).not.toMatch(/from ['"]@\/(app|lib\/api|i18n)|@supabase/);
  });

  it('calls the share sheet inside the tap, with nothing awaited before it', () => {
    const send = src.slice(src.indexOf('function onSend'), src.indexOf('function onCopy'));
    expect(send).toContain('navigator.share(');
    expect(send).not.toMatch(/\bawait\b/);
  });

  it('never renders text as HTML', () => {
    expect(src).not.toContain('dangerouslySetInnerHTML');
  });
});
