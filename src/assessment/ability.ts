/* ==========================================================================
   Ability model — the single source of truth for every level in the app.
   --------------------------------------------------------------------------
   The old placement walked a conjunctive staircase: it required a passing
   accuracy at every level in turn and stopped at the first level that missed
   the bar. On a short test that gives each level only 2–3 items, a single
   careless answer at A2 (accuracy 1/2 = 0.5, just under the 0.6 bar) threw
   away ALL the evidence above it — so a near-native learner who slipped once
   was reported as A1 while the per-skill display, computed by a completely
   different rule, still showed C1. Two models, two answers, no consistency.

   This module replaces both with one estimator, and everything else (overall
   level, per-skill levels, confidence, focus areas) is derived from it.

   The model is a standard 4-parameter logistic (item response theory):

       P(correct | θ) = c + (d − c) · σ( a · (θ − b) )

   θ  the learner's ability, expressed directly in CEFR band units
      (0 = Pre-A1 … 5 = C1), so it is interpretable without a lookup table.
   b  the item's difficulty on the same scale: its CEFR band, nudged by the
      item's own 1–10 difficulty within the band.
   a  discrimination — how sharply items separate learners near their level.
   c  the GUESSING floor. Every item in the bank is 4-option multiple choice,
      so even zero knowledge scores 25%. Without this floor, a beginner's
      lucky guess on a C1 item is read as real evidence of C1 ability.
   d  the SLIP ceiling. Nobody is perfectly reliable on items far below their
      level: attention wanders, a finger hits the wrong option. Without this
      ceiling, one careless miss on an easy item is treated as near-impossible
      and drags the estimate down by an enormous amount — which is precisely
      how one slip used to collapse an advanced result.

   The estimate is the MAP (maximum a posteriori) θ under a deliberately weak
   prior, so a normal-length check is driven by the answers, but a two-item
   fragment cannot fly off to an extreme.
   ========================================================================== */

import { CEFR, CEFR_LEVELS, ItemResponse, ScoreOutcome } from '../types'
import { cefrFromIndex, cefrIndex } from '../utils/cefr'

/** Discrimination (logistic slope per CEFR band). */
export const DISCRIMINATION = 1.7
/** Lower asymptote: the score a 4-option item yields by pure chance. */
export const GUESS_FLOOR = 0.25
/** Upper asymptote: even a master misses an easy item now and then. */
export const SLIP_CEILING = 0.97
/** Weak prior, centred between A2 and B1 — the middle of the scale. */
export const PRIOR_MEAN = 2.5
export const PRIOR_SD = 1.8
/** A single skill is estimated against the learner's OWN overall ability
 *  rather than the population prior (partial pooling). A skill with plenty of
 *  items still moves a band or more on its own evidence; a skill with one or
 *  two items stays near the learner's overall level instead of swinging to an
 *  extreme — which is what used to turn a single missed item into an "A1"
 *  skill sitting next to a C1 result. */
export const SKILL_PRIOR_SD = 1.2
/** θ is searched over this range; the ends sit just outside Pre-A1 and C1 so
 *  a floor/ceiling performance lands cleanly on the end bands. */
export const THETA_MIN = -1
export const THETA_MAX = 6
const GRID_STEP = 0.01

/** Highest band on the scale — the assessment's ceiling. */
export const CEILING_LEVEL: CEFR = CEFR_LEVELS[CEFR_LEVELS.length - 1]

export type Confidence = 'low' | 'moderate' | 'high'

export interface Prior {
  mean: number
  sd: number
}

const DEFAULT_PRIOR: Prior = { mean: PRIOR_MEAN, sd: PRIOR_SD }

export interface AbilityEstimate {
  /** Continuous ability in CEFR band units (0 = Pre-A1 … 5 = C1). */
  theta: number
  /** The band θ falls in. */
  level: CEFR
  /** Standard error of θ, from the curvature of the log-posterior. */
  standardError: number
  confidence: Confidence
  itemsAttempted: number
  /** Sum of credit earned (a 'partial' counts as a half). */
  creditEarned: number
  /** How far into the NEXT band the learner has come, 0–1. Lets the result say
   *  "B1, working into B2" instead of implying B1 is a single flat point. */
  progressIntoNext: number
  /** The learner performed at the very top of what this check can measure —
   *  the true level is "C1 or above", not "exactly C1". */
  atCeiling: boolean
}

/** Credit for an outcome. 'partial' is genuinely half-evidence, not a miss. */
export function outcomeCredit(outcome: ScoreOutcome): number {
  return outcome === 'correct' ? 1 : outcome === 'partial' ? 0.5 : 0
}

/**
 * An item's difficulty on the θ scale: its CEFR band, plus a fraction of a
 * band for where it sits inside that band. A difficulty-1 A2 item lands at
 * 1.5 (an easy A2, close to A1), a difficulty-10 A2 item at 2.5.
 */
export function itemDifficulty(cefr: CEFR, difficulty: number): number {
  const within = Math.max(1, Math.min(10, difficulty))
  return cefrIndex(cefr) + (within - 5.5) / 9
}

/** P(correct) for a learner of ability θ on an item of difficulty b. */
export function successProbability(theta: number, b: number): number {
  const sigma = 1 / (1 + Math.exp(-DISCRIMINATION * (theta - b)))
  return GUESS_FLOOR + (SLIP_CEILING - GUESS_FLOOR) * sigma
}

/** Log-posterior (log-likelihood + log-prior) of θ given the responses. */
function logPosterior(theta: number, responses: ItemResponse[], prior: Prior): number {
  let total = 0
  for (const r of responses) {
    const p = successProbability(theta, itemDifficulty(r.cefr, r.difficulty))
    const credit = outcomeCredit(r.outcome)
    total += credit * Math.log(p) + (1 - credit) * Math.log(1 - p)
  }
  const z = (theta - prior.mean) / prior.sd
  return total - 0.5 * z * z
}

/**
 * The CEFR band a θ value reports as. We take the FLOOR, not the nearest band:
 * the reported level is the band the learner has actually consolidated, and
 * the fractional remainder is progress into the next one. Rounding to nearest
 * would report a learner who has mastered B2 and is halfway into C1 as "C1",
 * overstating a level they cannot yet sustain — and this result is shown to
 * people deciding what to study.
 */
export function levelFromTheta(theta: number): CEFR {
  return cefrFromIndex(Math.floor(Math.max(0, Math.min(CEFR_LEVELS.length - 1, theta))))
}

/** θ at the centre of a band — the inverse of levelFromTheta. */
export function thetaForLevel(level: CEFR): number {
  return cefrIndex(level)
}

/**
 * How much to trust the estimate. Standard error alone is misleading at the
 * two ends of the scale: when every answer is correct the posterior has
 * nothing above it to curve against, so the error looks huge even though the
 * result ("at least the top of this check") is the most certain one we can
 * produce. So the ends are judged on evidence volume instead.
 */
function confidenceFrom(opts: {
  standardError: number
  items: number
  atCeiling: boolean
  atFloor: boolean
}): Confidence {
  if (opts.items < 4) return 'low'
  if (opts.atCeiling || opts.atFloor) return opts.items >= 8 ? 'high' : 'moderate'
  if (opts.items >= 8 && opts.standardError <= 0.6) return 'high'
  if (opts.standardError <= 0.9) return 'moderate'
  return 'low'
}

/**
 * MAP estimate of θ. A grid search (the posterior is smooth and the grid is
 * tiny) keeps this exact and dependency-free; a Newton step would be faster
 * and less obvious.
 */
export function estimateAbility(responses: ItemResponse[], prior: Prior = DEFAULT_PRIOR): AbilityEstimate {
  const itemsAttempted = responses.length
  const creditEarned = responses.reduce((sum, r) => sum + outcomeCredit(r.outcome), 0)

  if (itemsAttempted === 0) {
    return {
      theta: prior.mean,
      level: levelFromTheta(prior.mean),
      standardError: prior.sd,
      confidence: 'low',
      itemsAttempted: 0,
      creditEarned: 0,
      progressIntoNext: prior.mean - Math.floor(prior.mean),
      atCeiling: false,
    }
  }

  let best = THETA_MIN
  let bestValue = -Infinity
  for (let theta = THETA_MIN; theta <= THETA_MAX + 1e-9; theta += GRID_STEP) {
    const value = logPosterior(theta, responses, prior)
    if (value > bestValue) {
      bestValue = value
      best = theta
    }
  }

  // Standard error from the curvature at the peak (a central second
  // difference). Clamped inside the grid so the ends stay well-defined.
  const h = 0.05
  const mid = Math.max(THETA_MIN + h, Math.min(THETA_MAX - h, best))
  const curvature =
    (logPosterior(mid + h, responses, prior) -
      2 * logPosterior(mid, responses, prior) +
      logPosterior(mid - h, responses, prior)) /
    (h * h)
  const standardError = curvature < 0 ? Math.min(prior.sd, 1 / Math.sqrt(-curvature)) : prior.sd

  const level = levelFromTheta(best)
  const atCeiling = best >= cefrIndex(CEILING_LEVEL)
  const atFloor = best <= 0

  return {
    theta: best,
    level,
    standardError,
    confidence: confidenceFrom({ standardError, items: itemsAttempted, atCeiling, atFloor }),
    itemsAttempted,
    creditEarned,
    progressIntoNext: atCeiling ? 0 : Math.max(0, best - Math.floor(best)),
    atCeiling,
  }
}

