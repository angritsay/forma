/**
 * The crop frame over the whole picture: drag inside to move it, pull a corner to resize it.
 *
 * Pointer events, so one code path serves a finger, a mouse and a pen. The overlay knows only its
 * own box; every move is a delta in 0…1 of that box, handed to `cropEdit.ts`, which keeps the
 * frame inside the picture, above the minimum size and (with an aspect) in shape. Arrow keys move
 * the frame too, a hundredth at a time, so it is not a pointer-only control.
 */
import { clsx } from 'clsx';
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { Crop } from '@/lib/media/crop';
import { useT } from '@/app/hooks/useT';
import { cropOrFull, moveCrop, normaliseCrop, resizeCrop, type CropHandle } from './cropEdit';

const HANDLES: readonly CropHandle[] = ['nw', 'ne', 'sw', 'se'];

/** A 44px target over each corner, mostly inside the frame so it survives the picture edge: big enough for a thumb on a phone. */
const HANDLE_POS: Record<CropHandle, { style: CSSProperties; cursor: string }> = {
  nw: { style: { left: -11, top: -11 }, cursor: 'cursor-nwse-resize' },
  ne: { style: { right: -11, top: -11 }, cursor: 'cursor-nesw-resize' },
  sw: { style: { left: -11, bottom: -11 }, cursor: 'cursor-nesw-resize' },
  se: { style: { right: -11, bottom: -11 }, cursor: 'cursor-nwse-resize' },
};

interface Drag {
  pointer: number;
  handle: CropHandle | 'move';
  startX: number;
  startY: number;
  from: Crop;
}

export interface CropOverlayProps {
  crop: Crop | null;
  onChange: (crop: Crop | null) => void;
  /** Normalised `w / h` to keep, or null for a free frame. */
  ratio: number | null;
  disabled?: boolean;
}

export function CropOverlay({ crop, onChange, ratio, disabled }: CropOverlayProps) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const c = cropOrFull(crop);

  const start = (handle: CropHandle | 'move') => (e: PointerEvent<HTMLElement>) => {
    if (disabled || drag.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, handle, startX: e.clientX, startY: e.clientY, from: c };
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const rect = box.current?.getBoundingClientRect();
    if (!d || d.pointer !== e.pointerId || !rect || rect.width === 0 || rect.height === 0) return;
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    const next =
      d.handle === 'move' ? moveCrop(d.from, dx, dy) : resizeCrop(d.from, d.handle, dx, dy, ratio);
    onChange(normaliseCrop(next));
  };

  const end = (e: PointerEvent<HTMLElement>) => {
    if (drag.current?.pointer === e.pointerId) drag.current = null;
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    onChange(normaliseCrop(moveCrop(c, d[0], d[1])));
  };

  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden select-none">
      <div
        role="group"
        tabIndex={disabled ? -1 : 0}
        aria-label={t('app.studioCropFrame')}
        onKeyDown={onKey}
        onPointerDown={start('move')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={clsx(
          'absolute touch-none border-2 border-white outline-none focus-visible:border-accent',
          // The picture outside the frame is dimmed by the frame's own shadow.
          'shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]',
          disabled ? 'cursor-default' : 'cursor-move',
        )}
        style={{ left: pct(c.x), top: pct(c.y), width: pct(c.w), height: pct(c.h) }}
      >
        {/* Thirds, the way a camera draws them. */}
        <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/40" />
        <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/40" />
        <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/40" />
        <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/40" />
        {disabled
          ? null
          : HANDLES.map((h) => (
              <span
                key={h}
                aria-hidden="true"
                onPointerDown={start(h)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className={clsx(
                  'absolute flex h-11 w-11 touch-none items-center justify-center',
                  HANDLE_POS[h].cursor,
                )}
                style={HANDLE_POS[h].style}
              >
                <span className="h-3.5 w-3.5 rounded-[3px] border-2 border-white bg-ink/60" />
              </span>
            ))}
      </div>
    </div>
  );
}
