/**
 * Profile (docs/SPEC.md §10 flow 11): who you are, and the few things you have set.
 *
 * This is the one screen on paper. `data-theme="paper"` on the root flips every token under it —
 * white ground, ink text, a black primary button — while the sheets and dialogs it opens are
 * portalled to <body> and stay on the dark theme, as overlays do.
 *
 * It is short on purpose. The previous version was a settings page: the name with «Изменить имя»
 * under it, the avatar with «Новый аватар» under it, a kicker, the email, a black card with the
 * fitness index, a button, and then five headed sections of rows with a subtitle each — two
 * screens of type for four settings. The owner's own prototype (`design/ui_kits/app-v2`,
 * «Профиль») is the avatar, the name, one line, and five rows with their values on the right; her
 * note on the whole app was «МИНИМУМ текста». So: the section headings are gone (a list of four
 * rows does not need chapters), the subtitles became values, the index card became the value of
 * the row that leads back to the assessment, and the email moved to the sign-out row, the one
 * place the account's address is the point.
 *
 * "Retake tests" seeds the onboarding draft from the profile so the wizard resumes at the tests.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import type { Equipment } from '@/content/schema';
import { formatNumber, plural } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import { disableDemo, isDemo, isDemoForced, resetDemo } from '@/lib/api/mode';
import type { ProfilePatch } from '@/lib/api/types';
import type { Limitation } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { EquipmentSheet } from '@/app/features/profile/EquipmentSheet';
import {
  equipmentSummary,
  fitnessOf,
  limitationsSummary,
  newAvatarSeed,
  profileToDraft,
  sinceLabel,
  withEquipment,
  withLimitations,
} from '@/app/features/profile/model';
import { LimitationsSheet } from '@/app/features/profile/LimitationsSheet';
import { ProfileHeader } from '@/app/features/profile/ProfileHeader';
import { APP_VERSION, BUILD_MODE } from '@/app/features/profile/version';
import { saveDraft } from '@/app/screens/onboarding/draft';
import { useProgress, useProgressLoader } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { subscribeHref } from '@/app/features/courses/courseMeta';
import { subscriptionSubtitle } from '@/app/features/profile/subscription';
import { BOOKING, bookingFromPrice } from '@content/site/booking';
import { PLANS_ENABLED } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';

type Busy = 'avatar' | 'name' | 'equipment' | 'limitations' | null;
type SheetName = 'equipment' | 'limitations' | null;
type DemoDialog = 'reset' | 'leave' | null;

/** The paper root. `min-h-dvh` so the white ground runs under the whole screen, not just the content. */
function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="paper" className="min-h-dvh">
      {children}
    </div>
  );
}

interface ValueRowProps {
  title: string;
  /** What the setting is set to, on the right — the row's whole second line, in one word or two. */
  value?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

/**
 * A setting as one row: its name on the left, its value on the right, the way a phone's own
 * settings are read. The value gives way before the name does — it is capped and truncates —
 * because «Инвентарь» must always be legible and «Коврик, стул, гантели 4 и 6 кг» can end in an
 * ellipsis and still be understood.
 */
function ValueRow({ title, value, onClick, href, disabled }: ValueRowProps) {
  return (
    <ListRow
      title={title}
      onClick={onClick}
      href={href}
      disabled={disabled}
      trailing={
        <>
          {value ? (
            <span className="max-w-[48vw] truncate text-[15px] text-muted md:max-w-[220px]">
              {value}
            </span>
          ) : null}
          <Glyph size={16}>›</Glyph>
        </>
      }
    />
  );
}

export default function ProfileScreen() {
  useProgressLoader();
  const tr = useT();
  const { t, locale } = tr;
  const navigate = useNavigate();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const subscription = useSession((s) => s.subscription);
  const totals = useProgress((s) => s.totals);
  const admin = useIsAdmin();
  const [busy, setBusy] = useState<Busy>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [demoDialog, setDemoDialog] = useState<DemoDialog>(null);
  const demo = isDemo();
  // A build with PUBLIC_DEMO_MODE=true cannot be left from the UI; the visitor flag can.
  const canLeaveDemo = demo && !isDemoForced();

  const save = async (patch: ProfilePatch, key: Exclude<Busy, null>): Promise<boolean> => {
    setBusy(key);
    try {
      await useSession.getState().saveProfile(patch);
      toast.show({ kind: 'success', title: t('app.profileSaved') });
      return true;
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.profileSaveError'),
      });
      return false;
    } finally {
      setBusy(null);
    }
  };

  /*
   * Back to wherever the profile was opened from — the avatar on «Прогресс», the top row on a
   * laptop — and Home when there is nowhere to go back to, which is what a deep link is.
   */
  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  /* The screen's name and the way out, and nothing else in the bar: the name below is the screen. */
  const header = (
    <div className="flex h-14 items-center justify-between gap-3 px-6">
      <h1 className="font-display text-base">{t('app.profileTitle')}</h1>
      <IconButton
        label={t('common.close')}
        icon="close"
        variant="ghost"
        size="sm"
        className="-mr-2"
        onClick={close}
      />
    </div>
  );

  if (!profile) {
    return (
      <Paper>
        <Screen header={header}>
          <div className="flex flex-col gap-6 pt-6" aria-hidden="true">
            <Skeleton rounded="card" className="h-20" />
            <Skeleton rounded="card" className="h-64" />
          </div>
        </Screen>
      </Paper>
    );
  }

  const tp = profile.trainingProfile;
  const fitness = fitnessOf(profile);
  const email = profile.email || user?.email || '';
  /*
   * The one line under the name: when you started and how much you have done. Both are facts the
   * screen used to spend a kicker and a card on; here they are one quiet sentence, and either half
   * is dropped rather than shown as a zero.
   */
  const sinceDate = sinceLabel(locale, profile.createdAt);
  const workouts = totals?.workouts ?? 0;
  const line = [
    sinceDate ? t('app.profileSinceShort', { date: sinceDate }) : '',
    workouts > 0
      ? plural(locale, workouts, {
          one: t('app.profileTrainedOne', { n: formatNumber(locale, workouts) }),
          few: t('app.profileTrainedFew', { n: formatNumber(locale, workouts) }),
          many: t('app.profileTrainedMany', { n: formatNumber(locale, workouts) }),
        })
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const retakeTests = () => {
    const draft = profileToDraft(profile, locale);
    if (draft) saveDraft(draft);
    navigate('/onboarding?step=tests');
  };

  const saveEquipment = async (
    equipment: Equipment[],
    dumbbellKg: number[],
    kettlebellKg: number[],
  ) => {
    if (!tp) return;
    const ok = await save(
      { trainingProfile: withEquipment(tp, equipment, dumbbellKg, kettlebellKg) },
      'equipment',
    );
    if (ok) setSheet(null);
  };

  const saveLimitations = async (limitations: Limitation[]) => {
    if (!tp) return;
    const ok = await save({ trainingProfile: withLimitations(tp, limitations) }, 'limitations');
    if (ok) setSheet(null);
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await useSession.getState().signOut();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  return (
    <Paper>
      <Screen header={header}>
        {/*
         * Two columns from `md`: who you are on the left, what you have set on the right. Below
         * `md` it is the stack it has always been, in the same order. The side column is 320px —
         * the narrowest that holds the name at display size beside the avatar.
         */}
        <div className="flex flex-col gap-8 pt-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
          <div className="md:sticky md:top-[calc(var(--safe-top)+80px)] md:w-80 md:shrink-0">
            <ProfileHeader
              seed={profile.avatarSeed || profile.id}
              name={profile.displayName ?? ''}
              email={email}
              line={line || undefined}
              busy={busy === 'avatar' || busy === 'name' ? busy : null}
              onNewAvatar={() => void save({ avatarSeed: newAvatarSeed() }, 'avatar')}
              onSaveName={(name) => save({ displayName: name }, 'name')}
            />
          </div>

          {/*
            The settings: hairline rows, the name of each on the left and its value on the right.
            No headings over them — four rows do not need chapters — and no subtitles under them,
            because the value *is* what the subtitle used to say.
          */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <ul className="divide-y divide-border border-y border-border">
              {PLANS_ENABLED ? (
                <li>
                  <ValueRow
                    title={t('app.profileSubscriptionSection')}
                    value={subscriptionSubtitle(tr, subscription)}
                    href={subscribeHref(locale)}
                  />
                </li>
              ) : null}
              <li>
                <ValueRow
                  title={t('app.profileEquipment')}
                  value={equipmentSummary(tr, tp)}
                  disabled={!tp}
                  onClick={() => setSheet('equipment')}
                />
              </li>
              <li>
                <ValueRow
                  title={t('app.profileLimitations')}
                  value={limitationsSummary(tr, tp)}
                  disabled={!tp}
                  onClick={() => setSheet('limitations')}
                />
              </li>
              <li>
                {/* The index is the value of the row that leads back to the assessment: «54 из
                    100» is the answer the assessment gave, and this is where to give it again. */}
                {fitness ? (
                  <ValueRow
                    title={t('app.profileRetakeTests')}
                    value={`${formatNumber(locale, fitness.index)} ${t('app.profileFitnessOf')}`}
                    onClick={retakeTests}
                  />
                ) : (
                  <ValueRow
                    title={t('app.profileFitnessSetup')}
                    onClick={() => navigate('/onboarding')}
                  />
                )}
              </li>
              {BOOKING.enabled ? (
                <li>
                  <ValueRow
                    title={t('app.profileBook')}
                    value={t('app.profileBookFrom', {
                      price: formatPrice(locale, bookingFromPrice()),
                    })}
                    onClick={() => navigate('/book')}
                  />
                </li>
              ) : null}
              {admin === true ? (
                <li>
                  <ValueRow title={t('app.profileAdmin')} onClick={() => navigate('/admin')} />
                </li>
              ) : null}
              {demo ? (
                <li>
                  <ValueRow title={t('app.demoReset')} onClick={() => setDemoDialog('reset')} />
                </li>
              ) : null}
              {canLeaveDemo ? (
                <li>
                  <ValueRow title={t('app.demoLeave')} onClick={() => setDemoDialog('leave')} />
                </li>
              ) : null}
              <li>
                {/* The address is here and nowhere else: it says which account «Выйти» leaves. */}
                <ListRow
                  title={<span className="text-danger">{t('app.profileSignOut')}</span>}
                  trailing={
                    email ? (
                      <span
                        className="max-w-[52vw] truncate text-[13px] text-muted-2 md:max-w-[240px]"
                        aria-label={t('app.profileEmail')}
                      >
                        {email}
                      </span>
                    ) : null
                  }
                  onClick={() => setSignOutOpen(true)}
                />
              </li>
            </ul>
            <p className="text-[11px] text-muted-2">
              {t('app.profileVersion', { version: APP_VERSION, mode: BUILD_MODE })}
            </p>
          </div>
        </div>

        {tp ? (
          <>
            <EquipmentSheet
              open={sheet === 'equipment'}
              profile={tp}
              busy={busy === 'equipment'}
              onClose={() => setSheet(null)}
              onSave={(eq, d, k) => void saveEquipment(eq, d, k)}
            />
            <LimitationsSheet
              open={sheet === 'limitations'}
              limitations={tp.limitations}
              busy={busy === 'limitations'}
              onClose={() => setSheet(null)}
              onSave={(items) => void saveLimitations(items)}
            />
          </>
        ) : null}
        <Modal
          open={demoDialog === 'reset'}
          onClose={() => setDemoDialog(null)}
          title={t('app.demoResetTitle')}
          description={t('app.demoResetBody')}
          confirmLabel={t('app.demoReset')}
          cancelLabel={t('common.cancel')}
          danger
          onConfirm={() => resetDemo()}
        />
        <Modal
          open={demoDialog === 'leave'}
          onClose={() => setDemoDialog(null)}
          title={t('app.demoLeaveTitle')}
          description={t('app.demoLeaveBody')}
          confirmLabel={t('app.demoLeave')}
          cancelLabel={t('common.cancel')}
          onConfirm={() => {
            disableDemo();
            window.location.reload();
          }}
        />
        <Modal
          open={signOutOpen}
          onClose={() => setSignOutOpen(false)}
          title={t('app.profileSignOutTitle')}
          description={t('app.profileSignOutBody')}
          confirmLabel={t('app.profileSignOut')}
          cancelLabel={t('common.cancel')}
          danger
          loading={signingOut}
          onConfirm={() => void signOut()}
        />
      </Screen>
    </Paper>
  );
}
