/**
 * The pair's state and its two actions — read, share the invite, leave — as a hook. `ClubDuo`
 * draws it.
 *
 * ## Два состояния, и второе не хуже первого
 *
 * **Пара есть.** Тогда на экране два аватара и `&` между ними, под каждым — отметка за сегодня.
 * Откуда пара — важно, потому что это два разных обещания: подругу ты выбрала сама и она
 * останется, пока вы сами не разойдётесь; подобранная нами меняется каждый понедельник. Это
 * сказано в шторке «···», а не на лицевой стороне: человек, не знающий, какая у него пара, в
 * понедельник обнаружит чужое имя и решит, что что-то сломалось, — но читает он это раз в неделю.
 *
 * **Пары нет.** Владелец: «если же у тебя нету дуо, то там должен быть баннер, что нету дуо, мы
 * найдём тебе его автоматически, и каждую неделю мы будем менять тебе дуо». Второе место —
 * пунктирный «?», одна строка «Партнёр — в понедельник» и одна кнопка «Позвать друга». Ни абзаца,
 * ни адреса ссылки: после #230 («много текстов») ссылка уходит только в «поделиться».
 *
 * ## Ссылка одна и та же
 *
 * `createClubInvite()` на второй вызов отдаёт тот же токен (0034), и это видно здесь: кнопка
 * «поделиться» не заводит новую ссылку, а копирует ту же. Иначе отправленная вчера подруге ссылка
 * перестала бы работать от того, что сегодня нажали кнопку ещё раз.
 *
 * Делится через `navigator.share`, если он есть — внутри телеграма это родное меню «переслать», то
 * есть ровно то действие, которое тут и нужно. Нет его — копируем в буфер и говорим об этом.
 *
 * ## Чего здесь нет
 *
 * Почты — ни своей, ни напарницы. `club_duo_status()` её не возвращает, и это осознанно: экрану
 * нужны имя и аватар, а адрес, оказавшись в ответе, рано или поздно оказался бы и на экране.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { breakClubDuo, createClubInvite, getClubDuoStatus } from '@/lib/api/marathon';
import type { ClubDuoStatus } from '@/lib/api/types';
import { appHref } from '@/lib/util/paths';
import { useT } from '@/app/hooks/useT';
import { LINKS } from '@content/site/links';
import { inviteLink, shareFailure } from './duoInvite';

/** Полный адрес приглашения — то, что уедет в переписку. Никогда не печатается на экране. */
export function inviteUrl(token: string): string {
  const path = `${appHref('#/duo/')}${encodeURIComponent(token)}`;
  const web = typeof window === 'undefined' ? path : new URL(path, window.location.origin).href;
  return inviteLink(token, web, LINKS.telegramMiniApp);
}

export interface ClubDuoPairOptions {
  /** Дёргается, когда пара изменилась: задания дня у пары свои, и их надо перечитать. */
  onChanged?: () => void;
  /** Состояние пары, как только оно прочитано (и после каждого изменения). */
  onStatus?: (row: ClubDuoStatus | null) => void;
}

export interface ClubDuoPairHandle {
  /** Null while loading, or for somebody outside the duo round. */
  row: ClubDuoStatus | null;
  busy: boolean;
  share: () => Promise<void>;
  leave: () => Promise<void>;
}

export function useClubDuoPair({
  onChanged,
  onStatus,
}: ClubDuoPairOptions = {}): ClubDuoPairHandle {
  const { t } = useT();
  const toast = useToast();
  const [row, setRow] = useState<ClubDuoStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    getClubDuoStatus()
      .then((r) => {
        if (!alive) return;
        setRow(r);
        onStatus?.(r);
      })
      // Сбой запроса не должен занимать место пары: вкладка ниже работает и без неё.
      .catch(() => {
        if (!alive) return;
        setRow(null);
        onStatus?.(null);
      });
    return () => {
      alive = false;
    };
  }, [onStatus]);

  useEffect(load, [load]);

  const share = useCallback(async () => {
    setBusy(true);
    try {
      const token = row?.inviteToken ?? (await createClubInvite());
      const url = inviteUrl(token);
      if (!row?.inviteToken) load();
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: t('app.duoInviteTitle'), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.show({ kind: 'success', title: t('app.duoInviteCopied') });
    } catch (e) {
      // Закрытая шторка «поделиться» — не ошибка, о ней молчим. Остальное (нет доступа к клубу,
      // сеть, отказ буфера) говорится вслух: иначе кнопка просто «ничего не делает».
      const message = shareFailure(e);
      if (message) toast.show({ kind: 'error', title: t(message) });
    } finally {
      setBusy(false);
    }
  }, [row?.inviteToken, load, t, toast]);

  const leave = useCallback(async () => {
    if (!row?.teamId) return;
    setBusy(true);
    try {
      await breakClubDuo(row.teamId);
      load();
      onChanged?.();
    } catch {
      toast.show({ kind: 'error', title: t('common.errorGeneric') });
    } finally {
      setBusy(false);
    }
  }, [row?.teamId, load, onChanged, t, toast]);

  return { row, busy, share, leave };
}
