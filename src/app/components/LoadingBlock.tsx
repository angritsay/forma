import { LogoLoader } from '@/components/ui/LogoLoader';

/**
 * A panel waiting: the wordmark, small and centred, where a list or a bundle is still coming.
 *
 * This is the in-screen counterpart of {@link BootScreen} — the screen's own chrome is already
 * drawn and only its contents are missing, so the mark is set at reading size rather than at
 * display size. It replaced eight copies of a centred `<Spinner>` that had been written out by
 * hand in eight files with three different paddings; the padding is settled here at the one the
 * majority used, so a wait looks the same wherever it happens.
 *
 * Not for inline waits. A button, a row or a refresh glyph keeps `<Spinner size={16}>`: a
 * wordmark at 16px is a smudge, and there the indicator's job is to mark one control as busy
 * rather than to say the product is thinking.
 */
export function LoadingBlock() {
  return (
    <div className="flex justify-center py-10">
      <LogoLoader className="text-3xl" />
    </div>
  );
}
