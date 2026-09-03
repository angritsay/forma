/**
 * Admin (docs/SPEC.md §10 flow 12), admins only — everyone else is sent back to the profile.
 * Purchases with an email search and status filter; activate / refund with a confirmation;
 * "Add purchase" grants a course by hand. Every call is re-checked by `is_admin()` server-side.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { plural, type TKey } from '@/i18n/index';
import { addPurchase, listPurchases, setPurchaseStatus } from '@/lib/api/admin';
import { isAppError, toAppError, type AppError } from '@/lib/api/errors';
import type { PurchaseRow, PurchaseStatus } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { AddPurchaseSheet } from '@/app/features/admin/AddPurchaseSheet';
import {
  courseName,
  purchaseFilter,
  SEARCH_DEBOUNCE_MS,
  STATUS_FILTERS,
  withStatus,
  type StatusFilter,
} from '@/app/features/admin/model';
import { PurchaseList, STATUS_LABEL } from '@/app/features/admin/PurchaseList';
import { useDebounced } from '@/app/features/admin/useDebounced';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';

type ListStatus = 'loading' | 'ready' | 'error';

interface PendingAction {
  row: PurchaseRow;
  status: PurchaseStatus;
}

const FILTER_LABEL: Record<StatusFilter, TKey> = {
  all: 'app.adminFilterAll',
  pending: STATUS_LABEL.pending,
  active: STATUS_LABEL.active,
  refunded: STATUS_LABEL.refunded,
};

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} rounded="card" className="h-28" />
      ))}
    </div>
  );
}

export default function AdminScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const admin = useIsAdmin();
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
        <IconButton
          label={t('app.adminRefresh')}
          icon={status === 'loading' ? <Spinner size={18} /> : 'refresh'}
          variant="ghost"
          disabled={admin !== true || status === 'loading'}
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

  const countWord = plural(locale, rows.length, {
    one: t('app.adminCountOne', { n: rows.length }),
    few: t('app.adminCountFew', { n: rows.length }),
    many: t('app.adminCountMany', { n: rows.length }),
  });

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <ListSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
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
    body = (
      <EmptyState
        icon="search"
        title={t('app.adminEmptyTitle')}
        description={t('app.adminEmptyBody')}
      />
    );
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
          icon={<Icon name="plus" size={18} />}
          onClick={() => {
            setAddError(null);
            setAddOpen(true);
          }}
        >
          {t('app.adminAdd')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Input
          type="search"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={t('app.adminSearch')}
          placeholder={t('app.adminSearch')}
          leading={<Icon name="search" size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div
          role="radiogroup"
          aria-label={t('app.adminFilterLabel')}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        >
          {STATUS_FILTERS.map((f) => (
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
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t('app.adminPurchases')}
          </h2>
          {status === 'ready' ? (
            <span className="tabular text-xs text-muted">{countWord}</span>
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
    </Screen>
  );
}
