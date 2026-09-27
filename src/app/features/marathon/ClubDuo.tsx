/**
 * The duo tile: two avatars and an `&`, today's mark under each, the pair's rule as numbers.
 *
 * Replaces `ClubDuoPair`'s card and `ClubPartnerLine` (three sentences about the partner's day)
 * after the owner's «много текстов, нет элемента игры». What those sentences said is now two
 * marks — a warm ✓ under whoever has delivered today, a hollow circle under whoever has not —
 * and the rule under the pair is three tokens: `+12 · оба` (`all_members`), `+12 · каждый`
 * (`per_member`), `до 20 · пара` (`capped`). Nothing for `none`.
 *
 * «Напомнить» stays, as the small ghost it was (`nudgePartner`, one bot message a day per
 * direction, the database dedupes), and only while the partner is the one behind. «Выйти из
 * пары» and the explanation of how pairing works («автоподбор каждую неделю, друг остаётся»)
 * move into a «···» sheet: read once, not every morning.
 *
 * **Unpaired:** the second seat is a dashed «?», one line «Партнёр — в понедельник», one gradient
 * button «Позвать друга» that shares the invite directly (`navigator.share` → clipboard + toast).
 * The URL is never printed. The ⓘ opens the same sheet without the leave button.
 *
 * The 🎉 and the ✓ never sit on a fill the emoji rule forbids: the check is a glyph, and the
 * warm circle it sits in is the leader's circle of the board, one size down.
 */
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { isNetworkError } from '@/lib/api/errors';
import { nudgePartner } from '@/lib/api/referral';
import type { MarathonTodayTask } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { useMeAvatar } from './ClubHud';
import { useClubDuoPair, type ClubDuoPairOptions } from './ClubDuoPair';
import { partnerState, type PartnerState } from './partner';

export interface ClubDuoProps extends ClubDuoPairOptions {
  /** Today's task, for the two marks; null on a rest day, when there is nothing to mark. */
  item: MarathonTodayTask | null;
}

export function ClubDuo({ item, onChanged, onStatus }: ClubDuoProps) {
  const { t, locale } = useT();
  const me = useMeAvatar();
  const { row, busy, share, leave } = useClubDuoPair({ onChanged, onStatus });
  const [open, setOpen] = useState(false);

  // Ещё не загрузилось, или человека нет в дуо-круге: место под пару не занимаем.
  if (!row) return null;

  const paired = Boolean(row.teamId && row.mateName);
  const state: PartnerState | null = item && paired ? partnerState(item) : null;
  const meDone = Boolean(item?.mine && !item.mine.voidedAt);
  const mateDone = state === 'both' || state === 'partner-done';

  const task = item?.task;
  const p = task ? formatNumber(locale, task.points) : null;
  const rule =
    !task || !paired || task.rule === 'none'
      ? null
      : task.rule === 'all_members'
        ? t('app.clubDuoRuleBoth', { p: p! })
        : task.rule === 'per_member'
          ? t('app.clubDuoRuleEach', { p: p! })
          : task.cap !== null
            ? t('app.clubDuoRuleCap', { cap: formatNumber(locale, task.cap) })
            : null;

  const you = t('app.marathonBoardYou');

  return (
    <section className="glass-card flex flex-col gap-4 rounded-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start justify-center gap-4 pl-9">
          <Seat name={you} mark={item ? meDone : null}>
            <Avatar seed={me.seed} name={me.name} size={48} />
          </Seat>
          <span aria-hidden="true" className="display pt-3 text-[22px] text-muted-2">
            &amp;
          </span>
          {paired ? (
            <Seat name={row.mateName!} mark={item ? mateDone : null}>
              <Avatar seed={row.mateSeed} name={row.mateName} size={48} />
            </Seat>
          ) : (
            <Seat name="?" mark={null} quiet>
              <span
                role="img"
                aria-label={t('app.clubDuoSlot')}
                className="display flex size-12 items-center justify-center rounded-pill border border-dashed border-border-strong text-[18px] text-muted-2"
              >
                ?
              </span>
            </Seat>
          )}
        </div>
        <IconButton
          label={t('app.clubDuoMenu')}
          icon={paired ? <Glyph size={16}>···</Glyph> : 'info'}
          variant="ghost"
          size="sm"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        />
      </div>

      {paired ? (
        rule || state === 'partner-waiting' ? (
          <div className="flex min-h-7 items-center justify-between gap-3">
            <span className="numeral text-[13px] text-muted">{rule}</span>
            {state === 'partner-waiting' ? <NudgeButton /> : null}
          </div>
        ) : null
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-center text-[13px] text-muted">{t('app.clubDuoMonday')}</span>
          <Button
            variant="gradient"
            size="md"
            fullWidth
            loading={busy}
            onClick={() => void share()}
          >
            {t('app.duoInvite')}
          </Button>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t('app.clubDuoAbout')}>
        <div className="flex flex-col gap-4">
          {paired ? (
            <p className="text-[15px] text-text">
              {row.isAuto ? t('app.duoMateAuto') : t('app.duoMateChosen')}
            </p>
          ) : null}
          <p className="text-[14px] leading-relaxed text-muted">{t('app.duoNoneBody')}</p>
          {paired ? (
            <div className="flex">
              <Button
                variant="danger"
                size="md"
                loading={busy}
                onClick={() => {
                  setOpen(false);
                  void leave();
                }}
              >
                {t('app.duoLeave')}
              </Button>
            </div>
          ) : null}
        </div>
      </Sheet>
    </section>
  );
}

/**
 * One seat of the pair: the avatar, today's mark, the name. `mark` is null when there is
 * nothing to mark (a rest day, an empty seat) — the ring is still drawn so both seats stand at
 * one height.
 */
function Seat({
  name,
  mark,
  quiet = false,
  children,
}: {
  name: string;
  mark: boolean | null;
  quiet?: boolean;
  children: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="flex w-24 flex-col items-center gap-1.5">
      <div className="relative">
        {children}
        {mark !== null ? (
          <span
            className={clsx(
              'absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-pill',
              mark ? 'bg-warm text-ink' : 'border border-border-strong bg-surface',
            )}
            role="img"
            aria-label={t(mark ? 'app.clubDuoDone' : 'app.clubDuoNotYet', { name })}
          >
            {mark ? <Glyph size={10}>✓</Glyph> : null}
          </span>
        ) : null}
      </div>
      <span
        className={clsx(
          'w-full truncate text-center text-[13px] leading-tight',
          quiet ? 'text-muted-2' : 'text-text',
        )}
        aria-hidden={mark !== null || quiet ? true : undefined}
      >
        {name}
      </span>
    </div>
  );
}

/**
 * «Напомнить»: one tap, one message, then the button says it went and stays quiet. The state is
 * per mount on purpose — the database already refuses a second nudge today, and a button that
 * springs back after a reload would only collect refusals.
 */
export function NudgeButton() {
  const { t } = useT();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sent) return <span className="text-[13px] text-muted-2">{t('app.clubNudgeSent')}</span>;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-mr-4.5"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        nudgePartner()
          .then(() => {
            setSent(true);
            toast.show({ kind: 'success', title: t('app.clubNudgeSent') });
          })
          .catch((e: unknown) => {
            toast.show({
              kind: 'error',
              title: t(isNetworkError(e) ? 'common.errorOffline' : 'common.errorGeneric'),
            });
          })
          .finally(() => setBusy(false));
      }}
    >
      {t('app.clubNudge')}
    </Button>
  );
}
