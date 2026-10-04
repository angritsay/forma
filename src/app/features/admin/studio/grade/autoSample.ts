/**
 * The automatic pass in the browser: the clip's frames read the way the worker reads them, so the
 * preview shows what the render will do (`src/lib/media/autoEnhance.ts`).
 *
 * A second, hidden `<video>` on the same signed URL is seeked to {@link AUTO_SAMPLE_FRAMES} times
 * spread over the clip — the middles of equal slices, the frames the worker's `sampleArgs` takes — and
 * each frame is drawn into a {@link AUTO_SAMPLE_WIDTH}-pixel canvas. The whole frame, never the
 * crop: the framing is chosen later and must not move the colour. The player's own video is left
 * alone, so sampling never jumps the picture she is looking at.
 *
 * A clip the worker has already rendered carries the values it used (`autoParams`): those are
 * shown as they are, rather than recomputed from a browser's decode of the same frames.
 */
import { useEffect, useState } from 'react';
import {
  AUTO_SAMPLE_FRAMES,
  AUTO_SAMPLE_WIDTH,
  computeAutoParams,
  type AutoParams,
  type PixelSample,
} from '@/lib/media/autoEnhance';
import type { PlayWindow } from './time';

const SEEK_TIMEOUT_MS = 8000;

/** The times the samples are taken at: the middle of each of `n` equal slices of the window. */
export function sampleTimes(win: PlayWindow, n = AUTO_SAMPLE_FRAMES): number[] {
  const len = Math.max(0, win.to - win.from);
  return Array.from({ length: n }, (_, i) => win.from + ((i + 0.5) * len) / n);
}

function seekTo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((ok, fail) => {
    const done = () => {
      clearTimeout(timer);
      v.removeEventListener('seeked', done);
      ok();
    };
    const timer = setTimeout(() => {
      v.removeEventListener('seeked', done);
      fail(new Error('seek_timeout'));
    }, SEEK_TIMEOUT_MS);
    v.addEventListener('seeked', done);
    v.currentTime = t;
  });
}

function loaded(v: HTMLVideoElement): Promise<void> {
  if (v.readyState >= 1) return Promise.resolve();
  return new Promise((ok, fail) => {
    v.addEventListener('loadedmetadata', () => ok(), { once: true });
    v.addEventListener('error', () => fail(new Error('load_failed')), { once: true });
  });
}

/**
 * The clip's sample frames as RGBA bytes. Throws when the video will not load or hand its pixels
 * over (a canvas tainted by a URL without CORS).
 */
export async function sampleClipFrames(src: string, win: PlayWindow): Promise<PixelSample[]> {
  const v = document.createElement('video');
  v.crossOrigin = 'anonymous';
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = src;
  try {
    await loaded(v);
    const w = AUTO_SAMPLE_WIDTH;
    const h = Math.max(1, Math.round((w * (v.videoHeight || 9)) / (v.videoWidth || 16)));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('no_canvas');
    const out: PixelSample[] = [];
    for (const t of sampleTimes(win)) {
      await seekTo(v, t);
      ctx.drawImage(v, 0, 0, w, h);
      out.push({ data: ctx.getImageData(0, 0, w, h).data, channels: 4 });
    }
    return out;
  } finally {
    v.removeAttribute('src');
    v.load();
  }
}

const cache = new Map<string, AutoParams>();

export type AutoState = 'off' | 'working' | 'ready' | 'failed';

/**
 * The pass for a clip: off when its switch is off, the stored values when the worker left some,
 * otherwise computed here once per clip and window (and remembered for the visit).
 */
export function useAutoParams(
  clip: { id: string; autoEnhance: boolean; autoParams: AutoParams | null },
  src: string | null,
  win: PlayWindow,
  enabled: boolean = clip.autoEnhance,
): { params: AutoParams | null; state: AutoState } {
  const key = `${clip.id}:${win.from}:${win.to}`;
  const stored = clip.autoParams;
  const [computed, setComputed] = useState<{ key: string; params: AutoParams } | null>(() => {
    const hit = cache.get(key);
    return hit ? { key, params: hit } : null;
  });
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || stored || !src || cache.has(key)) {
      const hit = cache.get(key);
      if (hit) setComputed({ key, params: hit });
      return;
    }
    let alive = true;
    sampleClipFrames(src, win)
      .then((frames) => {
        const params = computeAutoParams(frames);
        cache.set(key, params);
        if (alive) setComputed({ key, params });
      })
      .catch(() => {
        if (alive) setFailed(key);
      });
    return () => {
      alive = false;
    };
    // `win` is in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, stored, src, key]);

  if (!enabled) return { params: null, state: 'off' };
  if (stored) return { params: stored, state: 'ready' };
  if (computed?.key === key) return { params: computed.params, state: 'ready' };
  return { params: null, state: failed === key ? 'failed' : 'working' };
}
