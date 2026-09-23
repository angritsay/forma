/**
 * «Обращения» (admins only, 0045): what people wrote to the bot or through «Написать тренеру», with
 * the text, and a reply that goes back through the bot.
 *
 * Built for one person on a phone: three tabs, one card per message, and the actions under it in
 * the order she reaches for them — reply, mark as answered, open the chat. Closing without a reply
 * is the one that takes a message out of sight, so it alone asks first.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import {
  listSupport,
  replySupport,
  setSupportStatus,
  type SupportItem,
  type SupportState,
  type SupportTab,
} from '@/lib/api/adminInbox';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import {
  chatLink,
  deliveryKey,
  formatMoscow,
  langLabel,
  mailLink,
  replyErrorKey,
  replyRoute,
} from '@/app/features/admin/inbox';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { checkSupportText, SUPPORT_MAX, supportLength } from '@/app/features/support/model';

const PAGE = 50;

export default function AdminSupportScreen() {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const admin = useIsAdmin();

  const [tab, setTab] = useState<SupportTab>('new');
  const [items, setItems] = useState<SupportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<SupportItem | null>(null);
  const [closing, setClosing] = useState<SupportItem | null>(null);
  // Ignores an answer to a tab she has already left.
  const request = useRef(0);

  const load = useCallback(
    (which: SupportTab) => {
      const id = ++request.current;
      setLoading(true);
      listSupport(which, PAGE, 0)
        .then((page) => {
          if (id !== request.current) return;
          setItems(page.items);
          setTotal(page.total);
        })
        .catch((e: unknown) => {
          if (id === request.current) {
            toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.inboxLoadError') });
          }
        })
        .finally(() => {
          if (id === request.current) setLoading(false);
        });
    },
    [toast, tr],
  );

  useEffect(() => {
    if (admin) load(tab);
  }, [admin, tab, load]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  const loadMore = async () => {
    setMore(true);
    try {
      const page = await listSupport(tab, PAGE, items.length);
      setItems((prev) => [...prev, ...page.items.filter((n) => !prev.some((p) => p.id === n.id))]);
      setTotal(page.total);
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.inboxLoadError') });
    } finally {
      setMore(false);
    }
  };

  const changeStatus = async (item: SupportItem, status: SupportState) => {
    setBusyId(item.id);
    try {
      await setSupportStatus(item.id, status);
      toast.show({
        kind: 'success',
        title: t(
          status === 'answered'
            ? 'app.inboxMarkedAnswered'
            : status === 'closed'
              ? 'app.inboxClosed'
              : 'app.inboxReopened',
        ),
      });
      setClosing(null);
      load(tab);
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.inboxStatusError') });
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { value: SupportTab; label: string }[] = [
    {
      value: 'new',
      label:
        tab === 'new' && total > 0 ? `${t('app.inboxTabNew')} · ${total}` : t('app.inboxTabNew'),
    },
    { value: 'answered', label: t('app.inboxTabAnswered') },
    { value: 'all', label: t('app.inboxTabAll') },
  ];

  return (
    <Screen header={<TopBar back title={t('app.inboxTitle')} />}>
      <div className="flex flex-col gap-4 py-2">
        <SegmentedControl<SupportTab>
          fullWidth
          label={t('app.inboxTitle')}
          value={tab}
          onChange={setTab}
          options={tabs}
        />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          tab === 'new' ? (
            <EmptyState title={t('app.inboxEmptyNew')} description={t('app.inboxEmptyNewBody')} />
          ) : (
            <EmptyState title={t('app.inboxEmpty')} />
          )
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id}>
                <SupportCard
                  item={item}
                  busy={busyId === item.id}
                  disabled={busyId !== null && busyId !== item.id}
                  onReply={() => setReplyTo(item)}
                  onStatus={(s) => (s === 'closed' ? setClosing(item) : void changeStatus(item, s))}
                />
              </li>
            ))}
          </ul>
        )}
        {!loading && items.length < total ? (
          <Button variant="secondary" fullWidth loading={more} onClick={() => void loadMore()}>
            {t('app.inboxMore')}
          </Button>
        ) : null}
      </div>

      <ReplySheet
        item={replyTo}
        onClose={() => setReplyTo(null)}
        onSent={() => {
          setReplyTo(null);
          load(tab);
        }}
      />

      <Modal
        open={closing !== null}
        onClose={() => setClosing(null)}
        title={t('app.inboxConfirmCloseTitle')}
        description={t('app.inboxConfirmCloseBody')}
        confirmLabel={t('app.inboxClose')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busyId !== null}
        onConfirm={() => closing && void changeStatus(closing, 'closed')}
      />
    </Screen>
  );
}

interface SupportCardProps {
  item: SupportItem;
  busy: boolean;
  disabled: boolean;
  onReply: () => void;
  onStatus: (status: SupportState) => void;
}

function SupportCard({ item, busy, disabled, onReply, onStatus }: SupportCardProps) {
  const { t, locale } = useT();
  const chat = chatLink(item);
  const mail = mailLink(item);
  const lang = langLabel(item.lang);
  const delivery = deliveryKey(item.replyDelivery);
  const who = [item.username ? `@${item.username}` : null, item.email].filter(Boolean).join(' · ');

  return (
    <article className="flex flex-col gap-3 border-t border-border py-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display truncate text-[15px] leading-[1.24]">
            {item.name ?? t('app.inboxNoName')}
          </span>
          {who ? <span className="truncate text-sm text-muted">{who}</span> : null}
          <span className="text-xs text-muted-2">{formatMoscow(item.createdAt, locale)}</span>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge>{t(item.channel === 'bot' ? 'app.inboxChannelBot' : 'app.inboxChannelApp')}</Badge>
          {lang ? <Badge>{lang}</Badge> : null}
          {item.status === 'answered' ? (
            <Badge tone="inverse">{t('app.inboxStatusAnswered')}</Badge>
          ) : item.status === 'closed' ? (
            <Badge>{t('app.inboxStatusClosed')}</Badge>
          ) : null}
        </div>
      </header>

      {item.context ? (
        <span className="text-xs text-muted">
          {t('app.inboxContext', { context: item.context })}
        </span>
      ) : null}
      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{item.text}</p>
      {item.attachment ? (
        <span className="text-xs text-muted-2">{t('app.inboxAttachment')}</span>
      ) : null}

      {item.replyText ? (
        <div className="flex flex-col gap-1 border-l-2 border-border pl-3">
          <span className="text-xs text-muted-2">
            {item.answeredAt
              ? t('app.inboxAnswered', { date: formatMoscow(item.answeredAt, locale) })
              : t('app.inboxYourReply')}
          </span>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-muted">
            {item.replyText}
          </p>
          {delivery ? (
            <span
              className={
                item.replyDelivery === 'skipped' || item.replyDelivery === 'failed'
                  ? 'text-xs text-danger'
                  : 'text-xs text-muted-2'
              }
            >
              {t(delivery)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {item.canReply ? (
          <Button size="sm" loading={busy} disabled={disabled} onClick={onReply}>
            {t('app.inboxReply')}
          </Button>
        ) : null}
        {item.status === 'new' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => onStatus('answered')}
          >
            {t('app.inboxMarkAnswered')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => onStatus('new')}
          >
            {t('app.inboxReopen')}
          </Button>
        )}
        {chat ? (
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="control-label inline-flex min-h-9 items-center px-3 text-[11px] text-muted hover:text-text"
          >
            {t('app.inboxOpenChat')}
          </a>
        ) : null}
        {!chat && mail ? (
          <a
            href={mail}
            className="control-label inline-flex min-h-9 items-center px-3 text-[11px] text-muted hover:text-text"
          >
            {t('app.inboxWriteEmail')}
          </a>
        ) : null}
        {item.status === 'new' ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || disabled}
            onClick={() => onStatus('closed')}
          >
            {t('app.inboxClose')}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

interface ReplySheetProps {
  item: SupportItem | null;
  onClose: () => void;
  onSent: () => void;
}

/**
 * The reply: the question quoted, one field, the neon send. The draft is kept per message, so an
 * accidental backdrop tap loses nothing, and cleared once it has gone.
 */
function ReplySheet({ item, onClose, onSent }: ReplySheetProps) {
  const { t } = useT();
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keeps the last message on screen while the sheet animates closed.
  const [shown, setShown] = useState<SupportItem | null>(item);

  useEffect(() => {
    if (item) {
      setShown(item);
      setError(null);
    }
  }, [item]);

  const value = shown ? (drafts[shown.id] ?? '') : '';
  const check = checkSupportText(value);
  const length = supportLength(value);
  const route = shown ? replyRoute(shown) : 'none';

  const send = async () => {
    if (!shown || !check.ok) return;
    setBusy(true);
    setError(null);
    try {
      const result = await replySupport(shown.id, check.text);
      toast.show(
        result === 'demo'
          ? { kind: 'info', title: t('app.inboxReplyDemo') }
          : result === 'waiting'
            ? {
                kind: 'success',
                title: t('app.inboxReplyWaiting'),
                description: t('app.inboxReplyWaitingHint'),
              }
            : {
                kind: 'success',
                title: t('app.inboxReplySent'),
                description: t('app.inboxReplySentHint'),
              },
      );
      setDrafts((d) => {
        const next = { ...d };
        delete next[shown.id];
        return next;
      });
      onSent();
    } catch (e) {
      setError(t(replyErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={item !== null}
      onClose={onClose}
      title={t('app.inboxReplyTitle')}
      footer={
        <Button
          variant="action"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!check.ok}
          onClick={() => void send()}
        >
          {t('app.inboxReplySend')}
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
        {shown ? (
          <blockquote className="border-l-2 border-border pl-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-muted">
            {shown.text}
          </blockquote>
        ) : null}
        <p className="text-sm leading-relaxed text-muted">
          {t(route === 'chat' ? 'app.inboxReplyLeadBot' : 'app.inboxReplyLeadWait')}
        </p>
        <Textarea
          name="supportReply"
          autoFocus
          rows={5}
          aria-label={t('app.inboxReplyTitle')}
          placeholder={t('app.inboxReplyPlaceholder')}
          value={value}
          onChange={(e) => {
            const text = e.target.value;
            if (shown) setDrafts((d) => ({ ...d, [shown.id]: text }));
            if (error) setError(null);
          }}
          error={error ?? (length > SUPPORT_MAX ? t('app.supportErrorLong') : undefined)}
          hint={
            length > SUPPORT_MAX * 0.8
              ? t('app.supportCounter', { n: length, max: SUPPORT_MAX })
              : undefined
          }
        />
      </form>
    </Sheet>
  );
}
