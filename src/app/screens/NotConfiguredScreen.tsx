import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { HeroField, KeyTitle } from '@/components/ui/HeroField';
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
 * A developer screen, but still the brand's: the wordmark, the blue field saying what is missing,
 * the variable names as a ruled list, and the demo offer — the screen's one neon action — under a
 * hairline instead of in a card of its own.
 */
export default function NotConfiguredScreen({ onOpenDemo }: NotConfiguredScreenProps) {
  const { t } = useT();
  return (
    <Screen>
      <div className="flex flex-col gap-8 py-6">
        <Logo className="text-xl" />
        {/* The screen's one blue field: what is wrong, with the key word. */}
        <HeroField className="flex flex-col gap-3">
          <h1 className="display text-[28px] leading-[1.2] text-balance">
            <KeyTitle text={t('app.errorNotConfiguredTitle')} />
          </h1>
          <p className="text-[15px] leading-relaxed text-on-field/90">
            {t('app.errorNotConfiguredBody')}
          </p>
        </HeroField>
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
          <Button variant="action" size="lg" fullWidth onClick={onOpenDemo}>
            {t('app.demoOpen')}
          </Button>
        </section>
      </div>
    </Screen>
  );
}
