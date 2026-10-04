/**
 * «Студия» → «Цвет и кадр» (admins only, 0060): every clip cut from a shoot, graded and framed
 * here, then sent to the render worker.
 *
 * Two addresses:
 *  - `/admin/studio/grade` — the clip grid (`ClipGrid`): filter, select many, paste the copied
 *    settings onto them, queue, retry;
 *  - `/admin/studio/grade/:clipId` — one clip in the editor (`GradeEditor`), on its own address so
 *    Telegram's back button leaves it, asking first when there are unsaved changes.
 *
 * Cutting a shoot into clips is the studio's other screen; this one starts from clips that exist.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { isNetworkError } from '@/lib/api/errors';
import { listMediaClips, type MediaClip } from '@/lib/api/mediaStudio';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useUnsavedGuard } from '@/app/features/admin/useUnsavedGuard';
import { ClipGrid } from '@/app/features/admin/studio/grade/ClipGrid';
import { GradeEditor } from '@/app/features/admin/studio/grade/GradeEditor';
import { useBackOr } from '@/app/hooks/useBackOr';
import { useT } from '@/app/hooks/useT';

const GRID = '/admin/studio/grade';

export default function AdminStudioGradeScreen() {
  const { clipId } = useParams();
  const admin = useIsAdmin();
  if (admin === null) return <AdminBoot />;
  if (admin === false) return <Navigate to="/" replace />;
  return clipId ? <EditorScreen key={clipId} clipId={clipId} /> : <GridScreen />;
}

function GridScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const back = useBackOr('/admin');
  const [reloads, setReloads] = useState(0);

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={t('app.studioGradeTitle')}
          right={
            <IconButton
              label={t('app.studioRefresh')}
              icon="refresh"
              variant="ghost"
              onClick={() => setReloads((n) => n + 1)}
            />
          }
        />
      }
    >
      <ClipGrid reloadSignal={reloads} onOpen={(id) => void navigate(`${GRID}/${id}`)} />
    </Screen>
  );
}

type Load = 'loading' | 'ready' | 'error' | 'offline';

function EditorScreen({ clipId }: { clipId: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [status, setStatus] = useState<Load>('loading');
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedGuard(dirty, GRID);

  const load = useCallback((quiet = false) => {
    if (!quiet) setStatus('loading');
    listMediaClips(null)
      .then((list) => {
        setClips(list);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!quiet) setStatus(isNetworkError(e) ? 'offline' : 'error');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clip = clips.find((c) => c.id === clipId) ?? null;

  // Neighbours in the same shoot, in the order they were filmed.
  const [prevId, nextId] = useMemo(() => {
    if (!clip) return [null, null];
    const shoot = clips
      .filter((c) => c.sourceId === clip.sourceId)
      .sort((a, b) => a.startS - b.startS || a.id.localeCompare(b.id));
    const i = shoot.findIndex((c) => c.id === clip.id);
    return [shoot[i - 1]?.id ?? null, shoot[i + 1]?.id ?? null];
  }, [clips, clip]);

  const onSaved = useCallback((next: MediaClip) => {
    setClips((list) => list.map((c) => (c.id === next.id ? next : c)));
  }, []);

  const title = clip
    ? (clip.exerciseName ?? clip.exerciseId ?? t('app.studioUnlabelled'))
    : t('app.studioGradeTitle');

  return (
    <Screen header={<TopBar back={guard.attempt} title={title} />}>
      {status === 'loading' ? (
        <LoadingBlock />
      ) : status !== 'ready' ? (
        <div role="alert">
          <EmptyState
            title={
              status === 'offline' ? t('app.studioLoadOffline') : t('app.studioGradeLoadError')
            }
            description={status === 'offline' ? t('app.studioLoadOfflineBody') : undefined}
            action={
              <Button variant="secondary" onClick={() => load()}>
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      ) : !clip ? (
        <EmptyState
          title={t('app.studioClipMissingTitle')}
          description={t('app.studioClipMissingBody')}
          action={
            <Button variant="secondary" onClick={() => void navigate(GRID, { replace: true })}>
              {t('app.studioToGrid')}
            </Button>
          }
        />
      ) : (
        <GradeEditor
          clip={clip}
          prevId={prevId}
          nextId={nextId}
          onGo={(id) => {
            setDirty(false);
            void navigate(`${GRID}/${id}`, { replace: true });
          }}
          onSaved={onSaved}
          onReload={() => load(true)}
          onDirtyChange={setDirty}
        />
      )}
      <Modal
        open={guard.asking}
        onClose={guard.stay}
        title={t('app.builderLeaveTitle')}
        description={t('app.studioLeaveBody')}
        confirmLabel={t('app.builderLeaveConfirm')}
        cancelLabel={t('app.builderLeaveStay')}
        danger
        onConfirm={guard.leave}
      />
    </Screen>
  );
}
