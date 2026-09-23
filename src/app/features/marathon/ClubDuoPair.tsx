/**
 * Кто с тобой на этой неделе — первое, что видно на вкладке «Дуо».
 *
 * ## Два состояния, и второе не хуже первого
 *
 * **Пара есть.** Тогда это одна строка: аватар, имя и приписка, откуда она взялась. Откуда —
 * важно, потому что это два разных обещания: подругу ты выбрала сама и она останется, пока вы
 * сами не разойдётесь; подобранная нами меняется каждый понедельник. Человек, не знающий, какая у
 * него пара, в понедельник обнаружит чужое имя и решит, что что-то сломалось.
 *
 * **Пары нет.** Владелец: «если же у тебя нету дуо, то там должен быть баннер, что нету дуо, мы
 * найдём тебе его автоматически, и каждую неделю мы будем менять тебе дуо. Таким образом, у тебя
 * каждую неделю появляется шанс двойной получить встречу с Сережей». Это не извинение за пустоту,
 * а предложение: отсюда зовут подругу, и отсюда же видно, что без подруги всё равно играешь.
 *
 * Порядок внутри баннера именно такой: сначала сказано, что напарник будет в любом случае, и
 * только потом — что можно позвать свою. Наоборот читалось бы как «позови, иначе не играешь».
 *
 * ## Ссылка одна и та же
 *
 * `createClubInvite()` на второй вызов отдаёт тот же токен (0034), и это видно здесь: кнопка
 * «поделиться» не заводит новую ссылку, а копирует ту же. Иначе отправленная вчера подруге ссылка
 * перестала бы работать от того, что сегодня нажали кнопку ещё раз.
 *
 * Делится через `navigator.share`, если он есть — внутри телеграма это родное меню «переслать», то
 * есть ровно то действие, которое тут и нужно. Нет его — копируем в буфер и говорим об этом.
 * Провалиться может и то и другое (отказ в разрешении, отмена шторки), поэтому текст ссылки виден
 * на экране и без кнопки: он и есть запасной путь.
 *
 * ## Чего здесь нет
 *
 * Почты — ни своей, ни напарницы. `club_duo_status()` её не возвращает, и это осознанно: экрану
 * нужны имя и аватар, а адрес, оказавшись в ответе, рано или поздно оказался бы и на экране.
 */
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { breakClubDuo, createClubInvite, getClubDuoStatus } from '@/lib/api/marathon';
import type { ClubDuoStatus } from '@/lib/api/types';
import { appHref } from '@/lib/util/paths';
import { useT } from '@/app/hooks/useT';
import { LINKS } from '@content/site/links';
import { inviteLink, shareFailure } from './duoInvite';

/** Полный адрес приглашения — то, что уедет в переписку. */
export function inviteUrl(token: string): string {
  const path = `${appHref('#/duo/')}${encodeURIComponent(token)}`;
  const web = typeof window === 'undefined' ? path : new URL(path, window.location.origin).href;
  return inviteLink(token, web, LINKS.telegramMiniApp);
}

export interface ClubDuoPairProps {
  /** Дёргается, когда пара изменилась: задания дня у пары свои, и их надо перечитать. */
  onChanged?: () => void;
}

export function ClubDuoPair({ onChanged }: ClubDuoPairProps) {
  const { t } = useT();
  const toast = useToast();
  const [row, setRow] = useState<ClubDuoStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    getClubDuoStatus()
      .then((r) => {
        if (alive) setRow(r);
      })
      // Сбой запроса не должен занимать место пары: вкладка ниже работает и без неё.
      .catch(() => {
        if (alive) setRow(null);
      });
    return () => {
      alive = false;
    };
  }, []);

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

  // Ещё не загрузилось, или человека нет в дуо-круге: место под пару не занимаем.
  if (!row) return null;

  if (row.teamId && row.mateName) {
    return (
      <Card level={2} padding="sm" className="flex items-center gap-3">
        <Avatar seed={row.mateSeed} name={row.mateName} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold">{row.mateName}</span>
          <span className="text-[13px] text-muted-2">
            {row.isAuto ? t('app.duoMateAuto') : t('app.duoMateChosen')}
          </span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void leave()}
          className="shrink-0 text-[13px] text-muted underline underline-offset-4 disabled:opacity-50"
        >
          {t('app.duoLeave')}
        </button>
      </Card>
    );
  }

  return (
    <Card level={2} padding="sm" className="flex flex-col gap-3">
      <span className="text-[15px] leading-snug">{t('app.duoNoneTitle')}</span>
      <span className="text-[13px] leading-relaxed text-muted">{t('app.duoNoneBody')}</span>
      {row.inviteToken ? (
        /* Ссылка написана целиком: шторка «поделиться» может не открыться, и тогда её копируют
           глазами. `break-all` — потому что токен не переносится по словам. */
        <span className="break-all text-[12px] leading-snug text-muted-2">
          {inviteUrl(row.inviteToken)}
        </span>
      ) : null}
      <Button variant="action" size="md" loading={busy} onClick={() => void share()}>
        {t('app.duoInvite')}
      </Button>
    </Card>
  );
}
