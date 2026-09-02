import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';

export interface ScaleSheetProps {
  open: boolean;
  scale: number;
  onClose: () => void;
}

/** "Your load ×1.05": what the course scale is and how it adapts after every session. */
export function ScaleSheet({ open, scale, onClose }: ScaleSheetProps) {
  const { t, locale } = useT();
  const value = formatNumber(locale, scale, 2);
  return (
    <Sheet open={open} onClose={onClose} title={t('app.pathScaleTitle')}>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-4 rounded-inner bg-surface-2 p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-accent">
            <Icon name="bolt" size={24} />
          </span>
          <span className="tabular text-4xl font-bold leading-none">×{value}</span>
        </div>
        <p className="text-[15px] leading-relaxed">{t('app.pathScaleBody1', { scale: value })}</p>
        <p className="text-[15px] leading-relaxed text-muted">{t('app.pathScaleBody2')}</p>
        <p className="text-[15px] leading-relaxed text-muted">{t('app.pathScaleBody3')}</p>
        <p className="flex gap-2 text-sm text-muted-2">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <span>{t('app.pathScaleStart')}</span>
        </p>
      </div>
    </Sheet>
  );
}
