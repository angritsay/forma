/**
 * «Привязать к человеку»: pick who gets access for an unmatched payment.
 *
 * The person is chosen by name through `PersonPicker`, like every other grant in the admin — the
 * owner knows names, not addresses. The field starts with the checkout address when somebody has
 * an account with it (then it is almost certainly them), and empty otherwise.
 *
 * A course payment also asks which course: «по заказу человека» first, because that is what the
 * webhook would have done had the address matched; a course by name when there was no order.
 * The sheet only collects the choice — the screen asks to confirm before anything is written.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { isValidEmail, normalizeEmail } from '@/lib/api/auth';
import type { PaymentRow } from '@/lib/api/adminPayments';
import { useCatalogue } from '@/app/store/catalogue';
import { useT } from '@/app/hooks/useT';
import { ChipGroup } from '@/app/screens/onboarding/ChipGroup';
import { PersonPicker } from '../PersonPicker';
import { formatMoney, INTENT_LABEL } from './model';

/** The chip that means «the person's own pending order decides». */
const BY_ORDER = '__order';

export interface BindPaymentSheetProps {
  /**
   * Hidden, not cleared, while the screen asks to confirm: a refusal sends the person back here
   * with their choice intact and the reason under the field.
   */
  open: boolean;
  row: PaymentRow | null;
  /** Server-side message to show under the person field (no order, bad address). */
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string, courseId: string | null) => void;
}

export function BindPaymentSheet({ open, row, error, onClose, onSubmit }: BindPaymentSheetProps) {
  const { t, l, locale } = useT();
  const courses = useCatalogue((s) => s.courses);
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState<string>(BY_ORDER);
  const [touched, setTouched] = useState(false);

  // A new payment starts the form over; the same one coming back after a refusal does not.
  const rowId = row?.id ?? null;
  const rowEmail = row && row.hasAccount ? row.email : '';
  useEffect(() => {
    if (!rowId) return;
    setEmail(rowEmail);
    setCourse(BY_ORDER);
    setTouched(false);
  }, [rowId, rowEmail]);

  const emailOk = isValidEmail(email);
  const isCourse = row?.intent === 'course';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailOk) return;
    onSubmit(normalizeEmail(email), isCourse && course !== BY_ORDER ? course : null);
  };

  return (
    <Sheet
      open={open && row !== null}
      onClose={onClose}
      title={t('app.adminPayBindTitle')}
      footer={
        <Button
          size="lg"
          fullWidth
          variant="action"
          type="submit"
          form="admin-bind-payment"
          disabled={!emailOk}
        >
          {t('app.adminPayBindNext')}
        </Button>
      }
    >
      <form id="admin-bind-payment" onSubmit={submit} className="flex flex-col gap-5 py-2">
        {row ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-display tabular text-[17px]">
              {formatMoney(locale, row.amount, row.currency, row.provider)}
            </span>
            <span className="text-sm text-muted">{t(INTENT_LABEL[row.intent])}</span>
            <span className="text-[13px] break-all text-muted-2">
              {t('app.adminPayCheckoutEmail', { email: row.email })}
            </span>
          </div>
        ) : null}
        <p className="text-[15px] text-muted">{t('app.adminPayBindLead')}</p>
        <PersonPicker
          label={t('app.adminPayBindPerson')}
          placeholder={t('app.adminPersonPlaceholder')}
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched(true)}
          error={error ?? (touched && email && !emailOk ? t('app.adminInvalidEmail') : undefined)}
        />
        {isCourse ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">
              {t('app.adminPayBindCourse')}
            </span>
            <ChipGroup<string>
              label={t('app.adminPayBindCourse')}
              values={[course]}
              onToggle={(id) => setCourse(id)}
              options={[
                { value: BY_ORDER, label: t('app.adminPayBindCourseByOrder') },
                ...courses.map((c) => ({ value: c.id, label: l(c.name) })),
              ]}
            />
            <span className="text-[12px] text-muted-2">{t('app.adminPayBindCourseHint')}</span>
          </div>
        ) : null}
      </form>
    </Sheet>
  );
}
