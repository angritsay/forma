import { describe, expect, it } from 'vitest';
import { adminPersonFromDb } from '@/lib/api/adminPerson';
import {
  activeClubMemberships,
  canCloseAccess,
  duoPartners,
  formatMoney,
  proofState,
  sessionTitle,
} from './model';

describe('proofState', () => {
  it('reads the four states in the coach order', () => {
    expect(proofState({ voidedAt: 'x', attempt: 2, reviewedAt: 'y' })).toBe('rejected');
    expect(proofState({ voidedAt: null, attempt: 2, reviewedAt: 'y' })).toBe('accepted');
    expect(proofState({ voidedAt: null, attempt: 2, reviewedAt: null })).toBe('waiting');
    expect(proofState({ voidedAt: null, attempt: 1, reviewedAt: null })).toBe('counted');
  });
});

describe('sessionTitle', () => {
  it('names a coach-built workout by its own title', () => {
    const s = sessionTitle(
      { courseId: 'custom', nodeId: 'back', workoutId: 'back', customTitle: 'Спина дома' },
      'ru',
    );
    expect(s.workout).toBe('Спина дома');
  });

  it('falls back to the ids for an unknown course', () => {
    const s = sessionTitle(
      { courseId: 'gone_course', nodeId: 'n1', workoutId: 'w_gone', customTitle: null },
      'ru',
    );
    expect(s).toEqual({ course: 'gone_course', workout: 'w_gone' });
  });
});

describe('formatMoney', () => {
  it('writes a currency when there is one, and a bare number when there is not', () => {
    expect(formatMoney(990, 'RUB', 'ru').replace(/\s/g, ' ')).toBe('990 ₽');
    expect(formatMoney(19, 'USD', 'en')).toBe('$19');
    expect(formatMoney(1990, null, 'ru').replace(/\s/g, ' ')).toBe('1 990');
    expect(formatMoney(null, 'RUB', 'ru')).toBe('—');
  });
});

describe('club helpers', () => {
  const person = adminPersonFromDb({
    memberships: [
      { member_id: 'solo', is_club: true, solo: true, status: 'active', partners: [] },
      {
        member_id: 'duo',
        is_club: true,
        solo: false,
        status: 'active',
        partners: [{ email: 'olya@example.com', display_name: 'Оля' }],
      },
      { member_id: 'round', is_club: false, solo: false, status: 'active', partners: [] },
      { member_id: 'gone', is_club: true, solo: true, status: 'removed', partners: [] },
    ],
    subscription: { live: true },
  });

  it('removes only live club rows, not closed rounds', () => {
    expect(activeClubMemberships(person).map((m) => m.memberId)).toEqual(['solo', 'duo']);
  });

  it('finds the duo partner', () => {
    expect(duoPartners(person)).toEqual([{ email: 'olya@example.com', displayName: 'Оля' }]);
  });

  it('offers closing access only where the server can do it', () => {
    expect(canCloseAccess(person)).toBe(false);
    expect(canCloseAccess({ ...person, canEndSubscription: true })).toBe(true);
    expect(canCloseAccess({ ...person, canEndSubscription: true, subscription: null })).toBe(false);
  });
});
