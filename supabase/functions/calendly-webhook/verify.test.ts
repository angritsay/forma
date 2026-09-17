import { describe, expect, it } from 'vitest';
import {
  parseSignature,
  readChange,
  readLocation,
  signPayload,
  signatureMatches,
  TOLERANCE_MS,
  verifySignature,
} from './verify';

const KEY = 'signing-key-from-the-subscription';

/**
 * The envelope Calendly posts, with only the fields this function reads spelled out.
 * `overrides.payload` is merged into the invitee; anything else replaces an envelope field.
 */
function created(overrides: Record<string, unknown> = {}): unknown {
  const { payload: payloadOverrides, ...envelopeOverrides } = overrides;
  return {
    event: 'invitee.created',
    created_at: '2026-03-10T10:00:00.000000Z',
    payload: {
      uri: 'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
      email: 'Lena@Example.com',
      name: 'Лена',
      status: 'active',
      timezone: 'Europe/Moscow',
      rescheduled: false,
      old_invitee: null,
      new_invitee: null,
      cancel_url: 'https://calendly.com/cancellations/IN1',
      reschedule_url: 'https://calendly.com/reschedulings/IN1',
      scheduled_event: {
        uri: 'https://api.calendly.com/scheduled_events/EV1',
        name: 'Тренировка 60 минут',
        status: 'active',
        start_time: '2026-03-11T06:00:00.000000Z',
        end_time: '2026-03-11T07:00:00.000000Z',
        location: {
          type: 'zoom_conference',
          status: 'pushed',
          join_url: 'https://example.com/j/1234567890',
          data: { id: '1234567890', password: 'secret' },
        },
      },
      ...(payloadOverrides as Record<string, unknown> | undefined),
    },
    ...envelopeOverrides,
  };
}

describe('parseSignature', () => {
  it('reads the t/v1 pair Calendly sends', () => {
    const v1 = 'a'.repeat(64);
    expect(parseSignature(`t=1773135600,v1=${v1}`)).toEqual({ t: '1773135600', v1 });
  });

  it('tolerates spacing and extra members it does not know', () => {
    const v1 = 'b'.repeat(64);
    expect(parseSignature(` t=1773135600 , v0=zz, v1=${v1} `)).toEqual({ t: '1773135600', v1 });
  });

  it('refuses anything that is not a timestamp and a 64-hex digest', () => {
    expect(parseSignature(null)).toBeNull();
    expect(parseSignature('')).toBeNull();
    expect(parseSignature('v1=' + 'a'.repeat(64))).toBeNull();
    expect(parseSignature('t=1773135600')).toBeNull();
    expect(parseSignature('t=later,v1=' + 'a'.repeat(64))).toBeNull();
    expect(parseSignature('t=1773135600,v1=' + 'a'.repeat(63))).toBeNull();
    expect(parseSignature('t=1773135600,v1=' + 'z'.repeat(64))).toBeNull();
  });
});

describe('signPayload', () => {
  it('signs `${t}.${rawBody}` — the timestamp is inside the digest', async () => {
    const body = '{"event":"invitee.created"}';
    const a = await signPayload('1773135600', body, KEY);
    const b = await signPayload('1773135601', body, KEY);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('depends on the exact bytes of the body, not on its meaning', async () => {
    const t = '1773135600';
    const compact = await signPayload(t, '{"a":1,"b":2}', KEY);
    const spaced = await signPayload(t, '{"a": 1, "b": 2}', KEY);
    expect(compact).not.toBe(spaced);
  });

  it('depends on the key', async () => {
    const t = '1773135600';
    expect(await signPayload(t, '{}', KEY)).not.toBe(await signPayload(t, '{}', KEY + '!'));
  });
});

describe('signatureMatches', () => {
  it('compares digests without leaking on length or content', async () => {
    const sig = await signPayload('1773135600', '{}', KEY);
    expect(signatureMatches(sig, sig)).toBe(true);
    expect(signatureMatches(sig, null)).toBe(false);
    expect(signatureMatches(sig, sig.slice(0, -1))).toBe(false);
    expect(signatureMatches(sig, sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0'))).toBe(false);
  });
});

describe('verifySignature', () => {
  const body = JSON.stringify(created());
  const now = 1773135600000;
  const t = String(now / 1000);

  async function header(overrides: { t?: string; body?: string; key?: string } = {}) {
    const ts = overrides.t ?? t;
    return `t=${ts},v1=${await signPayload(ts, overrides.body ?? body, overrides.key ?? KEY)}`;
  }

  it('accepts a delivery signed with the subscription key', async () => {
    expect(await verifySignature(body, await header(), KEY, now)).toEqual({ ok: true });
  });

  it('accepts an upper-case digest', async () => {
    const signed = (await header()).toUpperCase().replace('T=', 't=').replace('V1=', 'v1=');
    expect(await verifySignature(body, signed, KEY, now)).toEqual({ ok: true });
  });

  it('refuses a delivery with no signature at all', async () => {
    expect(await verifySignature(body, null, KEY, now)).toEqual({
      ok: false,
      reason: 'no_signature',
    });
  });

  it('refuses a body that was changed after signing', async () => {
    const signed = await header();
    const tampered = body.replace('Lena@Example.com', 'attacker@example.com');
    expect(await verifySignature(tampered, signed, KEY, now)).toEqual({
      ok: false,
      reason: 'mismatch',
    });
  });

  it('refuses a signature made with another key', async () => {
    expect(await verifySignature(body, await header({ key: 'guessed' }), KEY, now)).toEqual({
      ok: false,
      reason: 'mismatch',
    });
  });

  it('refuses a replay of a genuine delivery once it is stale', async () => {
    const signed = await header();
    expect(await verifySignature(body, signed, KEY, now + TOLERANCE_MS - 1000)).toEqual({
      ok: true,
    });
    expect(await verifySignature(body, signed, KEY, now + TOLERANCE_MS + 1000)).toEqual({
      ok: false,
      reason: 'stale',
    });
  });

  it('refuses a timestamp too far in the future as well', async () => {
    const future = String(now / 1000 + 600);
    expect(await verifySignature(body, await header({ t: future }), KEY, now)).toEqual({
      ok: false,
      reason: 'stale',
    });
  });
});

describe('readLocation', () => {
  it('finds the join link on a conferencing location', () => {
    expect(
      readLocation({ type: 'google_conference', status: 'pushed', join_url: 'https://meet.g/abc' }),
    ).toEqual({ kind: 'google_conference', joinUrl: 'https://meet.g/abc', text: null });
  });

  it('reads a physical location as text, with no join link', () => {
    expect(readLocation({ type: 'physical', location: 'Зал на Тверской, 3' })).toEqual({
      kind: 'physical',
      joinUrl: null,
      text: 'Зал на Тверской, 3',
    });
  });

  it('reads a phone location as text too', () => {
    expect(readLocation({ type: 'outbound_call', location: '+7 900 000-00-00' })).toEqual({
      kind: 'outbound_call',
      joinUrl: null,
      text: '+7 900 000-00-00',
    });
  });

  it('drops a join link that is not https — no javascript: reaching an anchor', () => {
    expect(readLocation({ type: 'custom', join_url: 'javascript:alert(1)' }).joinUrl).toBeNull();
    expect(readLocation({ type: 'custom', join_url: 'http://example.com/j/1' }).joinUrl).toBeNull();
  });

  it('survives a location that is missing or the wrong shape', () => {
    expect(readLocation(undefined)).toEqual({ kind: null, joinUrl: null, text: null });
    expect(readLocation('somewhere')).toEqual({ kind: null, joinUrl: null, text: null });
  });
});

describe('readChange — a booking', () => {
  it('reads the fields the screen needs, with the email normalised', () => {
    expect(readChange(created())).toEqual({
      kind: 'upsert',
      email: 'lena@example.com',
      inviteeUri: 'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
      eventUri: 'https://api.calendly.com/scheduled_events/EV1',
      startsAt: '2026-03-11T06:00:00.000Z',
      endsAt: '2026-03-11T07:00:00.000Z',
      timezone: 'Europe/Moscow',
      joinUrl: 'https://example.com/j/1234567890',
      locationKind: 'zoom_conference',
      locationText: null,
      cancelUrl: 'https://calendly.com/cancellations/IN1',
      rescheduleUrl: 'https://calendly.com/reschedulings/IN1',
      eventName: 'Тренировка 60 минут',
      previousInviteeUri: null,
    });
  });

  it('carries the invitee it replaces, so a reschedule moves one row', () => {
    const change = readChange(
      created({
        payload: { old_invitee: 'https://api.calendly.com/scheduled_events/EV0/invitees/IN0' },
      }),
    );
    expect(change).toMatchObject({
      kind: 'upsert',
      previousInviteeUri: 'https://api.calendly.com/scheduled_events/EV0/invitees/IN0',
    });
  });

  it('refuses a payload with no scheduled_event rather than inventing a time', () => {
    const bare = created({ payload: { scheduled_event: undefined } }) as {
      payload: Record<string, unknown>;
    };
    delete bare.payload.scheduled_event;
    bare.payload.event = 'https://api.calendly.com/scheduled_events/EV1';
    expect(readChange(bare)).toEqual({
      kind: 'ignore',
      why: 'no scheduled_event object in the payload',
    });
  });

  it('refuses times that are missing, unreadable or backwards', () => {
    const noStart = created() as { payload: { scheduled_event: Record<string, unknown> } };
    delete noStart.payload.scheduled_event.start_time;
    expect(readChange(noStart)).toMatchObject({ kind: 'ignore' });

    const backwards = created() as { payload: { scheduled_event: Record<string, unknown> } };
    backwards.payload.scheduled_event.end_time = '2026-03-11T05:00:00.000000Z';
    expect(readChange(backwards)).toMatchObject({ kind: 'ignore' });
  });

  it('refuses a booking with no email — there is nobody to show it to', () => {
    const anon = created() as { payload: Record<string, unknown> };
    anon.payload.email = '';
    expect(readChange(anon)).toEqual({ kind: 'ignore', why: 'no usable invitee email' });
  });

  it('drops a timezone that is not a plausible zone name', () => {
    const odd = created({ payload: { timezone: "'; drop table coach_bookings--" } });
    expect(readChange(odd)).toMatchObject({ timezone: null });
  });

  it('drops cancel and reschedule urls that are not https', () => {
    const odd = created({
      payload: { cancel_url: 'javascript:alert(1)', reschedule_url: 'http://example.com/r' },
    });
    expect(readChange(odd)).toMatchObject({ cancelUrl: null, rescheduleUrl: null });
  });
});

describe('readChange — a cancellation', () => {
  function canceled(payload: Record<string, unknown> = {}): unknown {
    return {
      event: 'invitee.canceled',
      created_at: '2026-03-10T10:00:00.000000Z',
      payload: {
        uri: 'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
        email: 'lena@example.com',
        status: 'canceled',
        rescheduled: false,
        cancellation: { canceled_by: 'Лена', reason: 'заболела', canceler_type: 'invitee' },
        ...payload,
      },
    };
  }

  it('marks the booking cancelled and keeps the reason', () => {
    expect(readChange(canceled())).toEqual({
      kind: 'cancel',
      inviteeUri: 'https://api.calendly.com/scheduled_events/EV1/invitees/IN1',
      reason: 'заболела',
    });
  });

  it('works without a reason', () => {
    expect(readChange(canceled({ cancellation: undefined }))).toMatchObject({
      kind: 'cancel',
      reason: null,
    });
  });

  it('refuses the cancellation half of a reschedule — that is a move, not a cancellation', () => {
    expect(readChange(canceled({ rescheduled: true }))).toEqual({
      kind: 'ignore',
      why: 'cancellation is one half of a reschedule',
    });
  });
});

describe('readChange — anything else', () => {
  it('ignores events this function does not handle, without failing the delivery', () => {
    expect(
      readChange({ event: 'routing_form_submission.created', payload: { uri: 'x' } }),
    ).toMatchObject({ kind: 'ignore' });
  });

  it('ignores a body that is not a Calendly envelope at all', () => {
    expect(readChange(null)).toMatchObject({ kind: 'ignore' });
    expect(readChange('{}')).toMatchObject({ kind: 'ignore' });
    expect(readChange([])).toMatchObject({ kind: 'ignore' });
    expect(readChange({ event: 'invitee.created' })).toMatchObject({ kind: 'ignore' });
    expect(readChange({ payload: {} })).toMatchObject({ kind: 'ignore' });
    expect(readChange({ event: 'invitee.created', payload: {} })).toMatchObject({ kind: 'ignore' });
  });

  it('never names the person in the reason it gives the log', () => {
    const anon = created() as { payload: Record<string, unknown> };
    anon.payload.email = '';
    const change = readChange(anon);
    expect(change.kind).toBe('ignore');
    const why = (change as { why: string }).why;
    expect(why).not.toContain('@');
    expect(why).not.toContain('Лена');
  });
});
