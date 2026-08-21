import { describe, it, expect } from 'vitest'
import { buildDiagnosticPlan, computePlacement } from './placement'
import { publicAssessmentItems } from '../data/assessmentBank'
import { AssessmentItem, CEFR, ItemResponse } from '../types'
import { cefrIndex } from '../utils/cefr'

/** Simulate a learner of a given true level answering a plan:
 *  correct on items at or below their level, wrong above. */
function simulate(plan: AssessmentItem[], trueLevel: CEFR): ItemResponse[] {
  return plan.map((it) => ({
    itemId: it.id,
    skill: it.skill,
    cefr: it.cefr,
    difficulty: it.difficulty,
    outcome: cefrIndex(it.cefr) <= cefrIndex(trueLevel) ? 'correct' : 'needsWork',
    at: 0,
  }))
}

describe('buildDiagnosticPlan', () => {
  it('gives an adult items at every level up to C1', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const levels = new Set(plan.map((i) => i.cefr))
    expect(levels.has('C1')).toBe(true)
    expect(levels.has('B2')).toBe(true)
    expect(levels.has('B1')).toBe(true)
    // Ordered easy → hard.
    for (let i = 1; i < plan.length; i++) {
      expect(cefrIndex(plan[i].cefr)).toBeGreaterThanOrEqual(cefrIndex(plan[i - 1].cefr))
    }
  })

  it('only serves auto-scorable items', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    for (const it of plan) {
      expect(it.options).toBeDefined()
      expect(it.answerIndex).toBeDefined()
    }
  })

  it('does not crash for young learners with a shallow pool', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: '6-8' })
    expect(plan.length).toBeGreaterThan(0)
  })

  it('shuffles option order instead of always putting the answer first', () => {
    // The item bank always authors the correct option at index 0 — assert the
    // rendered plan doesn't just pass that straight through every time.
    const runs = Array.from({ length: 30 }, () =>
      buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' }),
    )
    const answerIndexes = runs.flatMap((plan) => plan.map((it) => it.answerIndex))
    expect(new Set(answerIndexes).size).toBeGreaterThan(1)
    // The option text at the answerIndex must still be the correct one — i.e.
    // options and answerIndex were permuted together, not independently.
    for (const plan of runs) {
      for (const it of plan) {
        const original = publicAssessmentItems.find((p) => p.id === it.id)!
        expect(it.options![it.answerIndex!]).toBe(original.options![original.answerIndex!])
        expect(new Set(it.options)).toEqual(new Set(original.options))
      }
    }
  })

  it('varies which items are chosen across repeated runs when the pool has spares', () => {
    const runs = Array.from({ length: 15 }, () =>
      buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' }).map((it) => it.id).join(','),
    )
    expect(new Set(runs).size).toBeGreaterThan(1)
  })
})

describe('computePlacement — reaches the right level', () => {
  it('places a strong adult (all correct) at C1', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult', selfLevel: 'C1' })
    const result = computePlacement(simulate(plan, 'C1'))
    expect(result.estimatedLevel).toBe('C1')
  })

  it('places a B1 adult at B1 (passes through B1, stalls above)', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const result = computePlacement(simulate(plan, 'B1'))
    expect(result.estimatedLevel).toBe('B1')
    // Some emerging/failing evidence above → a boundary may be flagged.
    expect(cefrIndex(result.estimatedLevel)).toBeGreaterThanOrEqual(cefrIndex('B1'))
  })

  it('places a B2 adult at B2', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const result = computePlacement(simulate(plan, 'B2'))
    expect(result.estimatedLevel).toBe('B2')
  })

  it('does not inflate a beginner from one lucky high answer', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const responses = simulate(plan, 'A1')
    // Flip one C1 item to "correct" (a lucky guess).
    const c1 = responses.find((r) => r.cefr === 'C1')
    if (c1) c1.outcome = 'correct'
    const result = computePlacement(responses)
    expect(cefrIndex(result.estimatedLevel)).toBeLessThanOrEqual(cefrIndex('A2'))
  })

  it('places someone who fails everything at the floor', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: 'adult' })
    const responses = plan.map((it) => ({
      itemId: it.id,
      skill: it.skill,
      cefr: it.cefr,
      difficulty: it.difficulty,
      outcome: 'needsWork' as const,
      at: 0,
    }))
    const result = computePlacement(responses)
    expect(result.estimatedLevel).toBe('preA1')
  })

  it('lets a strong teen reach C1 (age bands broadened)', () => {
    const plan = buildDiagnosticPlan({ pool: publicAssessmentItems, ageBand: '13-17', selfLevel: 'C1' })
    expect(new Set(plan.map((i) => i.cefr)).has('C1')).toBe(true)
    const result = computePlacement(simulate(plan, 'C1'))
    expect(result.estimatedLevel).toBe('C1')
  })
})
