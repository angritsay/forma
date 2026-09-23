/**
 * Победитель недели — на вкладке клуба, всем участникам.
 *
 * Владелец: «Победитель виден всем в приложении + баннер ему». Приз обещан прямо в приветствии
 * бота — «час с тренером тому, кто выше всех в воскресенье», — и до сих пор это обещание нигде не
 * закрывалось: в понедельник неделя просто начиналась заново, и кто выиграл, знали только те, кто
 * смотрел доску в воскресенье вечером.
 *
 * ## Две плашки, а не одна с условием
 *
 * Победителю и всем остальным говорится разное, и разными голосами. Остальным — новость: кто
 * выиграл, одной строкой, тихо. Победителю — то, ради чего он неделю и старался, и здесь скупость
 * была бы ошибкой: это единственное место, где приложение поздравляет.
 *
 * Поэтому у своей победы кант из градиента клуба — единственная карточка вкладки, обведённая им,
 * — а у чужой обычная поверхность и кубок эмодзи. Неон тут не участвует: он уже занят под место
 * лидера в таблице и под приз, и красить им же объявление значило бы говорить два разных «важно»
 * одним словом.
 *
 * ## Последний объявленный, а не текущая неделя
 *
 * Неделя, которая идёт, победителя ещё не имеет: пруфы сдаются до воскресенья. Поэтому функция
 * отдаёт последнего объявленного (0028), и в понедельник на экране висит тот, кто выиграл вчера —
 * ровно тогда, когда на это и смотрят.
 *
 * Ничего не объявлено — не рисуется ничего. Заголовок «Победитель недели» над пустотой обещает
 * то, чего ещё не случилось.
 */
import { useEffect, useState } from 'react';
import { getClubWinner } from '@/lib/api/marathon';
import type { ClubWinner as ClubWinnerRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export function ClubWinner() {
  const { t } = useT();
  const [row, setRow] = useState<ClubWinnerRow | null>(null);

  useEffect(() => {
    let alive = true;
    getClubWinner()
      .then((r) => {
        if (alive) setRow(r);
      })
      .catch(() => {
        /* Пропавшее объявление никогда не ломает вкладку клуба. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!row) return null;

  if (row.isMe) {
    return (
      /*
       * Своя победа — в кант градиента клуба (стиль B, global.css): 1.5px crossroads вокруг
       * обычной тёмной карточки. Белая плашка, что стояла здесь, ставила `.eyebrow` серым по
       * белому; на поверхности угля всё, что внутри, читается с теми же цифрами, что и везде.
       */
      <div className="mb-4 rounded-card bg-cross p-[1.5px]">
        <div className="flex flex-col gap-1 rounded-[calc(var(--r-card)-1.5px)] bg-surface p-4">
          <span className="eyebrow">{t('app.clubWinnerTitle')}</span>
          <span className="font-display text-[19px] leading-[1.2] text-balance">
            {t('app.clubWinnerYou')}
          </span>
          {/*
           * Приз — словами тренера, из самого круга. Не зашит в текст: он может смениться, и
           * приложение не должно обещать час, если на этой неделе обещали другое.
           */}
          {row.prize ? <span className="text-[13px] text-muted">{row.prize}</span> : null}
          {row.note ? <span className="text-[13px] text-muted">«{row.note}»</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-card border border-border bg-surface p-4">
      <span className="emoji shrink-0 text-[20px]" aria-hidden="true">
        🏆
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="eyebrow text-muted-2">{t('app.clubWinnerTitle')}</span>
        <span className="truncate text-[15px] leading-tight text-text">{row.displayName}</span>
        {row.note ? (
          <span className="truncate text-[12px] leading-tight text-muted-2">«{row.note}»</span>
        ) : null}
      </span>
    </div>
  );
}
