/**
 * Best-effort login throttling. State is in memory, so on serverless it is
 * per-instance and resets on cold start. It slows down guessing but is not a hard guarantee.
 */
const attempts = new Map<string, { n: number; lockedUntil: number }>();
const MAX = 5;
const LOCK_MS = 15 * 60 * 1000;

export function lockRemainingMs(key: string) {
  const a = attempts.get(key);
  return a && a.lockedUntil > Date.now() ? a.lockedUntil - Date.now() : 0;
}
export async function recordFailure(key: string) {
  const a = attempts.get(key) ?? { n: 0, lockedUntil: 0 };
  a.n += 1;
  if (a.n >= MAX) {
    a.lockedUntil = Date.now() + LOCK_MS;
    a.n = 0;
  }
  attempts.set(key, a);
  await new Promise((r) => setTimeout(r, 600)); // fixed delay slows scripted guessing
}
export const recordSuccess = (key: string) => void attempts.delete(key);
