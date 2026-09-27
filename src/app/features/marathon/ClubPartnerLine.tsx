/**
 * The partner's day, on the duo club's task card.
 *
 * Owner, on what the week screen has to make a member feel: belonging, and a little pressure —
 * the partner is the one other person whose day is visibly tied to yours. Three sentences, one of
 * which is true on any given task (`partnerState`, pure):
 *
 *   «Аня уже сделала ✓ — твоя очередь»   the partner delivered, you have not
 *   «Аня ещё не сделала»                 the partner has not, whether or not you have
 *   «Вы оба сделали 🎉»                  both proofs are in
 *
 * and under it the pair's rule for this task in the member's own numbers — «+12 каждому, если
 * сделаете оба» (`all_members`), «+12 за каждого из вас» (`per_member`), «до 20 на пару»
 * (`capped`) — because a rule the card does not state is a rule that gets discovered at the
 * board, as a missing number.
 *
 * **The name is the API's** (`club_duo_status().mate_name`, through `ClubDuoPair`); nothing here
 * invents a person. Russian verbs are written «сделал(а)»: the roster carries no gender.
 *
 * The 🎉 sits on the card's plain surface, never on a fill (`contrast-usage.test.ts`).
 *
 * `NudgeButton` — «напомнить» — sends the partner one bot message, «{name} уже сделал(а)
 * задание — твоя очередь» (`club_duo_nudge()`, 0051; once a day per direction, the database
 * dedupes). It shows only while the partner is the one who has not delivered: nudging somebody
 * who is ahead of you would be noise, and the database would refuse a second one anyway.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { isNetworkError } from '@/lib/api/errors';
import { nudgePartner } from '@/lib/api/referral';
import type { MarathonTodayTask } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { partnerState } from './partner';

export interface ClubPartnerLineProps {
  item: MarathonTodayTask;
  /** The partner's display name from `club_duo_status`. */
  mateName: string;
}

export function ClubPartnerLine({ item, mateName }: ClubPartnerLineProps) {
  const { t, locale } = useT();
  const state = partnerState(item);
  if (state === null) return null;
  const { task } = item;
  const p = formatNumber(locale, task.points);

  const line =
    state === 'both'
      ? t('app.clubPartnerBoth')
      : state === 'partner-done'
        ? t('app.clubPartnerDone', { name: mateName })
        : t('app.clubPartnerWaiting', { name: mateName });

  const rule =
    task.rule === 'all_members'
      ? t('app.clubRuleAll', { p })
      : task.rule === 'per_member'
        ? t('app.clubRulePer', { p })
        : task.rule === 'capped' && task.cap !== null
          ? t('app.clubRuleCapped', { cap: formatNumber(locale, task.cap) })
          : null;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex items-center gap-2 text-[14px] leading-snug text-text">
        <span>{line}</span>
        <NudgeButton state={state} />
      </p>
      {rule ? <span className="text-[13px] text-muted-2">{rule}</span> : null}
    </div>
  );
}

/**
 * «Напомнить»: one tap, one message, then the button says it went and stays quiet. The state is
 * per mount on purpose — the database already refuses a second nudge today, and a button that
 * springs back after a reload would only collect refusals.
 */
export function NudgeButton({ state }: { state: NonNullable<ReturnType<typeof partnerState>> }) {
  const { t } = useT();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (state !== 'partner-waiting') return null;
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
