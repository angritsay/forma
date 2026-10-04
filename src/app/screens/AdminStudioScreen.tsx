/**
 * «Студия» (admins only): the filmed videos cut into exercise clips, and where each clip is on its
 * way to the exercise library. See `features/admin/studio/StudioOverview.tsx`.
 */
import { Navigate } from 'react-router';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { StudioOverview } from '@/app/features/admin/studio/StudioOverview';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useT } from '@/app/hooks/useT';

export default function AdminStudioScreen() {
  const { t } = useT();
  const admin = useIsAdmin();

  if (admin === null) return <AdminBoot />;
  if (admin === false) return <Navigate to="/" replace />;

  return (
    <Screen header={<TopBar back title={t('app.studioTitle')} />}>
      <StudioOverview />
    </Screen>
  );
}
