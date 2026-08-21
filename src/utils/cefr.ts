import { CEFR, CEFR_LEVELS, Skill, SKILLS, SkillEstimate, SkillEstimates } from '../types'

/** Numeric index of a CEFR level (preA1 = 0 … C1 = 5). */
export function cefrIndex(level: CEFR): number {
  return CEFR_LEVELS.indexOf(level)
}

export function cefrFromIndex(i: number): CEFR {
  const clamped = Math.max(0, Math.min(CEFR_LEVELS.length - 1, Math.round(i)))
  return CEFR_LEVELS[clamped]
}

/** Move a level up or down by `steps`, clamped to the valid range. */
export function shiftCefr(level: CEFR, steps: number): CEFR {
  return cefrFromIndex(cefrIndex(level) + steps)
}

/** Human-friendly short label, localized via i18n keys elsewhere. */
export function cefrLabel(level: CEFR): string {
  return level === 'preA1' ? 'Pre-A1' : level
}

export function makeEstimate(
  level: CEFR,
  confidence = 0.2,
  evidenceCount = 0,
  at = 0,
): SkillEstimate {
  // levelScore starts on the band itself; updateEstimate moves it continuously
  // from there so small pieces of evidence accumulate instead of rounding away.
  return { level, levelScore: cefrIndex(level), confidence, evidenceCount, updatedAt: at }
}

/** A fresh set of estimates seeded at a starting level (default A1). */
export function seedEstimates(start: CEFR = 'A1', at = 0): SkillEstimates {
  return SKILLS.reduce((acc, skill) => {
    acc[skill] = makeEstimate(start, 0.2, 0, at)
    return acc
  }, {} as SkillEstimates)
}

/** Overall level = the median-ish of per-skill estimates, rounded down slightly
 *  so we never overstate. Avoids fake precision. */
export function overallCefr(estimates: SkillEstimates): CEFR {
  const indices = SKILLS.map((s) => cefrIndex(estimates[s].level)).sort((a, b) => a - b)
  const mid = indices[Math.floor((indices.length - 1) / 2)]
  return cefrFromIndex(mid)
}

/** The skill with the highest estimate (ties broken by confidence). */
export function strongestSkill(estimates: SkillEstimates): Skill {
  return [...SKILLS].sort((a, b) => {
    const d = cefrIndex(estimates[b].level) - cefrIndex(estimates[a].level)
    return d !== 0 ? d : estimates[b].confidence - estimates[a].confidence
  })[0]
}
