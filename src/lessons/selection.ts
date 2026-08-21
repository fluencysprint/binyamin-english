/* ==========================================================================
   Content selection with repeat-avoidance.
   --------------------------------------------------------------------------
   A student who takes a lesson every week should not meet the same warm-up
   and the same conversation task every time. `pickVaried` picks genuinely
   at random (no network, no AI — just Math.random, still fully local) from
   whichever candidates haven't been used recently, so selection can't
   degrade into a memorizable fixed rotation once a bank is mostly "seen."
   The RNG is injectable so tests stay deterministic without the app itself
   being deterministic — mirrors the pattern used in the sibling LinguaCue
   project's src/lib/selection.ts.
   ========================================================================== */

/** How many recently used content ids to remember per student. */
export const RECENT_CONTENT_WINDOW = 40

/** Still used to rotate which INTEREST phrase gets appended to a prompt
 *  (see personalizeTopic in activityContent.ts) — a phrasing-variation
 *  concern, not the content-repetition one `pickVaried` solves below. */
export function pickIndex(seed: number, len: number): number {
  return len === 0 ? 0 : ((seed % len) + len) % len
}

/**
 * Pick one item at random, preferring those not used recently. Falls back to
 * the full list once everything has been seen — running out of fresh content
 * must degrade to repetition, never to returning nothing.
 */
export function pickVaried<T>(
  candidates: T[],
  idOf: (item: T) => string,
  recentIds: readonly string[],
  rng: () => number = Math.random,
): T {
  const recent = new Set(recentIds)
  const fresh = candidates.filter((c) => !recent.has(idOf(c)))
  const pool = fresh.length > 0 ? fresh : candidates
  return pool[Math.floor(rng() * pool.length)]
}

/** Roll newly used ids into the recency window: deduped, most-recent last. */
export function pushRecentContentIds(
  existing: readonly string[],
  used: readonly string[],
): string[] {
  const next = [...existing.filter((id) => !used.includes(id)), ...used]
  return next.slice(-RECENT_CONTENT_WINDOW)
}
