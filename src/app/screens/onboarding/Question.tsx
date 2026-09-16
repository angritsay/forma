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
 * 28px rather than the 30px `PageTitle` used: Unbounded capitals are wide, and «ПОДСТРОИТЬ
 * тренировки под тебя?» has to fit in two lines of a 342px column with the answers still above
 * the fold.
 */
export function Question({ text }: { text: string }) {
  return <DisplayTitle as="h1" text={text} className="text-[28px] leading-[1.08]" />;
}
