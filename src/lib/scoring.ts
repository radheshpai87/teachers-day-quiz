/**
 * Scoring. Deliberately simple, and only ever executed on the server.
 *
 * A correct answer is worth between MAX_POINTS (instant) and MAX_POINTS / 2
 * (used the entire clock). A wrong answer or a non-answer is worth nothing.
 * Because the multiplier is a function of *that question's own* timer, every
 * participant who receives a given question faces exactly the same scoring
 * curve -- which is what keeps randomised question order fair.
 */

export const MAX_POINTS = 1000

/** Allowance for network latency when validating sub-second/millisecond submissions. */
export const SUBMIT_GRACE_MS = 3000

export function scoreAnswer(opts: {
  correct: boolean
  /** Milliseconds from when answers unlocked to when the server received it. */
  elapsedMs: number
  /** The question's own time limit, in seconds. */
  limitSeconds: number
}): number {
  if (!opts.correct) return 0

  const limitMs = Math.max(1, opts.limitSeconds * 1000)
  const used = Math.min(Math.max(opts.elapsedMs, 0), limitMs)
  const speedMultiplier = 1 - 0.5 * (used / limitMs) // 1.0 -> 0.5

  // Round to the nearest 10 so scores read cleanly on the leaderboard.
  return Math.round((MAX_POINTS * speedMultiplier) / 10) * 10
}
