import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/app/hooks/useT';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * The screen a person sees, and — folded underneath it — the one line that says what went wrong.
 *
 * **The detail is here because its absence cost an evening.** The coach hit this screen on his
 * phone inside Telegram, where there is no console to open and no way to reach one, so all that
 * could come back was a photograph of a generic apology. `componentDidCatch` had the error the
 * whole time and logged it somewhere nobody could read.
 *
 * So the message is on the screen, behind a disclosure: closed by default, because a fault string
 * is not an answer to «что мне делать» and the two buttons above it are. Open, it is the difference
 * between a bug report and a screenshot.
 *
 * The message only — never `error.stack`. A minified trace reads `a.jsx:1:24601`, which tells a
 * reader nothing and fills the screen doing it. Anything more belongs in a log the app ships, not
 * in front of a customer.
 */
function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useT();
  const detail = error?.message?.trim();
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      {/* No warning triangle over the heading: the words say what happened. */}
      <EmptyState
        title={t('app.errorTitle')}
        description={t('app.errorBody')}
        action={
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => window.location.reload()}>
              {t('app.errorReload')}
            </Button>
            <Button variant="ghost" onClick={onRetry}>
              {t('app.errorTryAgain')}
            </Button>
            {detail ? (
              <details className="mt-2 text-left">
                <summary className="cursor-pointer text-[13px] text-muted-2">
                  {t('app.errorDetails')}
                </summary>
                {/*
                 * `break-words` rather than a scroller: this gets read off a photograph of somebody
                 * else's phone, and a message that needs scrolling to be read is one that arrives
                 * cropped.
                 */}
                <p className="mt-1.5 text-[12px] leading-snug break-words text-muted-2">{detail}</p>
              </details>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

/** Catches render errors anywhere below and shows a localized fallback instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[forma] render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />
      );
    }
    return this.props.children;
  }
}
