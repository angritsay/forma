import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';

export interface TopBarProps {
  title?: ReactNode;
  /**
   * Back control: `true` → history back, a path string → navigate there,
   * a function → custom handler. Omitted → no back button.
   */
  back?: boolean | string | (() => void);
  /** Right-aligned slot (icon buttons, chips). */
  right?: ReactNode;
  /** Title alignment. Default left, next to the back arrow, the way the design system sets it. */
  align?: 'center' | 'left';
  className?: string;
}

/**
 * The screen header: a back arrow, a title, a right-hand slot.
 *
 * The arrow is the typographic ← glyph (the kit's `back` icon renders it), not a chevron in a
 * circle, and the title sits beside it in the heading face — «← Курсы» is how the brandbook
 * writes the way out of a screen. Left is the default because the whole system is set left; the
 * centred option remains for a caller that wants a label balanced over a symmetric surface.
 */
export function TopBar({ title, back, right, align = 'left', className }: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useT();
  const onBack = () => {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') navigate(back);
    else void navigate(-1);
  };
  /*
   * A centred title needs the same width on both sides to actually be centred, so it always
   * reserves the back slot. A left-aligned title only needs it when there is an arrow to sit
   * beside — otherwise it starts at the gutter like every other heading.
   */
  const reserveLeft = Boolean(back) || align === 'center';
  return (
    /*
     * The hairline under the bar is what separates chrome from page now that neither is a distinct
     * surface — the header is the same black as everything under it, and without a rule the title
     * and the screen's first heading run into each other while scrolling.
     */
    <header className={clsx('flex h-14 items-center gap-2 border-b border-border px-3', className)}>
      {reserveLeft ? (
        <div className="flex min-w-11 shrink-0 items-center">
          {back ? (
            <IconButton label={t('common.back')} icon="back" variant="ghost" onClick={onBack} />
          ) : null}
        </div>
      ) : null}
      <div
        className={clsx(
          'font-display min-w-0 flex-1 truncate text-base',
          align === 'center' ? 'text-center' : 'pl-2 text-left',
        )}
      >
        {title}
      </div>
      <div className="flex min-w-11 shrink-0 items-center justify-end gap-1">{right}</div>
    </header>
  );
}
