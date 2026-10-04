import { describe, expect, it } from 'vitest';
import { MAX_RAW_OFFSET_SECONDS } from '@/lib/api/mediaStudio';
import { END_PAD_SECONDS, planCut } from './cutPlan';

describe('planCut', () => {
  it('starts on the keyframe and records how far the mark is into the piece', () => {
    const r = planCut({ startS: 12.4, endS: 30, keyframeS: 10.01, durationS: 100 });
    expect(r).toEqual({
      plan: { cutStartS: 10.01, cutEndS: 30 + END_PAD_SECONDS, rawOffsetS: 2.39 },
    });
  });

  it('has no offset when the mark is on a keyframe', () => {
    const r = planCut({ startS: 8, endS: 20, keyframeS: 8, durationS: null });
    expect(r).toEqual({ plan: { cutStartS: 8, cutEndS: 20.5, rawOffsetS: 0 } });
  });

  it('treats a keyframe a hair after the mark as the mark', () => {
    const r = planCut({ startS: 8, endS: 20, keyframeS: 8.0004, durationS: null });
    expect(r).toEqual({ plan: { cutStartS: 8, cutEndS: 20.5, rawOffsetS: 0 } });
  });

  it('never pads past the end of the video', () => {
    const r = planCut({ startS: 90, endS: 99.9, keyframeS: 89, durationS: 100 });
    expect('plan' in r && r.plan.cutEndS).toBe(100);
  });

  it('refuses a file without a keyframe before the start', () => {
    expect(planCut({ startS: 1, endS: 5, keyframeS: null, durationS: 10 })).toEqual({
      problem: 'no_keyframe',
    });
  });

  it('refuses a keyframe further back than the server accepts', () => {
    const r = planCut({
      startS: MAX_RAW_OFFSET_SECONDS + 5,
      endS: MAX_RAW_OFFSET_SECONDS + 20,
      keyframeS: 1,
      durationS: null,
    });
    expect(r).toEqual({ problem: 'keyframe_too_far' });
  });

  it('allows exactly the longest offset', () => {
    const r = planCut({
      startS: MAX_RAW_OFFSET_SECONDS,
      endS: MAX_RAW_OFFSET_SECONDS + 5,
      keyframeS: 0,
      durationS: null,
    });
    expect('plan' in r && r.plan.rawOffsetS).toBe(MAX_RAW_OFFSET_SECONDS);
  });
});
