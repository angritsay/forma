import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import type { Limitation } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { LIMITATIONS, toggleIn } from '@/app/screens/onboarding/draft';
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

  useEffect(() => {
    if (open) setSelected([...limitations]);
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
        <div
          role="group"
          aria-label={t('app.profileLimitationsTitle')}
          className="flex flex-wrap gap-2"
        >
          <Chip
            role="checkbox"
            aria-checked={none}
            selected={none}
            icon="check"
            onClick={() => setSelected([])}
          >
            {t('app.onbLimNone')}
          </Chip>
          {LIMITATIONS.map((item) => {
            const on = selected.includes(item);
            return (
              <Chip
                key={item}
                role="checkbox"
                aria-checked={on}
                selected={on}
                onClick={() => setSelected((list) => toggleIn(list, item))}
              >
                {t(LIMITATION_LABEL[item])}
              </Chip>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
