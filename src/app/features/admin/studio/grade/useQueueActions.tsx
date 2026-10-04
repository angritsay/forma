/**
 * «Отправить в обработку» and «Повторить», for the grid and the editor alike.
 *
 * Before queueing, the plan (`selection.ts`) is read: nothing queueable says why; a queue that
 * would replace an exercise's existing video — or that labels two clips with one exercise — asks
 * first, naming the exercises. Only then does `admin_media_queue` run, and the toast says how many
 * the server actually took.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { queueMediaClips, retryMediaClips, type MediaClip } from '@/lib/api/mediaStudio';
import { useT } from '@/app/hooks/useT';
import { planQueue, retryIds, type QueuePlan } from './selection';
import { studioErrorTitle } from './studioErrors';

export interface QueueActions {
  /** Queue these clips (asking first when it replaces something). */
  queue: (ids: Iterable<string>) => void;
  retry: (ids: Iterable<string>) => void;
  busy: boolean;
  /** The confirm dialog; render it once. */
  dialog: ReactNode;
}

const names = (clips: readonly MediaClip[]): string =>
  clips.map((c) => `«${c.exerciseName ?? c.exerciseId ?? ''}»`).join(', ');

export function useQueueActions(
  clips: readonly MediaClip[],
  /** Called after the server answered, to reload. */
  onDone: () => void,
  /** Runs before a queue or a retry (the editor saves unsaved changes); false stops it. */
  before?: () => Promise<boolean>,
): QueueActions {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<QueuePlan | null>(null);

  const send = useCallback(
    async (plan: QueuePlan) => {
      setAsking(null);
      setBusy(true);
      try {
        if (before && !(await before())) return;
        const n = await queueMediaClips(plan.queue.map((c) => c.id));
        toast.show(
          n > 0
            ? {
                kind: 'success',
                title: t('app.studioQueued', { n }),
                description: t('app.studioQueuedHint'),
              }
            : { kind: 'info', title: t('app.studioQueuedNone') },
        );
        onDone();
      } catch (e) {
        toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioQueueError') });
      } finally {
        setBusy(false);
      }
    },
    [before, onDone, t, toast, tr],
  );

  const queue = useCallback(
    (ids: Iterable<string>) => {
      const plan = planQueue(clips, ids);
      if (plan.queue.length === 0) {
        toast.show({
          kind: 'info',
          title: plan.unlabelled > 0 ? t('app.studioQueueNeedsLabel') : t('app.studioQueueNothing'),
        });
        return;
      }
      if (plan.replacing.length > 0 || plan.sharedExercises.length > 0) setAsking(plan);
      else void send(plan);
    },
    [clips, send, t, toast],
  );

  const retry = useCallback(
    (ids: Iterable<string>) => {
      const list = retryIds(clips, ids);
      if (list.length === 0) return;
      setBusy(true);
      // Unsaved changes go first, as for a queue: a retry renders what is saved.
      void (async () => {
        try {
          if (before && !(await before())) return;
          const n = await retryMediaClips(list);
          toast.show({ kind: 'success', title: t('app.studioRetried', { n }) });
          onDone();
        } catch (e) {
          toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioQueueError') });
        } finally {
          setBusy(false);
        }
      })();
    },
    [before, clips, onDone, t, toast, tr],
  );

  const plan = asking;
  const dialog = (
    <Modal
      open={plan !== null}
      onClose={() => setAsking(null)}
      title={t('app.studioReplaceTitle')}
      confirmLabel={t('app.studioReplaceConfirm', { n: plan?.queue.length ?? 0 })}
      cancelLabel={t('common.cancel')}
      loading={busy}
      onConfirm={() => {
        if (plan) void send(plan);
      }}
    >
      {plan ? (
        <div className="flex flex-col gap-3 text-[14px] text-muted">
          {plan.replacing.length > 0 ? (
            <p>{t('app.studioReplaceBody', { names: names(plan.replacing) })}</p>
          ) : null}
          {plan.sharedExercises.length > 0 ? (
            <p className="text-warning">
              {t('app.studioReplaceShared', {
                names: names(
                  plan.sharedExercises.map(
                    (id) =>
                      plan.queue.find((c) => c.exerciseId === id) ??
                      ({ exerciseId: id } as MediaClip),
                  ),
                ),
              })}
            </p>
          ) : null}
          {plan.unlabelled > 0 ? (
            <p>{t('app.studioQueueSkipUnlabelled', { n: plan.unlabelled })}</p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );

  return { queue, retry, busy, dialog };
}
