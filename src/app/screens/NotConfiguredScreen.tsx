import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { useT } from '@/app/hooks/useT';

const ENV_VARS = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'] as const;

export interface NotConfiguredScreenProps {
  /** Turns demo mode on and boots the app on the browser-local backend. */
  onOpenDemo: () => void;
}

/**
 * Shown when the Supabase env is missing (docs/SPEC.md §8): explains what to set.
 *
 * A developer screen, but still the brand's: the wordmark, one display line, the variable names
 * as a ruled list, and the demo offer under a hairline instead of in a card of its own.
 */
export default function NotConfiguredScreen({ onOpenDemo }: NotConfiguredScreenProps) {
  const { t } = useT();
  return (
    <Screen>
      <div className="flex flex-col gap-8 py-6">
        <Logo className="text-xl" />
        <PageTitle
          display
          title={t('app.errorNotConfiguredTitle')}
          subtitle={t('app.errorNotConfiguredBody')}
        />
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col border-b border-border">
            {ENV_VARS.map((name) => (
              <li key={name} className="border-t border-border py-3 font-mono text-[13px]">
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            {t('app.errorNotConfiguredHint')} <code className="text-text">docs/SETUP.md</code>
          </p>
        </div>

        <section className="hairline flex flex-col gap-4 pt-6">
          <div>
            <p className="font-display text-xl">{t('app.demoOpenLead')}</p>
            <p className="mt-1 text-sm text-muted">{t('app.demoOpenBody')}</p>
          </div>
          <Button size="lg" fullWidth onClick={onOpenDemo}>
            {t('app.demoOpen')}
          </Button>
        </section>
      </div>
    </Screen>
  );
}
