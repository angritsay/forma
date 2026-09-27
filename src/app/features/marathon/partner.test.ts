import { describe, expect, it } from 'vitest';
import type { MarathonSubmissionRow } from '@/lib/api/types';
import { partnerState } from './partner';

const proof = (voided = false): MarathonSubmissionRow => ({
  id: 'p',
  taskId: 't',
  memberId: 'me',
  marathonId: 'm',
  dayIndex: 1,
  valueText: null,
  valueNum: null,
  mediaPath: null,
  submittedAt: '2026-09-27T10:00:00Z',
  voidedAt: voided ? '2026-09-27T11:00:00Z' : null,
  voidReason: voided ? 'no' : null,
  attempt: 1,
  resubmittedAt: null,
  reviewedAt: null,
});

describe('partnerState', () => {
  it('says nothing for a solo entry', () => {
    expect(partnerState({ mine: null, teammatesDone: [], entrySize: 1 })).toBeNull();
    expect(partnerState({ mine: proof(), teammatesDone: ['x'], entrySize: 1 })).toBeNull();
  });

  it('tells me it is my turn when the partner is done and I am not', () => {
    expect(partnerState({ mine: null, teammatesDone: ['mate'], entrySize: 2 })).toBe(
      'partner-done',
    );
    // A struck-out proof of mine is not done.
    expect(partnerState({ mine: proof(true), teammatesDone: ['mate'], entrySize: 2 })).toBe(
      'partner-done',
    );
  });

  it('waits for the partner whether or not I am done', () => {
    expect(partnerState({ mine: null, teammatesDone: [], entrySize: 2 })).toBe('partner-waiting');
    expect(partnerState({ mine: proof(), teammatesDone: [], entrySize: 2 })).toBe(
      'partner-waiting',
    );
  });

  it('celebrates when both are in', () => {
    expect(partnerState({ mine: proof(), teammatesDone: ['mate'], entrySize: 2 })).toBe('both');
  });
});
