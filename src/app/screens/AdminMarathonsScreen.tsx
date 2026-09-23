/**
 * The coach's marathons (admins only): every run, drafts and finished ones included.
 *
 * A marathon is created with a handle, a name and a start date and nothing else, because the day
 * plan is written one morning at a time and the thing has to exist before the first morning. It
 * starts as a draft — invisible to members — until he switches it to running.
 *
 * Two things sit above the list since 0047. «Не просмотрено» — proof from both live clubs nobody
 * has looked at yet, which is what the owner opens this screen for most mornings; `?proof=<id>`
 * opens one of them (the Telegram «Пруф прислали заново» link). And a badge on the rounds that are
 * the live club right now, solo and duo, listed first — so «which one are people in» is never a
 * guess. A new round can become the live club as it is created; that is asked, and confirmed,
 * because members see it the moment it happens.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { createMarathon, listMarathons, setLiveClub } from '@/lib/api/marathonAdmin';
import type { MarathonRow, MarathonStatus } from '@/lib/api/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { MARATHON_SLUG_RE, statusKey } from '@/app/features/marathon/admin/model';
import {
  clubErrorKey,
  liveClubs,
  proofIdFromSearch,
} from '@/app/features/marathon/admin/clubTools';
import { ProofQueue } from '@/app/features/marathon/admin/ProofQueue';

export default function AdminMarathonsScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const admin = useIsAdmin();

  const [rows, setRows] = useState<MarathonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [startsOn, setStartsOn] = useState(toLocalDateIso());
  /*
   * How it is played, asked here rather than left to a settings tab afterwards.
   *
   * It decides what every other screen offers — whether there are teams to build, whether a task
   * can wait for a partner — so it is the wrong thing to discover after the people have been added
   * and the first week planned. Pairs stay the default because that is Sergey's format.
   */
  const [teamSize, setTeamSize] = useState('2');
  /** «Сделать клубом сейчас?» — 'no' leaves it a draft, as before. */
  const [makeLive, setMakeLive] = useState<'no' | 'yes'>('no');
  const [confirmLive, setConfirmLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useSearchParams();
  const openProofId = proofIdFromSearch(search);
  const closeProof = useCallback(
    () =>
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('proof');
          return next;
        },
        { replace: true },
      ),
    [setSearch],
  );

  const live = useMemo(() => liveClubs(rows), [rows]);
  // The live clubs first: they are the ones people are in.
  const sorted = useMemo(() => {
    const isLive = (r: MarathonRow) => r.id === live.solo || r.id === live.duo;
    return [...rows].sort((a, b) => Number(isLive(b)) - Number(isLive(a)));
  }, [rows, live]);

  const refresh = useCallback(() => {
    setLoading(true);
    listMarathons()
      .then(setRows)
      .catch(() => toast.show({ kind: 'error', title: t('app.mAdminLoadError') }))
      .finally(() => setLoading(false));
  }, [toast, t]);

  useEffect(() => {
    if (admin) refresh();
  }, [admin, refresh]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  const slugError =
    slug !== '' && !MARATHON_SLUG_RE.test(slug) ? t('app.mAdminSlugInvalid') : undefined;

  const duoNew = Number(teamSize) > 1;
  const previousLive = rows.find((r) => r.id === (duoNew ? live.duo : live.solo)) ?? null;

  const create = async () => {
    if (!MARATHON_SLUG_RE.test(slug) || !title.trim()) return;
    setBusy(true);
    try {
      const made = await createMarathon({
        slug,
        title: title.trim(),
        startsOn,
        teamSize: Number(teamSize),
        // A club does not end (0016): ten years, as the two clubs the migrations made.
        days: makeLive === 'yes' ? 3650 : undefined,
      });
      if (makeLive === 'yes') {
        try {
          await setLiveClub(made.id, duoNew);
          toast.show({ kind: 'success', title: t('app.clubLiveDone') });
        } catch (e) {
          // The round exists either way; say what did not happen and open it.
          toast.show({ kind: 'error', title: t(clubErrorKey(e)) });
        }
      }
      setOpen(false);
      setConfirmLive(false);
      setSlug('');
      setTitle('');
      setTeamSize('2');
      setMakeLive('no');
      navigate(`/admin/marathons/${made.id}`);
    } catch {
      toast.show({ kind: 'error', title: t('app.mAdminCreateError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<TopBar back title={t('app.mAdminTitle')} />}
      footer={
        <Button size="lg" fullWidth icon={<Glyph size={16}>+</Glyph>} onClick={() => setOpen(true)}>
          {t('app.mAdminNew')}
        </Button>
      }
    >
      <div className="flex flex-col gap-8 py-2">
        <ProofQueue openProofId={openProofId} onCloseProof={closeProof} />
        <div className="flex flex-col">
          <h2 className="font-display pb-2 text-xl">{t('app.clubRoundsTitle')}</h2>
          {loading ? (
            <LoadingBlock />
          ) : rows.length === 0 ? (
            <EmptyState title={t('app.mAdminEmpty')} description={t('app.mAdminEmptyBody')} />
          ) : (
            <ul className="flex flex-col">
              {sorted.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/marathons/${row.id}`)}
                    className="flex w-full items-center gap-3 border-t border-border py-3.5 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-display truncate text-[15px] leading-[1.24]">
                        {row.title}
                      </span>
                      <span className="text-xs text-muted">
                        {row.startsOn} · {t('app.mAdminDays')} {formatNumber(locale, row.days)}
                      </span>
                    </span>
                    {row.id === live.solo || row.id === live.duo ? (
                      <Badge tone="success">
                        {t(row.teamSize > 1 ? 'app.clubLiveBadgeDuo' : 'app.clubLiveBadgeSolo')}
                      </Badge>
                    ) : (
                      <StatusBadge status={row.status} />
                    )}
                    <Glyph size={16} className="shrink-0 text-muted-2">
                      ›
                    </Glyph>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('app.mAdminNew')}
        footer={
          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={!MARATHON_SLUG_RE.test(slug) || !title.trim()}
            onClick={() => (makeLive === 'yes' ? setConfirmLive(true) : void create())}
          >
            {t('app.mAdminCreate')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <Input
            label={t('app.mAdminName')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label={t('app.mAdminSlug')}
            hint={t('app.mAdminSlugHint')}
            error={slugError}
            value={slug}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={(e) => setSlug(e.target.value.trim().toLowerCase())}
          />
          <Input
            label={t('app.mAdminStarts')}
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
          />
          <Select
            label={t('app.mAdminTeamSize')}
            hint={t('app.mAdminTeamSizeHint')}
            value={teamSize}
            onChange={setTeamSize}
            options={[
              { value: '2', label: t('app.mAdminTeamSizePair') },
              { value: '1', label: t('app.mAdminTeamSizeSolo') },
            ]}
          />
          <Select<'no' | 'yes'>
            label={t('app.clubLiveAsk')}
            hint={t('app.clubLiveAskHint')}
            value={makeLive}
            onChange={setMakeLive}
            options={[
              { value: 'no', label: t('app.clubLiveAskNo') },
              {
                value: 'yes',
                label: t(duoNew ? 'app.clubLiveAskYesDuo' : 'app.clubLiveAskYesSolo'),
              },
            ]}
          />
        </div>
      </Sheet>

      <Modal
        open={confirmLive}
        onClose={() => setConfirmLive(false)}
        title={t(duoNew ? 'app.clubLiveConfirmTitleDuo' : 'app.clubLiveConfirmTitleSolo', {
          title: title.trim(),
        })}
        description={
          previousLive
            ? t('app.clubLiveConfirmBodySwap', { previous: previousLive.title })
            : t('app.clubLiveConfirmBody')
        }
        confirmLabel={t('app.clubLiveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={busy}
        onConfirm={() => void create()}
      />
    </Screen>
  );
}

export function StatusBadge({ status }: { status: MarathonStatus }) {
  const { t } = useT();
  // Only a running marathon is "the one": everything else stays an outline, as the kit's Badge does.
  return <Badge tone={status === 'active' ? 'inverse' : 'neutral'}>{t(statusKey(status))}</Badge>;
}
