/**
 * «Вставить настройки»: which halves of the copied settings to carry — colour, frame, or both.
 *
 * Shared by the grid (paste onto every selected clip, through `admin_media_paste`) and the editor
 * (paste into the clip on screen, before saving). The sheet only asks; the caller does the paste.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { useT } from '@/app/hooks/useT';
import type { PasteChoice, StudioClipboard } from './clipboard';

export interface PasteSheetProps {
  open: boolean;
  onClose: () => void;
  clipboard: StudioClipboard | null;
  /** How many clips the paste lands on; null in the editor (one clip, said differently). */
  count: number | null;
  /** Selected clips a paste cannot touch (being rendered). */
  skipped?: number;
  busy?: boolean;
  onPaste: (choice: PasteChoice) => void;
}

export function PasteSheet({
  open,
  onClose,
  clipboard,
  count,
  skipped = 0,
  busy,
  onPaste,
}: PasteSheetProps) {
  const { t } = useT();
  const [choice, setChoice] = useState<PasteChoice>({ colour: true, crop: true });

  // Every opening starts from «both»: the usual case is the whole look.
  useEffect(() => {
    if (open) setChoice({ colour: true, crop: true });
  }, [open]);

  const none = !choice.colour && !choice.crop;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.studioPasteTitle')}
      footer={
        <Button
          fullWidth
          size="lg"
          loading={busy}
          disabled={none || !clipboard || count === 0}
          onClick={() => onPaste(choice)}
        >
          {count === null ? t('app.studioPasteHere') : t('app.studioPasteToN', { n: count })}
        </Button>
      }
    >
      {clipboard ? (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted">
            {clipboard.fromLabel
              ? t('app.studioPasteFrom', { name: clipboard.fromLabel })
              : t('app.studioPasteFromUnlabelled')}
          </p>
          <Switch
            checked={choice.colour}
            onChange={(v) => setChoice((c) => ({ ...c, colour: v }))}
            label={clipboard.grade ? t('app.studioPasteColour') : t('app.studioPasteColourNone')}
          />
          <Switch
            checked={choice.crop}
            onChange={(v) => setChoice((c) => ({ ...c, crop: v }))}
            label={clipboard.crop ? t('app.studioPasteCrop') : t('app.studioPasteCropNone')}
          />
          {none ? <p className="text-[13px] text-warning">{t('app.studioPasteNothing')}</p> : null}
          {skipped > 0 ? (
            <p className="text-[13px] text-muted">{t('app.studioPasteSkipped', { n: skipped })}</p>
          ) : null}
          {count !== null ? (
            <p className="text-[13px] text-muted">{t('app.studioPasteDoneHint')}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-[14px] text-muted">{t('app.studioClipboardEmpty')}</p>
      )}
    </Sheet>
  );
}
