/**
 * «Студия» for one filmed video (admins only, 0060–0061): `/admin/studio/s/:sourceId/:step`, with
 * the stepper «Нарезка · Названия · Цвет · Превью» over the step.
 *
 *  - `cut` — the cutter on this source (`Cutter`): pick the same file, cut more, upload;
 *  - `name` — each clip's exercise and play mode (`NameStep`);
 *  - `color` — colour, one clip at a time, pasted onto many (`ColorStep`);
 *  - `preview` — the card and the player, the framing, and «Отправить в обработку»
 *    (`PreviewStep`).
 *
 * A step that is not open yet (`flow.ts`) sends the address to the furthest one that is. `?clip=`
 * keeps the clip open in the colour and preview steps, so Telegram's back button and a reload land
 * on it. Leaving the colour step with unsaved changes asks first.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { isNetworkError } from '@/lib/api/errors';
import { listMediaClips, listMediaSources, type MediaClip } from '@/lib/api/mediaStudio';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useUnsavedGuard } from '@/app/features/admin/useUnsavedGuard';
import { ColorStep } from '@/app/features/admin/studio/ColorStep';
import { Cutter } from '@/app/features/admin/studio/Cutter';
import {
  allowedStep,
  isStudioStep,
  STUDIO_PATH,
  studioStepPath,
  type StudioStep,
} from '@/app/features/admin/studio/flow';
import { NameStep } from '@/app/features/admin/studio/NameStep';
import { PreviewStep } from '@/app/features/admin/studio/PreviewStep';
import { StudioSteps } from '@/app/features/admin/studio/StudioSteps';
import { useT } from '@/app/hooks/useT';

type Load = 'loading' | 'ready' | 'error' | 'offline';

export default function AdminStudioFlowScreen() {
  const { sourceId, step } = useParams();
  const admin = useIsAdmin();
  if (admin === null) return <AdminBoot />;
  if (admin === false) return <Navigate to="/" replace />;
  if (!sourceId) return <Navigate to={STUDIO_PATH} replace />;
  if (!isStudioStep(step)) return <Navigate to={studioStepPath(sourceId, 'name')} replace />;
  // Leaving the cutter remounts: the steps after it start from the clips as uploaded.
  return (
    <Flow key={`${sourceId}:${step === 'cut' ? 'cut' : 'steps'}`} sourceId={sourceId} step={step} />
  );
}

function Flow({ sourceId, step }: { sourceId: string; step: StudioStep }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clipId = params.get('clip');
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Load>('loading');
  const [dirty, setDirty] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const guard = useUnsavedGuard(dirty, STUDIO_PATH);

  const load = useCallback(
    (quiet = false) => {
      if (!quiet) setStatus('loading');
      Promise.all([listMediaClips(sourceId), listMediaSources()])
        .then(([list, sources]) => {
          setClips([...list].sort((a, b) => a.startS - b.startS || a.id.localeCompare(b.id)));
          setTitle(sources.find((s) => s.id === sourceId)?.title ?? '');
          setStatus('ready');
        })
        .catch((e: unknown) => {
          if (!quiet) setStatus(isNetworkError(e) ? 'offline' : 'error');
        });
    },
    [sourceId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = useCallback((next: MediaClip) => {
    setClips((list) => list.map((c) => (c.id === next.id ? next : c)));
  }, []);

  /** Another step or the overview; asks first while the colour has unsaved changes. */
  const go = (to: string) => {
    if (dirty) setLeaveTo(to);
    else void navigate(to);
  };
  const goStep = (s: StudioStep) => go(studioStepPath(sourceId, s, s === 'cut' ? null : clipId));
  const setActive = (id: string) =>
    setParams(
      (p) => {
        p.set('clip', id);
        return p;
      },
      { replace: true },
    );

  const header = (
    <TopBar
      back={dirty ? guard.attempt : STUDIO_PATH}
      title={title || t('app.studioTitle')}
      right={
        step === 'cut' ? undefined : (
          <IconButton
            label={t('app.studioRefresh')}
            icon="refresh"
            variant="ghost"
            onClick={() => load(true)}
          />
        )
      }
    />
  );

  // Until the clips are known the gates cannot be read; the cutter needs none of them.
  const ready = status === 'ready';
  const allowed = ready ? allowedStep(step, clips) : step;
  if (ready && allowed !== step) {
    return <Navigate to={studioStepPath(sourceId, allowed)} replace />;
  }

  return (
    <Screen header={header}>
      <StudioSteps current={step} clips={clips} onGo={goStep} />
      {step === 'cut' ? (
        <Cutter sourceId={sourceId} sourceTitle={title} onUploaded={() => load(true)} />
      ) : status === 'loading' ? (
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
      ) : step === 'name' ? (
        <NameStep clips={clips} onSaved={onSaved} onNext={() => goStep('color')} />
      ) : step === 'color' ? (
        <ColorStep
          clips={clips}
          activeId={clipId}
          onActive={setActive}
          onSaved={onSaved}
          onReload={() => load(true)}
          onDirtyChange={setDirty}
          onNext={() => goStep('preview')}
        />
      ) : (
        <PreviewStep
          clips={clips}
          activeId={clipId}
          onActive={setActive}
          onSaved={onSaved}
          onReload={() => load(true)}
        />
      )}
      <Modal
        open={guard.asking || leaveTo !== null}
        onClose={() => {
          setLeaveTo(null);
          guard.stay();
        }}
        title={t('app.builderLeaveTitle')}
        description={t('app.studioLeaveBody')}
        confirmLabel={t('app.builderLeaveConfirm')}
        cancelLabel={t('app.builderLeaveStay')}
        danger
        onConfirm={() => {
          const to = leaveTo;
          setLeaveTo(null);
          setDirty(false);
          // Over the guard's own extra entry, so back from the next step lands on this one.
          if (to) void navigate(to, { replace: true });
          else guard.leave();
        }}
      />
    </Screen>
  );
}
