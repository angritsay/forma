/**
 * «Кабинет автора» (0064): where a creator applies, waits, and then sees their money.
 *
 * Owner, 8 Oct 2026: creators should be able to sign up and launch without her, and see their
 * sales, members and what they are owed — «creators stay when they can see their money». This is
 * the first phase of that (docs/PLATFORM.md):
 *
 * - **Nobody yet** — the two plans in one line each (read from `creatorTerms.ts`, as on
 *   `/creators/`) and the application: the page address, the name, a line about them, a link to
 *   their audience, the follower count.
 * - **Applied / declined** — what happens next, and the same form to change the application.
 * - **Open** — the plan, the address, courses and buyers, this month's sales and «what is yours»,
 *   who owes whom, the months, and the closed (numbered) months. Course sales only: the club and
 *   the sessions are one shared club and Forma's coaches until creators have their own (phase 2),
 *   and the screen says so rather than show a zero that looks like a result.
 *
 * «Мои курсы» (0065) opens the course builder in the creator's scope (`/creator/courses`): their
 * own drafts, built and sent for review; the owner publishes.
 *
 * The page address is shown, not linked: public creator pages arrive with phase 2, and a link that
 * opens the 404 would be the first thing a new creator shares.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatNumber, type TKey } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import {
  applyAsCreator,
  CREATOR_SLUG_RE,
  getMyCreator,
  listMyInvoices,
  listMyStatement,
} from '@/lib/api/creators';
import type { CreatorInvoice, CreatorStatementRow, MyCreator } from '@/lib/api/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { formatMoney } from '@/app/features/admin/money';
import {
  balanceSide,
  creatorAddress,
  creatorStage,
  salesCount,
  statementMonths,
} from '@/app/features/creator/model';
import { BRAND } from '@content/site/brand';
import { CREATOR_TIER_BY_ID, percent } from '@content/site/creatorTerms';
import { formatPrice } from '@content/site/pricing';

/** Server words an application can come back with, and what the form says for each. */
const APPLY_ERRORS: Record<string, TKey> = {
  invalid_slug: 'app.creatorErrSlug',
  slug_taken: 'app.creatorErrSlugTaken',
  invalid_name: 'app.creatorErrName',
  invalid_url: 'app.creatorErrUrl',
  invalid_about: 'app.creatorErrAbout',
  invalid_followers: 'app.creatorErrFollowers',
  already_creator: 'app.creatorErrAlready',
};

function monthLabel(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card flex min-w-0 flex-col gap-1 rounded-card p-4">
      <span className="font-display tabular text-[24px] leading-none [overflow-wrap:anywhere]">
        {value}
      </span>
      <span className="text-[12px] leading-tight text-muted">{label}</span>
    </div>
  );
}

interface FormProps {
  initial: MyCreator | null;
  onSaved: () => void;
}

function ApplyForm({ initial, onSaved }: FormProps) {
  const { t } = useT();
  const toast = useToast();
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [about, setAbout] = useState(initial?.about ?? '');
  const [url, setUrl] = useState(initial?.audienceUrl ?? '');
  const [followers, setFollowers] = useState(
    initial?.followers != null ? String(initial.followers) : '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanSlug = slug.trim().toLowerCase();
  const slugOk = CREATOR_SLUG_RE.test(cleanSlug);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!slugOk) {
      setError(t('app.creatorErrSlug'));
      return;
    }
    setBusy(true);
    setError(null);
    const count = followers.trim() ? Number(followers.replace(/\s+/g, '')) : null;
    applyAsCreator({
      slug: cleanSlug,
      name,
      about,
      audienceUrl: url,
      followers: count !== null && Number.isFinite(count) ? Math.round(count) : null,
    })
      .then(() => {
        toast.show({ kind: 'success', title: t('app.creatorApplied') });
        onSaved();
      })
      .catch((err: unknown) => {
        const key = isAppError(err) ? APPLY_ERRORS[err.message] : undefined;
        setError(t(key ?? 'app.creatorErrGeneric'));
      })
      .finally(() => setBusy(false));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label={t('app.creatorSlug')}
        hint={t('app.creatorSlugHint', {
          address: creatorAddress(BRAND.domain, cleanSlug || 'name'),
        })}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        maxLength={30}
        required
      />
      <Input
        label={t('app.creatorName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        required
      />
      <Textarea
        label={t('app.creatorAbout')}
        hint={t('app.creatorAboutHint')}
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <Input
        label={t('app.creatorAudience')}
        hint={t('app.creatorAudienceHint')}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
        inputMode="url"
        placeholder="https://t.me/…"
        autoCapitalize="none"
      />
      <Input
        label={t('app.creatorFollowers')}
        value={followers}
        onChange={(e) => setFollowers(e.target.value)}
        inputMode="numeric"
        placeholder="20000"
      />
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>
        {initial ? t('app.creatorUpdate') : t('app.creatorApply')}
      </Button>
    </form>
  );
}

/** The two plans in one line each, from the same numbers `/creators/` states. */
function Plans() {
  const { t, locale } = useT();
  const start = CREATOR_TIER_BY_ID.get('start')!;
  const pro = CREATOR_TIER_BY_ID.get('pro')!;
  return (
    <ul className="flex flex-col gap-2">
      <li className="glass-card flex flex-col gap-1 rounded-card p-4">
        <span className="font-display text-lg">{t('app.creatorTierStart')}</span>
        <span className="text-[13px] leading-snug text-muted">
          {t('app.creatorTierStartLine', {
            you: percent(1 - start.salesShare),
            sessions: percent(1 - start.sessionsShare),
          })}
        </span>
      </li>
      <li className="glass-card flex flex-col gap-1 rounded-card p-4">
        <span className="font-display text-lg">{t('app.creatorTierPro')}</span>
        <span className="text-[13px] leading-snug text-muted">
          {t('app.creatorTierProLine', {
            fee: formatPrice(locale, pro.monthlyFee),
            you: percent(1 - pro.salesShare),
            sessions: percent(1 - pro.sessionsShare),
          })}
        </span>
      </li>
    </ul>
  );
}

function BalanceLine({ row }: { row: CreatorStatementRow }) {
  const { t, locale } = useT();
  const side = balanceSide(row.balance);
  const sum = formatMoney(locale, Math.abs(row.balance), row.currency);
  return (
    <span className="text-[13px] text-muted">
      {side === 'creatorOwes'
        ? t('app.creatorOwesForma', { sum })
        : side === 'formaOwes'
          ? t('app.creatorFormaOwes', { sum })
          : t('app.creatorEven')}
    </span>
  );
}

function Dashboard({ me }: { me: MyCreator }) {
  const { t, locale } = useT();
  const [rows, setRows] = useState<CreatorStatementRow[] | null>(null);
  const [invoices, setInvoices] = useState<CreatorInvoice[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([listMyStatement(12), listMyInvoices()])
      .then(([s, inv]) => {
        if (!alive) return;
        setRows(s);
        setInvoices(inv);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const n = (v: number) => formatNumber(locale, v);
  const months = statementMonths(rows ?? []);
  const thisMonth = `${toLocalDateIso().slice(0, 7)}-01`;
  const now = months.find((m) => m.month === thisMonth);
  const tierName = t(me.tier === 'pro' ? 'app.creatorTierPro' : 'app.creatorTierStart');

  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl leading-tight">{me.name}</h2>
          <Badge tone="neutral" size="sm">
            {tierName}
          </Badge>
          {me.status === 'paused' ? (
            <Badge tone="warning" size="sm">
              {t('app.creatorPaused')}
            </Badge>
          ) : null}
        </div>
        <p className="text-[13px] text-muted">
          {t('app.creatorAddress', { address: creatorAddress(BRAND.domain, me.slug) })}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile label={t('app.creatorCourses')} value={n(me.courses)} />
        <Tile label={t('app.creatorBuyers')} value={n(me.buyers)} />
        <Tile label={t('app.creatorSalesNow')} value={n(salesCount(now))} />
        <Tile
          label={t('app.creatorYoursNow')}
          value={
            now
              ? now.rows
                  .filter((r) => r.creatorShare > 0)
                  .map((r) => formatMoney(locale, r.creatorShare, r.currency))
                  .join(' · ') || '—'
              : '—'
          }
        />
      </div>

      {/*
       * The builder for their own courses (0065): one row, the way the account sheet links its
       * screens — a title, a quiet line under it, the arrow. Paused creators still open it to read.
       */}
      <Link
        to="/creator/courses"
        className="glass-card flex items-center gap-3 rounded-card p-4 transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-display text-lg">{t('app.creatorCoursesOpen')}</span>
          <span className="text-[13px] leading-snug text-muted">{t('app.creatorCoursesLine')}</span>
        </span>
        <Glyph size={16} className="shrink-0 text-muted-2">
          ›
        </Glyph>
      </Link>

      {me.courses === 0 ? (
        <p className="text-[14px] leading-snug text-muted">{t('app.creatorNoCourses')}</p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl">{t('app.creatorMonths')}</h2>
        <p className="text-[12px] leading-snug text-muted-2">
          {t('app.creatorMonthsNote', { fee: `${me.feePct}%` })}
        </p>
        {failed ? (
          <p className="text-[14px] text-muted">{t('app.creatorLoadError')}</p>
        ) : rows === null ? (
          <LoadingBlock />
        ) : months.length === 0 ? (
          <p className="text-[14px] text-muted">{t('app.creatorNoSales')}</p>
        ) : (
          <ul className="flex flex-col">
            {months.map((m) => (
              <li
                key={m.month}
                className="flex flex-col gap-1.5 border-t border-border py-3 first:border-t-0"
              >
                <span className="text-[14px] text-text first-letter:uppercase">
                  {monthLabel(locale, m.month)}
                </span>
                {m.rows.map((r) => (
                  <div key={r.currency} className="flex flex-col gap-0.5">
                    <span className="tabular text-[13px] text-text">
                      {t('app.creatorMonthLine', {
                        sales: n(r.sales),
                        gross: formatMoney(locale, r.gross, r.currency),
                        yours: formatMoney(locale, r.creatorShare, r.currency),
                      })}
                      {r.monthlyFee > 0
                        ? ` · ${t('app.creatorFeeLine', { fee: formatMoney(locale, r.monthlyFee, r.currency) })}`
                        : ''}
                    </span>
                    <BalanceLine row={r} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl">{t('app.creatorInvoices')}</h2>
        {invoices.length === 0 ? (
          <p className="text-[14px] text-muted">{t('app.creatorNoInvoices')}</p>
        ) : (
          <ul className="flex flex-col">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="tabular truncate text-[14px] text-text">{inv.number}</span>
                  <span className="text-[12px] text-muted-2">
                    {balanceSide(inv.balance) === 'creatorOwes'
                      ? t('app.creatorOwesForma', {
                          sum: formatMoney(locale, inv.balance, inv.currency),
                        })
                      : balanceSide(inv.balance) === 'formaOwes'
                        ? t('app.creatorFormaOwes', {
                            sum: formatMoney(locale, -inv.balance, inv.currency),
                          })
                        : t('app.creatorEven')}
                  </span>
                </span>
                <Badge tone={inv.settledAt ? 'success' : 'neutral'} size="sm">
                  {inv.settledAt
                    ? t('app.creatorSettled', {
                        date: formatDate(locale, inv.settledAt.slice(0, 10)),
                      })
                    : t('app.creatorOpen')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function CreatorScreen() {
  const { t } = useT();
  const [me, setMe] = useState<MyCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    getMyCreator()
      .then(setMe)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const stage = creatorStage(me?.status);

  return (
    <Screen header={<TopBar back title={t('app.creatorTitle')} />}>
      {loading ? (
        <LoadingBlock />
      ) : failed ? (
        <EmptyState className="py-16" title={t('app.creatorLoadError')} />
      ) : stage === 'open' && me ? (
        <Dashboard me={me} />
      ) : (
        <div className="flex flex-col gap-8 pt-6">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-2xl leading-tight text-balance">
              {stage === 'none'
                ? t('app.creatorIntroTitle')
                : stage === 'applied'
                  ? t('app.creatorAppliedTitle')
                  : t('app.creatorDeclinedTitle')}
            </h2>
            <p className="text-[14px] leading-snug text-muted">
              {stage === 'none'
                ? t('app.creatorIntroBody')
                : stage === 'applied'
                  ? t('app.creatorAppliedBody')
                  : t('app.creatorDeclinedBody')}
            </p>
          </section>
          {stage === 'none' ? <Plans /> : null}
          <ApplyForm initial={me} onSaved={load} />
        </div>
      )}
    </Screen>
  );
}
