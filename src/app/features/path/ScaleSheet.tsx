import { Glyph } from '@/components/ui/Icon';
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
        {/* The multiplier alone, as a numeral on a rule — the number is the illustration. */}
        <div className="border-b border-border pb-4">
          <span className="eyebrow">{t('app.pathStatLoad')}</span>
          <div className="numeral tabular mt-2 text-5xl leading-none">×{value}</div>
        </div>
        <p className="text-[15px] leading-relaxed">{t('app.pathScaleBody1', { scale: value })}</p>
        <p className="text-[15px] leading-relaxed text-muted">{t('app.pathScaleBody2')}</p>
        <p className="text-[15px] leading-relaxed text-muted">{t('app.pathScaleBody3')}</p>
        <p className="flex gap-2 text-sm text-muted-2">
          <Glyph size={12} className="mt-1 shrink-0">
            //
          </Glyph>
          <span>{t('app.pathScaleStart')}</span>
        </p>
      </div>
    </Sheet>
  );
}
