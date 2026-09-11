/**
 * Props for a link that leaves the Mini App.
 *
 * Inside Telegram a plain `<a href="/courses/…">` is a dead control: the webview is not a browser
 * tab, and a top-level navigation out of the Mini App either does nothing at all or replaces the
 * app with a website the customer then cannot get back from. Telegram has to be asked to open the
 * address outside instead — `openExternal` does that, and the anchor's own navigation is cancelled
 * only once Telegram has accepted it, so a client too old for `openLink` still follows the href.
 *
 * On the open web nothing here applies and the anchor behaves like any other.
 *
 * Every link out of the app goes through this. It was written inline in one component and missing
 * from another, and the one without it was the "Получить доступ" row on the home screen — the
 * purchase, silently doing nothing inside Telegram.
 */
import type { MouseEvent } from 'react';
import { externalTarget, openExternal } from '@/lib/telegram/webapp';

export interface ExternalLinkProps {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function externalLinkProps(href: string): ExternalLinkProps {
  return {
    href,
    onClick: (e) => {
      const target = externalTarget(href);
      if (target && openExternal(target)) e.preventDefault();
    },
  };
}
