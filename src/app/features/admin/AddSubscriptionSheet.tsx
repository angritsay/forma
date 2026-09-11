import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { isValidEmail, normalizeEmail } from '@/lib/api/auth';
import type { SubscriptionPlan } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { ChipGroup } from '@/app/screens/onboarding/ChipGroup';

export interface AddSubscriptionSheetProps {
  open: boolean;
  busy: boolean;
  /** Server-side validation message to show under the email field. */
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string, plan: SubscriptionPlan, until: string | null, note: string) => void;
}

/** Grant every course for a period by hand (bank transfer, gift, support case). */
export function AddSubscriptionSheet({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: AddSubscriptionSheetProps) {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly');
  const [until, setUntil] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setPlan('monthly');
    setUntil('');
    setNote('');
    setTouched(false);
  }, [open]);

  const emailOk = isValidEmail(email);
  // A date typed by hand; the end of that day in the coach's own time zone.
  const untilIso = until ? new Date(`${until}T23:59:59`).toISOString() : null;
  const untilOk = !until || (untilIso !== null && Date.parse(untilIso) > Date.now());
  const canSubmit = emailOk && untilOk;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit(normalizeEmail(email), plan, untilIso, note);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.adminSubAdd')}
      footer={
        <Button
          size="lg"
          fullWidth
          type="submit"
          form="admin-add-subscription"
          loading={busy}
          disabled={!canSubmit}
        >
          {t('app.adminSubAdd')}
        </Button>
      }
    >
      <form id="admin-add-subscription" onSubmit={submit} className="flex flex-col gap-5 py-2">
        <p className="text-[15px] text-muted">{t('app.adminSubAddLead')}</p>
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          label={t('app.adminAddEmail')}
          placeholder={t('app.authEmailPlaceholder')}
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={error ?? (touched && email && !emailOk ? t('app.adminInvalidEmail') : undefined)}
        />
        {/* The same 13px label the kit puts over a field, so the chip row reads as one more field. */}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">{t('app.adminSubAddPlan')}</span>
          <ChipGroup<SubscriptionPlan>
            label={t('app.adminSubAddPlan')}
            values={[plan]}
            onToggle={(id) => setPlan(id)}
            options={[
              { value: 'monthly', label: t('app.planMonthly') },
              { value: 'annual', label: t('app.planAnnual') },
            ]}
          />
        </div>
        <Input
          type="date"
          label={t('app.adminSubAddUntil')}
          hint={t('app.adminSubAddUntilHint')}
          value={until}
          disabled={busy}
          onChange={(e) => setUntil(e.target.value)}
        />
        <Input
          label={t('app.adminAddNote')}
          placeholder={t('app.adminAddNotePlaceholder')}
          value={note}
          maxLength={200}
          disabled={busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Sheet>
  );
}
