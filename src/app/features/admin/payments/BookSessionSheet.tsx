/**
 * «Записать на время» (0056): a session was paid for and matched no hold, so there is money and no
 * time. The admin agrees a time with the client and books it here — the coach, the length and a
 * Moscow date and time, like the move form in «Записи».
 *
 * The client is the account behind the payment (the one that claimed it, else the one the paid
 * address belongs to), decided by the server; the sheet only names who that will likely be. The
 * length starts where the amount points (`sessionOptionOf`); when the webhook recorded a length
 * and the switch says the other one, the server refuses (`option_mismatch`) rather than book the
 * wrong one. `admin_book_from_payment` also refuses a time on top of a session or a live hold, and
 * each refusal comes back under the fields.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { listCoaches, type AdminCoach } from '@/lib/api/adminCoaches';
import type { PaymentRow } from '@/lib/api/adminPayments';
import { dateIn, parseClock, wallToInstant } from '@/lib/coach/slots';
import { useT } from '@/app/hooks/useT';
import { COACH_TIME_ZONE } from '../inbox';
import { formatMoney, sessionOptionOf } from './model';

type Option = 'half' | 'hour';

export interface BookSessionSheetProps {
  row: PaymentRow | null;
  busy: boolean;
  /** The server's refusal, as a line under the fields. */
  error: string | null;
  onClose: () => void;
  onSubmit: (coach: string, startsAt: string, option: Option) => void;
}

export function BookSessionSheet({ row, busy, error, onClose, onSubmit }: BookSessionSheetProps) {
  const { t, locale } = useT();
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [coach, setCoach] = useState<string | null>(null);
  const [option, setOption] = useState<Option>('half');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [invalid, setInvalid] = useState(false);

  const rowId = row?.id ?? null;
  const guess = row ? sessionOptionOf(row) : null;
  useEffect(() => {
    if (!rowId) return;
    setOption(guess ?? 'half');
    setDate(dateIn(Date.now() + 86_400_000, COACH_TIME_ZONE));
    setTime('');
    setInvalid(false);
  }, [rowId, guess]);

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
    const minutes = parseClock(time);
    const at = minutes === null ? Number.NaN : wallToInstant(date, minutes, COACH_TIME_ZONE);
    if (!coach || !Number.isFinite(at) || at <= Date.now()) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSubmit(coach, new Date(at).toISOString(), option);
  };

  const who = row ? (row.accountEmail ?? row.boundEmail ?? row.email) : '';

  return (
    <Sheet
      open={row !== null}
      onClose={onClose}
      title={t('app.adminPayBookTitle')}
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
          <p className="text-sm text-muted">{t('app.adminPayBookLead')}</p>
          <p className="text-sm break-all">
            {t('app.adminPayBookFor', { email: who })} ·{' '}
            {formatMoney(locale, row.amount, row.currency, row.provider)}
          </p>
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
          <SegmentedControl<Option>
            fullWidth
            size="sm"
            label={t('app.adminPayBookLength')}
            value={option}
            onChange={setOption}
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
          {invalid || error ? (
            <p role="alert" className="text-sm text-danger">
              {invalid ? t('app.adminPayBookErrTime') : error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
