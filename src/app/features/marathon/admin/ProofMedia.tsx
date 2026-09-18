/**
 * The proof itself, on the coach's screen.
 *
 * **This component exists because the feed could not show one.** Every row that carried a photo
 * printed the words «Фото отправлено» and stopped, which made the whole point of the feed —
 * «чтобы тренер мог сказать что задание не выполнено» — impossible to act on: you cannot strike
 * out a proof you have never seen. The object was in the bucket and the coach had full read
 * access to it (`proofs: admin all`, 0011_marathon.sql); nothing ever asked for a URL.
 *
 * The `proofs` bucket is private, so the reference is resolved through `resolveMediaUrl`, which
 * mints a signed URL and caches it until shortly before it expires. Signing happens **on demand,
 * per row, when the thumbnail is opened** rather than for the whole feed at once: a month of a
 * busy club is hundreds of objects, and signing them all to render a page nobody scrolls to the
 * bottom of is hundreds of requests for nothing.
 *
 * Video and photo are one control, because the athlete's picker offers both. A clip gets a real
 * `<video controls>`; there is no autoplay and no loop — this is evidence being examined, not a
 * feed being browsed, and a dozen clips playing at once on one screen is unusable.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
import { resolveMediaUrl } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';

export interface ProofMediaProps {
  /** The `storage:proofs/…` reference stored on the submission. */
  mediaPath: string;
}

/**
 * Is this reference a clip rather than a picture?
 *
 * Read off the extension, which `proofMediaPath` puts there and strips to `[a-z0-9]`. There is no
 * media type stored beside the object, and asking the bucket for one is a second request to answer
 * a question the filename already answers. An unknown extension renders as an image, which fails
 * visibly (a broken picture) rather than silently (a `<video>` that never plays).
 */
export function isVideoRef(ref: string): boolean {
  const ext = ref.toLowerCase().split('.').pop() ?? '';
  return ext === 'mp4' || ext === 'mov' || ext === 'webm' || ext === 'm4v' || ext === 'quicktime';
}

type State =
  { kind: 'idle' } | { kind: 'loading' } | { kind: 'ready'; url: string } | { kind: 'failed' };

export function ProofMedia({ mediaPath }: ProofMediaProps) {
  const { t } = useT();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const video = isVideoRef(mediaPath);

  const load = useCallback(() => {
    if (state.kind !== 'idle' && state.kind !== 'failed') return;
    setState({ kind: 'loading' });
    resolveMediaUrl(mediaPath)
      .then((url) => {
        if (!alive.current) return;
        setState(url ? { kind: 'ready', url } : { kind: 'failed' });
      })
      .catch(() => {
        if (alive.current) setState({ kind: 'failed' });
      });
  }, [mediaPath, state.kind]);

  if (state.kind === 'ready') {
    return (
      <span className="mt-2 block overflow-hidden rounded-tile border border-border bg-surface-2">
        {video ? (
          /* No `<track>`: a phone clip of somebody doing twenty squats carries no speech to
             caption, and an empty track element is a worse lie than none. */
          <video src={state.url} controls preload="metadata" className="block max-h-80 w-full" />
        ) : (
          <img
            src={state.url}
            alt={t('app.mAdminProofOpen')}
            className="block max-h-80 w-full object-contain"
          />
        )}
      </span>
    );
  }

  /*
   * Closed, it is a control rather than a line of text: the whole reason the old «Фото отправлено»
   * was useless is that it looked like a fact and behaved like one.
   */
  return (
    <button
      type="button"
      onClick={load}
      disabled={state.kind === 'loading'}
      className="mt-1 flex items-center gap-2 text-[13px] text-text underline underline-offset-4 disabled:opacity-60"
    >
      <Glyph size={12} className="text-muted-2">
        {video ? '▶' : '▣'}
      </Glyph>
      {state.kind === 'failed'
        ? t('app.mAdminProofFailed')
        : state.kind === 'loading'
          ? t('common.loading')
          : video
            ? t('app.mAdminProofOpenVideo')
            : t('app.mAdminProofOpen')}
    </button>
  );
}
