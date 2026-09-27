/**
 * «+30 дней тебе и другу» — the referral programme's one card on the week screen (0051).
 *
 * It appears once today's task is delivered and not before: a member who has just done the
 * thing is the member most likely to tell somebody, and a card asking for a favour above an
 * undone task would be the screen selling before it serves. It goes to `/invite`, where the
 * link and the counts live; nothing is fetched here.
 *
 * The club's material: the warm gradient as a 1px rim on a glass card, the days as the
 * gradient key word, and a ghost button — the card's one gradient button is the task's.
 */
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';

export function ClubInviteCard({ className }: { className?: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <section aria-label={t('app.inviteTitle')} className={className}>
      <div className="bg-warm rounded-tile p-px">
        <div className="glass-card flex flex-col gap-3 rounded-tile p-4">
          <p className="eyebrow">{t('app.inviteEyebrow')}</p>
          <p className="font-display text-[20px] leading-tight">
            <span className="text-gradient">{t('app.inviteDays')}</span>{' '}
            {t('app.clubInviteCardRest')}
          </p>
          <p className="text-[14px] leading-snug text-muted">{t('app.clubInviteCardBody')}</p>
          <div className="flex">
            <Button variant="ghost" size="sm" onClick={() => navigate('/invite')}>
              {t('app.inviteTitle')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
