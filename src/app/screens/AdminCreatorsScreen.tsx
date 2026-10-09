/**
 * «Авторы» (admin, 0064): applications, open creators, their courses and what is owed.
 *
 * The owner's part of a creator's start is one tap — open or decline — instead of «write to
 * Nastia → call → we build» (docs/PLATFORM.md). Per creator: who they are and their audience, the
 * status, the plan (Start / Pro), the processor's fee shares are counted after, which courses are
 * theirs, and the rouble balance of their unsettled invoices. Under it, their months and invoices,
 * with «Расчёт проведён» once the money has moved.
 *
 * Months close by themselves on the 1st (`creator-invoices.yml`); «Закрыть прошлый месяц» does
 * the same by hand and writes nothing twice.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatNumber, type TKey } from '@/i18n/index';
import { listAdminCourses } from '@/lib/api/courseBuilder';
import {
  assignCourse,
  closeCreatorMonth,
  listCreatorInvoices,
  listCreators,
  listCreatorStatement,
  setCreator,
  settleInvoice,
} from '@/lib/api/creators';
import type {
  AdminCourseRow,
  AdminCreator,
  CreatorInvoice,
  CreatorStatementRow,
  CreatorStatus,
  CreatorTier,
} from '@/lib/api/types';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { formatMoney } from '@/app/features/admin/money';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { inReview } from '@/app/features/admin/courses/builderScope';
import { CourseStateBadge } from '@/app/features/admin/courses/CourseStateBadge';
import { balanceSide, statementMonths } from '@/app/features/creator/model';

const STATUS_LABEL: Record<CreatorStatus, TKey> = {
  applied: 'app.creatorsStatusApplied',
  active: 'app.creatorsStatusActive',
  paused: 'app.creatorsStatusPaused',
  declined: 'app.creatorsStatusDeclined',
};

const STATUS_TONE: Record<CreatorStatus, 'warning' | 'success' | 'neutral' | 'danger'> = {
  applied: 'warning',
  active: 'success',
  paused: 'neutral',
  declined: 'danger',
};

function Money({ rows }: { rows: CreatorStatementRow[] }) {
  const { t, locale } = useT();
  const months = statementMonths(rows);
  if (months.length === 0) {
    return <p className="text-[13px] text-muted">{t('app.creatorNoSales')}</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {months.slice(0, 6).map((m) =>
        m.rows.map((r) => (
          <li key={`${m.month}-${r.currency}`} className="tabular text-[13px] text-muted">
            {m.month.slice(0, 7)} · {formatNumber(locale, r.sales)} ·{' '}
            {formatMoney(locale, r.gross, r.currency)} ·{' '}
            {balanceSide(r.balance) === 'creatorOwes'
              ? t('app.creatorsOwesUs', { sum: formatMoney(locale, r.balance, r.currency) })
              : balanceSide(r.balance) === 'formaOwes'
                ? t('app.creatorsWeOwe', { sum: formatMoney(locale, -r.balance, r.currency) })
                : t('app.creatorEven')}
          </li>
        )),
      )}
    </ul>
  );
}

interface CardProps {
  c: AdminCreator;
  courses: AdminCourseRow[];
  onChanged: () => void;
}

function CreatorCard({ c, courses, onChanged }: CardProps) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [fee, setFee] = useState(String(c.feePct));
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CreatorStatementRow[] | null>(null);
  const [invoices, setInvoices] = useState<CreatorInvoice[]>([]);

  const act = (fn: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    return fn()
      .then(() => {
        toast.show({ kind: 'success', title: t('app.creatorsSaved') });
        onChanged();
      })
      .catch((e: unknown) => {
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.creatorsSaveError') });
      })
      .finally(() => setBusy(false));
  };

  const loadMoney = useCallback(() => {
    Promise.all([listCreatorStatement(c.id, 12), listCreatorInvoices(c.id)])
      .then(([s, inv]) => {
        setRows(s);
        setInvoices(inv);
      })
      .catch(() => setRows([]));
  }, [c.id]);

  useEffect(() => {
    if (open) loadMoney();
  }, [open, loadMoney]);

  const theirs = courses.filter((x) => x.creatorId === c.id);
  // Drafts the creator sent for review (0065): the owner's to publish or hand back.
  const waiting = theirs.filter((x) => inReview(x) && x.status !== 'published').length;
  const free = courses.filter((x) => !x.creatorId);
  const courseName = (x: AdminCourseRow) =>
    (locale === 'en' ? x.content.name?.en : x.content.name?.ru) || x.slugId;

  return (
    <li className="glass-card flex flex-col gap-4 rounded-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-lg leading-tight">{c.name}</span>
          <span className="truncate text-[12px] text-muted-2">
            {c.slug}
            {c.ownerEmail ? ` · ${c.ownerEmail}` : ''}
          </span>
        </div>
        <span className="flex flex-wrap items-center gap-2">
          {waiting > 0 ? (
            <Badge tone="warning" size="sm">
              {t('app.creatorsInReview', { n: formatNumber(locale, waiting) })}
            </Badge>
          ) : null}
          <Badge tone={STATUS_TONE[c.status]} size="sm">
            {t(STATUS_LABEL[c.status])}
          </Badge>
        </span>
      </div>

      {c.about ? <p className="text-[14px] leading-snug text-text">{c.about}</p> : null}
      <p className="text-[13px] text-muted">
        {c.followers != null
          ? t('app.creatorsFollowers', { n: formatNumber(locale, c.followers) })
          : null}
        {c.audienceUrl ? (
          <>
            {c.followers != null ? ' · ' : ''}
            <a
              href={c.audienceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              {c.audienceUrl.replace(/^https:\/\//, '')}
            </a>
          </>
        ) : null}
      </p>

      {c.house ? (
        <p className="text-[13px] text-muted">{t('app.creatorsHouse')}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {c.status !== 'active' ? (
              <Button
                size="sm"
                variant="primary"
                loading={busy}
                onClick={() => void act(() => setCreator(c.id, { status: 'active' }))}
              >
                {t(c.status === 'paused' ? 'app.creatorsReopen' : 'app.creatorsOpen')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                loading={busy}
                onClick={() => void act(() => setCreator(c.id, { status: 'paused' }))}
              >
                {t('app.creatorsPause')}
              </Button>
            )}
            {c.status === 'applied' ? (
              <Button
                size="sm"
                variant="ghost"
                loading={busy}
                onClick={() => void act(() => setCreator(c.id, { status: 'declined' }))}
              >
                {t('app.creatorsDecline')}
              </Button>
            ) : null}
          </div>

          <SegmentedControl<CreatorTier>
            label={t('app.creatorsTier')}
            options={[
              { value: 'start', label: t('app.creatorTierStart') },
              { value: 'pro', label: t('app.creatorTierPro') },
            ]}
            value={c.tier}
            onChange={(tier) => void act(() => setCreator(c.id, { tier }))}
            size="sm"
          />

          <div className="flex items-end gap-2">
            <Input
              label={t('app.creatorsFee')}
              hint={t('app.creatorsFeeHint')}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              inputMode="decimal"
              wrapperClassName="flex-1"
            />
            <Button
              size="md"
              variant="secondary"
              disabled={busy || Number(fee.replace(',', '.')) === c.feePct}
              onClick={() =>
                void act(() => setCreator(c.id, { feePct: Number(fee.replace(',', '.')) || 0 }))
              }
            >
              {t('app.creatorsSave')}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">{t('app.creatorsCourses')}</span>
            {theirs.length === 0 ? (
              <span className="text-[13px] text-muted-2">{t('app.creatorsNoCourses')}</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {theirs.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2 text-[14px]">
                    <Link
                      to={`/admin/courses/${x.id}`}
                      className="flex min-w-0 items-center gap-2 underline-offset-2 hover:underline"
                    >
                      <span className="truncate">{courseName(x)}</span>
                      <CourseStateBadge course={x} />
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void act(() => assignCourse(x.slugId, null))}
                    >
                      {t('app.creatorsUnassign')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {free.length > 0 ? (
              <Select<string>
                aria-label={t('app.creatorsAssign')}
                options={[
                  { value: '', label: t('app.creatorsAssign') },
                  ...free.map((x) => ({ value: x.slugId, label: courseName(x) })),
                ]}
                value=""
                onChange={(slug) => {
                  if (slug) void act(() => assignCourse(slug, c.id));
                }}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="tabular text-[13px] text-muted">
              {balanceSide(c.openBalance) === 'creatorOwes'
                ? t('app.creatorsOwesUs', { sum: formatMoney(locale, c.openBalance, 'RUB') })
                : balanceSide(c.openBalance) === 'formaOwes'
                  ? t('app.creatorsWeOwe', { sum: formatMoney(locale, -c.openBalance, 'RUB') })
                  : t('app.creatorEven')}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
              {t(open ? 'app.creatorsHideMoney' : 'app.creatorsShowMoney')}
            </Button>
          </div>

          {open ? (
            rows === null ? (
              <LoadingBlock />
            ) : (
              <div className="flex flex-col gap-3">
                <Money rows={rows} />
                {invoices.length > 0 ? (
                  <ul className="flex flex-col">
                    {invoices.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 border-t border-border py-2 first:border-t-0"
                      >
                        <span className="tabular min-w-0 truncate text-[13px]">
                          {inv.number} · {formatMoney(locale, inv.balance, inv.currency)}
                        </span>
                        <Button
                          size="sm"
                          variant={inv.settledAt ? 'ghost' : 'secondary'}
                          disabled={busy}
                          onClick={() =>
                            void act(() => settleInvoice(inv.id, !inv.settledAt)).then(loadMoney)
                          }
                        >
                          {t(inv.settledAt ? 'app.creatorsUnsettle' : 'app.creatorsSettle')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          ) : null}
        </>
      )}
    </li>
  );
}

export default function AdminCreatorsScreen() {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const admin = useIsAdmin();
  const [creators, setCreators] = useState<AdminCreator[] | null>(null);
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [failed, setFailed] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    Promise.all([listCreators(), listAdminCourses()])
      .then(([c, x]) => {
        setCreators(c);
        setCourses(x);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (admin === null) return <AdminBoot />;
  if (admin === false) return <Navigate to="/" replace />;

  const close = () => {
    setClosing(true);
    closeCreatorMonth()
      .then((n) => {
        toast.show({ kind: 'success', title: t('app.creatorsClosed', { n }) });
        load();
      })
      .catch((e: unknown) =>
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.creatorsSaveError') }),
      )
      .finally(() => setClosing(false));
  };

  return (
    <Screen header={<TopBar back title={t('app.creatorsNav')} />}>
      {failed ? (
        <EmptyState className="py-16" title={t('app.creatorLoadError')} />
      ) : creators === null ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] leading-snug text-muted">{t('app.creatorsNote')}</p>
            <Button variant="secondary" size="md" loading={closing} onClick={close}>
              {t('app.creatorsClose')}
            </Button>
          </div>
          {creators.length <= 1 ? (
            <p className="text-[14px] text-muted">{t('app.creatorsEmpty')}</p>
          ) : null}
          <ul className="flex flex-col gap-3">
            {creators.map((c) => (
              <CreatorCard key={c.id} c={c} courses={courses} onChanged={load} />
            ))}
          </ul>
        </div>
      )}
    </Screen>
  );
}
