/**
 * The coach's marathons (admins only): every run, drafts and finished ones included.
 *
 * A marathon is created with a handle, a name and a start date and nothing else, because the day
 * plan is written one morning at a time and the thing has to exist before the first morning. It
 * starts as a draft — invisible to members — until he switches it to running.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { createMarathon, listMarathons } from '@/lib/api/marathonAdmin';
import type { MarathonRow, MarathonStatus } from '@/lib/api/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { MARATHON_SLUG_RE, statusKey } from '@/app/features/marathon/admin/model';

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
  const [busy, setBusy] = useState(false);

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
  if (admin === false) return <Navigate to="/profile" replace />;

  const slugError =
    slug !== '' && !MARATHON_SLUG_RE.test(slug) ? t('app.mAdminSlugInvalid') : undefined;

  const create = async () => {
    if (!MARATHON_SLUG_RE.test(slug) || !title.trim()) return;
    setBusy(true);
    try {
      const made = await createMarathon({
        slug,
        title: title.trim(),
        startsOn,
        teamSize: Number(teamSize),
      });
      setOpen(false);
      setSlug('');
      setTitle('');
      setTeamSize('2');
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
      <div className="flex flex-col py-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('app.mAdminEmpty')} description={t('app.mAdminEmptyBody')} />
        ) : (
          <ul className="flex flex-col">
            {rows.map((row) => (
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
                  <StatusBadge status={row.status} />
                  <Glyph size={16} className="shrink-0 text-muted-2">
                    ›
                  </Glyph>
                </button>
              </li>
            ))}
          </ul>
        )}
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
            onClick={() => void create()}
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
        </div>
      </Sheet>
    </Screen>
  );
}

export function StatusBadge({ status }: { status: MarathonStatus }) {
  const { t } = useT();
  // Only a running marathon is "the one": everything else stays an outline, as the kit's Badge does.
  return <Badge tone={status === 'active' ? 'inverse' : 'neutral'}>{t(statusKey(status))}</Badge>;
}
