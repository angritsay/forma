import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/app/hooks/useT';
import { SupportSheet } from '@/app/features/support/SupportSheet';
import { hasConsent, listMyConsents, revokeConsent, type ConsentRecord } from '@/lib/api/consents';
import { LINKS } from '@content/site/links';
import { BRAND } from '@content/site/brand';
import { href } from '@/lib/util/paths';

export interface DataSheetProps {
  open: boolean;
  email: string;
  onClose: () => void;
}

/**
 * «Данные и согласия» — the rights in the privacy policy, as things you can press.
 *
 * The policy lists four of them (152-ФЗ ст. 14): know what is held, correct it, delete it, withdraw
 * consent. Two were already true — the name and the inventory are edited in the rows above — and
 * two were sentences on a web page with nothing behind them. This sheet is the other two.
 *
 * **Withdrawal is done here, deletion is done by a person.** Withdrawing the health consent is a
 * single row in a single table and the app can honestly do it on the spot; what it leaves behind is
 * a profile whose limitations are no longer permitted to shape a workout, so the button says that
 * rather than pretending nothing changes. Deleting an account is not a button: it takes purchases,
 * club membership, proofs in a private bucket and the coach's own records with it, and 152-ФЗ ст. 21
 * gives the operator thirty days to do it properly. So it opens a letter, pre-addressed and
 * pre-worded, and the policy already names that address as the channel.
 *
 * A mailto is not a fashionable control, and it is the honest one: the alternative is a button that
 * files a request into a table nobody has agreed to watch.
 */
export function DataSheet({ open, email, onClose }: DataSheetProps) {
  const { t, locale } = useT();
  const toast = useToast();
  const [records, setRecords] = useState<ConsentRecord[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  /* «Написать тренеру» replaces this sheet while it is open rather than stacking over it. */
  const [writing, setWriting] = useState(false);

  // Read on opening, not on mount: the sheet lives inside a profile that is mounted the whole
  // session, and a consent list fetched once at sign-in would be stale by the time it is read.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void listMyConsents().then((rows) => {
      if (alive) setRecords(rows);
    });
    return () => {
      alive = false;
    };
  }, [open]);

  const health = records !== null && hasConsent(records, 'health');

  const withdraw = async () => {
    setBusy(true);
    try {
      await revokeConsent('health');
      setRecords((rows) => (rows ?? []).filter((r) => r.kind !== 'health'));
      toast.show({ kind: 'success', title: t('app.dataWithdrawDone') });
      setConfirm(false);
    } catch {
      toast.show({ kind: 'error', title: t('app.dataWithdrawError') });
    } finally {
      setBusy(false);
    }
  };

  const support = LINKS.supportEmail || BRAND.contactEmail;
  const mailto =
    `mailto:${support}` +
    `?subject=${encodeURIComponent(t('app.dataDeleteSubject'))}` +
    `&body=${encodeURIComponent(t('app.dataDeleteBody', { email: email || '—' }))}`;

  return (
    <>
      <Sheet open={open && !confirm && !writing} onClose={onClose} title={t('app.dataTitle')}>
        <div className="flex flex-col gap-6 py-2">
          <p className="text-[15px] leading-relaxed text-muted">{t('app.dataLead')}</p>

          {/*
           * The health consent, and only it. `privacy` cannot be withdrawn while the account
           * exists — withdrawing it *is* the deletion request below, and offering it as a separate
           * switch would promise a state the product does not have: an account whose data may not
           * be processed but which is still signed in.
           */}
          {health ? (
            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <h3 className="display text-lg">{t('app.dataHealthTitle')}</h3>
              <p className="text-[13px] leading-snug text-muted">{t('app.dataHealthBody')}</p>
              <Button variant="secondary" size="md" onClick={() => setConfirm(true)}>
                {t('app.dataWithdraw')}
              </Button>
            </div>
          ) : null}

          {/*
           * A question that is not a legal request — «где мой курс», «как сменить почту» — goes to
           * the owner's Telegram topic, where somebody actually reads it on a phone. Deletion stays
           * a letter below: it is the channel the policy names, and it needs a written record.
           */}
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <h3 className="display text-lg">{t('app.dataSupportTitle')}</h3>
            <p className="text-[13px] leading-snug text-muted">{t('app.dataSupportBody')}</p>
            <Button variant="secondary" size="md" onClick={() => setWriting(true)}>
              {t('app.supportWrite')}
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <h3 className="display text-lg">{t('app.dataDeleteTitle')}</h3>
            <p className="text-[13px] leading-snug text-muted">{t('app.dataDeleteBody2')}</p>
            <a
              href={mailto}
              className="control-label inline-flex h-12 items-center justify-center rounded-control border border-border-strong px-6 text-[15px] text-text"
            >
              {t('app.dataDeleteCta')}
            </a>
          </div>

          <a
            href={href(locale, '/privacy/')}
            className="border-t border-border pt-5 text-[13px] text-muted underline underline-offset-4"
          >
            {t('app.dataPolicyLink')}
          </a>
        </div>
      </Sheet>

      <SupportSheet
        open={open && writing}
        onClose={() => setWriting(false)}
        // For the coach, who reads the topic in Russian whatever language the app is in.
        context="Профиль · данные и согласия"
      />

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('app.dataWithdrawTitle')}
        description={t('app.dataWithdrawConfirm')}
        confirmLabel={t('app.dataWithdraw')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void withdraw()}
      />
    </>
  );
}
