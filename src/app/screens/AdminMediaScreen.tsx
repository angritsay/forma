/**
 * The media library (admins only): every clip, recording and still in the buckets, by folder,
 * with the exercises that use each one. See `features/admin/media/MediaLibrary.tsx`.
 */
import { Navigate } from 'react-router';
import { Screen } from '@/components/ui/Screen';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { MediaLibrary } from '@/app/features/admin/media/MediaLibrary';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useT } from '@/app/hooks/useT';

export default function AdminMediaScreen() {
  const { t } = useT();
  const admin = useIsAdmin();

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;

  return (
    <Screen header={<TopBar back title={t('app.mediaLibTitle')} />}>
      <MediaLibrary />
    </Screen>
  );
}
