/**
 * The crop frame of one piece, drawn over its first frame: drag the frame to move it, pull a
 * corner to resize it, pinch with two fingers to scale it about its centre. Aspect presets lock
 * the shape (4:3, 9:16) or free it.
 *
 * The geometry is `cropMath.ts`; this is pointers in, boxes out. The frame is shown with the same
 * blob URL the cutter plays, seeked to the piece's start, so nothing is decoded twice.
 *
 * «Копировать кадр» puts the frame on the studio clipboard (shared with the grader), «Вставить
 * кадр» takes it from there — one framing for a whole shoot is one copy and a paste per piece.
 */
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import type { Crop } from '@/lib/media/crop';
import { useT } from '@/app/hooks/useT';
import { hasCrop, readClipboard, writeClipboard } from './clipboard';
import {
  ASPECT_PRESETS,
  boxOf,
  cropOfBox,
  dragCorner,
  fitAspect,
  moveBox,
  presetRatio,
  scaleBox,
  type AspectPreset,
  type Corner,
} from './cropMath';

export interface CropSheetProps {
  open: boolean;
  onClose: () => void;
  /** The cutter's blob URL. */
  videoUrl: string | null;
  /** Where to show the picture, seconds. */
  atS: number;
  /** The picture's displayed width over height. */
  frameAspect: number;
  crop: Crop | null;
  onSave: (crop: Crop | null) => void;
  onToast: (title: string) => void;
}

type Gesture =
  | { kind: 'move'; x: number; y: number; box: Crop }
  | { kind: 'corner'; corner: Corner; x: number; y: number; box: Crop }
  | { kind: 'pinch'; dist: number; box: Crop };

const CORNERS: readonly Corner[] = ['nw', 'ne', 'sw', 'se'];
const CORNER_POS: Record<Corner, string> = {
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
  se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
};

export function CropSheet(props: CropSheetProps) {
  const { open, onClose } = props;
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} title={t('app.studioCropTitle')}>
      {open ? <CropEditor {...props} /> : null}
    </Sheet>
  );
}

function CropEditor({
  onClose,
  videoUrl,
  atS,
  frameAspect,
  crop,
  onSave,
  onToast,
}: CropSheetProps) {
  const { t } = useT();
  const [box, setBox] = useState<Crop>(() => boxOf(crop));
  const [preset, setPreset] = useState<AspectPreset>('free');
  const [clipHasCrop, setClipHasCrop] = useState(() => hasCrop(readClipboard()));
  const area = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const ratio = presetRatio(preset);
  const aspect = frameAspect > 0 ? frameAspect : 16 / 9;

  // Show the piece's first frame (a tiny step in, so a browser does not show the previous one).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const seek = () => {
      try {
        v.currentTime = atS + 0.05;
      } catch {
        // Not seekable yet; loadedmetadata calls again.
      }
    };
    if (v.readyState >= 1) seek();
    v.addEventListener('loadedmetadata', seek);
    return () => v.removeEventListener('loadedmetadata', seek);
  }, [atS, videoUrl]);

  const rect = () => area.current?.getBoundingClientRect() ?? null;

  const pinchDistance = (): number => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onDown = (e: ReactPointerEvent<HTMLElement>, corner: Corner | null) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      gesture.current = { kind: 'pinch', dist: pinchDistance(), box };
    } else if (corner) {
      gesture.current = { kind: 'corner', corner, x: e.clientX, y: e.clientY, box };
    } else {
      gesture.current = { kind: 'move', x: e.clientX, y: e.clientY, box };
    }
  };

  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const r = rect();
    if (!g || !r || r.width === 0 || r.height === 0) return;
    if (g.kind === 'pinch') {
      const d = pinchDistance();
      if (g.dist > 0 && d > 0) setBox(scaleBox(g.box, d / g.dist));
      return;
    }
    const dx = (e.clientX - g.x) / r.width;
    const dy = (e.clientY - g.y) / r.height;
    if (g.kind === 'move') setBox(moveBox(g.box, dx, dy));
    else setBox(dragCorner(g.box, g.corner, dx, dy, ratio, aspect));
  };

  const onUp = (e: ReactPointerEvent<HTMLElement>) => {
    pointers.current.delete(e.pointerId);
    // One finger left after a pinch carries on as a move from where the box is now.
    const rest = [...pointers.current.values()][0];
    gesture.current = rest ? { kind: 'move', x: rest.x, y: rest.y, box } : null;
  };

  /** The keyboard's way to frame: arrows move (Shift — further), + and − scale. */
  const onKey = (e: ReactKeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const next =
      e.key === 'ArrowLeft'
        ? moveBox(box, -step, 0)
        : e.key === 'ArrowRight'
          ? moveBox(box, step, 0)
          : e.key === 'ArrowUp'
            ? moveBox(box, 0, -step)
            : e.key === 'ArrowDown'
              ? moveBox(box, 0, step)
              : e.key === '+' || e.key === '='
                ? scaleBox(box, 1.05)
                : e.key === '-' || e.key === '_'
                  ? scaleBox(box, 1 / 1.05)
                  : null;
    if (!next) return;
    e.preventDefault();
    setBox(next);
  };

  const choosePreset = (p: AspectPreset) => {
    setPreset(p);
    const r = presetRatio(p);
    if (r !== null) {
      setBox((b) => fitAspect(r, aspect, { cx: b.x + b.w / 2, cy: b.y + b.h / 2 }));
    }
  };

  const copy = () => {
    writeClipboard({ crop: cropOfBox(box) });
    setClipHasCrop(true);
    onToast(t('app.studioCropCopied'));
  };

  const paste = () => {
    const c = readClipboard();
    if (!hasCrop(c)) return;
    setPreset('free');
    setBox(boxOf(c.crop ?? null));
    onToast(t('app.studioCropPasted'));
  };

  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-muted">
        {t('app.studioCropHint')}{' '}
        <span id="crop-keys" className="hidden lg:inline">
          {t('app.studioCropKeys')}
        </span>
      </p>
      <div
        ref={area}
        className="relative mx-auto w-full touch-none overflow-hidden bg-black select-none"
        style={{
          aspectRatio: `${aspect}`,
          maxHeight: '55dvh',
          maxWidth: `calc(55dvh * ${aspect})`,
        }}
        // A second finger may land outside the frame: the picture takes it, for the pinch.
        onPointerDown={(e) => onDown(e, null)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {videoUrl ? (
          <video
            ref={video}
            src={videoUrl}
            muted
            playsInline
            preload="auto"
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          />
        ) : null}
        {/* Dimmed outside of the frame: four bands around the box. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-black/55"
          style={{ height: pct(box.y) }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55"
          style={{ height: pct(1 - box.y - box.h) }}
        />
        <div
          className="pointer-events-none absolute left-0 bg-black/55"
          style={{ top: pct(box.y), height: pct(box.h), width: pct(box.x) }}
        />
        <div
          className="pointer-events-none absolute right-0 bg-black/55"
          style={{ top: pct(box.y), height: pct(box.h), width: pct(1 - box.x - box.w) }}
        />
        <div
          role="group"
          tabIndex={0}
          aria-label={t('app.studioCropArea')}
          aria-describedby="crop-keys"
          onKeyDown={onKey}
          className="absolute touch-none border-2 border-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
          style={{ left: pct(box.x), top: pct(box.y), width: pct(box.w), height: pct(box.h) }}
          onPointerDown={(e) => onDown(e, null)}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {/* Thirds, the way a camera app frames. */}
          <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/40" />
          <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/40" />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/40" />
          <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/40" />
          {CORNERS.map((c) => (
            <span
              key={c}
              aria-hidden="true"
              className={`absolute flex h-11 w-11 touch-none items-center justify-center ${CORNER_POS[c]}`}
              onPointerDown={(e) => onDown(e, c)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <span className="h-4 w-4 border-2 border-white bg-black/40" />
            </span>
          ))}
        </div>
      </div>

      <SegmentedControl<AspectPreset>
        label={t('app.studioAspect')}
        fullWidth
        value={preset}
        onChange={choosePreset}
        options={ASPECT_PRESETS.map((p) => ({
          value: p,
          label: p === 'free' ? t('app.studioAspectFree') : p,
        }))}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={copy}>
          {t('app.studioCropCopy')}
        </Button>
        <Button size="sm" variant="secondary" onClick={paste} disabled={!clipHasCrop}>
          {t('app.studioCropPaste')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPreset('free');
            setBox(boxOf(null));
          }}
        >
          {t('app.studioCropReset')}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          fullWidth
          onClick={() => {
            onSave(cropOfBox(box));
            onClose();
          }}
        >
          {t('common.done')}
        </Button>
      </div>
    </div>
  );
}
