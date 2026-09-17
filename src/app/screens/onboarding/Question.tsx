import { DisplayTitle } from '@/app/features/home/DisplayTitle';

/**
 * The one line a step is allowed: its question, in the display face.
 *
 * Every step used to open with a `PageTitle` — a heading at 600 and a lead under it that restated
 * the heading in a sentence («Какое оборудование есть?» / «Отметь всё, что есть дома»). The owner's
 * prototype (`design/ui_kits/app-v2`) asks its one question the way «НАСКОЛЬКО тяжело сегодня?» is
 * asked: the first word at 800, the rest at 200, and then the answers. So the lead is gone, and
 * the question takes the brand's device instead of a subtitle.
 *
 * 28px rather than the 30px `PageTitle` used: Unbounded capitals are wide, and a two-word question
 * has to fit in two lines of a 342px column with the answers still above the fold.
 *
 * **`hyphens-none`, and it is not a detail.** `.display` (src/styles/global.css) turns on
 * `hyphens: auto` for the landing's hero, where a 320px screen would otherwise snap a long Russian
 * word mid-syllable. In the wizard the designer's note was the opposite one and it is right: a
 * question broken as «ОГРАНИ- / ЧЕНИЯ» reads as a typographic accident on a form somebody is
 * filling in. Every question here is short enough to wrap between words, so the wizard opts out
 * and lets the line break where the sentence does. `overflow-wrap: break-word` from `body` is
 * still the last resort, so nothing can widen the column.
 */
export function Question({ text }: { text: string }) {
  return <DisplayTitle as="h1" text={text} className="hyphens-none text-[28px] leading-[1.08]" />;
}
