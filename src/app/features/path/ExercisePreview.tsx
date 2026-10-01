/**
 * Упражнение крупно, ещё до того, как тренировка началась.
 *
 * ## Шторка снизу, а не окно посередине
 *
 * Сначала это было окно на 90% экрана с затемнением («в мордалке на 90 процентов экрана»). Владелица
 * передумала, увидев его на телефоне: «Пояснение должно открываться в нижнем drawer, не должно
 * скроллиться по горизонтали, плюс видео должно проигрываться автоматически». Шторка — тот же
 * `Sheet`, что у всех выборов в приложении: снизу, до 92% высоты, закрывается крестиком, Esc или
 * тапом по фону, а список позади остаётся виден.
 *
 * ## «Так же, как на тренировке» — буквально
 *
 * Внутри стоит `ExerciseBack` — та самая обратная сторона карточки, которую человек видит в
 * плеере, перевернув её: «Техника», «Рекомендации», «Осторожно», слово в слово и вкладка во
 * вкладку. Не похожий экран, а тот же компонент.
 *
 * ## Клип, а не кадр
 *
 * Сверху — сам клип движения: без звука, по кругу, сразу. Кадр (`ExerciseStill`) остаётся под ним
 * и запасным вариантом: пока подписывается ссылка, у движения ещё нет видео или браузер отказался
 * от автозапуска — видно кадр, а не чёрный прямоугольник. `muted` + `playsInline` — условие, при
 * котором iOS и Telegram WebView вообще разрешают автозапуск.
 *
 * ## Без прокрутки вбок
 *
 * Тело шторки прокручивается по вертикали, а `overflow-y: auto` в CSS включает и горизонтальную
 * прокрутку, как только что-то внутри оказывается шире. Содержимое поэтому обёрнуто в блок шириной
 * ровно со шторку и с `overflow-x-hidden`: что бы ни оказалось шире, оно обрезается, а не
 * утаскивает весь столбец вбок, как было на скриншоте.
 *
 * Нагрузка передаётся вместе с упражнением: «Осторожно» зависит от неё — то, что безопасно налегке,
 * с весом может быть противопоказано.
 *
 * ## Карточка с двумя сторонами
 *
 * Клип и текст стояли столбиком: видео, под ним вкладки. Владелица попросила «как у нас сделано» —
 * как в плеере, где это одна карточка: спереди видео, сзади слова. Поэтому тело шторки теперь тот же
 * `FlipCard`, что в плеере, в коробке фиксированной высоты:
 *
 *   - **лицо** — клип во всю карточку, название, крупная цель и кнопка «Как делать ↻»;
 *   - **оборот** — заметка тренера к этому упражнению (`ItemNotes`, как на обороте в плеере), под
 *     ней `ExerciseBack` с вкладками, и кнопка «← Видео».
 *
 * Кнопки нужны потому, что `FlipCard` переворачивается только свайпом вбок, а вертикаль здесь
 * принадлежит шторке и прокрутке текста. Свайп вбок работает как в плеере; без анимации
 * (`prefers-reduced-motion`) стороны меняются мгновенно — это делает сам `FlipCard`. Плеер свою
 * карточку не меняет: здесь только используется тот же компонент.
 *
 * Заголовка у шторки больше нет — название стоит на лице карточки, а шторка называется им для
 * экранного диктора (`label`).
 */
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { findExercise } from '@/content/catalogue';
import { exerciseStillUrl } from '@/lib/api/storage';
import type { PrescribedItem } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { ExerciseBack, ItemNotes } from '@/app/features/player/CardBack';
import { FlipCard } from '@/app/features/player/FlipCard';
import { exerciseVideoRef } from '@/app/features/player/model';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export interface ExercisePreviewProps {
  /** Упражнение и его нагрузка, или `null` — шторка закрыта. */
  item: PrescribedItem | null;
  onClose: () => void;
}

/**
 * The movement's clip, playing on its own; the still until it can, and instead of it if it can't.
 * It fills the card's front, in colour.
 */
function ExerciseClip({ exerciseId }: { exerciseId: string }) {
  const { locale } = useT();
  const url = useMediaUrl(exerciseVideoRef(exerciseId, locale));
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [url]);
  useEffect(() => {
    /* `autoPlay` alone is ignored by some WebViews when the source arrives after the element was
       created; asking once more when the URL lands is harmless everywhere else. */
    void video.current?.play().catch(() => undefined);
  }, [url]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-surface-2">
      <ExerciseStill exerciseId={exerciseId} loading="eager" />
      {url ? (
        <video
          ref={video}
          key={url}
          src={url}
          poster={exerciseStillUrl(exerciseId)}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          onPlaying={() => setReady(true)}
          className={clsx(
            'absolute inset-0 size-full object-cover transition-opacity duration-200 ease-(--ease-out)',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}
    </div>
  );
}

/**
 * The card itself. Mounted per movement (`key` below), so a card opened for the next movement starts
 * on its front rather than wherever the last one was left.
 */
function PreviewCard({ item }: { item: PrescribedItem }) {
  const { t, l } = useT();
  const exercise = findExercise(item.exerciseId);
  const [flipped, setFlipped] = useState(false);
  const toBack = useRef<HTMLButtonElement>(null);
  const toFront = useRef<HTMLButtonElement>(null);
  /*
   * The face turned away goes `inert`, and the button that turned it was on that face — so focus
   * would drop to the page. It is handed to the other face's button instead, after the render that
   * made that face live. Skipped on mount: opening the sheet is not a turn.
   */
  const turned = useRef(false);
  useEffect(() => {
    if (!turned.current) return;
    (flipped ? toFront : toBack).current?.focus({ preventScroll: true });
  }, [flipped]);
  const flip = (next: boolean) => {
    turned.current = true;
    setFlipped(next);
  };
  if (!exercise) return null;
  const name = l(exercise.name);

  const front = (
    <div className="relative size-full overflow-hidden rounded-card bg-surface-2">
      <ExerciseClip exerciseId={item.exerciseId} />
      {/*
       * The same fade-to-ground the workout's hero lays under its title, sized for a card. Over
       * the worst frame (pure white) the type's top edge sits on at least .7 of the ground: white
       * measures 7:1 there, and the name, lower down, more.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'linear-gradient(180deg, rgba(var(--bg-rgb),0) 0%, rgba(var(--bg-rgb),0.7) 45%, rgba(var(--bg-rgb),0.92) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          {/* No target, no number: the fitness test opens this card for a movement it asks about
              rather than prescribes (`AssessmentScreen`), and «0 повт.» there would be a lie. */}
          {item.target > 0 ? (
            <p className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-paper">
              <span className="numeral tabular text-[40px] leading-none">{item.target}</span>
              <span className="text-sm text-paper">
                {t(`training.${item.unit}`)}
                {item.perSide ? ` · ${t('training.perSide')}` : ''}
              </span>
            </p>
          ) : null}
          <h3 className="line-clamp-2 font-display text-[19px] leading-tight text-paper">{name}</h3>
        </div>
        <Button
          ref={toBack}
          variant="primary"
          shape="pill"
          size="sm"
          className="shrink-0"
          aria-label={t('app.previewFlipToBackLabel')}
          onClick={() => flip(true)}
          iconRight={<Glyph size={12}>↻</Glyph>}
        >
          {t('app.previewFlipToBack')}
        </Button>
      </div>
    </div>
  );

  const back = (
    <div className="flex size-full flex-col overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Button
          ref={toFront}
          variant="ghost"
          size="sm"
          aria-label={t('app.previewFlipToFrontLabel')}
          onClick={() => flip(false)}
          icon={<Glyph size={12}>←</Glyph>}
        >
          {t('app.previewFlipToFront')}
        </Button>
        <span className="min-w-0 truncate text-sm text-muted">{name}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4">
        <div className="flex flex-col gap-5">
          <ItemNotes item={item} />
          <ExerciseBack exerciseId={item.exerciseId} item={item} />
        </div>
      </div>
    </div>
  );

  return (
    /*
     * A fixed height, because both faces are laid absolutely on top of each other: the card takes
     * the room the sheet has (92dvh, less its close row) and never more, so the back scrolls inside
     * itself and the sheet does not scroll under a turned card.
     */
    <div className="h-[min(68dvh,600px)] w-full md:h-[min(62dvh,560px)]">
      <FlipCard flipped={flipped} onFlip={flip} front={front} back={back} />
    </div>
  );
}

export function ExercisePreview({ item, onClose }: ExercisePreviewProps) {
  const { l } = useT();
  const exercise = item ? findExercise(item.exerciseId) : null;

  return (
    <Sheet open={item !== null} onClose={onClose} label={exercise ? l(exercise.name) : undefined}>
      {item && exercise ? (
        <div className="w-full min-w-0 overflow-x-hidden">
          <PreviewCard key={item.exerciseId} item={item} />
        </div>
      ) : null}
    </Sheet>
  );
}
