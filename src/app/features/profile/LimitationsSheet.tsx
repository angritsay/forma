import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { Limitation } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { LIMITATIONS, toggleIn } from '@/app/screens/onboarding/draft';
import { OptionTile } from '@/app/screens/onboarding/OptionTile';
import { LIMITATION_LABEL } from '@/app/screens/onboarding/labels';

export interface LimitationsSheetProps {
  open: boolean;
  limitations: readonly Limitation[];
  busy: boolean;
  onClose: () => void;
  onSave: (limitations: Limitation[]) => void;
}

/** "Nothing" or any set of areas to go easy on; the engine swaps exercises accordingly. */
export function LimitationsSheet({
  open,
  limitations,
  busy,
  onClose,
  onSave,
}: LimitationsSheetProps) {
  const { t } = useT();
  const [selected, setSelected] = useState<Limitation[]>([]);
  const wasOpen = useRef(false);

  // Seed only when the sheet opens: a profile update elsewhere must not wipe an edit in progress.
  useEffect(() => {
    if (open && !wasOpen.current) setSelected([...limitations]);
    wasOpen.current = open;
  }, [open, limitations]);

  const none = selected.length === 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.profileLimitationsTitle')}
      footer={
        <Button size="lg" fullWidth loading={busy} onClick={() => onSave(selected)}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <p className="text-[15px] text-muted">{t('app.profileLimitationsLead')}</p>
        {/* The same question the onboarding step asks, so it is the same shape — see
            StepLimitations for why «Ничего» sits above the rest rather than among them. */}
        <div className="flex flex-col gap-4">
          <OptionTile wide role="checkbox" selected={none} onClick={() => setSelected([])}>
            {t('app.onbLimNone')}
          </OptionTile>
          <div
            role="group"
            aria-label={t('app.profileLimitationsTitle')}
            className="flex flex-wrap items-stretch gap-2"
          >
            {LIMITATIONS.map((item) => (
              <OptionTile
                key={item}
                role="checkbox"
                selected={selected.includes(item)}
                onClick={() => setSelected((list) => toggleIn(list, item))}
              >
                {t(LIMITATION_LABEL[item])}
              </OptionTile>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
