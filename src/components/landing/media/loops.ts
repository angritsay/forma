/**
 * Playback policy for the site's silent exercise loops (`LoopTile.astro`).
 *
 * A page can carry a dozen loops; decoding a dozen videos at once is what makes a phone hot and a
 * scroll stutter. So a loop plays only while at least {@link VISIBLE_RATIO} of it is on screen, no
 * more than {@link MAX_PLAYING} play at a time (the most visible win, then document order), and
 * nothing plays at all — the poster stands — for somebody who asked for reduced motion or less
 * data. The `src` is set only when a loop is first allowed to play, so under those settings the
 * clip is never even requested.
 *
 * Browser-only code, but no app code: this ships to site pages, and `bundle.test.ts` holds it to
 * that. The pure parts are exported for tests.
 */

export const VISIBLE_RATIO = 0.4;
export const MAX_PLAYING = 4;

export interface LoopEnv {
  reducedMotion: boolean;
  saveData: boolean;
}

/** Whether loops may play at all on this device. */
export function loopsAllowed(env: LoopEnv): boolean {
  return !env.reducedMotion && !env.saveData;
}

export interface LoopCandidate {
  /** Position in the document, for a stable tie-break. */
  order: number;
  /** IntersectionObserver ratio, 0..1. */
  ratio: number;
  /** A loop whose clip failed never plays again. */
  failed?: boolean;
}

/** The `order`s that should be playing now: visible enough, not failed, the top few. */
export function pickPlaying(
  candidates: readonly LoopCandidate[],
  max = MAX_PLAYING,
  threshold = VISIBLE_RATIO,
): Set<number> {
  const eligible = candidates
    .filter((c) => !c.failed && c.ratio >= threshold)
    .sort((a, b) => b.ratio - a.ratio || a.order - b.order);
  return new Set(eligible.slice(0, Math.max(0, max)).map((c) => c.order));
}

function readEnv(): LoopEnv {
  const reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return { reducedMotion, saveData: connection?.saveData === true };
}

/**
 * Bind every `video[data-loop-src]` under `root` once. Safe to call again: bound videos are
 * marked and skipped.
 */
export function bindLoops(root: ParentNode = document): void {
  if (!loopsAllowed(readEnv()) || typeof IntersectionObserver !== 'function') return;
  const videos = Array.from(
    root.querySelectorAll<HTMLVideoElement>('video[data-loop-src]:not([data-loop-bound])'),
  );
  if (videos.length === 0) return;

  const state = new Map<HTMLVideoElement, LoopCandidate>();
  videos.forEach((video, order) => {
    video.dataset.loopBound = '';
    state.set(video, { order, ratio: 0 });
    video.addEventListener('error', () => {
      const s = state.get(video);
      if (s) s.failed = true;
      // Drop the source so the element falls back to its poster, and never ask for it again.
      video.pause();
      video.removeAttribute('src');
      video.load();
      apply();
    });
  });

  /*
   * Asked for mid-session too: reduced motion switched on while the page is open stops every loop
   * where it stands (the frame it paused on stays), and a hidden tab plays nothing.
   */
  const motion =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const halted = () => motion?.matches === true || document.visibilityState === 'hidden';
  motion?.addEventListener?.('change', () => apply());
  document.addEventListener('visibilitychange', () => apply());

  function apply(): void {
    const playing = halted() ? new Set<number>() : pickPlaying([...state.values()]);
    for (const [video, s] of state) {
      if (playing.has(s.order)) {
        if (!video.getAttribute('src')) video.src = video.dataset.loopSrc ?? '';
        if (video.paused) void video.play().catch(() => undefined);
      } else if (!video.paused) {
        video.pause();
      }
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = state.get(e.target as HTMLVideoElement);
        if (s) s.ratio = e.isIntersecting ? e.intersectionRatio : 0;
      }
      apply();
    },
    { threshold: [0, VISIBLE_RATIO, 0.7, 1] },
  );
  videos.forEach((v) => io.observe(v));
}
