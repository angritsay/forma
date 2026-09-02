import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/app/hooks/useT';

/** Full-height brand splash shown while the session boots or a lazy screen loads. */
export function BootScreen() {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="font-display text-5xl">{t('common.brand')}</span>
      <Spinner size={24} className="text-muted" />
    </div>
  );
}
