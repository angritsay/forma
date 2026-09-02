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
  /** Left-align the title (default centered). */
  align?: 'center' | 'left';
  className?: string;
}

export function TopBar({ title, back, right, align = 'center', className }: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useT();
  const onBack = () => {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') navigate(back);
    else void navigate(-1);
  };
  return (
    <header className={clsx('flex h-14 items-center gap-2 px-3', className)}>
      <div className="flex min-w-11 shrink-0 items-center">
        {back ? (
          <IconButton label={t('common.back')} icon="back" variant="ghost" onClick={onBack} />
        ) : null}
      </div>
      <div
        className={clsx(
          'min-w-0 flex-1 truncate text-base font-semibold',
          align === 'center' ? 'text-center' : 'text-left',
        )}
      >
        {title}
      </div>
      <div className="flex min-w-11 shrink-0 items-center justify-end gap-1">{right}</div>
    </header>
  );
}
