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
 */
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Sheet } from '@/components/ui/Sheet';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { findExercise } from '@/content/catalogue';
import { exerciseStillUrl } from '@/lib/api/storage';
import type { PrescribedItem } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import { ExerciseBack } from '@/app/features/player/CardBack';
import { exerciseVideoRef } from '@/app/features/player/model';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export interface ExercisePreviewProps {
  /** Упражнение и его нагрузка, или `null` — шторка закрыта. */
  item: PrescribedItem | null;
  onClose: () => void;
}

/** The movement's clip, playing on its own; the still until it can, and instead of it if it can't. */
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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-surface-2">
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

export function ExercisePreview({ item, onClose }: ExercisePreviewProps) {
  const { l } = useT();
  const exercise = item ? findExercise(item.exerciseId) : null;

  return (
    <Sheet
      open={item !== null}
      onClose={onClose}
      title={exercise && item ? l(exercise.name) : undefined}
      label={exercise ? l(exercise.name) : undefined}
    >
      {item && exercise ? (
        <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-hidden">
          <ExerciseClip exerciseId={item.exerciseId} />
          <ExerciseBack exerciseId={item.exerciseId} item={item} />
        </div>
      ) : null}
    </Sheet>
  );
}
