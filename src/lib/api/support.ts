/**
 * «Написать тренеру» — a message from the app into the owner's «Обращения» topic (RPC
 * `support_message`, 0042).
 *
 * The server decides everything that matters: who is writing (the signed-in person's own profile,
 * never an argument), how often (five an hour), and how long (a thousand characters). The client
 * checks the length too, but only so the button can say so before a round trip.
 *
 * Errors come back as the short words the function raises — `text_empty`, `text_too_long`,
 * `rate_limited` — inside an `AppError`, and `supportErrorKey` in the feature's model turns them
 * into a sentence.
 */
import { supabase } from './client';
import { guard, requireUser, unwrapVoid } from './internal';
import { isDemo } from './mode';

/** What happened to the message: sent, or — in demo mode — deliberately sent nowhere. */
export type SupportResult = 'sent' | 'demo';

export async function sendSupportMessage(text: string, context?: string): Promise<SupportResult> {
  // A demo account has no coach behind it; saying «передали» would be the one lie here.
  if (isDemo()) return 'demo';
  return guard(async () => {
    await requireUser();
    unwrapVoid(
      await supabase().rpc('support_message', {
        p_text: text,
        p_context: context ? context.slice(0, 80) : null,
      }),
    );
    return 'sent' as const;
  });
}
