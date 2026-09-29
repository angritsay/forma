/**
 * `/intro` — the onboarding stories again, all six in the order the wizard shows them.
 *
 * Reached from the account sheet's row «Как это работает» (ProfileSheet.tsx). It lives under
 * `FocusShell` beside the onboarding, not in the tabbed shell: the player is `position: fixed`,
 * and a screen inside `AppShell` arrives on a transform that would turn that into a box inside the
 * page (see the `/assessment` note in router.tsx). No tab bar, no header — the × is the way out.
 *
 * Leaving replaces the history entry rather than pushing over it: a replay is not a place, and
 * the back gesture after it should not land on the slides a second time.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useT } from '@/app/hooks/useT';
import { STORY_IDS } from './onboarding/stories';
import { Story } from './onboarding/Story';

export default function IntroScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const leave = useCallback(() => navigate('/', { replace: true }), [navigate]);
  return <Story slides={STORY_IDS} onDone={leave} onExit={leave} finalLabel={t('app.introDone')} />;
}
