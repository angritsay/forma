/** A clip's status as a chip, the same words in the grid and in the editor. */
import { Chip, type ChipTone } from '@/components/ui/Chip';
import type { MediaClipStatus } from '@/lib/api/mediaStudio';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';

const LABEL: Record<MediaClipStatus, TKey> = {
  draft: 'app.studioStatusDraft',
  queued: 'app.studioStatusQueued',
  rendering: 'app.studioGradeStatusRendering',
  done: 'app.studioStatusDone',
  failed: 'app.studioStatusFailed',
};

const TONE: Record<MediaClipStatus, ChipTone> = {
  draft: 'default',
  queued: 'accent',
  rendering: 'accent',
  done: 'success',
  failed: 'danger',
};

export function ClipStatusChip({ status }: { status: MediaClipStatus }) {
  const { t } = useT();
  return (
    <Chip size="sm" tone={TONE[status]}>
      {t(LABEL[status])}
    </Chip>
  );
}
