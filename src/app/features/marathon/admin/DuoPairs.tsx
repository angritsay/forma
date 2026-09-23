/**
 * The duo club's pairs, and the three things the owner does to them (0047).
 *
 * «Пересобрать пары сейчас» runs the Monday draw now — the same SQL, not a copy of it. «Разбить»
 * takes one pair apart. «Поставить в пару» pairs someone who has nobody: joined on a Tuesday, or
 * the odd one out of the draw. Pairs she makes last until Monday unless she says keep them — then
 * they are like an invite pair and the draw leaves them alone.
 *
 * Each of them changes what two people see on their own screen the moment it is pressed, so each
 * asks first and says so.
 */
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { formatNumber } from '@/i18n/index';
import type { MarathonMemberRow, MarathonTeamRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { duoPeople, personName, type DuoPair } from './clubTools';

export interface DuoPairsProps {
  members: readonly MarathonMemberRow[];
  teams: readonly MarathonTeamRow[];
  /** Each rejects when it failed (the screen has already said so), so the dialog stays open. */
  onRematch: () => Promise<void>;
  onSplit: (teamId: string) => Promise<void>;
  onPair: (emailA: string, emailB: string, keep: boolean) => Promise<void>;
}

export function DuoPairs({ members, teams, onRematch, onSplit, onPair }: DuoPairsProps) {
  const { t, locale } = useT();
  const { pairs, unpaired } = useMemo(() => duoPeople(members, teams), [members, teams]);

  const [rematchOpen, setRematchOpen] = useState(false);
  const [splitting, setSplitting] = useState<DuoPair | null>(null);
  const [pairFor, setPairFor] = useState<MarathonMemberRow | null>(null);
  const [partner, setPartner] = useState('');
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);

  const pairName = (p: DuoPair) => p.members.map(personName).join(' и ');

  const wrap = (work: () => Promise<void>, close: () => void) => {
    setBusy(true);
    void work()
      .then(close)
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };

  const others = pairFor ? unpaired.filter((m) => m.id !== pairFor.id) : [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="eyebrow">
          {t('app.clubPairsTitle', { n: formatNumber(locale, pairs.length) })}
        </h3>
        <span className="text-[13px] text-muted-2">
          {t('app.clubPairsUnpaired', { n: formatNumber(locale, unpaired.length) })}
        </span>
      </div>

      <Button variant="secondary" size="md" onClick={() => setRematchOpen(true)}>
        {t('app.clubPairsRematch')}
      </Button>

      {pairs.length === 0 ? (
        <p className="border-t border-border py-4 text-[15px] text-muted-2">
          {t('app.clubPairsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {pairs.map((p) => (
            <li
              key={p.team.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3.5"
            >
              <span className="min-w-0 flex-1">
                <span className="font-display block text-[15px] leading-[1.24]">{pairName(p)}</span>
                <span className="block text-xs text-muted-2">
                  {t(p.team.isAuto ? 'app.clubPairAuto' : 'app.clubPairKept')}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSplitting(p)}>
                {t('app.clubPairSplit')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {unpaired.length > 0 ? (
        <ul className="flex flex-col">
          {unpaired.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3.5"
            >
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-[15px] leading-[1.24]">
                  {personName(m)}
                </span>
                <span className="block truncate text-xs text-muted-2">{m.email}</span>
              </span>
              <Badge tone="warning">{t('app.mAdminNoTeam')}</Badge>
              <Button
                variant="ghost"
                size="sm"
                disabled={unpaired.length < 2}
                onClick={() => {
                  setPartner('');
                  setKeep(false);
                  setPairFor(m);
                }}
              >
                {t('app.clubPairMake')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal
        open={rematchOpen}
        onClose={() => setRematchOpen(false)}
        title={t('app.clubPairsRematchTitle')}
        description={t('app.clubPairsRematchBody')}
        confirmLabel={t('app.clubPairsRematchConfirm')}
        cancelLabel={t('common.cancel')}
        loading={busy}
        onConfirm={() => wrap(onRematch, () => setRematchOpen(false))}
      />

      <Modal
        open={splitting !== null}
        onClose={() => setSplitting(null)}
        title={t('app.clubPairSplitTitle', { names: splitting ? pairName(splitting) : '' })}
        description={t('app.clubPairSplitBody')}
        confirmLabel={t('app.clubPairSplit')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => {
          if (!splitting) return;
          const id = splitting.team.id;
          wrap(
            () => onSplit(id),
            () => setSplitting(null),
          );
        }}
      />

      <Sheet
        open={pairFor !== null}
        onClose={() => setPairFor(null)}
        title={t('app.clubPairMakeTitle', { name: pairFor ? personName(pairFor) : '' })}
        footer={
          <Button
            size="lg"
            variant="action"
            fullWidth
            loading={busy}
            disabled={!partner}
            onClick={() => {
              const b = others.find((m) => m.id === partner);
              if (!pairFor || !b) return;
              wrap(
                () => onPair(pairFor.email, b.email, keep),
                () => setPairFor(null),
              );
            }}
          >
            {t('app.clubPairMake')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <Select
            label={t('app.clubPairPartner')}
            value={partner}
            onChange={setPartner}
            options={[
              { value: '', label: '—' },
              ...others.map((m) => ({ value: m.id, label: personName(m) })),
            ]}
          />
          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px]">{t('app.clubPairKeep')}</span>
              <span className="text-[13px] text-muted-2">{t('app.clubPairKeepHint')}</span>
            </span>
            <Switch checked={keep} onChange={setKeep} label={t('app.clubPairKeep')} />
          </label>
          <p className="text-[13px] text-muted-2">{t('app.clubPairMakeBody')}</p>
        </div>
      </Sheet>
    </section>
  );
}
