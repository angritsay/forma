/**
 * «Нарезка» (admins only): pick the long workout video, mark one piece per exercise, label and
 * frame each, and upload the pieces. See `features/admin/studio/Cutter.tsx`.
 *
 * The heavy modules (mediabunny, tus-js-client) load inside the cutter on first use, so this
 * screen's own chunk stays small and nothing outside the admin pays for them.
 */
import { Navigate } from 'react-router';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { Cutter } from '@/app/features/admin/studio/Cutter';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useT } from '@/app/hooks/useT';

export default function AdminStudioCutScreen() {
  const { t } = useT();
  const admin = useIsAdmin();

  if (admin === null) return <AdminBoot />;
  if (admin === false) return <Navigate to="/" replace />;

  return (
    <Screen header={<TopBar back="/admin/studio" title={t('app.studioCutTitle')} />}>
      <Cutter />
    </Screen>
  );
}
