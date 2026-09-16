import { LogoLoader } from '@/components/ui/LogoLoader';

/**
 * The loading screen: the mark in the middle of the screen, and nothing else.
 *
 * It used to be the mark set left in the content column with the tagline as a kicker under it —
 * the same measure every other screen uses, so that the boot read as a page whose content had not
 * arrived. The owner asked for the opposite: «переделай экран загрузки чтобы лого переливалось
 * медленно и зацикленно по центру и больше ничего не было». A launch screen is not a page missing
 * its content; it is the product's name while the product is on its way, and a sentence underneath
 * gives somebody something to read at the one moment they cannot act on it.
 *
 * So: centred on both axes, the tagline gone, and the mark slowed to a 4.2s loop in which the
 * light travels across it with the weight (`.wordmark-wave`).
 *
 * The size is a clamp rather than a breakpoint ladder, for the same reason the column used to grow:
 * a 36px wordmark alone in the middle of a 1440px window reads as a page that failed rather than
 * one that is coming. It is the same clamp the sign-in title card uses, so the two brand moments
 * are the same object at the same size.
 *
 * `src/pages/app/index.astro` draws this exact layout in plain HTML for the wait before the bundle
 * exists. The two must stay identical — the handover between them should be invisible.
 */
export function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <LogoLoader className="text-[clamp(44px,16vw,96px)]" />
    </div>
  );
}
