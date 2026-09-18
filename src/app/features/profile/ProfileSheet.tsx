/**
 * The account, as a sheet behind the avatar — what is left of «Профиль».
 *
 * «Профиль и все ачивки убирай.» The screen was 417 lines and a tab seat before that: an avatar,
 * a name, a line, and a list of settings rows with their values on the right. Almost none of it
 * was opened twice. What an athlete actually comes to an account for is to check who they are
 * signed in as, see what level they are, and — once ever — sign out; everything else on that
 * screen was either a thing they set at sign-up or a link to somewhere else in the app.
 *
 * So it is five things and no navigation: the avatar, the name, the level, one line saying how to
 * reach the next one, and the way out. It opens from the avatar in the header of «Курсы» and from
 * the same avatar in the top row from `md` — one object, two places it is reachable from, and
 * never a screen, because an account is something you glance at and close.
 *
 * **And the inventory, which is a sixth thing and is here on purpose.** The question «что есть
 * дома» left onboarding with the rest of it, so a new profile carries `['none']` for everybody.
 * That is the safe direction — `prescribe.ts` substitutes down the `scaling.easier` chain for
 * anything the athlete has not got — but it is only safe if there is somewhere to say otherwise,
 * and this was that somewhere. Without the row, somebody who owns a pair of dumbbells trains
 * without them forever and the prescription is permanently conservative.
 *
 * The sheet is the kit's own (`components/ui/Sheet`): a sheet on a phone, a dialog from `md`. When
 * the inventory opens, this one closes: two sheets stacked are two focus traps arguing, and the
 * way back from the inventory is this sheet reopening.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import type { Equipment } from '@/content/schema';
import { formatNumber } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import { levelForPoints } from '@/lib/training/levels';
import { useT } from '@/app/hooks/useT';
import { useTotalPoints } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { EquipmentSheet } from './EquipmentSheet';
import { equipmentSummary, withEquipment } from './model';

export interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const tr = useT();
  const { t, l, locale } = tr;
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const points = useTotalPoints();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gear, setGear] = useState(false);
  const [saving, setSaving] = useState(false);
  const tp = profile?.trainingProfile ?? null;

  const level = levelForPoints(points);
  const next = level.nextAt === null ? null : levelForPoints(level.nextAt);
  const remaining = level.nextAt === null ? 0 : Math.max(0, level.nextAt - points);
  const name = profile?.displayName ?? '';
  const email = profile?.email || user?.email || '';

  const saveEquipment = async (
    equipment: Equipment[],
    dumbbellKg: number[],
    kettlebellKg: number[],
  ) => {
    if (!tp) return;
    setSaving(true);
    try {
      await useSession
        .getState()
        .saveProfile({ trainingProfile: withEquipment(tp, equipment, dumbbellKg, kettlebellKg) });
      toast.show({ kind: 'success', title: t('app.profileSaved') });
      setGear(false);
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.profileSaveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await useSession.getState().signOut();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <>
      <Sheet open={open && !gear} onClose={onClose} title={t('app.profileTitle')}>
        <div className="flex flex-col gap-6 pb-2">
          {/*
           * Who you are: the name, and the address that «Выйти» will leave.
           *
           * There was a 56px monogram circle to the left of them — the first letter of the name on
           * a generated colour. Nobody in this product uploads a picture, so it was a placeholder
           * for a photograph that does not exist and never will, and the head of «Курсы» dropped
           * the same circle for the same reason. What is left is the two lines that carry
           * information, one size larger now that they are not sharing the row.
           */}
          <div className="flex min-w-0 flex-col gap-1">
            {name ? <p className="display text-2xl">{name}</p> : null}
            {email ? <p className="truncate text-[13px] text-muted-2">{email}</p> : null}
          </div>

          {/*
           * The level, and the one line that says how to get the next one. That line is the reason
           * the level is here at all: a rank with no rule attached is a badge, and the athlete has
           * no way to act on it. The rule is points, and points come from training.
           */}
          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="eyebrow">{t('app.statsLevelEyebrow', { n: level.level })}</span>
              <span className="numeral tabular shrink-0 text-sm">
                {t('app.statsPointsValue', { n: formatNumber(locale, points) })}
              </span>
            </div>
            <h3 className="display text-2xl">{l(level.title)}</h3>
            <ProgressBar
              value={level.progress}
              tone="primary"
              label={t('app.statsLevelProgress')}
            />
            <p className="text-[13px] text-muted">
              {next
                ? t('app.statsLevelNext', {
                    n: formatNumber(locale, remaining),
                    title: l(next.title),
                  })
                : t('app.statsLevelMax')}
            </p>
          </div>

          {/* The one setting: what is at home. Its value is the row's second line, the way a
              phone's own settings are read. */}
          <ul className="-mx-6 border-y border-border md:-mx-8">
            <li>
              <ListRow
                title={t('app.profileEquipment')}
                disabled={!tp}
                onClick={() => setGear(true)}
                trailing={
                  <>
                    <span className="max-w-[44vw] truncate text-[15px] text-muted md:max-w-[220px]">
                      {equipmentSummary(tr, tp)}
                    </span>
                    <Glyph size={16}>›</Glyph>
                  </>
                }
              />
            </li>
          </ul>

          {/* The red is on the label, not on the button: `ghost` sets its own text colour and a
              `text-danger` beside it is a coin toss on which utility the stylesheet emits last. */}
          <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirm(true)}>
            <span className="text-danger">{t('app.profileSignOut')}</span>
          </Button>
        </div>
      </Sheet>
      {tp ? (
        <EquipmentSheet
          open={gear}
          profile={tp}
          busy={saving}
          onClose={() => setGear(false)}
          onSave={(eq, d, k) => void saveEquipment(eq, d, k)}
        />
      ) : null}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('app.profileSignOutTitle')}
        description={t('app.profileSignOutBody')}
        confirmLabel={t('app.profileSignOut')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void signOut()}
      />
    </>
  );
}
