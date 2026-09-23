import { useState } from 'react';
import { isNetworkError } from '@/lib/api/errors';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { claimPayment, ORDER_REF_MAX, type ClaimResult } from '@/lib/api/claims';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';

export interface ClaimSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * «Оплатил(а) с другой почты» — забрать свой платёж по номеру заказа.
 *
 * Это единственный экран, который чинит расхождение, из-за которого оплата может не открыть доступ:
 * всё, что даёт доступ, ищется по почте, а почту плательщика мы не задаём. Короткая ссылка Prodamus
 * теряет `?customer_email=`, который приложение к ней приписывает, поэтому адрес в форме — тот,
 * который человек вписал руками: рабочий, подставленный браузером, или вообще мужа. Деньги пришли,
 * заказа на этот адрес нет, доступ не открылся.
 *
 * Спрашивается номер заказа, а не вторая почта. Разница не в удобстве: вторая почта — это заявление,
 * и, зная адрес чужого покупателя, им мог бы воспользоваться кто угодно. Номер заказа приходит в
 * чеке на почту плательщика и больше нигде не появляется, поэтому он — доказательство.
 *
 * Ответов шесть и все шесть человеческие, включая неудачи: «такого номера нет» — это не ошибка
 * приложения, это опечатка или чужой номер, и экран говорит об этом словами, а не красным.
 */
export function ClaimSheet({ open, onClose }: ClaimSheetProps) {
  const { t } = useT();
  const toast = useToast();
  const refreshEntitlements = useSession((s) => s.refreshEntitlements);
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<ClaimResult | null>(null);

  const submit = async () => {
    setBusy(true);
    setAnswer(null);
    try {
      const result = await claimPayment(ref);
      setAnswer(result);
      if (result === 'subscription' || result === 'course') {
        // Доступ уже выдан в базе; перечитываем, чтобы экраны под шторкой это увидели, и только
        // потом закрываем — иначе человек вернётся на тот же замок, который только что оплатил.
        await refreshEntitlements();
        toast.show({ kind: 'success', title: t('app.claimOk') });
        onClose();
      }
    } catch (e) {
      // «Нет соединения» — только когда его и правда нет; отказ сервера — другая фраза.
      toast.show({
        kind: 'error',
        title: t(isNetworkError(e) ? 'common.errorOffline' : 'common.errorGeneric'),
      });
    } finally {
      setBusy(false);
    }
  };

  const note: Record<ClaimResult, string> = {
    subscription: t('app.claimOk'),
    course: t('app.claimOk'),
    linked: t('app.claimLinked'),
    not_found: t('app.claimNotFound'),
    email_taken: t('app.claimEmailTaken'),
    rate_limited: t('app.claimRateLimited'),
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('app.claimTitle')}>
      <div className="flex flex-col gap-5 py-2">
        <p className="text-[15px] leading-relaxed text-muted">{t('app.claimBody')}</p>

        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          maxLength={ORDER_REF_MAX}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('app.claimPlaceholder')}
          aria-label={t('app.claimTitle')}
          className="w-full rounded-control border border-border bg-surface-2 px-3.5 py-3 text-[15px] text-text placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />

        <Button
          variant="action"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!ref.trim()}
          onClick={() => void submit()}
        >
          {t('app.claimCta')}
        </Button>

        {answer ? <p className="text-[13px] leading-snug text-muted">{note[answer]}</p> : null}
      </div>
    </Sheet>
  );
}
