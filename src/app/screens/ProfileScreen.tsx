/**
 * Profile (docs/SPEC.md §10 flow 11): avatar, name, email, fitness index, equipment and
 * limitations editors, the coach's bookable hour, sign out, version,
 * and the admin entry point.
 * "Retake tests" seeds the onboarding draft from the profile so the wizard resumes at the tests.
 *
 * This is the one screen on paper. `data-theme="paper"` on the root flips every token under it —
 * white ground, ink text, a black primary button — while the sheets and dialogs it opens are
 * portalled to <body> and stay on the dark theme, as overlays do.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ListRow } from '@/components/ui/ListRow';
import { Logo } from '@/components/ui/Logo';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import type { Equipment } from '@/content/schema';
import { isAppError } from '@/lib/api/errors';
import { disableDemo, isDemo, isDemoForced, resetDemo } from '@/lib/api/mode';
import type { ProfilePatch } from '@/lib/api/types';
import type { Limitation } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { EquipmentSheet } from '@/app/features/profile/EquipmentSheet';
import { FitnessCard } from '@/app/features/profile/FitnessCard';
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
import { Section } from '@/app/features/stats/Section';
import { saveDraft } from '@/app/screens/onboarding/draft';
import { useSession } from '@/app/store/session';
import { subscribeHref } from '@/app/features/courses/courseMeta';
import { subscriptionSubtitle, subscriptionTitle } from '@/app/features/profile/subscription';
import { BOOKING } from '@content/site/booking';
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

export default function ProfileScreen() {
  const tr = useT();
  const { t, locale } = tr;
  const navigate = useNavigate();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const subscription = useSession((s) => s.subscription);
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
   * The wordmark on the left, the screen's name as a kicker on the right — the design system's
   * paper header. The kicker is still the page's <h1>: the big line below is the person's name,
   * and a heading that changes with the visitor is no name for the screen.
   */
  const header = (
    <div className="flex h-14 items-center justify-between gap-3 px-5">
      <Logo className="text-[15px]" />
      <h1 className="eyebrow">{t('app.profileTitle')}</h1>
    </div>
  );

  if (!profile) {
    return (
      <Paper>
        <Screen header={header}>
          <div className="flex flex-col gap-6 pt-6" aria-hidden="true">
            <Skeleton rounded="card" className="h-20" />
            <Skeleton rounded="card" className="h-36" />
            <Skeleton rounded="card" className="h-40" />
          </div>
        </Screen>
      </Paper>
    );
  }

  const tp = profile.trainingProfile;
  const fitness = fitnessOf(profile);
  const email = profile.email || user?.email || '';
  const sinceDate = sinceLabel(locale, profile.createdAt);
  const since = sinceDate ? t('app.profileSince', { date: sinceDate }) : undefined;

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
        <div className="flex flex-col gap-8 pt-6">
          <ProfileHeader
            seed={profile.avatarSeed || profile.id}
            name={profile.displayName ?? ''}
            email={email}
            since={since}
            busy={busy === 'avatar' || busy === 'name' ? busy : null}
            onNewAvatar={() => void save({ avatarSeed: newAvatarSeed() }, 'avatar')}
            onSaveName={(name) => save({ displayName: name }, 'name')}
          />
          <FitnessCard
            fitness={fitness}
            onRetake={retakeTests}
            onSetup={() => navigate('/onboarding')}
          />

          {/*
            Settings are hairline rows and words. The row icons that used to lead each one are
            gone: the title says what the row is, and the subtitle says what it is set to.
          */}
          <div className="flex flex-col gap-2">
            {PLANS_ENABLED ? (
              <Section title={t('app.profileSubscriptionSection')}>
                <div className="border-t border-border">
                  <ListRow
                    title={subscriptionTitle(tr, subscription)}
                    subtitle={subscriptionSubtitle(tr, subscription)}
                    href={subscribeHref(locale)}
                  />
                </div>
              </Section>
            ) : null}

            {BOOKING.enabled ? (
              <Section title={t('app.profileCoachSection')}>
                <div className="border-t border-border">
                  <ListRow
                    title={t('app.profileBook')}
                    subtitle={t('app.profileBookHint', {
                      duration: BOOKING.durationMin,
                      price: formatPrice(locale, BOOKING.price),
                    })}
                    onClick={() => navigate('/book')}
                  />
                </div>
              </Section>
            ) : null}

            <Section title={t('app.profileTrainingSection')}>
              <div className="border-t border-border">
                <ul className="divide-y divide-border">
                  <li>
                    <ListRow
                      title={t('app.profileEquipment')}
                      subtitle={equipmentSummary(tr, tp)}
                      disabled={!tp}
                      onClick={() => setSheet('equipment')}
                    />
                  </li>
                  <li>
                    <ListRow
                      title={t('app.profileLimitations')}
                      subtitle={limitationsSummary(tr, tp)}
                      disabled={!tp}
                      onClick={() => setSheet('limitations')}
                    />
                  </li>
                </ul>
              </div>
            </Section>

            {demo ? (
              <Section title={t('app.demoSection')}>
                <div className="border-t border-border">
                  <ul className="divide-y divide-border">
                    <li className="px-4 py-3 text-sm text-muted">{t('app.demoDataNote')}</li>
                    <li>
                      <ListRow
                        title={t('app.demoReset')}
                        subtitle={t('app.demoResetHint')}
                        onClick={() => setDemoDialog('reset')}
                      />
                    </li>
                    {canLeaveDemo ? (
                      <li>
                        <ListRow
                          title={t('app.demoLeave')}
                          subtitle={t('app.demoLeaveHint')}
                          onClick={() => setDemoDialog('leave')}
                        />
                      </li>
                    ) : null}
                  </ul>
                </div>
              </Section>
            ) : null}

            <Section title={t('app.profileAccountSection')}>
              <div className="border-t border-border">
                <ul className="divide-y divide-border">
                  {admin === true ? (
                    <li>
                      <ListRow
                        title={t('app.profileAdmin')}
                        subtitle={t('app.profileAdminHint')}
                        onClick={() => navigate('/admin')}
                      />
                    </li>
                  ) : null}
                  <li>
                    <ListRow
                      title={<span className="text-danger">{t('app.profileSignOut')}</span>}
                      trailing={null}
                      onClick={() => setSignOutOpen(true)}
                    />
                  </li>
                </ul>
              </div>
            </Section>
          </div>

          <p className="text-[11px] text-muted-2">
            {t('app.profileVersion', { version: APP_VERSION, mode: BUILD_MODE })}
          </p>
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
