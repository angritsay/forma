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
 * 28px rather than the 30px `PageTitle` used. The original reason was that Unbounded capitals are
 * wide; the capitals have since gone (PR #93) and the size stays anyway, because the constraint
 * that actually binds is the column: every question has to fit two lines of 342px with its answers
 * still above the fold. Measured at 390×844 on the built stylesheet — «Сколько тебе лет?» and
 * «Уровень формы» set on one line, «Максимум не выжимаем» on two, and the longest of them leaves
 * the first plate at y=143. 28px is also exactly `text-5xl`, so it is a step on the scale rather
 * than a number of its own; it is written out only because the leading below has to travel with it.
 *
 * **`hyphens-none` is belt and braces now.** `.display` used to turn on `hyphens: auto`, and the
 * wizard opted out because a question broken as «ограни- / чения» reads as a typographic accident
 * on a form somebody is filling in. The owner then read that same accident on the difficulty sheet
 * («се- / годня») and `.display` went to `hyphens: manual` for the whole product, so this class is
 * no longer load-bearing — it is kept because the argument for it here is the strongest in the app
 * and a future change of mind upstream should not silently reach a form. `overflow-wrap:
 * break-word` from `body` is still the last resort, so nothing can widen the column.
 */
export function Question({ text }: { text: string }) {
  // 1.08 → 1.2: every question wraps to two lines and 1.08 was drawn for capitals, which have
  // no descenders. The measurement is in global.css's type-scale comment.
  return <DisplayTitle as="h1" text={text} className="hyphens-none text-[28px] leading-[1.2]" />;
}
