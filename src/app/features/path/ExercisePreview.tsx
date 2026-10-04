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
 * плеере, перевернув её: «Техника», «Советы», «Осторожно», слово в слово и вкладка во
 * вкладку. Не похожий экран, а тот же компонент.
 *
 * ## Клип, а не кадр
 *
 * На вкладке «Видео» — сам клип движения: без звука, по кругу, сразу. Кадр (`ExerciseStill`) остаётся под ним
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
 * ## Одна строка вкладок рядом с ✕
 *
 * Сначала тело шторки было карточкой с двумя сторонами (`FlipCard`, как в плеере): спереди клип,
 * сзади — обведённая рамкой карточка со своей строкой «← Видео · название» и вкладками, уехавшими
 * вниз. Владелица, увидев это на телефоне: рамка в рамке, а вкладки должны стоять в одной строке с
 * крестиком шторки и без обводки. Из предложенных вариантов она выбрала все четыре в один ряд:
 *
 *   **Видео · Техника · Советы · Осторожно** ✕
 *
 * Поэтому переворота здесь больше нет — шторка просто меняет содержимое под строкой:
 *
 *   - **Видео** — клип в цвете, со скруглёнными углами и без рамки, на нём название и крупная цель
 *     поверх того же затемнения снизу, что и раньше;
 *   - **Техника** — сначала заметка тренера к этому упражнению (`ItemNotes`), под ней пошаговое
 *     «как делать» и дыхание;
 *   - **Советы** и **Осторожно** — те же страницы, что на обороте карточки в плеере.
 *
 * Строка вкладок — это `bar` шторки: она стоит в шапке вместо заголовка, по центру по высоте с ✕.
 * Вкладки те же, что в плеере (`EXERCISE_TABS` из `CardBack`), и тот же компонент `Tabs`; сами
 * страницы рисует `ExerciseBack` с `hideTabs` — без своей строки и своей панели. Шапка шторки
 * остаётся одной строкой: на узком телефоне (320–390px) вкладки прокручиваются вбок внутри своей
 * строки, крестик не сдвигается (он не сжимается, а строка берёт только оставшееся место), а тело
 * шторки вбок не едет.
 *
 * Высота области под строкой постоянна — это коробка видео. Текстовые вкладки прокручиваются
 * внутри неё по вертикали, поэтому шторка не прыгает при переключении. Клип, пока открыта другая
 * вкладка, стоит на паузе и не перезагружается: вернулись на «Видео» — он идёт дальше.
 *
 * Каждое упражнение открывается на «Видео», а не там, где оставили прошлое. Плеер свою карточку
 * с переворотом не меняет.
 *
 * Для экранного диктора: `id` вкладок и панелей с префиксом (`ID`), чтобы не совпасть с вкладками
 * `ExerciseBack` в плеере или на экране позади; шторка называется именем упражнения (`label`), а
 * фокус при открытии встаёт на выбранную вкладку.
 */
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Sheet } from '@/components/ui/Sheet';
import { Tabs, tabId, tabPanelId } from '@/components/ui/Tabs';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { findExercise } from '@/content/catalogue';
import { exerciseStillUrl } from '@/lib/api/storage';
import type { PrescribedItem } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';
import {
  EXERCISE_TABS,
  ExerciseBack,
  ItemNotes,
  type ExerciseTab,
} from '@/app/features/player/CardBack';
import { exerciseVideoRef } from '@/app/features/player/model';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export interface ExercisePreviewProps {
  /** Упражнение и его нагрузка, или `null` — шторка закрыта. */
  item: PrescribedItem | null;
  onClose: () => void;
}

type PreviewTab = 'video' | ExerciseTab;

/**
 * Prefix for this drawer's tab and panel ids. `ExerciseBack` in the player and the tabs of a screen
 * behind the sheet use the bare `tab-technique` / `tabpanel-technique`; these must not be the same.
 */
const ID = 'exercise-preview-';

/**
 * The movement's clip, playing on its own; the still until it can, and instead of it if it can't.
 * It fills the video tab's box, in colour.
 */
function ExerciseClip({ exerciseId, paused }: { exerciseId: string; paused: boolean }) {
  const { locale } = useT();
  const url = useMediaUrl(exerciseVideoRef(exerciseId, locale));
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [url]);
  useEffect(() => {
    /* `autoPlay` alone is ignored by some WebViews when the source arrives after the element was
       created; asking once more when the URL lands is harmless everywhere else. While another tab
       is open the clip is hidden but would go on decoding: it rests until «Видео» is chosen again,
       and picks up where it stopped. */
    const v = video.current;
    if (!v) return;
    if (paused) v.pause();
    else void v.play().catch(() => undefined);
  }, [url, paused]);

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
            'absolute inset-0 size-full object-cover transition-opacity duration-200 ease-(--ease-out) motion-reduce:transition-none',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}
    </div>
  );
}

/** The video tab: the clip with no frame around it, the target and the name over its lower half. */
function VideoPanel({
  item,
  name,
  hidden,
}: {
  item: PrescribedItem;
  name: string;
  hidden: boolean;
}) {
  const { t } = useT();
  return (
    <div
      id={tabPanelId('video', ID)}
      role="tabpanel"
      aria-labelledby={tabId('video', ID)}
      hidden={hidden}
      className="relative size-full overflow-hidden rounded-card bg-surface-2"
    >
      <ExerciseClip exerciseId={item.exerciseId} paused={hidden} />
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
      <div className="absolute inset-x-0 bottom-0 p-4">
        {/* No target, no number: the fitness test opens this drawer for a movement it asks about
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
        {/* `h2`: the sheet has no title of its own, so this is the dialog's first heading. */}
        <h2 className="line-clamp-2 font-display text-[19px] leading-tight text-paper">{name}</h2>
      </div>
    </div>
  );
}

export function ExercisePreview({ item, onClose }: ExercisePreviewProps) {
  const { t, l } = useT();
  const exercise = item ? findExercise(item.exerciseId) : null;
  const shownId = item && exercise ? item.exerciseId : null;

  /*
   * Каждое упражнение открывается на «Видео». Вкладка хранится вместе с тем, для какого движения
   * её выбрали; открыли другое (или закрыли шторку) — она сбрасывается в том же рендере, без
   * кадра со старой вкладкой.
   */
  const [tab, setTab] = useState<PreviewTab>('video');
  const [tabFor, setTabFor] = useState<string | null>(shownId);
  if (tabFor !== shownId) {
    setTabFor(shownId);
    setTab('video');
  }

  /*
   * A tap on a cell half-hidden at the edge of the row brings it whole into view. Arrow keys get
   * this for free from the focus they move; a tap does not move focus in Safari. Only the row is
   * scrolled — `scrollIntoView` would also move the page behind the sheet while it slides in.
   */
  const row = useRef<HTMLDivElement>(null);
  const choose = (next: PreviewTab) => {
    setTab(next);
    const box = row.current;
    const cell = document.getElementById(tabId(next, ID));
    if (!box || !cell) return;
    const r = box.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    if (c.left < r.left) box.scrollLeft -= r.left - c.left;
    else if (c.right > r.right) box.scrollLeft += c.right - r.right;
  };

  const bar =
    item && exercise ? (
      <div
        ref={row}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Tabs
          variant="fill"
          fit
          idPrefix={ID}
          label={t('app.playerCardBackLabel')}
          tabs={[
            { id: 'video' as PreviewTab, label: t('app.previewTabVideo') },
            ...EXERCISE_TABS.map((x) => ({ id: x.id as PreviewTab, label: t(x.key) })),
          ]}
          value={tab}
          onChange={choose}
        />
      </div>
    ) : undefined;

  return (
    <Sheet
      open={item !== null}
      onClose={onClose}
      label={exercise ? l(exercise.name) : undefined}
      bar={bar}
    >
      {item && exercise ? (
        /*
         * One fixed height for every tab — the video's box: the sheet keeps its size when the tab
         * changes, and a long page scrolls inside it rather than growing the sheet.
         */
        <div className="h-[min(68dvh,600px)] w-full min-w-0 overflow-x-hidden md:h-[min(62dvh,560px)]">
          <VideoPanel item={item} name={l(exercise.name)} hidden={tab !== 'video'} />
          {tab !== 'video' ? (
            <div
              // A page per key: «Советы» opens at its top, not where «Техника» was scrolled to.
              key={tab}
              id={tabPanelId(tab, ID)}
              role="tabpanel"
              aria-labelledby={tabId(tab, ID)}
              // Focusable so a keyboard can scroll a long page; no control inside to take focus. The
              // ring goes inside: the box around it clips anything drawn outside.
              tabIndex={0}
              className="size-full overflow-x-hidden overflow-y-auto overscroll-contain focus-visible:-outline-offset-2"
            >
              <div className="flex flex-col gap-5 pb-2">
                {tab === 'technique' ? <ItemNotes item={item} /> : null}
                <ExerciseBack exerciseId={item.exerciseId} item={item} tab={tab} hideTabs />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
