/**
 * The old «Цвет и кадр» addresses of 0060 (`/admin/studio/grade`, `/admin/studio/grade/:clipId`),
 * kept so a bookmark or a link in a message still lands somewhere: the grid goes to the studio's
 * overview, one clip to the colour step of its video, open on it (`flow.ts`).
 */
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { listMediaClips } from '@/lib/api/mediaStudio';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { STUDIO_PATH, studioStepPath } from '@/app/features/admin/studio/flow';

export default function AdminStudioGradeScreen() {
  const { clipId } = useParams();
  const admin = useIsAdmin();
  const [to, setTo] = useState<string | null>(clipId ? null : STUDIO_PATH);

  useEffect(() => {
    if (!clipId || admin !== true) return;
    let alive = true;
    listMediaClips(null)
      .then((list) => {
        const clip = list.find((c) => c.id === clipId);
        if (alive) setTo(clip ? studioStepPath(clip.sourceId, 'color', clip.id) : STUDIO_PATH);
      })
      .catch(() => {
        if (alive) setTo(STUDIO_PATH);
      });
    return () => {
      alive = false;
    };
  }, [admin, clipId]);

  if (admin === false) return <Navigate to="/" replace />;
  if (admin === null || to === null) return <AdminBoot />;
  return <Navigate to={to} replace />;
}
