import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { COURSES } from '@/content/registry';
import { isValidEmail, normalizeEmail } from '@/lib/api/auth';
import { useT } from '@/app/hooks/useT';
import { ChipGroup } from '@/app/screens/onboarding/ChipGroup';

export interface AddPurchaseSheetProps {
  open: boolean;
  busy: boolean;
  /** Server-side validation message to show under the email field. */
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string, courseId: string, note: string) => void;
}

/** Grant a course to an email by hand (bank transfer, gift, support case). */
export function AddPurchaseSheet({ open, busy, error, onClose, onSubmit }: AddPurchaseSheetProps) {
  const { t, l } = useT();
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setCourseId(null);
    setNote('');
    setTouched(false);
  }, [open]);

  const emailOk = isValidEmail(email);
  const canSubmit = emailOk && courseId !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !courseId) return;
    onSubmit(normalizeEmail(email), courseId, note);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.adminAdd')}
      footer={
        <Button
          size="lg"
          fullWidth
          type="submit"
          form="admin-add-purchase"
          loading={busy}
          disabled={!canSubmit}
        >
          {t('app.adminAdd')}
        </Button>
      }
    >
      <form id="admin-add-purchase" onSubmit={submit} className="flex flex-col gap-5 py-2">
        <p className="text-[15px] text-muted">{t('app.adminAddLead')}</p>
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          label={t('app.adminAddEmail')}
          placeholder={t('app.authEmailPlaceholder')}
          leading={<Icon name="mail" size={18} />}
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={error ?? (touched && email && !emailOk ? t('app.adminInvalidEmail') : undefined)}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">{t('app.adminAddCourse')}</span>
          <ChipGroup<string>
            label={t('app.adminAddCourse')}
            values={courseId ? [courseId] : []}
            onToggle={(id) => setCourseId(id)}
            options={COURSES.map((c) => ({ value: c.id, label: l(c.name) }))}
          />
        </div>
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
