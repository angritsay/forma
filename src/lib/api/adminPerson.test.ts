import { describe, expect, it } from 'vitest';
import { adminPersonFromDb } from './adminPerson';

/** A payload as `admin_person()` returns it (0046), numbers partly as strings like PostgREST. */
const payload = {
  email: 'nastia@example.com',
  profile: {
    display_name: 'Настя',
    locale: 'en',
    created_at: '2026-09-01T10:00:00+00:00',
    onboarded_at: '2026-09-01T10:05:00+00:00',
    fitness_level: 2,
    fitness_index: 40,
    telegram_linked: true,
  },
  purchases: [
    {
      id: 'p1',
      course_id: 'start',
      status: 'active',
      source: 'admin',
      note: null,
      created_at: '2026-09-02T10:00:00+00:00',
      activated_at: '2026-09-02T10:00:00+00:00',
    },
  ],
  subscription: {
    id: 's1',
    plan: 'annual',
    status: 'cancelled',
    started_at: '2026-09-01T00:00:00+00:00',
    expires_at: '2027-09-01T00:00:00+00:00',
    source: 'prodamus',
    note: null,
    live: true,
  },
  club_access: true,
  memberships: [
    {
      member_id: 'm1',
      marathon_id: 'k1',
      marathon_title: 'Клуб',
      is_club: true,
      solo: false,
      status: 'active',
      joined_at: '2026-09-03T00:00:00+00:00',
      team_name: 'Пара 3',
      partners: [{ email: 'olya@example.com', display_name: 'Оля' }, 'garbage'],
    },
  ],
  proofs: [
    {
      id: 'x1',
      marathon_title: 'Клуб',
      is_club: true,
      day_index: '4',
      task_title: 'Планка',
      submitted_at: '2026-09-05T08:00:00+00:00',
      voided_at: null,
      void_reason: null,
      attempt: 2,
      reviewed_at: null,
    },
  ],
  assigned: [
    {
      workout_id: 'w1',
      short_id: 'back_home',
      title: 'Спина дома',
      title_en: null,
      note: 'после травмы',
      assigned_at: '2026-09-04T00:00:00+00:00',
      done: true,
    },
  ],
  activity: {
    sessions: '7',
    started: 9,
    days: 5,
    points: '1200',
    last_completed_at: '2026-09-20T18:00:00+00:00',
  },
  sessions: [
    {
      id: 's1',
      course_id: 'custom',
      node_id: 'back_home',
      workout_id: 'back_home',
      custom_title: 'Спина дома',
      points: 0,
      feeling: 'ok',
      started_at: '2026-09-20T17:30:00+00:00',
      completed_at: null,
    },
  ],
  support: [
    { id: 'r1', channel: 'telegram', accepted: false, created_at: '2026-09-10T00:00:00+00:00' },
    { id: 'r2', channel: 'app', created_at: '2026-09-09T00:00:00+00:00', status: 'answered' },
  ],
  payment_emails: ['nastia.pay@example.com', 42],
  payments: [
    {
      id: 'pay1',
      email: 'nastia.pay@example.com',
      amount: '2990.00',
      currency: 'RUB',
      intent: 'course',
      provider: 'lava',
      provider_ref: 'ord-1',
      paid_at: '2026-09-02T09:59:00+00:00',
      applied: true,
      claimed_at: null,
    },
  ],
  can_end_subscription: true,
};

describe('adminPersonFromDb', () => {
  it('maps a full payload', () => {
    const p = adminPersonFromDb(payload);
    expect(p.email).toBe('nastia@example.com');
    expect(p.profile).toEqual({
      displayName: 'Настя',
      locale: 'en',
      createdAt: '2026-09-01T10:00:00+00:00',
      onboardedAt: '2026-09-01T10:05:00+00:00',
      fitnessLevel: 2,
      telegramLinked: true,
    });
    expect(p.purchases[0]).toMatchObject({ id: 'p1', courseId: 'start', status: 'active' });
    expect(p.subscription).toMatchObject({ plan: 'annual', status: 'cancelled', live: true });
    expect(p.clubAccess).toBe(true);
    expect(p.memberships[0]).toMatchObject({ isClub: true, solo: false, teamName: 'Пара 3' });
    // Non-objects inside a list are dropped rather than rendered as empty rows.
    expect(p.memberships[0]?.partners).toEqual([{ email: 'olya@example.com', displayName: 'Оля' }]);
    expect(p.proofs[0]).toMatchObject({ dayIndex: 4, attempt: 2, reviewedAt: null });
    expect(p.assigned[0]).toMatchObject({ shortId: 'back_home', done: true, titleEn: null });
    expect(p.activity).toEqual({
      sessions: 7,
      started: 9,
      days: 5,
      points: 1200,
      lastCompletedAt: '2026-09-20T18:00:00+00:00',
    });
    expect(p.sessions[0]).toMatchObject({ customTitle: 'Спина дома', completedAt: null });
    expect(p.support).toEqual([
      {
        id: 'r1',
        channel: 'telegram',
        accepted: false,
        createdAt: '2026-09-10T00:00:00+00:00',
        status: null,
      },
      {
        id: 'r2',
        channel: 'app',
        accepted: true,
        createdAt: '2026-09-09T00:00:00+00:00',
        status: 'answered',
      },
    ]);
    expect(p.paymentEmails).toEqual(['nastia.pay@example.com']);
    expect(p.payments[0]).toMatchObject({ amount: 2990, currency: 'RUB', provider: 'lava' });
    expect(p.canEndSubscription).toBe(true);
  });

  it('an address nobody signed in with: no profile, empty lists, zero activity', () => {
    const p = adminPersonFromDb({
      email: 'presale@example.com',
      profile: null,
      purchases: [],
      subscription: null,
      activity: { sessions: 0, started: 0, days: 0, points: 0, last_completed_at: null },
    });
    expect(p.profile).toBeNull();
    expect(p.subscription).toBeNull();
    expect(p.memberships).toEqual([]);
    expect(p.support).toEqual([]);
    expect(p.activity.lastCompletedAt).toBeNull();
    expect(p.canEndSubscription).toBe(false);
  });

  it('tolerates a missing or malformed payload', () => {
    for (const raw of [null, undefined, 'x', 42, [], { purchases: 'no', activity: null }]) {
      const p = adminPersonFromDb(raw);
      expect(p.purchases).toEqual([]);
      expect(p.activity.sessions).toBe(0);
      expect(p.profile).toBeNull();
    }
  });

  it('clamps unknown enum values to a safe default', () => {
    const p = adminPersonFromDb({
      purchases: [{ id: 'p', status: 'weird' }],
      subscription: { plan: 'weekly', status: '??' },
      memberships: [{ status: 'banned' }],
      proofs: [{ attempt: 0 }],
    });
    expect(p.purchases[0]?.status).toBe('pending');
    expect(p.subscription).toMatchObject({ plan: 'monthly', status: 'pending', live: false });
    expect(p.memberships[0]?.status).toBe('active');
    expect(p.proofs[0]?.attempt).toBe(1);
  });
});
