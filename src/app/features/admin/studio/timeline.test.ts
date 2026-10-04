import { describe, expect, it } from 'vitest';
import { MAX_CLIP_SECONDS } from '@/lib/api/mediaStudio';
import {
  clampTime,
  cutAt,
  FALLBACK_FPS,
  freeRoom,
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
  withUploaded,
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

describe('no overlaps', () => {
  /** Two cut pieces, [10, 20] and [30, 40], nothing selected. */
  const two = (): MarkState => {
    let st = markOut(markIn(EMPTY, 10).state, 20, ids('a')).state;
    st = markOut(markIn({ ...st, selectedId: null }, 30).state, 40, ids('b')).state;
    return { ...st, selectedId: null };
  };

  it('refuses a start inside a range already cut', () => {
    const st = two();
    const r = markIn(st, 15);
    expect(r.problem).toBe('inside_cut');
    expect(r.state).toBe(st);
    // The end of a piece is free: the next one may start right there.
    expect(markIn(st, 20).problem).toBeNull();
  });

  it('stops an end at the start of the next cut range', () => {
    const st = markIn(two(), 22).state;
    const r = markOut(st, 35, ids('c'));
    expect(r.problem).toBeNull();
    expect(r.state.segments.find((s) => s.id === 'c')).toMatchObject({ startS: 22, endS: 30 });
    // An end past several pieces stops at the first of them.
    const far = markOut(markIn(two(), 5).state, 45, ids('d')).state;
    expect(far.segments.find((s) => s.id === 'd')).toMatchObject({ startS: 5, endS: 10 });
  });

  it('refuses an end that leaves less than half a second before the next piece', () => {
    const st = markIn(two(), 29.8).state;
    const r = markOut(st, 35, ids('x'));
    expect(r.problem).toBe('overlap');
    expect(r.state).toBe(st);
    expect(r.state.segments).toHaveLength(2);
  });

  it('keeps a selected piece out of its neighbours', () => {
    const st = { ...two(), selectedId: 'a' };
    // The start cannot move into another piece…
    expect(markIn({ ...st, selectedId: 'b' }, 15).problem).toBe('inside_cut');
    // …the end stops at the next one…
    const grown = markOut(st, 33, ids('x')).state;
    expect(grown.segments.find((s) => s.id === 'a')).toMatchObject({ startS: 10, endS: 30 });
    // …and a start moved back past a piece stops at its end.
    const back = markIn({ ...st, selectedId: 'b' }, 5).state;
    expect(back.segments.find((s) => s.id === 'b')).toMatchObject({ startS: 20, endS: 40 });
  });

  it('never leaves two pieces overlapping, whatever is pressed', () => {
    let st: MarkState = EMPTY;
    let n = 0;
    const presses = [3, 8, 6, 12, 11, 25, 9, 14, 13, 16, 2, 30, 18.2, 18.4, 18.1, 50];
    for (let i = 0; i < presses.length; i++) {
      st = { ...st, selectedId: null };
      st = (i % 2 === 0 ? markIn(st, presses[i]!) : markOut(st, presses[i]!, () => `s${n++}`))
        .state;
    }
    const sorted = [...st.segments].sort((a, b) => a.startS - b.startS);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.startS).toBeGreaterThanOrEqual(sorted[i - 1]!.endS);
    }
    expect(sorted.length).toBeGreaterThan(1);
  });

  it('counts clips already uploaded to the source as cut, once', () => {
    const st = two();
    const uploaded = [
      { id: 'a', startS: 10, endS: 20, exerciseId: null, exerciseName: null },
      { id: 'old', startS: 50, endS: 55, exerciseId: 'squat', exerciseName: 'Присед' },
    ];
    const list = withUploaded(st.segments, uploaded);
    expect(list.map((s) => s.id)).toEqual(['a', 'b', 'old']);
    expect(list[2]).toMatchObject({ upload: 'done', exerciseName: 'Присед' });
    expect(markIn({ ...st, segments: list }, 52).problem).toBe('inside_cut');
  });

  it('finds the cut range and the free room around a span', () => {
    const st = two();
    expect(cutAt(st.segments, 15)?.id).toBe('a');
    expect(cutAt(st.segments, 15, 'a')).toBeNull();
    expect(cutAt(st.segments, 20)).toBeNull();
    expect(freeRoom(st.segments, 22, 25)).toEqual({ lo: 20, hi: 30 });
    expect(freeRoom(st.segments, 45, 45)).toEqual({ lo: 40, hi: Number.POSITIVE_INFINITY });
    expect(freeRoom(st.segments, 10, 20, 'a')).toEqual({ lo: 0, hi: 30 });
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
