/**
 * «Записать на время» (0056): a session was paid for and matched no hold, so there is money and no
 * time. The admin agrees a time with the client and books it here — the person, the coach, the
 * length and a Moscow date and time, like the move form in «Записи».
 *
 * **Who** (0058) is a `PersonPicker`, the admin's one way of naming a person: it starts on the
 * account the server would pick (the one that claimed the payment, or the one signed in with the
 * checkout address), and it is required when there is none — the server used to book the checkout
 * address blind, and a session on an address nobody signs in with is a session nobody sees.
 *
 * **The length** starts on the one the webhook recorded (`session_option`, 0058), else where the
 * amount points (`sessionOptionOf`); a switch that contradicts a recorded length is refused by the
 * server (`option_mismatch`) rather than booking the wrong one.
 *
 * **«Это занятие»** (0058) opens the same sheet for an unmatched course payment: a session paid at
 * the wrong amount. Then no length is pre-picked — the amount says nothing — and one must be.
 *
 * `admin_book_from_payment` also refuses a time on top of a session or a live hold, and each
 * refusal comes back under the fields.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { isValidEmail, normalizeEmail } from '@/lib/api/auth';
import { listCoaches, type AdminCoach } from '@/lib/api/adminCoaches';
import type { PaymentRow } from '@/lib/api/adminPayments';
import { dateIn, parseClock, wallToInstant } from '@/lib/coach/slots';
import { useT } from '@/app/hooks/useT';
import { COACH_TIME_ZONE } from '../inbox';
import { PersonPicker } from '../PersonPicker';
import { formatMoney, INTENT_LABEL, likelyPerson, needsPerson, sessionOptionOf } from './model';

type Option = 'half' | 'hour';

export interface BookSessionSheetProps {
  row: PaymentRow | null;
  busy: boolean;
  /** The server's refusal, as a line under the fields. */
  error: string | null;
  onClose: () => void;
  /** `email` is the person picked; null leaves it to the server (the account behind the payment). */
  onSubmit: (coach: string, startsAt: string, option: Option, email: string | null) => void;
}

type Problem = 'time' | 'option' | 'person' | 'email';

const PROBLEM_KEY = {
  time: 'app.adminPayBookErrTime',
  option: 'app.adminPayBookErrOption',
  person: 'app.adminPayBookErrPerson',
  email: 'app.adminInvalidEmail',
} as const;

export function BookSessionSheet({ row, busy, error, onClose, onSubmit }: BookSessionSheetProps) {
  const { t, locale } = useT();
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [coach, setCoach] = useState<string | null>(null);
  const [option, setOption] = useState<Option | null>(null);
  const [person, setPerson] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [problem, setProblem] = useState<Problem | null>(null);

  const rowId = row?.id ?? null;
  // An unmatched course payment (0058 «Это занятие»): the amount points at no length.
  const asSession = row !== null && row.intent !== 'session';
  const guess = row && !asSession ? sessionOptionOf(row) : null;
  const likely = row ? likelyPerson(row) : '';
  const required = row ? needsPerson(row) : false;
  useEffect(() => {
    if (!rowId) return;
    setOption(guess ?? (asSession ? null : 'half'));
    setPerson(likely);
    setDate(dateIn(Date.now() + 86_400_000, COACH_TIME_ZONE));
    setTime('');
    setProblem(null);
  }, [rowId, guess, asSession, likely]);

  useEffect(() => {
    if (!rowId) return;
    let alive = true;
    listCoaches()
      .then((list) => {
        if (!alive) return;
        const active = list.filter((c) => c.active);
        setCoaches(active);
        setCoach((cur) => cur ?? active[0]?.id ?? null);
      })
      .catch(() => {
        /* No coaches, no button: the list stays empty and the submit stays off. */
      });
    return () => {
      alive = false;
    };
  }, [rowId]);

  const submit = () => {
    const who = person.trim();
    if (required && !who) return setProblem('person');
    if (who && !isValidEmail(who)) return setProblem('email');
    if (!option) return setProblem('option');
    const minutes = parseClock(time);
    const at = minutes === null ? Number.NaN : wallToInstant(date, minutes, COACH_TIME_ZONE);
    if (!coach || !Number.isFinite(at) || at <= Date.now()) return setProblem('time');
    setProblem(null);
    onSubmit(coach, new Date(at).toISOString(), option, who ? normalizeEmail(who) : null);
  };

  const personError =
    problem === 'person' || problem === 'email' ? t(PROBLEM_KEY[problem]) : undefined;
  const line = problem && !personError ? t(PROBLEM_KEY[problem]) : error;

  return (
    <Sheet
      open={row !== null}
      onClose={onClose}
      title={t(asSession ? 'app.adminPayAsSession' : 'app.adminPayBookTitle')}
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!coach}
          onClick={submit}
        >
          {t('app.adminPayBookConfirm')}
        </Button>
      }
    >
      {row ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-display tabular text-[17px]">
              {formatMoney(locale, row.amount, row.currency, row.provider)}
            </span>
            <span className="text-sm text-muted">{t(INTENT_LABEL[row.intent])}</span>
            <span className="text-[13px] break-all text-muted-2">
              {t('app.adminPayCheckoutEmail', { email: row.email })}
            </span>
          </div>
          <p className="text-sm text-muted">
            {t(asSession ? 'app.adminPayAsSessionLead' : 'app.adminPayBookLead')}
          </p>
          <PersonPicker
            label={t('app.adminPayBindPerson')}
            placeholder={t('app.adminPersonPlaceholder')}
            value={person}
            onChange={(v) => {
              setPerson(v);
              if (problem === 'person' || problem === 'email') setProblem(null);
            }}
            hint={required ? t('app.adminPayBookWhoHint') : undefined}
            error={personError}
          />
          {coaches.length > 1 ? (
            <SegmentedControl<string>
              fullWidth
              size="sm"
              label={t('app.bookingsCoach')}
              value={coach ?? coaches[0]!.id}
              onChange={setCoach}
              options={coaches.map((c) => ({
                value: c.id,
                label: locale === 'en' ? (c.nameEn ?? c.name) : c.name,
              }))}
            />
          ) : null}
          <SegmentedControl<Option | ''>
            fullWidth
            size="sm"
            label={t('app.adminPayBookLength')}
            value={option ?? ''}
            onChange={(v) => {
              if (v) setOption(v);
              if (problem === 'option') setProblem(null);
            }}
            options={[
              { value: 'half', label: t('app.bookDuration', { n: 30 }) },
              { value: 'hour', label: t('app.bookDuration', { n: 60 }) },
            ]}
          />
          <div className="flex gap-2">
            <Input
              label={t('app.bookingsMoveDate')}
              type="date"
              value={date}
              wrapperClassName="flex-1"
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label={t('app.bookingsMoveTime')}
              type="time"
              step={1800}
              value={time}
              wrapperClassName="flex-1"
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          {line ? (
            <p role="alert" className="text-sm text-danger">
              {line}
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
