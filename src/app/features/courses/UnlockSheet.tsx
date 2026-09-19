import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { courseTitle } from '@/content/catalogue';
import type { Course } from '@/content/schema';
import { isAppError } from '@/lib/api/errors';
import { createOrder } from '@/lib/api/orders';
import { formatPrice } from '@content/site/pricing';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';

export interface UnlockSheetProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
}

/**
 * «Открыть весь курс» — оплата, не выходя из приложения.
 *
 * Раньше любой упёршийся в замок отправлялся на страницу курса на сайте: приложение говорило
 * «Этого курса у тебя пока нет» и давало ссылку наружу. Человек уходил из продукта в момент, когда
 * он был к покупке ближе всего — сразу после тренировки, — и возвращался, если возвращался,
 * через форму, где надо заново вписать почту, которую приложение и так знает.
 *
 * Здесь оно делает ровно то же, что форма на сайте, и в том же порядке: сначала `create_order()`
 * пишет `pending`-покупку, потом человек уходит платить. Порядок не косметический — именно эта
 * строка потом и опознаёт платёж (`apply_course_payment()` в 0019 ищет единственный ожидающий
 * заказ), так что заказ, не записанный до оплаты, превращает автоматическую активацию в ручную.
 *
 * Почта берётся из сессии и не спрашивается: она подтверждена кодом из письма, и это та же почта,
 * по которой курс откроется. Согласие тоже не спрашивается второй раз — оно дано при входе, рядом
 * со ссылками на политику и оферту, и записано в журнал (0018).
 *
 * **Если заказ записать не удалось, кнопка оплаты всё равно появляется.** Так же устроена форма на
 * сайте: отказ бэкенда не повод терять покупку, потому что уведомление платёжного сервиса несёт ту
 * же почту и тренер включит курс руками. Молча делать вид, что ничего не произошло, нельзя —
 * поэтому подпись под кнопкой в этом случае говорит, что доступ откроется не сразу.
 */
export function UnlockSheet({ open, course, onClose }: UnlockSheetProps) {
  const { t, l, locale } = useT();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [ordered, setOrdered] = useState<'idle' | 'ok' | 'failed'>('idle');

  const email = (profile?.email || user?.email || '').trim().toLowerCase();
  const payment = paymentTarget(course?.paymentUrl?.[locale] ?? course?.paymentUrl?.ru);
  const price = course ? formatPrice(locale, course.price) : '';

  if (!course) return null;

  const go = async () => {
    setBusy(true);
    let recorded = false;
    try {
      await createOrder({ email, courseId: course.id, locale, source: 'app' });
      recorded = true;
    } catch (e) {
      // Записать не вышло — но платить человек всё ещё хочет; см. комментарий к компоненту.
      console.error('[unlock] create order failed', e);
      if (isAppError(e) && e.code === 'network') {
        toast.show({ kind: 'error', title: t('common.errorOffline') });
        setBusy(false);
        return;
      }
    }
    setOrdered(recorded ? 'ok' : 'failed');
    setBusy(false);
    if (payment && email) {
      window.location.assign(withEmail(payment, email));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('app.unlockTitle')}>
      <div className="flex flex-col gap-5 py-2">
        <p className="text-[15px] leading-relaxed text-muted">
          {t('app.unlockBody', { course: l(courseTitle(course)) })}
        </p>

        <p className="numeral tabular text-4xl leading-none">{price}</p>

        {payment ? (
          <Button size="lg" fullWidth loading={busy} onClick={() => void go()}>
            {t('app.unlockCta')}
          </Button>
        ) : (
          /* Ссылки на оплату нет — так бывает, пока продукт не заведён у платёжного сервиса.
             Тогда честнее назвать адрес поддержки, чем показать кнопку в никуда. */
          <p className="text-[13px] leading-snug text-muted">{t('app.unlockNoPayment')}</p>
        )}

        <p className="text-[13px] leading-snug text-muted-2">
          {ordered === 'failed' ? t('app.unlockNoteManual') : t('app.unlockNote', { email })}
        </p>
      </div>
    </Sheet>
  );
}
