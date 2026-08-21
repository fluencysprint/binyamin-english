/* ==========================================================================
   Focus areas — what to work on, derived from what the learner actually got
   wrong.
   --------------------------------------------------------------------------
   The previous version looked up three fixed sentences by the final CEFR
   label, so every A1 result recommended present simple and do/does whether or
   not the learner had shown any trouble with them — and when the label itself
   was wrong, the advice was confidently wrong too.

   Here a focus area is a (skill, level) bucket where the learner did WORSE
   THAN THEIR OWN ABILITY PREDICTS. That relative test is what separates a
   genuine gap from noise: a near-native who slips once on an A1 item has
   missed an item, but not by enough to be surprising — and telling them to go
   study do/does because of it is exactly the advice that destroyed trust in
   the old result. Conversely a B1 learner who misses every B1 grammar item
   has a real, nameable weakness even though those items are "at their level".

   When nothing stands out, we say so honestly: the advice becomes the next
   step up plus the skills this check cannot see (speaking, pronunciation),
   rather than an invented weakness.
   ========================================================================== */

import { CEFR, ItemResponse, Skill } from '../types'
import { cefrIndex } from '../utils/cefr'
import { itemDifficulty, outcomeCredit, successProbability } from './ability'

/** How many items' worth of shortfall, across a whole skill, counts as a real
 *  weakness rather than a slip. One careless miss on an easy item produces a
 *  deficit just under 1, so the bar sits above that: a weakness has to show up
 *  more than once. */
export const DEFICIT_THRESHOLD = 1.2
/** Within a weak skill, a level only counts as the place to start if the
 *  learner fell meaningfully short there — not merely missed one hard item. */
export const LEVEL_DEFICIT_PER_ITEM = 0.4
/** Advice is never pinned more than this far below where the learner placed.
 *  At that distance a miss is far more likely to be a misclick or a poor item
 *  than a real gap, and "study do/does" under a C1 headline is exactly the
 *  self-contradiction this whole result must not produce. */
export const MAX_BANDS_BELOW = 2

export interface FocusArea {
  skill: Skill
  /** The level of the missed items, or the growth level for a clean run. */
  level: CEFR
  /** i18n key; the UI localizes this and falls back to `text`. */
  key: string
  /** English text, also used for the plain-text booking summary. */
  text: string
  attempted: number
  missed: number
  /** How many items below expectation this bucket came in. 0 for the
   *  forward-looking suggestions that are not based on an error. */
  deficit: number
}

/** Per-(skill, level) advice for the skills the check actually measures. */
const FOCUS_TEXT: Partial<Record<Skill, Record<CEFR, string>>> = {
  vocabulary: {
    preA1: 'Build a first core of everyday words: people, places, numbers and colors.',
    A1: 'Grow everyday vocabulary for daily routines, family, food and work.',
    A2: 'Learn common verb phrases and time expressions for talking about the past.',
    B1: 'Expand vocabulary for opinions, feelings and abstract ideas.',
    B2: 'Work on precise word choice and the collocations that sound natural.',
    C1: 'Refine nuance, register and idiomatic phrasing.',
  },
  grammar: {
    preA1: 'Practice simple “I am / I have” sentences and basic word order.',
    A1: 'Use the present simple accurately: he/she + verb-s, and do/does questions.',
    A2: 'Practice the past simple with irregular verbs, and articles (a/an/the).',
    B1: 'Work on present perfect vs. past simple, and linking ideas with because/although.',
    B2: 'Practice conditionals, the passive and reported speech.',
    C1: 'Polish complex structures: inversion, cleft sentences and fine shades of modality.',
  },
  reading: {
    preA1: 'Practice reading familiar words and very short, simple sentences.',
    A1: 'Read short everyday texts — messages, signs, simple emails — for key details.',
    A2: 'Practice finding specific information in short factual texts.',
    B1: 'Work on following the main argument through a longer article.',
    B2: 'Practice inferring attitude and implied meaning, not just stated facts.',
    C1: 'Read dense or specialized texts and pick up tone, irony and implication.',
  },
}

/** Fallback for skills this check cannot measure but a tutor session can. */
const GENERAL_TEXT: Record<Skill, string> = {
  listening: 'Practice listening to natural speech at normal speed.',
  speaking: 'Build fluency in longer spoken turns, with fewer pauses.',
  pronunciation: 'Work on clear American vowels, word stress and sentence rhythm.',
  vocabulary: 'Keep growing active vocabulary you can actually use in speech.',
  grammar: 'Tidy up the grammar patterns that show up most in your own speech.',
  reading: 'Read a little every day at a level that stretches you slightly.',
  writing: 'Practice writing clear, well-organized short texts.',
}

/** Forward-looking advice when nothing was missed at a given level. */
const GROWTH_TEXT: Record<CEFR, string> = {
  preA1: 'Start with everyday words, simple sentences and lots of listening.',
  A1: 'Move into everyday conversations about routines, plans and past events.',
  A2: 'Start expressing opinions with reasons, and telling longer stories.',
  B1: 'Move toward extended speech: arguments, hypotheticals and richer vocabulary.',
  B2: 'Work toward C1: nuance, register, idiom and sustained natural fluency.',
  C1: 'At this level the gains are in precision, register and effortless natural phrasing — best worked on in conversation.',
}

export function focusText(skill: Skill, level: CEFR): { key: string; text: string } {
  const bySkill = FOCUS_TEXT[skill]
  if (bySkill) return { key: `focus.${skill}.${level}`, text: bySkill[level] }
  return { key: `focus.general.${skill}`, text: GENERAL_TEXT[skill] }
}

export function growthFocus(level: CEFR): { key: string; text: string } {
  return { key: `focus.growth.${level}`, text: GROWTH_TEXT[level] }
}

/** Exposed so a test can assert the locale files and this table stay in sync. */
export const FOCUS_TABLES = { FOCUS_TEXT, GENERAL_TEXT, GROWTH_TEXT }

interface Bucket {
  level: CEFR
  attempted: number
  missed: number
  /** Items the ability model expected this learner to get right here. */
  expected: number
  earned: number
}

interface SkillTally {
  skill: Skill
  attempted: number
  missed: number
  expected: number
  earned: number
  byLevel: Map<CEFR, Bucket>
}

/**
 * Rank the learner's demonstrated weaknesses and return up to `limit` focus
 * areas.
 *
 * `theta` is the learner's estimated ability, used to work out how many items
 * they should have got right. The comparison is made per SKILL: a skill that
 * is uniformly weak drags the overall estimate down with it, so judging each
 * (skill, level) cell against the overall expectation on its own would hide
 * exactly the weakness a tutor most wants named.
 */
export function deriveFocusAreas(
  responses: ItemResponse[],
  estimated: CEFR,
  theta: number,
  limit = 3,
): FocusArea[] {
  const tallies = new Map<Skill, SkillTally>()
  for (const r of responses) {
    const tally =
      tallies.get(r.skill) ??
      ({ skill: r.skill, attempted: 0, missed: 0, expected: 0, earned: 0, byLevel: new Map() } as SkillTally)
    const credit = outcomeCredit(r.outcome)
    const expected = successProbability(theta, itemDifficulty(r.cefr, r.difficulty))
    tally.attempted += 1
    tally.earned += credit
    tally.expected += expected
    if (r.outcome !== 'correct') tally.missed += 1

    const bucket =
      tally.byLevel.get(r.cefr) ??
      ({ level: r.cefr, attempted: 0, missed: 0, expected: 0, earned: 0 } as Bucket)
    bucket.attempted += 1
    bucket.earned += credit
    bucket.expected += expected
    if (r.outcome !== 'correct') bucket.missed += 1
    tally.byLevel.set(r.cefr, bucket)
    tallies.set(r.skill, tally)
  }

  const floorIndex = cefrIndex(estimated) - MAX_BANDS_BELOW
  const candidates: (FocusArea & { score: number })[] = []

  for (const tally of tallies.values()) {
    const deficit = tally.expected - tally.earned
    if (deficit < DEFICIT_THRESHOLD) continue

    // Start teaching at the LOWEST level this skill actually broke down at —
    // that is where the foundation needs repair — but never below the floor.
    const levels = [...tally.byLevel.values()]
      .filter(
        (b) =>
          b.missed > 0 &&
          (b.expected - b.earned) / b.attempted >= LEVEL_DEFICIT_PER_ITEM &&
          cefrIndex(b.level) >= floorIndex,
      )
      .sort((a, b) => cefrIndex(a.level) - cefrIndex(b.level))
    const start = levels[0]
    if (!start) continue

    const { key, text } = focusText(tally.skill, start.level)
    candidates.push({
      skill: tally.skill,
      level: start.level,
      key,
      text,
      attempted: start.attempted,
      missed: start.missed,
      deficit: Number(deficit.toFixed(2)),
      score: deficit,
    })
  }

  const areas: FocusArea[] = candidates
    .sort((a, b) => b.score - a.score || cefrIndex(b.level) - cefrIndex(a.level))
    .slice(0, limit)
    .map(({ score: _score, ...area }) => area)

  // Nothing stood out. Point forward, and name the skills this check cannot
  // measure, rather than inventing a weakness the evidence does not support.
  const filler: { skill: Skill; key: string; text: string }[] = [
    { skill: 'speaking', ...growthFocus(estimated) },
    { skill: 'speaking', ...focusText('speaking', estimated) },
    { skill: 'pronunciation', ...focusText('pronunciation', estimated) },
  ]
  for (const f of filler) {
    if (areas.length >= limit) break
    if (areas.some((a) => a.key === f.key)) continue
    areas.push({
      skill: f.skill,
      level: estimated,
      key: f.key,
      text: f.text,
      attempted: 0,
      missed: 0,
      deficit: 0,
    })
  }
  return areas.slice(0, limit)
}
