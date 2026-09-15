import { clsx } from 'clsx';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { useKitLabels } from './KitContext';
import { useEnterTransition, useEscape, useFocusTrap, useLockBodyScroll } from './overlay';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Sticky footer (actions). */
  footer?: ReactNode;
  /** Accessible name when there is no visible title. */
  label?: string;
  className?: string;
}

/**
 * A sheet on a phone, a dialog on anything wider: backdrop + Esc close, focus trap, body scroll
 * lock, safe-area padding.
 *
 * Glass, with its shoulders back. The rounded top that marks a sheet was taken away when every
 * radius went to 0 and is restored here at `--r-card`; the panel itself is frosted rather than
 * solid, which is what the dimmed screen showing faintly through it is for. The strong hairline
 * along the top edge and the short grab bar under it stay — they said "sheet" while nothing else
 * did. It slides up over 280ms on the brand's ease-out and casts no shadow.
 *
 * **From `md` it stops being a sheet, and that is one change here rather than in nine callers.**
 * A bottom sheet is a phone idiom and it is a phone idiom for a physical reason: the panel arrives
 * from the edge the thumb is nearest. On a laptop nothing is near the bottom edge, and a 480px
 * panel glued to the middle of it reads as a phone screenshot pasted onto the page. So above `md`
 * it centres, takes the full radius on all four corners, drops the grab bar — there is nothing to
 * drag — and arrives by fading up from 96% instead of sliding. Every sheet in the product moves
 * with it: the profile's inventory and limitations, the player's difficulty and scaling, the
 * admin's four pickers.
 *
 * `translate-y-full` is a phone-only transform for the same reason. Leaving it on at desktop width
 * would push the centred dialog a full panel-height below the fold on its way in.
 */
export function Sheet({ open, onClose, title, children, footer, label, className }: SheetProps) {
  const labels = useKitLabels();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const shown = useEnterTransition(open);
  useEscape(open, onClose);
  useFocusTrap(ref, open);
  useLockBodyScroll(open);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      {/* Backdrop: a pointer shortcut only. It is hidden from assistive tech and from the tab
          order because the sheet already exposes a real close button (and Esc). */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-ink/60 transition-opacity duration-150 ease-(--ease-out)',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
        className={clsx(
          'glass relative flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-card border-t border-border-strong',
          'md:max-h-[80dvh] md:max-w-[560px] md:rounded-card md:border',
          'outline-none transition-[transform,opacity] duration-280 ease-(--ease-out)',
          shown
            ? 'translate-y-0 md:scale-100 md:opacity-100'
            : 'translate-y-full md:scale-[0.96] md:opacity-0',
          'md:translate-y-0',
          className,
        )}
      >
        {/* The grab bar is the one part that does not survive: it promises a drag, and a dialog
            in the middle of a laptop screen cannot be dragged anywhere. */}
        <div
          className="mx-auto mt-3 h-0.5 w-10 shrink-0 bg-border-strong md:hidden"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-3">
          {title ? (
            <h2 id={titleId} className="font-display text-lg">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <IconButton
            label={labels.close}
            icon="close"
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-6 pt-5 pb-[calc(var(--safe-bottom)+16px)] md:pb-5">
            {footer}
          </div>
        ) : (
          /* The safe-area tail belongs to a panel touching the bottom edge; a centred one is clear
             of the home indicator by construction. */
          <div className="h-[var(--safe-bottom)] md:hidden" />
        )}
      </div>
    </div>,
    document.body,
  );
}
