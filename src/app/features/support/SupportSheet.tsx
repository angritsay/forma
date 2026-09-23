import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/app/hooks/useT';
import { sendSupportMessage } from '@/lib/api/support';
import { checkSupportText, SUPPORT_MAX, supportErrorKey, supportLength } from './model';

export interface SupportSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * Where in the app the person pressed «Написать» — the session length on the Тренер tab, say.
   * It travels with the message so the coach reads «про часовую тренировку» without asking.
   */
  context?: string;
}

/**
 * «Написать тренеру»: one field, one neon button, and the message lands in the owner's
 * «Обращения» topic in Telegram (`support_message`, 0042).
 *
 * It replaces a `mailto:` and a bare Telegram link. Both sent the person out of the app into
 * somebody else's program, and the mail one landed in an inbox nobody on the team reads on a
 * phone. The owner's channel is where she and the coach already look.
 *
 * The draft survives closing the sheet by accident — a backdrop tap is an easy mistake with a
 * keyboard up — and is cleared only once the message has gone. The counter appears near the cap
 * rather than always: a «0 / 1000» under an empty field reads as an instruction to write a lot.
 */
export function SupportSheet({ open, onClose, context }: SupportSheetProps) {
  const { t } = useT();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) setError(null);
    wasOpen.current = open;
  }, [open]);

  const check = checkSupportText(value);
  const length = supportLength(value);
  const nearCap = length > SUPPORT_MAX * 0.8;

  const send = async () => {
    if (!check.ok) {
      setError(t(check.reason === 'empty' ? 'app.supportErrorEmpty' : 'app.supportErrorLong'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await sendSupportMessage(check.text, context);
      toast.show(
        result === 'demo'
          ? { kind: 'info', title: t('app.supportDemo') }
          : { kind: 'success', title: t('app.supportSent'), description: t('app.supportSentHint') },
      );
      setValue('');
      onClose();
    } catch (e) {
      setError(t(supportErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.supportTitle')}
      footer={
        <Button
          variant="action"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!check.ok}
          onClick={() => void send()}
        >
          {t('app.supportSend')}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <p className="text-[15px] leading-relaxed text-muted">{t('app.supportLead')}</p>
        <Textarea
          name="supportMessage"
          autoFocus
          rows={5}
          aria-label={t('app.supportTitle')}
          placeholder={t('app.supportPlaceholder')}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? (length > SUPPORT_MAX ? t('app.supportErrorLong') : undefined)}
          hint={nearCap ? t('app.supportCounter', { n: length, max: SUPPORT_MAX }) : undefined}
        />
      </form>
    </Sheet>
  );
}
