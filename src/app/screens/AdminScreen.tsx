/**
 * Admin (docs/SPEC.md §10 flow 12), admins only — everyone else is sent back to the profile.
 * Purchases with an email search and status filter; activate / refund with a confirmation;
 * "Add purchase" grants a course by hand. Every call is re-checked by `is_admin()` server-side.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { plural, type TKey } from '@/i18n/index';
import {
  addPurchase,
  listPurchases,
  listSubscriptions,
  setPurchaseStatus,
  setSubscription,
} from '@/lib/api/admin';
import { isAppError, toAppError, type AppError } from '@/lib/api/errors';
import type {
  PurchaseRow,
  PurchaseStatus,
  SubscriptionPlan,
  SubscriptionRow,
} from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { AddPurchaseSheet } from '@/app/features/admin/AddPurchaseSheet';
import { AddSubscriptionSheet } from '@/app/features/admin/AddSubscriptionSheet';
import { SubscriptionList, type SubscriptionAction } from '@/app/features/admin/SubscriptionList';
import { PLANS_ENABLED } from '@content/site/plans';
import {
  courseName,
  purchaseFilter,
  SEARCH_DEBOUNCE_MS,
  STATUS_FILTERS,
  withStatus,
  type StatusFilter,
  SUB_STATUS_FILTERS,
  subscriptionFilter,
  type SubStatusFilter,
} from '@/app/features/admin/model';
import { PurchaseList, STATUS_LABEL } from '@/app/features/admin/PurchaseList';
import { useDebounced } from '@/app/features/admin/useDebounced';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';

type ListStatus = 'loading' | 'ready' | 'error';

interface PendingAction {
  row: PurchaseRow;
  status: PurchaseStatus;
}

type Tab = 'purchases' | 'subscriptions';

interface PendingSubAction {
  row: SubscriptionRow;
  action: SubscriptionAction;
}

const SUB_FILTER_LABEL: Record<SubStatusFilter, TKey> = {
  all: 'app.adminFilterAll',
  pending: 'app.adminSubStatusPending',
  active: 'app.adminSubStatusActive',
  cancelled: 'app.adminSubStatusCancelled',
};

const FILTER_LABEL: Record<StatusFilter, TKey> = {
  all: 'app.adminFilterAll',
  pending: STATUS_LABEL.pending,
  active: STATUS_LABEL.active,
  refunded: STATUS_LABEL.refunded,
};

/** The three authoring tools, in the order the coach reaches for them. */
const TOOLS: { key: TKey; to: string }[] = [
  { key: 'app.builderScreenTitle', to: '/admin/workouts' },
  { key: 'app.courseScreenTitle', to: '/admin/courses' },
  { key: 'app.exScreenTitle', to: '/admin/exercises' },
  { key: 'app.mAdminNav', to: '/admin/marathons' },
];

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} rounded="control" className="h-24" />
      ))}
    </div>
  );
}

export default function AdminScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const admin = useIsAdmin();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');
  const [error, setError] = useState<AppError | null>(null);
  const [tick, setTick] = useState(0);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('purchases');
  const [subFilter, setSubFilter] = useState<SubStatusFilter>('all');
  const [subRows, setSubRows] = useState<SubscriptionRow[]>([]);
  const [subStatus, setSubStatus] = useState<ListStatus>('loading');
  const [subError, setSubError] = useState<AppError | null>(null);
  const [pendingSub, setPendingSub] = useState<PendingSubAction | null>(null);
  const [subAddOpen, setSubAddOpen] = useState(false);
  const [subAdding, setSubAdding] = useState(false);
  const [subAddError, setSubAddError] = useState<string | null>(null);
  const subscriptions = tab === 'subscriptions';

  useEffect(() => {
    if (admin !== true || !subscriptions) return;
    let alive = true;
    setSubStatus('loading');
    setSubError(null);
    listSubscriptions(subscriptionFilter(subFilter, debouncedSearch))
      .then((data) => {
        if (!alive) return;
        setSubRows(data);
        setSubStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setSubError(toAppError(e));
        setSubStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [admin, subscriptions, subFilter, debouncedSearch, tick]);

  useEffect(() => {
    if (admin !== true) return;
    let alive = true;
    setStatus('loading');
    setError(null);
    listPurchases(purchaseFilter(filter, debouncedSearch))
      .then((data) => {
        if (!alive) return;
        setRows(data);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(toAppError(e));
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [admin, filter, debouncedSearch, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const errorText = useCallback(
    (e: unknown): string => {
      if (!isAppError(e)) return t('common.errorGeneric');
      switch (e.code) {
        case 'network':
          return t('common.errorOffline');
        case 'forbidden':
        case 'auth':
          return t('app.adminForbidden');
        case 'validation':
        case 'not_found':
        case 'unknown':
          return t('common.errorGeneric');
      }
    },
    [t],
  );

  const applyStatus = async () => {
    if (!pending) return;
    const { row, status: next } = pending;
    setBusyId(row.id);
    try {
      await setPurchaseStatus(row.id, next);
      setRows((list) => withStatus(list, row.id, next, new Date().toISOString()));
      toast.show({ kind: 'success', title: t('app.adminStatusUpdated') });
      setPending(null);
      reload();
    } catch (e) {
      toast.show({ kind: 'error', title: t('app.adminActionError'), description: errorText(e) });
    } finally {
      setBusyId(null);
    }
  };

  const applySubAction = async () => {
    if (!pendingSub) return;
    const { row, action } = pendingSub;
    setBusyId(row.id);
    try {
      if (action === 'cancel') {
        await setSubscription({ email: row.email, plan: row.plan, status: 'cancelled' });
      } else {
        const plan: SubscriptionPlan = action === 'extend_year' ? 'annual' : 'monthly';
        await setSubscription({ email: row.email, plan, status: 'active' });
      }
      toast.show({ kind: 'success', title: t('app.adminStatusUpdated') });
      setPendingSub(null);
      reload();
    } catch (e) {
      toast.show({ kind: 'error', title: t('app.adminActionError'), description: errorText(e) });
    } finally {
      setBusyId(null);
    }
  };

  const addSubscription = async (
    email: string,
    plan: SubscriptionPlan,
    until: string | null,
    note: string,
  ) => {
    setSubAdding(true);
    setSubAddError(null);
    try {
      await setSubscription({ email, plan, status: 'active', expiresAt: until, note });
      toast.show({ kind: 'success', title: t('app.adminSubAdded'), description: email });
      setSubAddOpen(false);
      reload();
    } catch (e) {
      if (isAppError(e) && e.code === 'validation') setSubAddError(t('app.adminInvalidEmail'));
      else
        toast.show({ kind: 'error', title: t('app.adminActionError'), description: errorText(e) });
    } finally {
      setSubAdding(false);
    }
  };

  const add = async (email: string, courseId: string, note: string) => {
    setAdding(true);
    setAddError(null);
    try {
      await addPurchase(email, courseId, note);
      toast.show({
        kind: 'success',
        title: t('app.adminAdded'),
        description: `${email} · ${courseName(courseId, locale)}`,
      });
      setAddOpen(false);
      reload();
    } catch (e) {
      if (isAppError(e) && e.code === 'validation') setAddError(t('app.adminInvalidEmail'));
      else
        toast.show({ kind: 'error', title: t('app.adminActionError'), description: errorText(e) });
    } finally {
      setAdding(false);
    }
  };

  const header = (
    <TopBar
      back="/profile"
      title={t('app.adminTitle')}
      right={
        /*
         * Reload is an icon-only control, and its mark stays an SVG: there is no glyph for
         * "again" in the brand's set, and the arrow-in-a-loop is a physical sign a glyph cannot
         * say. Monochrome, 16px, with its name on the button.
         */
        <IconButton
          label={t('app.adminRefresh')}
          icon={
            (subscriptions ? subStatus : status) === 'loading' ? <Spinner size={16} /> : 'refresh'
          }
          variant="ghost"
          size="sm"
          disabled={admin !== true || (subscriptions ? subStatus : status) === 'loading'}
          onClick={reload}
        />
      }
    />
  );

  if (admin === null) {
    return (
      <Screen header={header}>
        <div className="py-4">
          <ListSkeleton />
        </div>
      </Screen>
    );
  }
  if (admin === false) return <Navigate to="/profile" replace />;

  const countWord = subscriptions
    ? plural(locale, subRows.length, {
        one: t('app.adminSubCountOne', { n: subRows.length }),
        few: t('app.adminSubCountFew', { n: subRows.length }),
        many: t('app.adminSubCountMany', { n: subRows.length }),
      })
    : plural(locale, rows.length, {
        one: t('app.adminCountOne', { n: rows.length }),
        few: t('app.adminCountFew', { n: rows.length }),
        many: t('app.adminCountMany', { n: rows.length }),
      });

  let body: React.ReactNode;
  if (subscriptions) {
    if (subStatus === 'loading') {
      body = <ListSkeleton />;
    } else if (subStatus === 'error') {
      body = (
        <EmptyState
          title={t('app.adminSubErrorTitle')}
          description={errorText(subError)}
          action={
            <Button size="lg" onClick={reload}>
              {t('common.retry')}
            </Button>
          }
        />
      );
    } else if (subRows.length === 0) {
      body = (
        <EmptyState title={t('app.adminEmptyTitle')} description={t('app.adminSubEmptyBody')} />
      );
    } else {
      body = (
        <SubscriptionList
          rows={subRows}
          busyId={busyId}
          onAction={(row, action) => setPendingSub({ row, action })}
        />
      );
    }
  } else if (status === 'loading') {
    body = <ListSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.adminErrorTitle')}
        description={errorText(error)}
        action={
          <Button size="lg" onClick={reload}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else if (rows.length === 0) {
    body = <EmptyState title={t('app.adminEmptyTitle')} description={t('app.adminEmptyBody')} />;
  } else {
    body = (
      <PurchaseList
        rows={rows}
        busyId={busyId}
        onAction={(row, next) => setPending({ row, status: next })}
      />
    );
  }

  return (
    <Screen
      header={header}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Glyph size={16}>+</Glyph>}
          onClick={() => {
            if (subscriptions) {
              setSubAddError(null);
              setSubAddOpen(true);
            } else {
              setAddError(null);
              setAddOpen(true);
            }
          }}
        >
          {subscriptions ? t('app.adminSubAdd') : t('app.adminAdd')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/*
         * The coach's authoring tools as a numbered index — 01 / 02 / 03, hairlines, a › at the
         * end of each row — rather than three framed buttons with pictures on them. Hidden from
         * `lg` up, where SideNav lists the same three and repeating them is just clutter in the
         * screen she works in all day.
         */}
        <nav aria-label={t('app.adminTitle')} className="flex flex-col lg:hidden">
          {TOOLS.map((tool, i) => (
            <button
              key={tool.to}
              type="button"
              onClick={() => navigate(tool.to)}
              className="flex w-full items-center gap-4 border-t border-border py-3.5 text-left transition-colors duration-150 ease-(--ease-out) first:border-t-0 hover:bg-surface-2 active:bg-surface-3"
            >
              <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display min-w-0 flex-1 truncate text-[15px]">
                {t(tool.key)}
              </span>
              <Glyph size={16} className="shrink-0 text-muted-2">
                ›
              </Glyph>
            </button>
          ))}
        </nav>
        {PLANS_ENABLED ? (
          <SegmentedControl<Tab>
            fullWidth
            label={t('app.adminTitle')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'purchases', label: t('app.adminTabPurchases') },
              { value: 'subscriptions', label: t('app.adminTabSubscriptions') },
            ]}
          />
        ) : null}
        <Input
          type="search"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={t('app.adminSearch')}
          placeholder={t('app.adminSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div
          role="radiogroup"
          aria-label={t('app.adminFilterLabel')}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        >
          {subscriptions
            ? SUB_STATUS_FILTERS.map((f) => (
                <Chip
                  key={f}
                  role="radio"
                  aria-checked={subFilter === f}
                  selected={subFilter === f}
                  onClick={() => setSubFilter(f)}
                >
                  {t(SUB_FILTER_LABEL[f])}
                </Chip>
              ))
            : STATUS_FILTERS.map((f) => (
                <Chip
                  key={f}
                  role="radio"
                  aria-checked={filter === f}
                  selected={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {t(FILTER_LABEL[f])}
                </Chip>
              ))}
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5 pb-1">
          <h2 className="font-display text-xl">
            {subscriptions ? t('app.adminSubscriptions') : t('app.adminPurchases')}
          </h2>
          {(subscriptions ? subStatus : status) === 'ready' ? (
            <span className="eyebrow tabular">{countWord}</span>
          ) : null}
        </div>
        {body}
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending?.status === 'refunded'
            ? t('app.adminConfirmRefundTitle')
            : t('app.adminConfirmActivateTitle')
        }
        description={
          pending
            ? `${pending.row.email} · ${courseName(pending.row.courseId, locale)}. ${
                pending.status === 'refunded'
                  ? t('app.adminConfirmRefundBody')
                  : t('app.adminConfirmActivateBody')
              }`
            : undefined
        }
        confirmLabel={
          pending?.status === 'refunded' ? t('app.adminRefund') : t('app.adminActivate')
        }
        cancelLabel={t('common.cancel')}
        danger={pending?.status === 'refunded'}
        loading={busyId !== null}
        onConfirm={() => void applyStatus()}
      />
      <AddPurchaseSheet
        open={addOpen}
        busy={adding}
        error={addError}
        onClose={() => setAddOpen(false)}
        onSubmit={(email, courseId, note) => void add(email, courseId, note)}
      />
      <Modal
        open={pendingSub !== null}
        onClose={() => setPendingSub(null)}
        title={
          pendingSub?.action === 'cancel'
            ? t('app.adminSubConfirmCancelTitle')
            : t('app.adminSubConfirmExtendTitle')
        }
        description={
          pendingSub
            ? `${pendingSub.row.email}. ${
                pendingSub.action === 'cancel'
                  ? t('app.adminSubConfirmCancelBody')
                  : t('app.adminSubConfirmExtendBody')
              }`
            : undefined
        }
        confirmLabel={
          pendingSub?.action === 'cancel'
            ? t('app.adminSubCancel')
            : pendingSub?.action === 'extend_year'
              ? t('app.adminSubExtendYear')
              : t('app.adminSubExtendMonth')
        }
        cancelLabel={t('common.cancel')}
        danger={pendingSub?.action === 'cancel'}
        loading={busyId !== null}
        onConfirm={() => void applySubAction()}
      />
      <AddSubscriptionSheet
        open={subAddOpen}
        busy={subAdding}
        error={subAddError}
        onClose={() => setSubAddOpen(false)}
        onSubmit={(email, plan, until, note) => void addSubscription(email, plan, until, note)}
      />
    </Screen>
  );
}
