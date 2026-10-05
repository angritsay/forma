/**
 * «Названия», the studio's second step: for each uploaded clip, which exercise it is and how it
 * plays.
 *
 * One row per clip: the raw piece looping as a thumbnail (only while the row is on screen — the
 * pieces are big), the exercise (the `ExerciseSheet` picker; a new exercise is created «на повторы»
 * or «на время»), and «Луп · Один раз · Стоп-кадр». «Стоп-кадр» opens a frame scrubber inside the
 * clip; the thumbnail then holds that frame. Every choice is saved at once.
 *
 * Colour and preview open once every clip has an exercise (`flow.ts`).
 */
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import {
  saveMediaClip,
  type MediaClip,
  type MediaClipPatch,
  type PlayMode,
} from '@/lib/api/mediaStudio';
import { useT } from '@/app/hooks/useT';
import { ExerciseSheet, type PickedExercise } from './ExerciseSheet';
import { STUDIO_FOOTER } from './footer';
import { ClipStatusChip } from './grade/ClipStatus';
import { isBusy } from './grade/selection';
import { studioErrorTitle } from './grade/studioErrors';
import { clipDuration, formatClock, formatSpan, previewWindow, wrapTime } from './grade/time';
import { useRawSource } from './grade/useRawSource';
import { stillDefault } from './playMode';
import { unitLabel } from './unitLabel';

export interface NameStepProps {
  clips: readonly MediaClip[];
  onSaved: (clip: MediaClip) => void;
  onNext: () => void;
}

export function NameStep({ clips, onSaved, onNext }: NameStepProps) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const [labelFor, setLabelFor] = useState<string | null>(null);
  const labelClip = clips.find((c) => c.id === labelFor) ?? null;
  const unnamed = clips.filter((c) => !c.exerciseId).length;

  const save = async (clip: MediaClip, patch: MediaClipPatch): Promise<void> => {
    try {
      onSaved(await saveMediaClip(clip.id, patch));
    } catch (e) {
      toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioSaveError') });
    }
  };

  const onPick = (picked: PickedExercise | null) => {
    const clip = labelClip;
    setLabelFor(null);
    if (!clip) return;
    void save(clip, { exerciseId: picked?.id ?? null });
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <p className="text-[15px] text-muted">{t('app.studioNameLead')}</p>
      <ol className="flex flex-col">
        {clips.map((c, i) => (
          <NameRow
            key={c.id}
            clip={c}
            index={i}
            onLabel={() => setLabelFor(c.id)}
            onSave={(patch) => save(c, patch)}
          />
        ))}
      </ol>

      <div className={STUDIO_FOOTER}>
        {unnamed > 0 ? (
          <p className="text-[13px] text-muted">{t('app.studioNameLeft', { n: unnamed })}</p>
        ) : null}
        <Button fullWidth disabled={unnamed > 0} onClick={onNext}>
          {t('app.studioNameNext')}
        </Button>
      </div>

      <ExerciseSheet
        open={labelClip !== null}
        onClose={() => setLabelFor(null)}
        onPick={onPick}
        canClear={Boolean(labelClip?.exerciseId)}
        onToast={(kind, msg) => toast.show({ kind, title: msg })}
      />
    </div>
  );
}

function NameRow({
  clip,
  index,
  onLabel,
  onSave,
}: {
  clip: MediaClip;
  index: number;
  onLabel: () => void;
  onSave: (patch: MediaClipPatch) => Promise<void>;
}) {
  const { t } = useT();
  const busy = isBusy(clip);
  const duration = clipDuration(clip);
  // The frame being chosen, shown at once and saved when the finger lets go.
  const [frameAt, setFrameAt] = useState<number | null>(null);
  const still =
    clip.playMode === 'still' ? (frameAt ?? clip.stillAtS ?? stillDefault(duration)) : null;

  useEffect(() => setFrameAt(null), [clip.updatedAt]);

  const modes: { value: PlayMode; label: string }[] = [
    { value: 'loop', label: t('app.studioPlayLoop') },
    { value: 'once', label: t('app.studioPlayOnce') },
    { value: 'still', label: t('app.studioPlayStill') },
  ];

  const chooseMode = (mode: PlayMode) => {
    if (mode === clip.playMode) return;
    void onSave(
      mode === 'still' && clip.stillAtS === null
        ? { playMode: mode, stillAtS: stillDefault(duration) }
        : { playMode: mode },
    );
  };

  const commitFrame = () => {
    if (frameAt === null) return;
    void onSave({ stillAtS: frameAt });
  };

  return (
    <li className="flex flex-col gap-3 border-t border-border py-4">
      <div className="flex items-start gap-3">
        <span className="numeral tabular w-6 shrink-0 pt-1 text-[13px] text-muted-2">
          {String(index + 1).padStart(2, '0')}
        </span>
        <ClipThumb clip={clip} stillAt={still} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button
            type="button"
            onClick={onLabel}
            disabled={busy}
            className={clsx(
              'truncate text-left text-[15px] underline-offset-4 hover:underline disabled:no-underline',
              clip.exerciseId ? 'font-medium text-text' : 'text-warning',
            )}
          >
            {clip.exerciseName ?? clip.exerciseId ?? t('app.studioNamePick')}
          </button>
          <span className="numeral tabular text-[12px] text-muted-2">
            {formatSpan(clip)}
            {clip.exerciseUnit ? ` · ${t(unitLabel(clip.exerciseUnit))}` : ''}
          </span>
          <span>
            <ClipStatusChip status={clip.status} />
          </span>
        </div>
      </div>

      <SegmentedControl<PlayMode>
        label={t('app.studioPlayMode')}
        value={clip.playMode}
        onChange={chooseMode}
        fullWidth
        size="sm"
        options={modes.map((m) => ({ ...m, disabled: busy }))}
      />

      {clip.playMode === 'still' && still !== null ? (
        <label className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between text-[13px] text-muted">
            <span>{t('app.studioStillFrame')}</span>
            <span className="numeral tabular">
              {formatClock(still)} / {formatClock(duration)}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.04}
            value={Math.min(still, duration)}
            disabled={busy}
            aria-valuetext={formatClock(still)}
            onChange={(e) => setFrameAt(Number(e.target.value))}
            onPointerUp={commitFrame}
            onKeyUp={commitFrame}
            onBlur={commitFrame}
            className="h-8 w-full accent-[var(--accent)]"
          />
        </label>
      ) : null}
    </li>
  );
}

/**
 * The raw piece as a small looping picture, or held on the still frame. Plays only while on screen:
 * a page of pieces each streaming at once would starve the one she is looking at.
 */
function ClipThumb({ clip, stillAt }: { clip: MediaClip; stillAt: number | null }) {
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const source = useRawSource(visible ? clip.rawPath : null);
  const win = useMemo(() => previewWindow(clip), [clip]);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), {
      rootMargin: '120px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v || !source.src) return;
    if (stillAt !== null) {
      v.pause();
      v.currentTime = win.from + stillAt;
      return;
    }
    const loop = () => {
      const want = wrapTime(v.currentTime, win);
      if (want !== v.currentTime) v.currentTime = want;
    };
    v.addEventListener('timeupdate', loop);
    v.addEventListener('ended', loop);
    if (visible) void v.play().catch(() => undefined);
    else v.pause();
    return () => {
      v.removeEventListener('timeupdate', loop);
      v.removeEventListener('ended', loop);
    };
  }, [source.src, stillAt, visible, win]);

  return (
    <span
      ref={box}
      className="relative h-24 w-[54px] shrink-0 overflow-hidden rounded-control bg-surface-3"
    >
      {source.src ? (
        <video
          ref={video}
          src={source.src}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = win.from + (stillAt ?? 0);
          }}
        />
      ) : null}
    </span>
  );
}
