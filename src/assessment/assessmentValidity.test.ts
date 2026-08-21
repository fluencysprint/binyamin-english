/* ==========================================================================
   Assessment validity — the regressions that matter to a real person.
   --------------------------------------------------------------------------
   The bug these guard against: a native English speaker finished the public
   check, was shown vocabulary C1, grammar B2 and reading C1, and was then told
   their overall level was "A1 Beginner" with a recommendation to study present
   simple and do/does. Everything below is a property of the result a learner
   sees, not of an implementation detail — so the tests stay meaningful if the
   estimator is replaced again.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { buildDiagnosticPlan, computePlacement } from './placement'
import { buildSnapshot } from './snapshot'
import { estimateAbility, itemDifficulty, successProbability } from './ability'
import { CEILING_LEVEL } from './ability'
import { deriveFocusAreas, FOCUS_TABLES, focusText, growthFocus } from './focusAreas'
import { publicAssessmentItems } from '../data/assessmentBank'
import { AssessmentItem, CEFR, ItemResponse, ScoreOutcome, Skill } from '../types'
import { cefrIndex } from '../utils/cefr'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'

const adultPlan = () => buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })

function respond(item: AssessmentItem, outcome: ScoreOutcome): ItemResponse {
  return {
    itemId: item.id,
    skill: item.skill,
    cefr: item.cefr,
    difficulty: item.difficulty,
    outcome,
    at: 0,
  }
}

/** A learner who reliably handles everything at or below their level. */
function idealLearner(plan: AssessmentItem[], level: CEFR): ItemResponse[] {
  return plan.map((it) =>
    respond(it, cefrIndex(it.cefr) <= cefrIndex(level) ? 'correct' : 'needsWork'),
  )
}

/** Deterministic PRNG so noisy fixtures are reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A learner of true ability θ answering the way the item model says people
 *  actually do — including lucky guesses and careless slips. */
function noisyLearner(plan: AssessmentItem[], theta: number, seed: number): ItemResponse[] {
  const rand = mulberry32(seed)
  return plan.map((it) => {
    const p = successProbability(theta, itemDifficulty(it.cefr, it.difficulty))
    return respond(it, rand() < p ? 'correct' : 'needsWork')
  })
}

function levelOf(responses: ItemResponse[]): CEFR {
  return buildSnapshot(responses).overallCEFR
}

/* -------------------------------------------------------------------------- */
/* 1. The reported bug                                                        */
/* -------------------------------------------------------------------------- */

describe('the native-speaker regression', () => {
  /** Reproduces the real report: strong answers everywhere, two careless
   *  misses on easy items — which is what the old staircase choked on. */
  function nativeWithSlips(): ItemResponse[] {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'C1')
    const easy = responses.filter((r) => cefrIndex(r.cefr) <= cefrIndex('A2'))
    easy[0].outcome = 'needsWork'
    if (easy[1]) easy[1].outcome = 'needsWork'
    return responses
  }

  it('cannot report below B2 when the skills read C1 / B2 / C1', () => {
    const snapshot = buildSnapshot(nativeWithSlips())
    const skillLevels = (Object.keys(snapshot.perSkill) as Skill[]).map((s) =>
      cefrIndex(snapshot.perSkill[s]!),
    )
    expect(Math.min(...skillLevels)).toBeGreaterThanOrEqual(cefrIndex('B2'))
    expect(cefrIndex(snapshot.overallCEFR)).toBeGreaterThanOrEqual(cefrIndex('B2'))
  })

  it('never recommends A1 basics to someone placed above A2', () => {
    const snapshot = buildSnapshot(nativeWithSlips())
    const advice = snapshot.priorities.join(' ').toLowerCase()
    expect(advice).not.toContain('do/does')
    expect(advice).not.toContain('present simple')
  })

  it('reaches the top band on near-perfect answers, and says so', () => {
    const plan = adultPlan()
    const snapshot = buildSnapshot(idealLearner(plan, 'C1'))
    expect(snapshot.overallCEFR).toBe('C1')
    // C1 is this check's ceiling — the result must admit it may understate.
    expect(snapshot.atCeiling).toBe(true)
  })

  it('one isolated mistake cannot collapse an advanced result', () => {
    const plan = adultPlan()
    const perfect = idealLearner(plan, 'C1')
    const before = computePlacement(perfect)
    for (let i = 0; i < perfect.length; i++) {
      const withSlip = perfect.map((r, j) => (i === j ? { ...r, outcome: 'needsWork' as const } : r))
      const after = computePlacement(withSlip)
      expect(cefrIndex(after.estimatedLevel)).toBeGreaterThanOrEqual(cefrIndex('B2'))
      expect(cefrIndex(before.estimatedLevel) - cefrIndex(after.estimatedLevel)).toBeLessThanOrEqual(1)
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 2. Calibration across the whole scale                                      */
/* -------------------------------------------------------------------------- */

describe('calibration', () => {
  const cases: CEFR[] = ['preA1', 'A1', 'A2', 'B1', 'B2', 'C1']

  for (const level of cases) {
    it(`places a clean ${level} performance at ${level}`, () => {
      expect(levelOf(idealLearner(adultPlan(), level))).toBe(level)
    })
  }

  /* A 15-item, 4-option check cannot be exact: a lucky guessing run genuinely
     looks like a stronger learner. What it must be is UNBIASED and tightly
     clustered — and never wrong by a margin that would send someone to the
     wrong end of the curriculum. That is what these bounds pin down. */
  it('is unbiased and tightly clustered for noisy, realistic learners', () => {
    const errors: number[] = []
    for (const trueLevel of cases) {
      for (let seed = 1; seed <= 40; seed++) {
        // A learner solidly AT that band sits in the middle of its span.
        const theta = Math.min(5.5, cefrIndex(trueLevel) + 0.5)
        const error = cefrIndex(levelOf(noisyLearner(adultPlan(), theta, seed))) - cefrIndex(trueLevel)
        expect(Math.abs(error)).toBeLessThanOrEqual(2)
        errors.push(error)
      }
    }
    const within1 = errors.filter((e) => Math.abs(e) <= 1).length / errors.length
    expect(within1).toBeGreaterThan(0.9)
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length
    expect(Math.abs(mean)).toBeLessThan(0.4)
  })

  it('never places a strong learner in beginner territory', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const strong = levelOf(noisyLearner(adultPlan(), 5.5, seed))
      expect(cefrIndex(strong)).toBeGreaterThanOrEqual(cefrIndex('B1'))
    }
  })

  it('never places a true beginner above A2', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const weak = levelOf(noisyLearner(adultPlan(), 0.2, seed))
      expect(cefrIndex(weak)).toBeLessThanOrEqual(cefrIndex('A2'))
    }
  })

  it('keeps a beginner a beginner, even with lucky guesses on hard items', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'A1')
    // Every single high-level item guessed correctly (1-in-4 items, so this is
    // a very lucky run — 4-option items score 25% by chance).
    for (const r of responses) {
      if (cefrIndex(r.cefr) >= cefrIndex('B2')) r.outcome = 'correct'
    }
    expect(cefrIndex(levelOf(responses))).toBeLessThanOrEqual(cefrIndex('A2'))
  })

  it('places someone who gets nothing right at the floor', () => {
    const responses = adultPlan().map((it) => respond(it, 'needsWork'))
    expect(levelOf(responses)).toBe('preA1')
  })
})

/* -------------------------------------------------------------------------- */
/* 3. Evidence, not assumption                                                */
/* -------------------------------------------------------------------------- */

describe('missing evidence is reported as missing', () => {
  it('never reports an unassessed skill as a beginner level', () => {
    const snapshot = buildSnapshot(idealLearner(adultPlan(), 'C1'))
    const unassessed = snapshot.skillEvidence!.filter((e) => e.status === 'unassessed')
    // The public check has no speaking/listening/pronunciation/writing items.
    expect(unassessed.length).toBeGreaterThan(0)
    for (const e of unassessed) {
      expect(e.level).toBeUndefined()
      expect(snapshot.perSkill[e.skill]).toBeUndefined()
    }
  })

  it('marks a skill carried by one or two items as limited evidence', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'B1').filter(
      (r) => r.skill !== 'reading' || r.cefr === 'A2',
    )
    const reading = buildSnapshot(responses).skillEvidence!.find((e) => e.skill === 'reading')!
    if (reading.attempted > 0 && reading.attempted < 3) {
      expect(reading.status).toBe('limited')
    }
  })

  it('does not let a single missed item define a skill as A1', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'C1')
    // Strong learner; the ONE reading item they saw happened to be wrong.
    const nonReading = responses.filter((r) => r.skill !== 'reading')
    const oneReading = { ...responses.find((r) => r.skill === 'reading')!, outcome: 'needsWork' as const }
    const snapshot = buildSnapshot([...nonReading, oneReading])
    const reading = snapshot.skillEvidence!.find((e) => e.skill === 'reading')!
    expect(reading.status).toBe('limited')
    expect(cefrIndex(reading.level!)).toBeGreaterThanOrEqual(cefrIndex('B1'))
  })

  it('still lets a genuinely weak skill show as weak', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'B2').map((r) =>
      r.skill === 'grammar' ? { ...r, outcome: 'needsWork' as const } : r,
    )
    const snapshot = buildSnapshot(responses)
    const grammar = snapshot.skillEvidence!.find((e) => e.skill === 'grammar')!
    expect(cefrIndex(grammar.level!)).toBeLessThan(cefrIndex(snapshot.overallCEFR))
  })

  it('reports confidence honestly: a long clean run is confident, a stub is not', () => {
    const plan = adultPlan()
    expect(buildSnapshot(idealLearner(plan, 'B1')).confidence).not.toBe('low')
    const stub = idealLearner(plan, 'B1').slice(0, 2)
    expect(buildSnapshot(stub).confidence).toBe('low')
  })
})

/* -------------------------------------------------------------------------- */
/* 4. Internal consistency — the result cannot contradict itself              */
/* -------------------------------------------------------------------------- */

describe('a result never contradicts itself', () => {
  it('keeps the overall level inside the range of the assessed skills', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const plan = adultPlan()
      const theta = (seed % 12) * 0.5 - 0.5
      const snapshot = buildSnapshot(noisyLearner(plan, theta, seed))
      const assessed = snapshot.skillEvidence!.filter((e) => e.status === 'assessed' && e.level)
      if (assessed.length === 0) continue
      const idx = assessed.map((e) => cefrIndex(e.level!))
      expect(cefrIndex(snapshot.overallCEFR)).toBeGreaterThanOrEqual(Math.min(...idx))
      expect(cefrIndex(snapshot.overallCEFR)).toBeLessThanOrEqual(Math.max(...idx))
    }
  })

  it('names a strongest skill that really is among the strongest', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const snapshot = buildSnapshot(noisyLearner(adultPlan(), 2 + (seed % 7) * 0.5, seed))
      const measured = snapshot.skillEvidence!.filter((e) => e.level)
      const best = Math.max(...measured.map((e) => cefrIndex(e.level!)))
      const named = measured.find((e) => e.skill === snapshot.strongestSkill)!
      expect(cefrIndex(named.level!)).toBe(best)
    }
  })

  it('gives advice that matches the level it reports', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const snapshot = buildSnapshot(noisyLearner(adultPlan(), (seed % 11) * 0.5, seed))
      const overall = cefrIndex(snapshot.overallCEFR)
      for (const key of snapshot.priorityKeys ?? []) {
        const level = key.split('.')[2] as CEFR
        if (!level || cefrIndex(level) < 0) continue
        // Advice may target a gap below, or the next step up — never two whole
        // bands away from where the learner was placed.
        expect(Math.abs(cefrIndex(level) - overall)).toBeLessThanOrEqual(2)
      }
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 5. Advice comes from demonstrated errors                                   */
/* -------------------------------------------------------------------------- */

describe('focus areas are earned, not boilerplate', () => {
  it('points at the skill the learner actually missed, and where it broke down', () => {
    const plan = adultPlan()
    // Strong vocabulary and reading; grammar falls apart from A2 upward.
    const responses = idealLearner(plan, 'B2').map((r) =>
      r.skill === 'grammar' && cefrIndex(r.cefr) >= cefrIndex('A2')
        ? { ...r, outcome: 'needsWork' as const }
        : r,
    )
    const areas = deriveFocusAreas(responses, 'B2', estimateAbility(responses).theta)
    expect(areas[0].skill).toBe('grammar')
    expect(areas[0].missed).toBeGreaterThan(0)
    // Teaching starts at the lowest level the skill actually broke down at
    // (which level that is depends on what this run's plan contained).
    const lowestBroken = Math.min(
      ...responses
        .filter((r) => r.skill === 'grammar' && r.outcome !== 'correct')
        .map((r) => cefrIndex(r.cefr)),
    )
    expect(cefrIndex(areas[0].level)).toBe(lowestBroken)
  })

  it('gives two different learners at the same level different advice', () => {
    const plan = adultPlan()
    const weakGrammar = idealLearner(plan, 'B1').map((r) =>
      r.skill === 'grammar' ? { ...r, outcome: 'needsWork' as const } : r,
    )
    const weakVocab = idealLearner(plan, 'B1').map((r) =>
      r.skill === 'vocabulary' ? { ...r, outcome: 'needsWork' as const } : r,
    )
    const a = buildSnapshot(weakGrammar)
    const b = buildSnapshot(weakVocab)
    expect(a.priorityKeys).not.toEqual(b.priorityKeys)
  })

  it('ignores a single careless miss instead of calling it a weakness', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'C1')
    const easy = responses.find((r) => cefrIndex(r.cefr) <= cefrIndex('A1'))!
    easy.outcome = 'needsWork'
    const areas = deriveFocusAreas(responses, 'C1', estimateAbility(responses).theta)
    expect(areas.every((a) => a.missed === 0)).toBe(true)
  })

  it('illustrates a correction from the area it actually recommends', () => {
    const plan = adultPlan()
    const responses = idealLearner(plan, 'B2').map((r) =>
      r.skill === 'grammar' && cefrIndex(r.cefr) >= cefrIndex('A2')
        ? { ...r, outcome: 'needsWork' as const }
        : r,
    )
    const snapshot = buildSnapshot(responses)
    // The example sentence must match the level of the advice above it, not
    // the headline label — otherwise the card explains something the learner
    // was never told to work on.
    expect(snapshot.sampleCorrectionLevel).toBe(snapshot.priorityKeys![0].split('.')[2])
  })

  it('does not invent a weakness when nothing was missed', () => {
    const perfect = idealLearner(adultPlan(), 'C1')
    const areas = deriveFocusAreas(perfect, 'C1', estimateAbility(perfect).theta)
    expect(areas.every((a) => a.missed === 0)).toBe(true)
    expect(areas[0].key).toBe('focus.growth.C1')
  })

  it('keeps the English source table and the en locale in step', () => {
    const en = flatten(locales.en)
    const { FOCUS_TEXT, GENERAL_TEXT, GROWTH_TEXT } = FOCUS_TABLES
    for (const [skill, byLevel] of Object.entries(FOCUS_TEXT)) {
      for (const [level, text] of Object.entries(byLevel!)) {
        expect({ key: `focus.${skill}.${level}`, text: en[`focus.${skill}.${level}`] }).toEqual({
          key: `focus.${skill}.${level}`,
          text,
        })
      }
    }
    for (const [skill, text] of Object.entries(GENERAL_TEXT)) {
      expect(en[`focus.general.${skill}`]).toBe(text)
    }
    for (const [level, text] of Object.entries(GROWTH_TEXT)) {
      expect(en[`focus.growth.${level}`]).toBe(text)
    }
  })

  it('has a localized string for every focus key the model can emit', () => {
    const keys = new Set<string>()
    for (const skill of ['listening', 'speaking', 'pronunciation', 'vocabulary', 'grammar', 'reading', 'writing'] as Skill[]) {
      for (const level of ['preA1', 'A1', 'A2', 'B1', 'B2', 'C1'] as CEFR[]) {
        keys.add(focusText(skill, level).key)
        keys.add(growthFocus(level).key)
      }
    }
    for (const [lang, dict] of Object.entries(locales)) {
      const flat = flatten(dict)
      const missing = [...keys].filter((k) => !(k in flat))
      expect({ lang, missing }).toEqual({ lang, missing: [] })
    }
  })

  it('localizes every focus key it can produce, in every language', () => {
    const dicts = Object.entries(locales).map(([lang, d]) => [lang, flatten(d)] as const)
    const keys = new Set<string>()
    for (let seed = 1; seed <= 30; seed++) {
      const snapshot = buildSnapshot(noisyLearner(adultPlan(), (seed % 12) * 0.5 - 0.5, seed))
      for (const k of snapshot.priorityKeys ?? []) keys.add(k)
    }
    expect(keys.size).toBeGreaterThan(3)
    for (const [lang, dict] of dicts) {
      const missing = [...keys].filter((k) => !(k in dict))
      expect({ lang, missing }).toEqual({ lang, missing: [] })
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 6. The question bank can actually tell the levels apart                    */
/* -------------------------------------------------------------------------- */

describe('question bank coverage', () => {
  const bands = ['9-12', '13-17', 'adult'] as const

  for (const band of bands) {
    it(`offers every level from Pre-A1 to C1 for ${band}`, () => {
      const eligible = publicAssessmentItems.filter(
        (i) => i.ageBands.includes(band) && i.options && i.answerIndex != null,
      )
      for (const level of ['preA1', 'A1', 'A2', 'B1', 'B2', 'C1'] as CEFR[]) {
        const atLevel = eligible.filter((i) => i.cefr === level)
        expect({ band, level, count: atLevel.length }).toEqual({
          band,
          level,
          count: atLevel.length,
        })
        expect(atLevel.length).toBeGreaterThanOrEqual(2)
      }
    })
  }

  it('gives an adult enough items per skill to report that skill', () => {
    for (let run = 0; run < 20; run++) {
      const plan = adultPlan()
      const counts = new Map<Skill, number>()
      for (const it of plan) counts.set(it.skill, (counts.get(it.skill) ?? 0) + 1)
      for (const [, n] of counts) expect(n).toBeGreaterThanOrEqual(3)
    }
  })

  it('every auto-scored item has exactly four options and a valid answer', () => {
    for (const item of publicAssessmentItems) {
      if (!item.options) continue
      expect(item.options.length).toBe(4)
      expect(new Set(item.options).size).toBe(4)
      expect(item.answerIndex).toBeGreaterThanOrEqual(0)
      expect(item.answerIndex).toBeLessThan(item.options.length)
      expect(item.difficulty).toBeGreaterThanOrEqual(1)
      expect(item.difficulty).toBeLessThanOrEqual(10)
    }
  })
})

/* -------------------------------------------------------------------------- */
/* 7. The model itself                                                        */
/* -------------------------------------------------------------------------- */

describe('ability model', () => {
  it('cannot be driven above the ceiling or below the floor', () => {
    const plan = adultPlan()
    const high = estimateAbility(plan.map((it) => respond(it, 'correct')))
    const low = estimateAbility(plan.map((it) => respond(it, 'needsWork')))
    expect(high.level).toBe('C1')
    expect(low.level).toBe('preA1')
    expect(high.atCeiling).toBe(true)
  })

  it('discounts a correct answer that could be a guess', () => {
    const c1 = publicAssessmentItems.find((i) => i.cefr === 'C1' && i.options)!
    const one = estimateAbility([respond(c1, 'correct')])
    // One correct 4-option item is weak evidence — it cannot carry someone to
    // the top of the scale on its own, and it is reported as unreliable.
    expect(cefrIndex(one.level)).toBeLessThan(cefrIndex(CEILING_LEVEL))
    expect(one.confidence).toBe('low')
  })

  it('treats a partial answer as genuinely partial credit', () => {
    const plan = adultPlan()
    const asPartial = estimateAbility(plan.map((it) => respond(it, 'partial')))
    const asCorrect = estimateAbility(plan.map((it) => respond(it, 'correct')))
    const asWrong = estimateAbility(plan.map((it) => respond(it, 'needsWork')))
    expect(asPartial.theta).toBeGreaterThan(asWrong.theta)
    expect(asPartial.theta).toBeLessThan(asCorrect.theta)
  })
})
