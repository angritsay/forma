/**
 * The screenshot attached to a day's steps.
 *
 * Steps are typed in by hand, which is the honest arrangement — no phone health API is reachable
 * from a Mini App — and it is also the one number in the product that is purely the athlete's word.
 * A screenshot of their own step counter turns that word into something a person can look at, and
 * for the athlete it is less work than typing, not more: open Здоровье, screenshot, attach.
 *
 * It proves nothing to the machine. Points still come from the number, and nothing reads the image.
 * That is deliberate: a screenshot is evidence a coach can glance at, not a thing to verify.
 *
 * The picture is held in a private bucket and shown through a signed URL, so it is loaded here
 * rather than passed in — a parent that had to resolve it would have to know about storage.
 */
import { useEffect, useRef, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { resolveMediaUrl } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';

export interface StepsProofProps {
  /** The stored reference, or null when the day has no screenshot. */
  value: string | null;
  /** Called with the picked file; the caller uploads it and hands back the new reference. */
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
  disabled?: boolean;
  busy?: boolean;
}

export function StepsProof({ value, onPick, onRemove, disabled, busy }: StepsProofProps) {
  const { t } = useT();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!value) {
      setUrl(undefined);
      return;
    }
    resolveMediaUrl(value)
      .then((resolved) => {
        if (alive) setUrl(resolved);
      })
      .catch(() => {
        /* A signed URL that will not mint leaves the thumbnail empty; the row still says it is there. */
      });
    return () => {
      alive = false;
    };
  }, [value]);

  const pick = () => input.current?.click();

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear the input either way: picking the same file twice must fire `change` again.
          e.target.value = '';
          if (file) void onPick(file);
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 border-t border-border pt-3.5">
          {/*
           * A thumbnail, tappable to see it full size. Small on purpose: this is a receipt filed
           * against the day, not something to look at every time the screen opens.
           */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!url}
            className="size-14 shrink-0 overflow-hidden bg-surface-2 disabled:cursor-default"
            aria-label={t('app.stepsProofOpen')}
          >
            {url ? (
              <img src={url} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                <Spinner size={16} />
              </span>
            )}
          </button>
          <span className="min-w-0 flex-1 text-[15px]">{t('app.stepsProofAttached')}</span>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled || busy}
            className="control-label tap-target-y shrink-0 text-[11px] text-muted transition-colors duration-150 ease-(--ease-out) hover:text-text disabled:opacity-40"
          >
            {t('common.remove')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || busy}
          className="flex items-center gap-3 border-t border-border py-3.5 text-left transition-colors duration-150 ease-(--ease-out) hover:text-text disabled:opacity-40"
        >
          <span className="flex size-14 shrink-0 items-center justify-center border border-dashed border-border-strong text-muted-2">
            {busy ? <Spinner size={16} /> : <Glyph size={18}>+</Glyph>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">{t('app.stepsProofAdd')}</span>
            <span className="block text-xs text-muted-2">{t('app.stepsProofHint')}</span>
          </span>
        </button>
      )}

      {/* Full size, over everything, dismissed by a tap anywhere. No chrome — it is one picture. */}
      {open && url ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('common.close')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
        >
          <img src={url} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      ) : null}
    </div>
  );
}
