/* ==========================================================================
   CEFR placement: which items to ask, and what the answers mean.
   --------------------------------------------------------------------------
   The diagnostic is LEVEL-BALANCED (items at every level up to C1, so a strong
   learner actually gets the chance to demonstrate C1) and, within each level,
   SKILL-BALANCED (so every reported skill rests on real evidence rather than
   on whichever one the shuffle happened to favour).

   Scoring is delegated entirely to the ability model in ./ability. The old
   conjunctive staircase — "pass every level in turn, stop at the first miss" —
   is gone: with only 2–3 items per level, one careless answer put a level
   below its accuracy bar and discarded every correct answer above it, which is
   how a near-native learner was reported as A1.
   ========================================================================== */

import { AgeBand, AssessmentItem, CEFR, CEFR_LEVELS, ItemResponse, Skill } from '../types'
import { cefrIndex } from '../utils/cefr'
import { AbilityEstimate, Confidence, estimateAbility } from './ability'

/** How many items to aim for at each level in a full diagnostic (15 items,
 *  ~10 minutes). Every level gets at least two items so no band is judged on a
 *  single answer, and the top two bands get three: those are where a short
 *  check is least certain, and where being wrong costs a learner the most. */
const BASE_TARGET: Record<CEFR, number> = { preA1: 2, A1: 2, A2: 2, B1: 3, B2: 3, C1: 3 }

/** Accuracy bands used ONLY to describe per-level evidence in the result
 *  (which levels were probed, and how they went). They no longer decide the
 *  level — the ability model does. */
export const PASS_THRESHOLD = 0.6
export const EMERGING_THRESHOLD = 0.34
export const MIN_ATTEMPTS = 2

export type LevelStatus = 'unknown' | 'notYet' | 'emerging' | 'passing'

export interface LevelEvidence {
  level: CEFR
  attempted: number
  correct: number
  accuracy: number
  status: LevelStatus
}

export interface PlacementResult {
  /** The band the learner has consolidated, from the ability model. */
  estimatedLevel: CEFR
  /** The next level up when the learner is already well into it (the estimate
   *  sits in the upper part of its band). Descriptive, not a second level. */
  boundary?: CEFR
  perLevel: LevelEvidence[]
  itemsAttempted: number
  /** The full ability estimate behind `estimatedLevel`. */
  ability: AbilityEstimate
  confidence: Confidence
  /** True when performance hit the top of what this check can measure, so the
   *  honest reading is "C1 or above" rather than "exactly C1". */
  atCeiling: boolean
}

/** Per-level item targets, lightly branched on the learner's self-estimate. */
function targetsFor(selfLevel?: CEFR): Record<CEFR, number> {
  const t = { ...BASE_TARGET }
  if (!selfLevel) return t
  const idx = cefrIndex(selfLevel)
  if (idx >= cefrIndex('B1')) {
    // Confident learner: keep a couple of low anchors, spend budget upward.
    t.preA1 = 0
    t.A1 = 2
    t.A2 = 2
  } else if (idx <= cefrIndex('A1')) {
    // Beginner: still include stretch, but a little less of it.
    t.C1 = 2
  }
  return t
}

/** Fisher–Yates shuffle. Returns a new array; does not mutate the input. */
function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Randomize an auto-scorable item's option order so the correct answer isn't
 *  always in the same position (the item bank always lists it at index 0,
 *  since that's easiest to author and proofread). Leaves non-auto items
 *  (no options) untouched. */
function withShuffledOptions(item: AssessmentItem): AssessmentItem {
  if (!item.options || item.answerIndex == null) return item
  const order = shuffled(item.options.map((_, i) => i))
  return {
    ...item,
    options: order.map((i) => item.options![i]),
    answerIndex: order.indexOf(item.answerIndex),
  }
}

/**
 * Build a level-balanced diagnostic queue (easy → hard) for the given age band.
 * Only auto-scorable items are used (the public check has no tutor to judge).
 * The queue always includes whatever high-level items exist for the age band,
 * so a strong learner is actually given the chance to demonstrate B1/B2/C1.
 *
 * Which items are picked at each level (when the pool has more than we need)
 * and the on-screen order of each item's options are both randomized per run,
 * so retaking the check doesn't serve the same questions in the same order
 * with the answer always in the same slot.
 */
export function buildDiagnosticPlan(opts: {
  pool: AssessmentItem[]
  ageBand: AgeBand
  selfLevel?: CEFR
}): AssessmentItem[] {
  const targets = targetsFor(opts.selfLevel)
  const eligible = opts.pool.filter(
    (it) => it.ageBands.includes(opts.ageBand) && it.options != null && it.answerIndex != null,
  )
  // Round-robin across skills as the queue is filled, so a 13-item check
  // yields enough items per skill to report that skill honestly instead of
  // leaving one skill with a single item (whose "level" would be noise).
  const used = new Map<Skill, number>()
  const pickForLevel = (level: CEFR, want: number): AssessmentItem[] => {
    const pool = shuffled(eligible.filter((it) => it.cefr === level))
    const chosen: AssessmentItem[] = []
    while (chosen.length < want && pool.length > 0) {
      // Prefer the least-used skill still available at this level.
      let bestIdx = 0
      for (let i = 1; i < pool.length; i++) {
        if ((used.get(pool[i].skill) ?? 0) < (used.get(pool[bestIdx].skill) ?? 0)) bestIdx = i
      }
      const [item] = pool.splice(bestIdx, 1)
      used.set(item.skill, (used.get(item.skill) ?? 0) + 1)
      chosen.push(item)
    }
    return chosen
  }

  const queue: AssessmentItem[] = []
  for (const level of CEFR_LEVELS) {
    const want = targets[level]
    if (want <= 0) continue
    queue.push(...pickForLevel(level, want))
  }
  // Easy → hard so the experience ramps up gently.
  queue.sort((a, b) => cefrIndex(a.cefr) - cefrIndex(b.cefr) || a.difficulty - b.difficulty)
  return queue.map(withShuffledOptions)
}

/**
 * Build a FOUNDATIONAL diagnostic for a non-reader (or a learner who reports
 * they cannot read English). Items are picture/listening based: the instruction
 * is shown in the interface language and the English target is spoken, so the
 * learner is never secretly tested on reading. Ordered easy → hard; option
 * order is shuffled per run.
 */
export function buildFoundationalPlan(opts: {
  pool: AssessmentItem[]
  ageBand: AgeBand
  /** How many items to include. Defaults to 8 (the pool's original full size)
   *  so behavior is unchanged until the pool grows past that. */
  target?: number
}): AssessmentItem[] {
  const eligible = opts.pool.filter(
    (it) => it.ageBands.includes(opts.ageBand) && it.options != null && it.answerIndex != null,
  )
  const queue = shuffled(eligible)
    .slice(0, opts.target ?? 8)
    .sort((a, b) => a.difficulty - b.difficulty)
  return queue.map(withShuffledOptions)
}

function levelStatus(attempted: number, accuracy: number): LevelStatus {
  if (attempted < MIN_ATTEMPTS) return 'unknown'
  if (accuracy >= PASS_THRESHOLD) return 'passing'
  if (accuracy >= EMERGING_THRESHOLD) return 'emerging'
  return 'notYet'
}

function computePerLevel(responses: ItemResponse[]): LevelEvidence[] {
  return CEFR_LEVELS.map((level) => {
    const forLevel = responses.filter((r) => r.cefr === level)
    const attempted = forLevel.length
    const correct = forLevel.filter((r) => r.outcome === 'correct').length
    const accuracy = attempted > 0 ? correct / attempted : 0
    return { level, attempted, correct, accuracy, status: levelStatus(attempted, accuracy) }
  })
}

/**
 * Estimate the learner's level from their answers.
 *
 * Every level's evidence contributes: the ability model weighs each answer by
 * the item's difficulty, discounts lucky guesses (4-option items score 25% by
 * chance) and discounts careless slips on easy items, so no single answer —
 * high or low — can decide the result on its own.
 */
export function computePlacement(responses: ItemResponse[]): PlacementResult {
  const perLevel = computePerLevel(responses)
  const ability = estimateAbility(responses)
  const nextIndex = cefrIndex(ability.level) + 1
  const boundary =
    !ability.atCeiling && ability.progressIntoNext >= 0.5 && nextIndex < CEFR_LEVELS.length
      ? CEFR_LEVELS[nextIndex]
      : undefined

  return {
    estimatedLevel: ability.level,
    boundary,
    perLevel,
    itemsAttempted: responses.length,
    ability,
    confidence: ability.confidence,
    atCeiling: ability.atCeiling,
  }
}
