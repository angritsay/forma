/**
 * Profile (docs/SPEC.md §10 flow 11): avatar, name, email, fitness index, equipment and
 * limitations editors, language, player sounds, sign out, version, and the admin entry point.
 * "Retake tests" seeds the onboarding draft from the profile so the wizard resumes at the tests.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import type { Equipment } from '@/content/schema';
import { isAppError } from '@/lib/api/errors';
import { disableDemo, isDemo, isDemoForced, resetDemo } from '@/lib/api/mode';
import type { ProfilePatch } from '@/lib/api/types';
import type { Limitation } from '@/lib/training/types';
import { LanguageToggle } from '@/app/components/LanguageToggle';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useSoundStore } from '@/app/features/player/sound';
import { EquipmentSheet } from '@/app/features/profile/EquipmentSheet';
import { FitnessCard } from '@/app/features/profile/FitnessCard';
import {
  equipmentSummary,
  fitnessOf,
  limitationsSummary,
  newAvatarSeed,
  profileToDraft,
  withEquipment,
  withLimitations,
} from '@/app/features/profile/model';
import { LimitationsSheet } from '@/app/features/profile/LimitationsSheet';
import { ProfileHeader } from '@/app/features/profile/ProfileHeader';
import { Switch } from '@/app/features/profile/Switch';
import { APP_VERSION, BUILD_MODE } from '@/app/features/profile/version';
import { Section } from '@/app/features/stats/Section';
import { saveDraft } from '@/app/screens/onboarding/draft';
import { useSession } from '@/app/store/session';

type Busy = 'avatar' | 'name' | 'equipment' | 'limitations' | null;
type SheetName = 'equipment' | 'limitations' | null;
type DemoDialog = 'reset' | 'leave' | null;

export default function ProfileScreen() {
  const tr = useT();
  const { t, locale } = tr;
  const navigate = useNavigate();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const admin = useIsAdmin();
  const muted = useSoundStore((s) => s.muted);
  const setMuted = useSoundStore((s) => s.setMuted);
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

  const header = (
    <div className="flex h-16 items-center gap-2 px-5">
      <h1 className="font-display min-w-0 flex-1 truncate text-2xl">{t('app.profileTitle')}</h1>
    </div>
  );

  if (!profile) {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-5 py-2" aria-hidden="true">
          <Skeleton rounded="card" className="h-28" />
          <Skeleton rounded="card" className="h-28" />
          <Skeleton rounded="card" className="h-40" />
        </div>
      </Screen>
    );
  }

  const tp = profile.trainingProfile;
  const fitness = fitnessOf(profile);
  const email = profile.email || user?.email || '';

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
    <Screen header={header}>
      <div className="flex flex-col gap-6 py-2">
        <ProfileHeader
          seed={profile.avatarSeed || profile.id}
          name={profile.displayName ?? ''}
          email={email}
          busy={busy === 'avatar' || busy === 'name' ? busy : null}
          onNewAvatar={() => void save({ avatarSeed: newAvatarSeed() }, 'avatar')}
          onSaveName={(name) => save({ displayName: name }, 'name')}
        />
        <FitnessCard
          fitness={fitness}
          onRetake={retakeTests}
          onSetup={() => navigate('/onboarding')}
        />

        <Section title={t('app.profileTrainingSection')}>
          <Card padding="none">
            <ul className="divide-y divide-border">
              <li>
                <ListRow
                  leading={<Icon name="settings" />}
                  title={t('app.profileEquipment')}
                  subtitle={equipmentSummary(tr, tp)}
                  disabled={!tp}
                  onClick={() => setSheet('equipment')}
                />
              </li>
              <li>
                <ListRow
                  leading={<Icon name="warning" />}
                  title={t('app.profileLimitations')}
                  subtitle={limitationsSummary(tr, tp)}
                  disabled={!tp}
                  onClick={() => setSheet('limitations')}
                />
              </li>
            </ul>
          </Card>
        </Section>

        <Section title={t('app.profileSettingsSection')}>
          <Card padding="none">
            <ul className="divide-y divide-border">
              <li>
                <ListRow
                  leading={<Icon name="globe" />}
                  title={t('common.language')}
                  trailing={<LanguageToggle />}
                />
              </li>
              <li>
                <ListRow
                  leading={<Icon name="bolt" />}
                  title={t('app.profileSound')}
                  subtitle={muted ? t('app.profileSoundOff') : t('app.profileSoundOn')}
                  trailing={
                    <Switch
                      checked={!muted}
                      onChange={(on) => setMuted(!on)}
                      label={t('app.profileSound')}
                    />
                  }
                />
              </li>
            </ul>
          </Card>
        </Section>

        {demo ? (
          <Section title={t('app.demoSection')}>
            <Card padding="none">
              <ul className="divide-y divide-border">
                <li className="px-4 py-3 text-sm text-muted">{t('app.demoDataNote')}</li>
                <li>
                  <ListRow
                    leading={<Icon name="refresh" />}
                    title={t('app.demoReset')}
                    subtitle={t('app.demoResetHint')}
                    onClick={() => setDemoDialog('reset')}
                  />
                </li>
                {canLeaveDemo ? (
                  <li>
                    <ListRow
                      leading={<Icon name="logout" />}
                      title={t('app.demoLeave')}
                      subtitle={t('app.demoLeaveHint')}
                      onClick={() => setDemoDialog('leave')}
                    />
                  </li>
                ) : null}
              </ul>
            </Card>
          </Section>
        ) : null}

        <Section title={t('app.profileAccountSection')}>
          <Card padding="none">
            <ul className="divide-y divide-border">
              {admin === true ? (
                <li>
                  <ListRow
                    leading={<Icon name="star" />}
                    title={t('app.profileAdmin')}
                    subtitle={t('app.profileAdminHint')}
                    onClick={() => navigate('/admin')}
                  />
                </li>
              ) : null}
              <li>
                <ListRow
                  leading={<Icon name="logout" className="text-danger" />}
                  title={<span className="text-danger">{t('app.profileSignOut')}</span>}
                  trailing={null}
                  onClick={() => setSignOutOpen(true)}
                />
              </li>
            </ul>
          </Card>
        </Section>

        <p className="text-center text-xs text-muted-2">
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
  );
}
