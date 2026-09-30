/**
 * `/book` while `BOOKING.enabled` is off (`content/site/booking.ts`).
 *
 * The flag hides the offer on the site and takes «Тренер» off the tab bar, but a link can still
 * arrive here — the site's old buttons, the bot, a bookmark. Rather than a booking screen that
 * sells a session nobody can buy, the address says plainly that booking is closed and leads back
 * to «Курсы».
 */
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';

export function BookingOff() {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen header={<TopBar back="/" />}>
      <EmptyState
        title={t('app.bookOffTitle')}
        description={t('app.bookOffBody')}
        action={
          <Button variant="action" onClick={() => navigate('/')}>
            {t('app.tabCourses')}
          </Button>
        }
      />
    </Screen>
  );
}
