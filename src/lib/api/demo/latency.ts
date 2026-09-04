/**
 * Artificial latency for the demo backend.
 *
 * localStorage answers instantly, which would hide every loading state and make races
 * untestable. ~120 ms is close to a warm Supabase round trip.
 */
export const DEMO_LATENCY_MS = 120;

export function delay(ms: number = DEMO_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
