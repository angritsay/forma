/**
 * Admin (docs/SPEC.md §10 flow 12), admins only — everyone else is sent back to the profile.
 * Purchases with an email search and status filter; activate / refund with a confirmation;
 * "Add purchase" grants a course by hand. Every call is re-checked by `is_admin()` server-side.
 *
 * On top, «Сегодня» (0044): the last day and what waits for a decision, each row a link. The
 * «Платежи» tab is the payments journal with «Привязать к человеку» and «Отметить как
 * разобранный»; the tab, its filter and a payment id live in the URL so links land on them.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { clsx } from 'clsx';
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
  listPeople,
  listPurchases,
  listSubscriptions,
  setPurchaseStatus,
  setSubscription,
} from '@/lib/api/admin';
import { isAppError, toAppError, type AppError } from '@/lib/api/errors';
import {
  bindPayment,
  dismissPayment,
  endSubscription,
  listPayments,
  PAYMENT_FILTERS,
  type PaymentFilter,
  type PaymentRow,
} from '@/lib/api/adminPayments';
import type {
  PersonRow,
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
  sourceLabel,
  STATUS_FILTERS,
  withStatus,
  type StatusFilter,
  SUB_STATUS_FILTERS,
  subscriptionFilter,
  type SubStatusFilter,
} from '@/app/features/admin/model';
import { PurchaseList, STATUS_LABEL } from '@/app/features/admin/PurchaseList';
import { PeopleList } from '@/app/features/admin/PeopleList';
import { useDebounced } from '@/app/features/admin/useDebounced';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { BindPaymentSheet } from '@/app/features/admin/payments/BindPaymentSheet';
import { PaymentList } from '@/app/features/admin/payments/PaymentList';
import { TodayCard } from '@/app/features/admin/payments/TodayCard';
import {
  adminTabFrom,
  bindErrorKey,
  formatMoney,
  INTENT_LABEL,
  paymentFilterFrom,
  paymentIdFrom,
  type AdminTab,
} from '@/app/features/admin/payments/model';

type ListStatus = 'loading' | 'ready' | 'error';

interface PendingAction {
  row: PurchaseRow;
  status: PurchaseStatus;
}

type Tab = AdminTab;

/** A payment picked in the bind sheet, waiting for «Открыть доступ» in the confirmation. */
interface PendingBind {
  row: PaymentRow;
  email: string;
  courseId: string | null;
}

const PAY_FILTER_LABEL: Record<PaymentFilter, TKey> = {
  unclaimed: 'app.adminPayFilterUnclaimed',
  all: 'app.adminFilterAll',
  sessions: 'app.adminPayFilterSessions',
};

interface PendingSubAction {
  row: SubscriptionRow;
  action: SubscriptionAction;
}

const SUB_FILTER_LABEL: Record<SubStatusFilter, TKey> = {
  all: 'app.adminFilterAll',
  pending: 'app.adminSubStatusPending',
  active: 'app.adminSubStatusActive',
  cancelled: 'app.adminSubStatusCancelled',
  refunded: 'app.adminSubStatusRefunded',
};

/**
 * The confirmation for each subscription action. The two that end access now say plainly that
 * the money does not move by itself — the refund is made by hand in the till.
 */
const SUB_CONFIRM: Record<
  SubscriptionAction,
  { title: TKey; body: TKey; confirm: TKey; danger: boolean }
> = {
  extend_month: {
    title: 'app.adminSubConfirmExtendTitle',
    body: 'app.adminSubConfirmExtendBody',
    confirm: 'app.adminSubExtendMonth',
    danger: false,
  },
  extend_year: {
    title: 'app.adminSubConfirmExtendTitle',
    body: 'app.adminSubConfirmExtendBody',
    confirm: 'app.adminSubExtendYear',
    danger: false,
  },
  cancel: {
    title: 'app.adminSubConfirmCancelTitle',
    body: 'app.adminSubConfirmCancelBody',
    confirm: 'app.adminSubCancel',
    danger: true,
  },
  close_now: {
    title: 'app.adminSubConfirmCloseTitle',
    body: 'app.adminSubConfirmCloseBody',
    confirm: 'app.adminSubCloseNow',
    danger: true,
  },
  refund: {
    title: 'app.adminSubConfirmRefundTitle',
    body: 'app.adminSubConfirmRefundBody',
    confirm: 'app.adminSubRefund',
    danger: true,
  },
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
  { key: 'app.courseNavLabel', to: '/admin/courses' },
  { key: 'app.exScreenTitle', to: '/admin/exercises' },
  { key: 'app.mediaLibTitle', to: '/admin/media' },
  { key: 'app.mAdminNav', to: '/admin/marathons' },
  { key: 'app.adminStatsTitle', to: '/admin/stats' },
  { key: 'app.inboxNav', to: '/admin/support' },
  { key: 'app.bookingsNav', to: '/admin/bookings' },
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
  /*
   * The tab, the payments filter and a payment id live in the URL, not in state: a link from
   * «Сегодня», from the stats screen or from the owner's Telegram channel has to land on the right
   * list, and the back button has to leave it the way it came.
   */
  const [params, setParams] = useSearchParams();
  const tab = adminTabFrom(params.get('tab'), PLANS_ENABLED);
  const payFilter = paymentFilterFrom(params.get('filter'));
  const payId = paymentIdFrom(params.get('id'));
  const listTop = useRef<HTMLDivElement>(null);
  const tappedTab = useRef(false);
  const setTab = (next: Tab) => {
    if (next === tab && !payId) return;
    tappedTab.current = true;
    setParams({ tab: next }, { replace: true });
  };
  const setPayFilter = (next: PaymentFilter) => {
    if (next === payFilter && !payId) return;
    tappedTab.current = true;
    setParams({ tab: 'payments', filter: next }, { replace: true });
  };
  const [subFilter, setSubFilter] = useState<SubStatusFilter>('all');
  const [subRows, setSubRows] = useState<SubscriptionRow[]>([]);
  const [subStatus, setSubStatus] = useState<ListStatus>('loading');
  const [subError, setSubError] = useState<AppError | null>(null);
  const [pendingSub, setPendingSub] = useState<PendingSubAction | null>(null);
  const [subAddOpen, setSubAddOpen] = useState(false);
  const [subAdding, setSubAdding] = useState(false);
  const [subAddError, setSubAddError] = useState<string | null>(null);
  const subscriptions = tab === 'subscriptions';
  const isPayments = tab === 'payments';
  const [payRows, setPayRows] = useState<PaymentRow[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payStatus, setPayStatus] = useState<ListStatus>('loading');
  const [payError, setPayError] = useState<AppError | null>(null);
  const [payMore, setPayMore] = useState(false);
  const [bindRow, setBindRow] = useState<PaymentRow | null>(null);
  const [bindError, setBindError] = useState<string | null>(null);
  const [pendingBind, setPendingBind] = useState<PendingBind | null>(null);
  const [pendingDismiss, setPendingDismiss] = useState<PaymentRow | null>(null);

  /*
   * The people list. Separate state rather than a third branch of the purchases one: it answers a
   * different question (who exists) from a different source, and folding them together is how a
   * screen ends up showing one list's empty state over the other list's rows.
   *
   * `grantTo` is the address a sheet was opened with. It is cleared when the sheet closes so that
   * the next «Добавить вручную» from the toolbar starts empty — the manual path still has to work
   * for somebody who has never signed in.
   */
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<ListStatus>('loading');
  const [peopleError, setPeopleError] = useState<AppError | null>(null);
  const [grantTo, setGrantTo] = useState<string>('');
  const isPeople = tab === 'people';

  useEffect(() => {
    if (admin !== true || !isPeople) return;
    let alive = true;
    setPeopleStatus('loading');
    setPeopleError(null);
    listPeople(debouncedSearch)
      .then((data) => {
        if (!alive) return;
        setPeople(data);
        setPeopleStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setPeopleError(toAppError(e));
        setPeopleStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [admin, isPeople, debouncedSearch, tick]);

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
    if (admin !== true || !isPayments) return;
    let alive = true;
    setPayStatus('loading');
    setPayError(null);
    listPayments(payFilter, 0, payId)
      .then((page) => {
        if (!alive) return;
        setPayRows(page.rows);
        setPayTotal(page.total);
        setPayStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setPayError(toAppError(e));
        setPayStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [admin, isPayments, payFilter, payId, tick]);

  /*
   * Arriving on a tab by a link — from «Сегодня» above or from outside — scrolls the list into
   * view: on a phone it starts below the card and the tools, and a link that lands on the card
   * instead of the list it named looks like a link that did nothing. A tap on the tab control
   * itself does not scroll; the list is already where the thumb is.
   */
  const linkedTab = params.get('tab');
  useEffect(() => {
    if (admin !== true || !linkedTab) return;
    if (tappedTab.current) {
      tappedTab.current = false;
      return;
    }
    listTop.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [admin, linkedTab, payId, payFilter]);

  useEffect(() => {
    if (admin !== true || tab !== 'purchases') return;
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
  }, [admin, tab, filter, debouncedSearch, tick]);

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
        // В админке сидит тот самый человек, который применяет миграции, — значит ему можно и
        // нужно сказать, что именно не сошлось. Имя колонки из ответа постгреста в тексте: без
        // него «примени миграции» не отвечает на вопрос «какие».
        case 'schema':
          return t('app.adminSchemaBehind', { detail: e.message });
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
      } else if (action === 'close_now' || action === 'refund') {
        await endSubscription(row.email, action === 'refund');
      } else {
        const plan: SubscriptionPlan = action === 'extend_year' ? 'annual' : 'monthly';
        await setSubscription({ email: row.email, plan, status: 'active' });
      }
      if (action === 'refund') {
        toast.show({
          kind: 'success',
          title: t('app.adminSubRefunded'),
          description: t('app.adminSubRefundReminder', {
            till: sourceLabel(t, row.source) ?? 'Prodamus / lava.top',
          }),
        });
      } else {
        toast.show({
          kind: 'success',
          title: action === 'close_now' ? t('app.adminSubClosed') : t('app.adminStatusUpdated'),
        });
      }
      setPendingSub(null);
      reload();
    } catch (e) {
      toast.show({ kind: 'error', title: t('app.adminActionError'), description: errorText(e) });
    } finally {
      setBusyId(null);
    }
  };

  const confirmBind = async () => {
    if (!pendingBind) return;
    const { row, email, courseId } = pendingBind;
    setBusyId(row.id);
    try {
      const result = await bindPayment(row.id, email, courseId);
      toast.show({
        kind: 'success',
        title: result === 'subscription' ? t('app.adminPayBoundSub') : t('app.adminPayBoundCourse'),
        description: email,
      });
      setPendingBind(null);
      setBindRow(null);
      reload();
    } catch (e) {
      const key = bindErrorKey(e);
      setPendingBind(null);
      // The two refusals the person can fix in the sheet go back to it, under the field.
      if (key === 'app.adminPayErrNoOrder' || key === 'app.adminInvalidEmail') {
        setBindError(t(key));
        toast.show({ kind: 'error', title: t('app.adminActionError'), description: t(key) });
      } else {
        setBindRow(null);
        toast.show({
          kind: 'error',
          title: t('app.adminActionError'),
          description: key ? t(key) : errorText(e),
        });
        reload();
      }
    } finally {
      setBusyId(null);
    }
  };

  const confirmDismiss = async () => {
    if (!pendingDismiss) return;
    const row = pendingDismiss;
    setBusyId(row.id);
    try {
      await dismissPayment(row.id);
      toast.show({ kind: 'success', title: t('app.adminPayDismissed') });
      setPendingDismiss(null);
      reload();
    } catch (e) {
      const key = bindErrorKey(e);
      toast.show({
        kind: 'error',
        title: t('app.adminActionError'),
        description: key ? t(key) : errorText(e),
      });
    } finally {
      setBusyId(null);
    }
  };

  const loadMorePayments = async () => {
    setPayMore(true);
    try {
      const page = await listPayments(payFilter, payRows.length);
      setPayRows((list) => [...list, ...page.rows]);
      setPayTotal(page.total);
    } catch (e) {
      toast.show({ kind: 'error', title: t('app.adminPayErrorTitle'), description: errorText(e) });
    } finally {
      setPayMore(false);
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

  const currentStatus: ListStatus = isPeople
    ? peopleStatus
    : subscriptions
      ? subStatus
      : isPayments
        ? payStatus
        : status;

  const header = (
    <TopBar
      back="/"
      title={t('app.adminTitle')}
      right={
        /*
         * Reload is an icon-only control, and its mark stays an SVG: there is no glyph for
         * "again" in the brand's set, and the arrow-in-a-loop is a physical sign a glyph cannot
         * say. Monochrome, 16px, with its name on the button.
         */
        <IconButton
          label={t('app.adminRefresh')}
          icon={currentStatus === 'loading' ? <Spinner size={16} /> : 'refresh'}
          variant="ghost"
          size="sm"
          disabled={admin !== true || currentStatus === 'loading'}
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
  if (admin === false) return <Navigate to="/" replace />;

  const payCount = payId ? payRows.length : payTotal;
  const countWord = isPayments
    ? plural(locale, payCount, {
        one: t('app.adminPayCountOne', { n: payCount }),
        few: t('app.adminPayCountFew', { n: payCount }),
        many: t('app.adminPayCountMany', { n: payCount }),
      })
    : isPeople
      ? plural(locale, people.length, {
          one: t('app.adminPeopleCountOne', { n: people.length }),
          few: t('app.adminPeopleCountFew', { n: people.length }),
          many: t('app.adminPeopleCountMany', { n: people.length }),
        })
      : subscriptions
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
  if (isPeople) {
    if (peopleStatus === 'loading') {
      body = <ListSkeleton />;
    } else if (peopleStatus === 'error') {
      body = (
        <EmptyState
          title={t('app.adminErrorTitle')}
          description={errorText(peopleError)}
          action={
            <Button size="lg" onClick={reload}>
              {t('common.retry')}
            </Button>
          }
        />
      );
    } else if (people.length === 0) {
      body = (
        <EmptyState title={t('app.adminPeopleEmpty')} description={t('app.adminPeopleEmptyBody')} />
      );
    } else {
      body = (
        <PeopleList
          rows={people}
          onGrantCourse={(row) => {
            setGrantTo(row.email);
            setAddOpen(true);
          }}
          {...(PLANS_ENABLED
            ? {
                onGrantSubscription: (row: PersonRow) => {
                  setGrantTo(row.email);
                  setSubAddOpen(true);
                },
              }
            : {})}
        />
      );
    }
  } else if (isPayments) {
    if (payStatus === 'loading') {
      body = <ListSkeleton />;
    } else if (payStatus === 'error') {
      body = (
        <EmptyState
          title={t('app.adminPayErrorTitle')}
          description={errorText(payError)}
          action={
            <Button size="lg" onClick={reload}>
              {t('common.retry')}
            </Button>
          }
        />
      );
    } else if (payRows.length === 0) {
      body =
        payFilter === 'unclaimed' && !payId ? (
          <EmptyState
            title={t('app.adminPayEmptyUnclaimed')}
            description={t('app.adminPayEmptyUnclaimedBody')}
          />
        ) : (
          <EmptyState title={t('app.adminPayEmpty')} description={t('app.adminPayEmptyBody')} />
        );
    } else {
      body = (
        <div className="flex flex-col gap-4">
          <PaymentList
            rows={payRows}
            busyId={busyId}
            highlightId={payId}
            onBind={(row) => {
              setBindError(null);
              setBindRow(row);
            }}
            onDismiss={(row) => setPendingDismiss(row)}
          />
          {!payId && payRows.length < payTotal ? (
            <Button
              variant="secondary"
              fullWidth
              loading={payMore}
              onClick={() => void loadMorePayments()}
            >
              {t('app.adminPayMore')}
            </Button>
          ) : null}
        </div>
      );
    }
  } else if (subscriptions) {
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
      /*
       * No sticky button on «Люди»: there the action belongs to a row — «дать этому человеку» —
       * and a screen-wide «+ Добавить покупку» under a list of people is asking the coach to pick
       * somebody twice. The manual path, for granting to an address that has never signed in, is
       * still on the other two tabs, where it is the only way in.
       */
      footer={
        isPeople || isPayments ? undefined : (
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
        )
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <TodayCard reloadKey={tick} />
        {/*
         * The coach's authoring tools as a numbered index — 01 / 02 / 03, hairlines, a › at the
         * end of each row — rather than three framed buttons with pictures on them. Hidden from
         * `md` up, where `AdminNav` stands beside the screen and lists the same destinations;
         * repeating them inside the screen she works in all day is just clutter.
         */}
        <nav aria-label={t('app.adminTitle')} className="flex flex-col md:hidden">
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
        {/* The list starts here; a link to a tab scrolls to this line. */}
        <div ref={listTop} className="scroll-mt-4" />
        {/*
         * Four tabs with «Платежи», so the small size: at 390px the four labels fit side by side
         * at 14px and would not at 15. Without plans the control stays — «Платежи» and «Люди» are
         * there either way.
         */}
        <SegmentedControl<Tab>
          fullWidth
          size="sm"
          label={t('app.adminTitle')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'purchases', label: t('app.adminTabPurchases') },
            ...(PLANS_ENABLED
              ? [{ value: 'subscriptions' as const, label: t('app.adminTabSubscriptions') }]
              : []),
            { value: 'payments', label: t('app.adminTabPayments') },
            { value: 'people', label: t('app.adminTabPeople') },
          ]}
        />
        {/* The journal has no search: it is read by filter, and a link opens one payment. */}
        {isPayments ? null : (
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
        )}
        {/* No status chips on «Люди»: a person has no status to filter by, and leaving the
            purchases' row under the people list offered a filter that changed nothing. */}
        <div
          role="radiogroup"
          aria-label={t('app.adminFilterLabel')}
          className={clsx('-mx-6 flex gap-2 overflow-x-auto px-6 pb-1', isPeople && 'hidden')}
        >
          {isPayments
            ? payId
              ? [
                  <Chip key="all" onClick={() => setPayFilter(payFilter)}>
                    {t('app.adminPayShowAll')}
                  </Chip>,
                ]
              : PAYMENT_FILTERS.map((f) => (
                  <Chip
                    key={f}
                    role="radio"
                    aria-checked={payFilter === f}
                    selected={payFilter === f}
                    onClick={() => setPayFilter(f)}
                  >
                    {t(PAY_FILTER_LABEL[f])}
                  </Chip>
                ))
            : subscriptions
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
            {isPayments
              ? payId
                ? t('app.adminPayOneTitle')
                : t('app.adminTabPayments')
              : isPeople
                ? t('app.adminTabPeople')
                : subscriptions
                  ? t('app.adminSubscriptions')
                  : t('app.adminPurchases')}
          </h2>
          {currentStatus === 'ready' ? <span className="eyebrow tabular">{countWord}</span> : null}
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
        prefillEmail={grantTo}
        busy={adding}
        error={addError}
        onClose={() => {
          setAddOpen(false);
          setGrantTo('');
        }}
        onSubmit={(email, courseId, note) => void add(email, courseId, note)}
      />
      <Modal
        open={pendingSub !== null}
        onClose={() => setPendingSub(null)}
        title={t(SUB_CONFIRM[pendingSub?.action ?? 'extend_month'].title)}
        description={
          pendingSub
            ? `${pendingSub.row.email}. ${t(SUB_CONFIRM[pendingSub.action].body)}`
            : undefined
        }
        confirmLabel={t(SUB_CONFIRM[pendingSub?.action ?? 'extend_month'].confirm)}
        cancelLabel={t('common.cancel')}
        danger={SUB_CONFIRM[pendingSub?.action ?? 'extend_month'].danger}
        loading={busyId !== null}
        onConfirm={() => void applySubAction()}
      />
      <BindPaymentSheet
        open={pendingBind === null}
        row={bindRow}
        error={bindError}
        onClose={() => {
          setBindRow(null);
          setBindError(null);
        }}
        onSubmit={(email, courseId) => {
          if (!bindRow) return;
          setBindError(null);
          setPendingBind({ row: bindRow, email, courseId });
        }}
      />
      <Modal
        open={pendingBind !== null}
        onClose={() => setPendingBind(null)}
        title={pendingBind ? t('app.adminPayBindConfirmTitle', { email: pendingBind.email }) : ''}
        description={
          pendingBind
            ? t('app.adminPayBindConfirmBody', {
                what: [
                  t(INTENT_LABEL[pendingBind.row.intent]),
                  pendingBind.courseId ? courseName(pendingBind.courseId, locale) : '',
                ]
                  .filter(Boolean)
                  .join(' · '),
                amount: formatMoney(
                  locale,
                  pendingBind.row.amount,
                  pendingBind.row.currency,
                  pendingBind.row.provider,
                ),
              })
            : undefined
        }
        confirmLabel={t('app.adminPayBindConfirm')}
        cancelLabel={t('common.cancel')}
        loading={busyId !== null}
        onConfirm={() => void confirmBind()}
      />
      <Modal
        open={pendingDismiss !== null}
        onClose={() => setPendingDismiss(null)}
        title={t('app.adminPayDismissTitle')}
        description={
          pendingDismiss
            ? `${formatMoney(
                locale,
                pendingDismiss.amount,
                pendingDismiss.currency,
                pendingDismiss.provider,
              )} · ${pendingDismiss.email}. ${t('app.adminPayDismissBody')}`
            : undefined
        }
        confirmLabel={t('app.adminPayDismiss')}
        cancelLabel={t('common.cancel')}
        loading={busyId !== null}
        onConfirm={() => void confirmDismiss()}
      />
      <AddSubscriptionSheet
        open={subAddOpen}
        prefillEmail={grantTo}
        busy={subAdding}
        error={subAddError}
        onClose={() => {
          setSubAddOpen(false);
          setGrantTo('');
        }}
        onSubmit={(email, plan, until, note) => void addSubscription(email, plan, until, note)}
      />
    </Screen>
  );
}
