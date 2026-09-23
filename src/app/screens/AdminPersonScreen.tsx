/**
 * The person page (admin): `/admin/people/<email>`.
 *
 * «Что у этого человека?» is asked several times a day — somebody wrote in, somebody paid and says
 * nothing opened, somebody is missing from the board. The answer used to be spread over five
 * screens, each searched by typing the address again. Here it is one page, from one call
 * (`admin_person`, 0046), with the things that are done about it on the same page:
 *
 *   - the blue field holds who this is and the facts that decide what to do next — how long they
 *     have been here, whether they got through the questionnaire, whether a subscription is live,
 *     whether Telegram is linked (which is how the coach can answer them);
 *   - the actions reuse the sheets and calls the rest of the admin already has: the purchase and
 *     subscription sheets prefilled with this address, the workout picker, the member update. The
 *     two that take something away ask first;
 *   - then the record, one card per question, newest first everywhere.
 *
 * An address nobody has signed in with still has a page: a pre-sale grant is a real thing, and the
 * page for it says «ещё не входил(а)» rather than «не найдено».
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroField } from '@/components/ui/HeroField';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatNumber, type TKey } from '@/i18n/index';
import { addPurchase, setSubscription } from '@/lib/api/admin';
import { endSubscription, getAdminPerson, type AdminPerson } from '@/lib/api/adminPerson';
import { assignCustomWorkout } from '@/lib/api/customWorkouts';
import { isAppError } from '@/lib/api/errors';
import { updateMarathonMember } from '@/lib/api/marathonAdmin';
import type { CustomWorkoutSummary, SubscriptionPlan } from '@/lib/api/types';
import { PLANS_ENABLED } from '@content/site/plans';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { AddPurchaseSheet } from '@/app/features/admin/AddPurchaseSheet';
import { AddSubscriptionSheet } from '@/app/features/admin/AddSubscriptionSheet';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { WorkoutPickerSheet } from '@/app/features/admin/courses/WorkoutPickerSheet';
import { courseName } from '@/app/features/admin/model';
import { STATUS_LABEL } from '@/app/features/admin/PurchaseList';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import {
  activeClubMemberships,
  canCloseAccess,
  duoPartners,
  formatMoney,
  proofState,
  sessionTitle,
  type ProofState,
} from '@/app/features/admin/person/model';
import { emailFromParam, personPath } from '@/app/features/admin/person/path';

type Status = 'loading' | 'ready' | 'error';
type Open = 'course' | 'sub' | 'workout' | 'close' | 'remove' | null;

const PROOF_LABEL: Record<ProofState, TKey> = {
  rejected: 'app.personProofRejected',
  waiting: 'app.personProofWaiting',
  accepted: 'app.personProofAccepted',
  counted: 'app.personProofCounted',
};

const PROOF_TONE: Record<ProofState, BadgeTone> = {
  rejected: 'danger',
  waiting: 'warning',
  accepted: 'success',
  counted: 'neutral',
};

const INTENT_LABEL: Record<string, TKey> = {
  course: 'app.personPayCourse',
  monthly: 'app.personPayMonthly',
  annual: 'app.personPayAnnual',
  session: 'app.personPaySession',
};

/** A card with a heading; the page's record is a column of these. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding="md" role="region" aria-label={title} className="flex flex-col gap-3">
      <h2 className="font-display text-lg">{title}</h2>
      {children}
    </Card>
  );
}

/** A hairline row: the thing on the left, its state on the right. */
function Row({ main, sub, side }: { main: ReactNode; sub?: ReactNode; side?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] leading-tight break-words text-text">{main}</span>
        {sub ? <span className="text-[12px] leading-tight text-muted-2">{sub}</span> : null}
      </span>
      {side ? <span className="flex shrink-0 flex-col items-end gap-1">{side}</span> : null}
    </li>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[14px] text-muted-2">{children}</p>;
}

export default function AdminPersonScreen() {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const admin = useIsAdmin();
  const navigate = useNavigate();
  const params = useParams();
  const email = emailFromParam(params.email);

  const [person, setPerson] = useState<AdminPerson | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  useEffect(() => {
    if (admin !== true || !email) return;
    let alive = true;
    setStatus('loading');
    getAdminPerson(email)
      .then((p) => {
        if (!alive) return;
        setPerson(p);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e);
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [admin, email, tick]);

  // A different address in the URL is a different person: never show the last one's record.
  useEffect(() => {
    setPerson(null);
    setStatus('loading');
  }, [email]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const fail = (e: unknown) =>
    toast.show({
      kind: 'error',
      title: t('app.adminActionError'),
      description: adminErrorTitle(tr, e, 'common.errorGeneric'),
    });

  /** Run an action, say how it went, and read the person again. */
  const act = async (fn: () => Promise<unknown>, success: TKey) => {
    setBusy(true);
    setSheetError(null);
    try {
      await fn();
      toast.show({ kind: 'success', title: t(success) });
      setOpen(null);
      reload();
    } catch (e) {
      if (isAppError(e) && e.code === 'validation') setSheetError(t('app.adminInvalidEmail'));
      else fail(e);
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    // Opened from a link with nothing behind it: go to the admin rather than out of the app.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void navigate(-1);
    else void navigate('/admin');
  };

  const header = (
    <TopBar
      back={back}
      title={t('app.personTitle')}
      right={
        <IconButton
          label={t('app.adminRefresh')}
          icon={status === 'loading' && person ? <Spinner size={16} /> : 'refresh'}
          variant="ghost"
          size="sm"
          disabled={admin !== true || !email}
          onClick={reload}
        />
      }
    />
  );

  if (admin === false) return <Navigate to="/" replace />;
  if (admin === null) {
    return (
      <Screen header={header}>
        <LoadingBlock />
      </Screen>
    );
  }
  if (!email) {
    return (
      <Screen header={header}>
        <EmptyState title={t('app.personBadEmail')} description={t('app.personBadEmailBody')} />
      </Screen>
    );
  }
  if (!person) {
    return (
      <Screen header={header}>
        {status === 'error' ? (
          <EmptyState
            title={t('app.personLoadError')}
            description={adminErrorTitle(tr, loadError, 'common.errorGeneric')}
            action={
              <Button size="lg" onClick={reload}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : (
          <LoadingBlock />
        )}
      </Screen>
    );
  }

  const p = person;
  const name = p.profile?.displayName?.trim() || t('app.personNoName');
  const clubRows = activeClubMemberships(p);
  const partners = duoPartners(p);
  const closable = canCloseAccess(p);
  const date = (iso: string | null, style: 'short' | 'long' = 'short') =>
    iso ? formatDate(locale, iso, style) : '—';

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-4 py-2">
        {/* A failed refresh keeps the record on screen and says so, rather than blanking it. */}
        {status === 'error' ? (
          <p role="alert" className="text-[13px] text-danger">
            {t('app.personLoadError')} · {adminErrorTitle(tr, loadError, 'common.errorGeneric')}
          </p>
        ) : null}
        {/* --- who ------------------------------------------------------------ */}
        <HeroField padding="lg" className="flex flex-col gap-3">
          <span className="eyebrow break-all text-on-field/85">{p.email}</span>
          <h1 className="display text-3xl break-words">{name}</h1>
          <div className="flex flex-wrap gap-2">
            {p.profile ? (
              <>
                <Pill tone="ghost">
                  {t('app.personSince', { date: date(p.profile.createdAt, 'long') })}
                </Pill>
                <Pill tone="ghost">
                  {p.profile.onboardedAt ? t('app.personOnboarded') : t('app.personNotOnboarded')}
                </Pill>
                {p.profile.fitnessLevel ? (
                  <Pill tone="ghost">{t('app.personLevel', { n: p.profile.fitnessLevel })}</Pill>
                ) : null}
                <Pill tone="ghost">
                  {p.profile.telegramLinked ? t('app.personTelegram') : t('app.personNoTelegram')}
                </Pill>
                <Pill tone="ghost">{p.profile.locale.toUpperCase()}</Pill>
              </>
            ) : (
              <Pill tone="ghost">{t('app.personNeverSignedIn')}</Pill>
            )}
            {partners ? (
              <Pill tone="ghost">
                {t('app.personPartner', {
                  name: partners.map((x) => x.displayName?.trim() || x.email).join(', '),
                })}
              </Pill>
            ) : null}
            {/* The one fact that decides most conversations, as the sticker. */}
            <Pill tone={p.subscription?.live ? 'white' : 'ghost'}>
              {p.subscription?.live
                ? t('app.personSubUntil', { date: date(p.subscription.expiresAt, 'long') })
                : t('app.personNoSub')}
            </Pill>
          </div>
        </HeroField>

        {/* --- what can be done ------------------------------------------------ */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Glyph size={14}>+</Glyph>}
            onClick={() => {
              setSheetError(null);
              setOpen('course');
            }}
          >
            {t('app.personGiveCourse')}
          </Button>
          {PLANS_ENABLED ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<Glyph size={14}>+</Glyph>}
              onClick={() => {
                setSheetError(null);
                setOpen('sub');
              }}
            >
              {t('app.personGiveSub')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            icon={<Glyph size={14}>+</Glyph>}
            onClick={() => setOpen('workout')}
          >
            {t('app.personGiveWorkout')}
          </Button>
          {closable ? (
            <Button size="sm" variant="ghost" onClick={() => setOpen('close')}>
              {t('app.personCloseAccess')}
            </Button>
          ) : null}
          {clubRows.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setOpen('remove')}>
              {t('app.personRemoveClub')}
            </Button>
          ) : null}
        </div>

        {/* --- access -------------------------------------------------------- */}
        <Section title={t('app.personAccess')}>
          <ul className="flex flex-col">
            {p.subscription ? (
              <Row
                main={`${t('app.personSubscription')} · ${
                  p.subscription.plan === 'annual' ? t('app.planAnnual') : t('app.planMonthly')
                }`}
                sub={[
                  p.subscription.expiresAt
                    ? p.subscription.live
                      ? t('app.adminSubUntil', { date: date(p.subscription.expiresAt, 'long') })
                      : `${t('app.adminSubExpired')} ${date(p.subscription.expiresAt, 'long')}`
                    : null,
                  p.subscription.source,
                  p.subscription.note,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                side={
                  <Badge tone={p.subscription.live ? 'inverse' : 'neutral'}>
                    {t(
                      p.subscription.status === 'active'
                        ? 'app.adminSubStatusActive'
                        : p.subscription.status === 'cancelled'
                          ? 'app.adminSubStatusCancelled'
                          : 'app.adminSubStatusPending',
                    )}
                  </Badge>
                }
              />
            ) : null}
            {p.purchases.map((row) => (
              <Row
                key={row.id}
                main={courseName(row.courseId, locale)}
                sub={[date(row.activatedAt ?? row.createdAt, 'long'), row.source, row.note]
                  .filter(Boolean)
                  .join(' · ')}
                side={
                  <Badge
                    tone={
                      row.status === 'active'
                        ? 'inverse'
                        : row.status === 'refunded'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {t(STATUS_LABEL[row.status])}
                  </Badge>
                }
              />
            ))}
          </ul>
          {!p.subscription && p.purchases.length === 0 ? (
            <Empty>{t('app.personNoPurchases')}</Empty>
          ) : null}
        </Section>

        {/* --- club ------------------------------------------------------------ */}
        <Section title={t('app.personClub')}>
          <p className="text-[14px] text-muted">
            {p.clubAccess ? t('app.personClubAccess') : t('app.personClubNoAccess')}
          </p>
          {p.memberships.length === 0 ? (
            <Empty>{t('app.personNotInClub')}</Empty>
          ) : (
            <ul className="flex flex-col">
              {p.memberships.map((m) => (
                <Row
                  key={m.memberId}
                  main={
                    m.isClub
                      ? `${t('app.personClub')} · ${m.solo ? t('app.personSolo') : t('app.personDuo')}`
                      : m.marathonTitle
                  }
                  sub={
                    m.solo ? null : m.partners.length > 0 ? (
                      <>
                        {t('app.personPartnerLead')}{' '}
                        {m.partners.map((x, i) => (
                          <span key={x.email}>
                            {i > 0 ? ', ' : null}
                            <button
                              type="button"
                              className="underline decoration-border-strong underline-offset-2 hover:text-text"
                              onClick={() => void navigate(personPath(x.email))}
                            >
                              {x.displayName?.trim() || x.email}
                            </button>
                          </span>
                        ))}
                      </>
                    ) : (
                      t('app.personNoPartner')
                    )
                  }
                  side={
                    m.status === 'removed' ? (
                      <Badge tone="warning">{t('app.personRemoved')}</Badge>
                    ) : (
                      <span className="text-[12px] text-muted-2">{date(m.joinedAt)}</span>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </Section>

        {/* --- proofs ---------------------------------------------------------- */}
        <Section title={t('app.personProofs')}>
          {p.proofs.length === 0 ? (
            <Empty>{t('app.personNoProofs')}</Empty>
          ) : (
            <ul className="flex flex-col">
              {p.proofs.map((proof) => {
                const state = proofState(proof);
                return (
                  <Row
                    key={proof.id}
                    main={proof.taskTitle}
                    sub={[
                      proof.isClub ? t('app.personClub') : proof.marathonTitle,
                      t('app.personProofDay', { n: proof.dayIndex }),
                      date(proof.submittedAt),
                      state === 'rejected' ? proof.voidReason : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    side={<Badge tone={PROOF_TONE[state]}>{t(PROOF_LABEL[state])}</Badge>}
                  />
                );
              })}
            </ul>
          )}
        </Section>

        {/* --- workouts from the coach ----------------------------------------- */}
        <Section title={t('app.personAssigned')}>
          {p.assigned.length === 0 ? (
            <Empty>{t('app.personNoAssigned')}</Empty>
          ) : (
            <ul className="flex flex-col">
              {p.assigned.map((w) => (
                <Row
                  key={w.workoutId}
                  main={(locale === 'en' && w.titleEn) || w.title}
                  sub={[date(w.assignedAt), w.note].filter(Boolean).join(' · ')}
                  side={
                    <Badge tone={w.done ? 'success' : 'neutral'}>
                      {w.done ? t('app.personAssignedDone') : t('app.personAssignedOpen')}
                    </Badge>
                  }
                />
              ))}
            </ul>
          )}
        </Section>

        {/* --- training -------------------------------------------------------- */}
        <Section title={t('app.personActivity')}>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                [p.activity.sessions, 'app.personActSessions'],
                [p.activity.days, 'app.personActDays'],
                [p.activity.points, 'app.personActPoints'],
              ] as const
            ).map(([n, key]) => (
              <div key={key} className="flex flex-col gap-1 rounded-control bg-surface-2 p-3">
                <span className="font-display tabular text-xl leading-none">
                  {formatNumber(locale, n)}
                </span>
                <span className="text-[12px] text-muted">{t(key)}</span>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-muted">
            {p.activity.lastCompletedAt
              ? t('app.personActLast', { date: date(p.activity.lastCompletedAt, 'long') })
              : t('app.personActNever')}
          </p>
          {p.sessions.length > 0 ? (
            <ul className="flex flex-col">
              {p.sessions.map((s) => {
                const title = sessionTitle(s, locale);
                return (
                  <Row
                    key={s.id}
                    main={title.workout}
                    sub={`${title.course} · ${date(s.startedAt)}`}
                    side={
                      s.completedAt ? (
                        <span className="tabular text-[13px] text-text">
                          {t('app.personSessionPoints', { n: formatNumber(locale, s.points) })}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-2">
                          {t('app.personSessionOpen')}
                        </span>
                      )
                    }
                  />
                );
              })}
            </ul>
          ) : null}
        </Section>

        {/* --- support --------------------------------------------------------- */}
        <Section title={t('app.personSupport')}>
          {p.support.length === 0 ? (
            <Empty>{t('app.personNoSupport')}</Empty>
          ) : (
            <>
              <ul className="flex flex-col">
                {p.support.map((r) => (
                  <Row
                    key={r.id}
                    main={
                      r.channel === 'telegram'
                        ? t('app.personSupportTelegram')
                        : t('app.personSupportApp')
                    }
                    sub={[date(r.createdAt, 'long'), r.status].filter(Boolean).join(' · ')}
                    side={
                      r.accepted ? null : (
                        <Badge tone="warning">{t('app.personSupportLimited')}</Badge>
                      )
                    }
                  />
                ))}
              </ul>
              <p className="text-[12px] text-muted-2">{t('app.personSupportNote')}</p>
            </>
          )}
        </Section>

        {/* --- payments -------------------------------------------------------- */}
        <Section title={t('app.personPayments')}>
          {p.payments.length === 0 ? (
            <Empty>{t('app.personNoPayments')}</Empty>
          ) : (
            <ul className="flex flex-col">
              {p.payments.map((pay) => {
                const intent = INTENT_LABEL[pay.intent];
                return (
                  <Row
                    key={pay.id}
                    main={`${formatMoney(pay.amount, pay.currency, locale)} · ${
                      intent ? t(intent) : pay.intent
                    }`}
                    sub={[
                      date(pay.paidAt, 'long'),
                      pay.provider,
                      pay.email.toLowerCase() !== p.email
                        ? t('app.personPayVia', { email: pay.email })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    side={
                      <Badge tone={pay.applied || pay.claimedAt ? 'success' : 'warning'}>
                        {pay.claimedAt
                          ? t('app.personPayClaimed', { date: date(pay.claimedAt) })
                          : pay.applied
                            ? t('app.personPayApplied')
                            : t('app.personPayPending')}
                      </Badge>
                    }
                  />
                );
              })}
            </ul>
          )}
          {p.paymentEmails.length > 0 ? (
            <p className="text-[12px] break-all text-muted-2">
              {t('app.personPayEmails', { emails: p.paymentEmails.join(', ') })}
            </p>
          ) : null}
        </Section>
      </div>

      {/* --- the actions' sheets and confirmations --------------------------- */}
      <AddPurchaseSheet
        open={open === 'course'}
        prefillEmail={p.email}
        busy={busy}
        error={sheetError}
        onClose={() => setOpen(null)}
        onSubmit={(to, courseId, note) =>
          void act(() => addPurchase(to, courseId, note), 'app.adminAdded')
        }
      />
      <AddSubscriptionSheet
        open={open === 'sub'}
        prefillEmail={p.email}
        busy={busy}
        error={sheetError}
        onClose={() => setOpen(null)}
        onSubmit={(to, plan: SubscriptionPlan, until, note) =>
          void act(
            () => setSubscription({ email: to, plan, status: 'active', expiresAt: until, note }),
            'app.adminSubAdded',
          )
        }
      />
      <WorkoutPickerSheet
        open={open === 'workout'}
        title={t('app.personWorkoutPick')}
        onClose={() => setOpen(null)}
        onPick={(w: CustomWorkoutSummary) =>
          void act(() => assignCustomWorkout(w.id, p.email), 'app.personWorkoutGiven')
        }
      />
      <Modal
        open={open === 'close'}
        onClose={() => setOpen(null)}
        title={t('app.personCloseTitle')}
        description={`${p.email}. ${t('app.personCloseBody')}`}
        confirmLabel={t('app.personCloseAccess')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void act(() => endSubscription(p.email), 'app.personClosed')}
      />
      <Modal
        open={open === 'remove'}
        onClose={() => setOpen(null)}
        title={t('app.personRemoveTitle')}
        description={`${name}. ${
          p.clubAccess ? t('app.personRemoveBodyAccess') : t('app.personRemoveBody')
        }`}
        confirmLabel={t('app.personRemoveClub')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() =>
          void act(
            () =>
              Promise.all(
                clubRows.map((m) => updateMarathonMember(m.memberId, { status: 'removed' })),
              ),
            'app.personRemovedToast',
          )
        }
      />
    </Screen>
  );
}
