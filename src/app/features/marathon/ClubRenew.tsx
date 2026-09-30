/**
 * «Продлить» on the club screen, in a member's last week.
 *
 * There is no auto-renewal (`content/site/plans.ts`), and three days before the end the bot says
 * «продли в приложении» (`subscription_ending`, 0054). Until this existed the app had no such
 * button: the club tab only turned into the selling screen once the days were already gone. So
 * inside the last week (`RENEW_AHEAD_MS`) the top of the screen says until when, and links to the
 * same annual checkout as «Вступить», with the same one-charge line under it.
 *
 * Renders nothing otherwise — a member with months left is not sold anything.
 */
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { isDemo } from '@/lib/api/mode';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { subscriptionDate, subscriptionRenewDue } from '@/app/features/profile/subscription';
import { clubChargeLabel, clubJoinHref } from './clubPlan';

export function ClubRenew() {
  const { t, locale } = useT();
  const subscription = useSession((s) => s.subscription);
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const now = Date.now();
  if (!subscriptionRenewDue(subscription, now) || !subscription?.expiresAt) return null;
  const charge = clubChargeLabel(locale);
  const email = profile?.email || user?.email || '';
  return (
    <section className="mb-6 flex flex-col gap-2.5 rounded-tile border border-accent/55 p-4">
      <p className="text-[15px] font-semibold text-text">
        {t('app.clubRenewTitle', { date: subscriptionDate(locale, subscription.expiresAt, now) })}
      </p>
      <p className="text-[13px] leading-snug text-muted">{t('app.clubRenewNote')}</p>
      <LinkButton href={clubJoinHref(locale, email, isDemo())} variant="gradient" size="md">
        {t('app.clubRenewCta')}
      </LinkButton>
      {charge ? (
        <p className="text-[12px] leading-snug text-muted-2">
          {t('app.profileSubscriptionCharge', { price: charge })}
        </p>
      ) : null}
    </section>
  );
}
