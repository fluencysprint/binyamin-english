/* ==========================================================================
   Build an "English Snapshot" from assessment responses.
   Used by both the public self-check and the tutor diagnostic.
   --------------------------------------------------------------------------
   Everything here derives from ONE ability model (./ability), so the overall
   level, the per-skill levels and the focus advice cannot disagree with each
   other. Previously the overall level came from a level-staircase while the
   per-skill levels came from "highest item answered correctly", and the two
   routinely contradicted — a learner could be shown C1 vocabulary, B2 grammar
   and C1 reading under an "A1" headline.

   Two rules keep the result honest:
   • A skill with too little evidence is reported as such. It is never
     silently placed at the bottom of the scale — absence of evidence is not
     evidence of beginner.
   • A skill's own estimate is pooled toward the learner's overall ability, so
     a skill carrying one or two items cannot swing a whole result.
   ========================================================================== */

import { AssessmentSnapshot, CEFR, ItemResponse, Skill, SkillEvidence, SKILLS } from '../types'
import { cefrFromIndex, cefrIndex } from '../utils/cefr'
import { grammarLibrary } from '../data/grammarLibrary'
import { detectZeroEnglish, stageFromResponses } from '../students/beginnerModel'
import { estimateAbility, SKILL_PRIOR_SD } from './ability'
import { deriveFocusAreas } from './focusAreas'

/** Below this many items a skill's level is shown as a rough indication only;
 *  with zero items it is not shown as a level at all. */
export const MIN_ITEMS_FOR_SKILL = 3

const SAMPLE_CORRECTION_BY_LEVEL: Record<CEFR, { said: string; better: string; note?: string }> = {
  preA1: { said: 'I student.', better: 'I am a student.', note: 'Add “am” and “a”.' },
  A1: { said: 'She go to school.', better: 'She goes to school.', note: 'He/she/it adds -s.' },
  A2: { said: 'Yesterday I go to the park.', better: 'Yesterday I went to the park.', note: 'Past of “go” is “went”.' },
  B1: { said: 'I have seen him yesterday.', better: 'I saw him yesterday.', note: 'With a finished time, use past simple.' },
  B2: { said: 'The bridge was build in 1932.', better: 'The bridge was built in 1932.', note: 'Passive uses the past participle “built”.' },
  C1: { said: 'In the other hand, it’s risky.', better: 'On the other hand, it’s risky.', note: 'The natural phrase is “on the other hand”.' },
}

/** Per-skill evidence, pooled toward the learner's own overall ability. */
function skillEvidence(responses: ItemResponse[], overallTheta: number): SkillEvidence[] {
  return SKILLS.map((skill) => {
    const forSkill = responses.filter((r) => r.skill === skill)
    const attempted = forSkill.length
    const correct = forSkill.filter((r) => r.outcome === 'correct').length
    if (attempted === 0) {
      return { skill, status: 'unassessed' as const, attempted: 0, correct: 0 }
    }
    const est = estimateAbility(forSkill, { mean: overallTheta, sd: SKILL_PRIOR_SD })
    return {
      skill,
      status: attempted >= MIN_ITEMS_FOR_SKILL ? ('assessed' as const) : ('limited' as const),
      level: est.level,
      attempted,
      correct,
    }
  })
}

export function buildSnapshot(
  responses: ItemResponse[],
  overrideOverall?: CEFR,
  opts?: { foundational?: boolean },
): AssessmentSnapshot {
  const ability = estimateAbility(responses)
  const evidence = skillEvidence(responses, ability.theta)
  const measured = evidence.filter((e) => e.status !== 'unassessed')
  const assessed = evidence.filter((e) => e.status === 'assessed')

  const perSkill: Partial<Record<Skill, CEFR>> = {}
  for (const e of measured) if (e.level) perSkill[e.skill] = e.level

  /* The overall level may not fall outside the range of the skills that
     produced it. This is an invariant of the model, not a patch: an aggregate
     of C1 / B2 / C1 evidence describing itself as "A1" is arithmetically
     impossible, and the result is shown to people who will act on it. Because
     both estimates come from the same likelihood, this bound almost never
     binds — it exists so that it CANNOT be violated. */
  const assessedIdx = assessed.filter((e) => e.level).map((e) => cefrIndex(e.level!))
  const bounded = (level: CEFR): CEFR => {
    if (assessedIdx.length === 0) return level
    const lo = Math.min(...assessedIdx)
    const hi = Math.max(...assessedIdx)
    return cefrFromIndex(Math.max(lo, Math.min(hi, cefrIndex(level))))
  }

  const overall = overrideOverall ?? (responses.length === 0 ? 'A1' : bounded(ability.level))

  const strongest =
    [...measured]
      .filter((e) => e.level)
      .sort((a, b) => cefrIndex(b.level!) - cefrIndex(a.level!))[0]?.skill ?? 'speaking'

  const focusAreas = deriveFocusAreas(responses, overall, ability.theta)
  // The illustrative correction now matches the learner's top focus area
  // rather than the headline label, so it illustrates something they actually
  // got wrong whenever there is such evidence.
  const correctionLevel = focusAreas[0]?.level ?? overall

  const snapshot: AssessmentSnapshot = {
    overallCEFR: overall,
    perSkill,
    skillEvidence: evidence,
    strongestSkill: strongest,
    priorities: focusAreas.map((f) => f.text),
    priorityKeys: focusAreas.map((f) => f.key),
    sampleCorrection: SAMPLE_CORRECTION_BY_LEVEL[correctionLevel],
    sampleCorrectionLevel: correctionLevel,
    itemsAttempted: responses.length,
    confidence: responses.length === 0 ? 'low' : ability.confidence,
    atCeiling: ability.atCeiling && overall === 'C1',
  }
  // Pre-A1 results are made specific and supportive rather than a bare label.
  if (overall === 'preA1') {
    snapshot.preA1Stage = stageFromResponses(responses)
    snapshot.foundational = opts?.foundational ?? detectZeroEnglish(responses)
  }
  return snapshot
}

/** A short plain-text summary, used in the booking inquiry. */
export function snapshotToText(s: AssessmentSnapshot): string {
  const evidence = s.skillEvidence ?? []
  const skills = evidence
    .filter((e) => e.status !== 'unassessed' && e.level)
    .map((e) => `${e.skill}: ${e.level}${e.status === 'limited' ? ' (limited evidence)' : ''}`)
    .join(', ')
  const notAssessed = evidence.filter((e) => e.status === 'unassessed').map((e) => e.skill)
  return [
    `Approximate level: ${s.overallCEFR}${s.atCeiling ? ' (top of this check)' : ''}`,
    s.itemsAttempted ? `Based on ${s.itemsAttempted} questions; confidence: ${s.confidence}` : '',
    skills ? `By skill: ${skills}` : '',
    notAssessed.length ? `Not assessed here: ${notAssessed.join(', ')}` : '',
    `Strongest: ${s.strongestSkill}`,
    `Focus: ${s.priorities.join('; ')}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Pick a level-appropriate grammar concept id to seed a first lesson. */
export function suggestedFirstObjective(level: CEFR): string {
  const atLevel = grammarLibrary.filter((g) => g.cefr === level)
  const nearby = grammarLibrary.filter((g) => Math.abs(cefrIndex(g.cefr) - cefrIndex(level)) <= 1)
  return (atLevel[0] ?? nearby[0] ?? grammarLibrary[0]).id
}
