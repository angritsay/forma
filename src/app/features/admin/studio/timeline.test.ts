import { describe, expect, it } from 'vitest';
import { MAX_CLIP_SECONDS } from '@/lib/api/mediaStudio';
import {
  clampTime,
  FALLBACK_FPS,
  formatTimecode,
  isLocked,
  markIn,
  markOut,
  newSegment,
  pendingUploads,
  safeFps,
  segmentAt,
  segmentSeconds,
  spanProblem,
  stepFrame,
  stepSeconds,
  type MarkState,
} from './timeline';

const EMPTY: MarkState = { segments: [], pendingIn: null, selectedId: null };
const ids = (...list: string[]) => {
  let i = 0;
  return () => list[i++]!;
};

describe('playhead', () => {
  it('keeps the time inside the video', () => {
    expect(clampTime(-1, 10)).toBe(0);
    expect(clampTime(NaN, 10)).toBe(0);
    expect(clampTime(12, 10)).toBe(10);
    expect(clampTime(12, null)).toBe(12);
  });

  it('trusts only believable frame rates', () => {
    expect(safeFps(29.97)).toBe(29.97);
    expect(safeFps(0)).toBe(FALLBACK_FPS);
    expect(safeFps(1000)).toBe(FALLBACK_FPS);
    expect(safeFps(undefined)).toBe(FALLBACK_FPS);
  });

  it('steps one frame to the middle of the next frame', () => {
    // 30 fps: frame 30 spans 1.000–1.033; a step forward lands in frame 31.
    expect(stepFrame(1, 30, 1, 10)).toBeCloseTo(31.5 / 30, 3);
    expect(stepFrame(1, 30, -1, 10)).toBeCloseTo(29.5 / 30, 3);
    // Repeated steps never stall on a frame.
    let t = 0;
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      t = stepFrame(t, 25, 1, 10);
      seen.add(Math.floor(t * 25));
    }
    expect(seen.size).toBe(20);
  });

  it('does not step past either end', () => {
    expect(stepFrame(0, 30, -1, 10)).toBe(0);
    expect(stepFrame(10, 30, 1, 10)).toBe(10);
    expect(stepSeconds(0.4, -1, 10)).toBe(0);
    expect(stepSeconds(9.5, 1, 10)).toBe(10);
    expect(stepSeconds(2, 1, 10)).toBe(3);
  });

  it('formats a timecode with tenths', () => {
    expect(formatTimecode(0)).toBe('0:00.0');
    expect(formatTimecode(65.27)).toBe('1:05.2');
    expect(formatTimecode(3725.9)).toBe('1:02:05.9');
    expect(formatTimecode(-3)).toBe('0:00.0');
  });
});

describe('spans', () => {
  it('names what is wrong with a span', () => {
    expect(spanProblem(5, 4)).toBe('reversed');
    expect(spanProblem(5, 5)).toBe('reversed');
    expect(spanProblem(5, 5.2)).toBe('too_short');
    expect(spanProblem(0, MAX_CLIP_SECONDS + 1)).toBe('too_long');
    expect(spanProblem(5, 25)).toBeNull();
  });

  it('rounds a segment length to tenths', () => {
    expect(segmentSeconds({ startS: 1.04, endS: 13.27 })).toBe(12.2);
  });
});

describe('marks', () => {
  it('turns a start and an end into a selected segment', () => {
    const a = markIn(EMPTY, 10.1234);
    expect(a.problem).toBeNull();
    expect(a.state.pendingIn).toBe(10.123);
    const b = markOut(a.state, 20, ids('s1'));
    expect(b.problem).toBeNull();
    expect(b.state.pendingIn).toBeNull();
    expect(b.state.selectedId).toBe('s1');
    expect(b.state.segments).toHaveLength(1);
    expect(b.state.segments[0]).toMatchObject({ id: 's1', startS: 10.123, endS: 20 });
  });

  it('asks for a start before an end', () => {
    expect(markOut(EMPTY, 5, ids('x')).problem).toBe('no_in');
  });

  it('refuses an end before the pending start', () => {
    const a = markIn(EMPTY, 10).state;
    const b = markOut(a, 9, ids('x'));
    expect(b.problem).toBe('reversed');
    expect(b.state).toBe(a);
  });

  it('moves the edges of the selected segment', () => {
    const s = markOut(markIn(EMPTY, 10).state, 20, ids('s1')).state;
    const moved = markIn(s, 12).state;
    expect(moved.segments[0]).toMatchObject({ startS: 12, endS: 20 });
    const ended = markOut(moved, 25, ids('never')).state;
    expect(ended.segments[0]).toMatchObject({ startS: 12, endS: 25 });
    expect(ended.segments).toHaveLength(1);
  });

  it('refuses to move an edge past the other one', () => {
    const s = markOut(markIn(EMPTY, 10).state, 20, ids('s1')).state;
    expect(markIn(s, 21).problem).toBe('reversed');
    expect(markOut(s, 10.2, ids('x')).problem).toBe('too_short');
  });

  it('keeps an uploaded segment fixed', () => {
    const s = markOut(markIn(EMPTY, 10).state, 20, ids('s1')).state;
    const done: MarkState = {
      ...s,
      segments: s.segments.map((x) => ({ ...x, upload: 'done' as const })),
    };
    expect(markIn(done, 12).problem).toBe('locked');
    expect(markOut(done, 22, ids('x')).problem).toBe('locked');
  });

  it('a moved edge resets a failed upload', () => {
    const s = markOut(markIn(EMPTY, 10).state, 20, ids('s1')).state;
    const failed: MarkState = {
      ...s,
      segments: s.segments.map((x) => ({ ...x, upload: 'error' as const, error: 'offline' })),
    };
    const moved = markIn(failed, 11).state.segments[0]!;
    expect(moved.upload).toBe('idle');
    expect(moved.error).toBeNull();
  });

  it('keeps segments in filming order', () => {
    let st = markOut(markIn(EMPTY, 50).state, 60, ids('late')).state;
    st = { ...st, selectedId: null };
    st = markOut(markIn(st, 5).state, 15, ids('early')).state;
    expect(st.segments.map((s) => s.id)).toEqual(['early', 'late']);
  });
});

describe('lists', () => {
  const a = { ...newSegment('a', 0, 10), upload: 'done' as const };
  const b = newSegment('b', 20, 30);
  const c = { ...newSegment('c', 12, 18), upload: 'error' as const };

  it('finds the segment under the playhead', () => {
    expect(segmentAt([a, b], 5)?.id).toBe('a');
    expect(segmentAt([a, b], 10)).toBeNull();
    expect(segmentAt([a, b], 25)?.id).toBe('b');
  });

  it('uploads what is not done yet, in order', () => {
    expect(pendingUploads([b, a, c]).map((s) => s.id)).toEqual(['c', 'b']);
  });

  it('locks only pieces past the device', () => {
    expect(isLocked(a)).toBe(true);
    expect(isLocked(b)).toBe(false);
    expect(isLocked(c)).toBe(false);
    expect(isLocked({ ...b, upload: 'uploading' })).toBe(true);
  });
});
