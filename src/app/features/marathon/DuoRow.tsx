/**
 * The pair as one row of the task card: two small avatars with today's mark on each, the pair's
 * rule as numbers, «Напомнить» when the partner is behind, and «···» for the rest.
 *
 * This was a tile of its own (`ClubDuo`) under the card — two 48px avatars and an `&`. The owner,
 * on that screen: integrate the duo block into the task card. A pair is a fact about today's
 * task («+15 · оба» is the rule of *this* task), so it belongs on the face, under the title and
 * over the control, where `ClubCard` puts it through its `duo` prop.
 *
 * What the old sentences said is now two marks — a warm ✓ on whoever has delivered today, a
 * hollow circle on whoever has not — and the rule is three tokens: `+12 · оба` (`all_members`),
 * `+12 · каждый` (`per_member`), `до 20 · пара` (`capped`). Nothing for `none`.
 *
 * «Напомнить» stays, as the small ghost it was (`nudgePartner`, one bot message a day per
 * direction, the database dedupes), and only while the partner is the one behind. «Выйти из
 * пары» and the explanation of how pairing works («автоподбор каждую неделю, друг остаётся»)
 * live in the «···» sheet: read once, not every morning.
 *
 * **Unpaired:** the second seat is a dashed «?», one line «Партнёр — в понедельник», one ghost
 * «Позвать друга» that shares the invite directly (`navigator.share` → clipboard + toast). The
 * URL is never printed. The ⓘ opens the same sheet without the leave button.
 *
 * The row wraps: on a 390px phone the seats and the rule sit left, the buttons go right, and
 * when both do not fit on one line the buttons drop to a second one, still at the right.
 *
 * The ✓ never sits on a fill the emoji rule forbids: the check is a glyph, and the warm circle it
 * sits in is the leader's circle of the board, two sizes down.
 */
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
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

export interface DuoRowProps extends ClubDuoPairOptions {
  /** Today's task, for the two marks; null on a rest day, when there is nothing to mark. */
  item: MarathonTodayTask | null;
}

export function DuoRow({ item, onChanged, onStatus }: DuoRowProps) {
  const { t, locale } = useT();
  const me = useMeAvatar();
  const { row, busy, share, leave } = useClubDuoPair({ onChanged, onStatus });
  const [open, setOpen] = useState(false);
  /** «Выйти из пары» asks first: a pair chosen by invite does not come back by itself. */
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Not loaded yet (or a failed read): hold the row's height so the card does not jump when it
  // lands, and the hairline above it is not drawn over nothing.
  if (!row) return <div className="min-h-9" aria-hidden="true" />;

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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Seat name={you} mark={item ? meDone : null}>
        <Avatar seed={me.seed} name={me.name} size={28} />
      </Seat>
      {paired ? (
        <Seat name={row.mateName!} mark={item ? mateDone : null}>
          <Avatar seed={row.mateSeed} name={row.mateName} size={28} />
        </Seat>
      ) : (
        <Seat name="?" mark={null} quiet>
          <span
            role="img"
            aria-label={t('app.clubDuoSlot')}
            className="display flex size-7 items-center justify-center rounded-pill border border-dashed border-border-strong text-[13px] text-muted-2"
          >
            ?
          </span>
        </Seat>
      )}

      {paired ? (
        rule ? (
          <span className="numeral text-[13px] text-muted">{rule}</span>
        ) : null
      ) : (
        <span className="text-[12px] text-muted">{t('app.clubDuoMonday')}</span>
      )}

      {/* The actions, at the row's right; `-mr-2` sets the «···» on the text's edge. */}
      <div className="-mr-2 ml-auto flex items-center gap-1">
        {paired ? (
          state === 'partner-waiting' ? (
            <NudgeButton />
          ) : null
        ) : (
          <Button variant="ghost" size="sm" loading={busy} onClick={() => void share()}>
            {t('app.duoInvite')}
          </Button>
        )}
        <IconButton
          label={t('app.clubDuoMenu')}
          icon={paired ? <Glyph size={16}>···</Glyph> : 'info'}
          variant="ghost"
          size="sm"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        />
      </div>

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
                  setConfirmLeave(true);
                }}
              >
                {t('app.duoLeave')}
              </Button>
            </div>
          ) : null}
        </div>
      </Sheet>
      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t('app.duoLeaveTitle')}
        description={row.isAuto ? t('app.duoLeaveBodyAuto') : t('app.duoLeaveBodyChosen')}
        confirmLabel={t('app.duoLeave')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => {
          setConfirmLeave(false);
          void leave();
        }}
      />
    </div>
  );
}

/**
 * One seat of the pair: the avatar with today's mark on its corner, the name beside it. `mark`
 * is null when there is nothing to mark (a rest day, an empty seat).
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
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="relative shrink-0">
        {children}
        {mark !== null ? (
          <span
            className={clsx(
              'absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-pill',
              mark ? 'bg-warm text-ink' : 'border border-border-strong bg-surface',
            )}
            role="img"
            aria-label={t(mark ? 'app.clubDuoDone' : 'app.clubDuoNotYet', { name })}
          >
            {mark ? <Glyph size={8}>✓</Glyph> : null}
          </span>
        ) : null}
      </div>
      {quiet ? null : (
        <span
          className="max-w-20 truncate text-[12px] leading-tight text-text"
          aria-hidden={mark !== null ? true : undefined}
        >
          {name}
        </span>
      )}
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
