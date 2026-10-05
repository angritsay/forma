/**
 * The band at the bottom of a studio step that holds its next action («Загрузить», «Дальше —
 * названия», «Отправить в обработку»), kept on screen while the list above it scrolls.
 *
 * It stands on top of the floating tab bar rather than reaching under it: its bottom edge is
 * `--nav-inset` (the bar and the gap over it) plus the safe area, which is the line the bar's top
 * stays under. It used to stop at `--nav-inset` alone and pad the safe area inside, so the
 * opaque band ran on under the glass bar, and with Telegram's own bottom inset added to the safe
 * area the buttons could end up under the bar too. From `md` the bar is gone and `--nav-inset`
 * drops to the demo strip, so the band settles on the bottom edge.
 */
export const STUDIO_FOOTER =
  'sticky bottom-[calc(var(--nav-inset,0px)+var(--safe-bottom))] z-10 -mx-4 flex flex-col gap-2 bg-bg px-4 pt-3 pb-3 sm:mx-0 sm:px-0';
