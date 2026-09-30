/**
 * «Есть незаконченная тренировка» — asked before a new session replaces the one on the device.
 *
 * Beginning a session overwrites the persisted one (`useActiveWorkoutStore.begin`), so a start
 * with a workout still open used to throw that workout away without a word — the course preview
 * asked first, the coach's workouts did not. Both ask now, the same way, and the question has a
 * way back as well as a way on: «Сохранить ту» when the other workout is finished and only waits
 * to be saved, «Продолжить ту» when it is still under way, and starting this one as the danger.
 */
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { activeWorkoutPath, useActiveWorkoutStore } from '@/app/store/activeWorkout';

/** What to do about a start while another session is open: ask, or just start. */
export function startNeedsConfirm(
  state: { session: unknown } = useActiveWorkoutStore.getState(),
): boolean {
  return state.session !== null;
}

/** The way back to the other workout: save it when it is finished, resume it when not. */
export function resumeLabelKey(finishedAt: string | null): TKey {
  return finishedAt ? 'app.nodeReplaceSaveThat' : 'app.nodeReplaceResumeThat';
}

/** The way back, as the modal's body; a component of its own so it can be rendered in a test. */
export function ReplaceWorkoutBack({
  finishedAt,
  onBack,
}: {
  finishedAt: string | null;
  onBack: () => void;
}) {
  const { t } = useT();
  return (
    <Button variant="action" size="lg" fullWidth onClick={onBack}>
      {t(resumeLabelKey(finishedAt))}
    </Button>
  );
}

export function ReplaceWorkoutModal({
  open,
  loading,
  onClose,
  onReplace,
}: {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onReplace: () => void;
}) {
  const { t } = useT();
  const navigate = useNavigate();
  const session = useActiveWorkoutStore((s) => s.session);
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);
  const back = activeWorkoutPath({ session, finishedAt });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('app.nodeReplaceTitle')}
      description={t('app.nodeReplaceBody')}
      confirmLabel={t('app.nodeReplaceStartThis')}
      cancelLabel={t('common.cancel')}
      danger
      loading={loading}
      onConfirm={onReplace}
    >
      {back ? (
        <ReplaceWorkoutBack
          finishedAt={finishedAt}
          onBack={() => {
            onClose();
            navigate(back);
          }}
        />
      ) : null}
    </Modal>
  );
}
