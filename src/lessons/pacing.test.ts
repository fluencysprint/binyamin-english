/* ==========================================================================
   Pacing advice.
   --------------------------------------------------------------------------
   The rule these tests exist to protect: a productive conversation is never
   interrupted because a timer reached a number. Everything else about pacing
   is a suggestion; that one is a guarantee.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { PACING, PacingInput, ageStageFor, ageStageFromBand, lessonPosition, pacingAdvice, pacingFor } from './pacing'

const base = (over: Partial<PacingInput> = {}): PacingInput => ({
  elapsedSeconds: 10 * 60,
  plannedMinutes: 50,
  stepElapsedSeconds: 60,
  stepMinutes: 4,
  profile: pacingFor(30),
  isConversation: false,
  stepsRemaining: 8,
  ...over,
})

describe('timing is guidance, not punishment', () => {
  it('does NOT interrupt a conversation that is going well, however long it runs', () => {
    const verdict = pacingAdvice(
      base({ isConversation: true, stepElapsedSeconds: 40 * 60, stepMinutes: 5, lastOutcome: 'correct' }),
    )
    expect(verdict.advice).toBe('continue')
    expect(verdict.reasonKey).toBe('pacing.reasonFlowing')
    // It still REPORTS that it has run long — the tutor is informed, not told off.
    expect(verdict.overStep).toBe(true)
  })

  it('protects the conversation even when the whole lesson has overrun', () => {
    const verdict = pacingAdvice(
      base({ isConversation: true, elapsedSeconds: 70 * 60, stepElapsedSeconds: 20 * 60 }),
    )
    expect(verdict.advice).toBe('continue')
    expect(verdict.overLesson).toBe(true)
  })

  it('simplifies a struggling learner before the clock gets a say', () => {
    const verdict = pacingAdvice(
      base({ lastOutcome: 'needsWork', isConversation: true, stepElapsedSeconds: 30 * 60 }),
    )
    expect(verdict.advice).toBe('simplify')
    expect(verdict.reasonKey).toBe('pacing.reasonStruggling')
  })

  it('never returns an advice value that reads as a failure state', () => {
    const advices = new Set<string>()
    for (const isConversation of [true, false]) {
      for (const lastOutcome of [undefined, 'correct', 'partial', 'needsWork'] as const) {
        for (const stepElapsedSeconds of [10, 5 * 60, 30 * 60]) {
          for (const elapsedSeconds of [60, 30 * 60, 60 * 60]) {
            advices.add(
              pacingAdvice(base({ isConversation, lastOutcome, stepElapsedSeconds, elapsedSeconds })).advice,
            )
          }
        }
      }
    }
    expect([...advices].sort()).toEqual(
      ['advance', 'changeActivity', 'continue', 'simplify', 'wrapUp'].filter((a) => advices.has(a)).sort(),
    )
  })
})

describe('the four in-lesson decisions', () => {
  it('advances when it landed easily and there is time', () => {
    expect(pacingAdvice(base({ lastOutcome: 'correct' })).advice).toBe('advance')
  })

  it('suggests changing activity when one non-conversation step has run very long', () => {
    const verdict = pacingAdvice(base({ stepElapsedSeconds: 20 * 60, lastOutcome: 'partial' }))
    expect(verdict.advice).toBe('changeActivity')
  })

  it('starts wrapping up near the end so the lesson can finish on a success', () => {
    const verdict = pacingAdvice(base({ elapsedSeconds: 47 * 60, stepsRemaining: 3 }))
    expect(verdict.advice).toBe('wrapUp')
  })

  it('says continue when everything is simply on track', () => {
    const verdict = pacingAdvice(base())
    expect(verdict.advice).toBe('continue')
    expect(verdict.reasonKey).toBe('pacing.reasonOnTrack')
    expect(verdict.overStep).toBe(false)
    expect(verdict.overLesson).toBe(false)
  })

  it('does not tell the tutor to wrap up when there is nothing left to wrap', () => {
    const verdict = pacingAdvice(base({ elapsedSeconds: 48 * 60, stepsRemaining: 0 }))
    expect(verdict.advice).not.toBe('wrapUp')
  })
})

describe('pacing adapts to age', () => {
  it('young children get the shortest cycles and movement breaks', () => {
    const young = PACING.youngChild
    expect(young.stepMinutes).toBeLessThanOrEqual(3)
    expect(young.needsMovementBreaks).toBe(true)
    expect(young.allowsSustainedConversation).toBe(false)
  })

  it('older children and teens get moderate changes without movement games', () => {
    expect(PACING.child.needsMovementBreaks).toBe(true)
    expect(PACING.teen.needsMovementBreaks).toBe(false)
    expect(PACING.teen.maxActivityMinutes).toBeGreaterThan(PACING.child.maxActivityMinutes)
  })

  it('adults may sustain long conversation and deeper tasks', () => {
    expect(PACING.adult.allowsSustainedConversation).toBe(true)
    expect(PACING.adult.maxActivityMinutes).toBeGreaterThanOrEqual(20)
  })

  it('step length grows monotonically from young child to adult', () => {
    const order = [PACING.youngChild, PACING.child, PACING.teen, PACING.adult]
    for (let i = 1; i < order.length; i++) {
      expect(order[i].stepMinutes).toBeGreaterThan(order[i - 1].stepMinutes)
    }
  })

  it('an older adult is paced gently but is never treated as a child', () => {
    expect(PACING.olderAdult.needsMovementBreaks).toBe(false)
    expect(PACING.olderAdult.allowsSustainedConversation).toBe(true)
    expect(PACING.olderAdult.stepMinutes).toBeLessThan(PACING.adult.stepMinutes)
  })

  it('a C1 adult can hold a very long conversation block without advice to stop', () => {
    const verdict = pacingAdvice(
      base({ profile: PACING.adult, isConversation: true, stepElapsedSeconds: 25 * 60, stepMinutes: 8 }),
    )
    expect(verdict.advice).toBe('continue')
  })
})

describe('age stage derivation', () => {
  it('falls back sensibly when only the age band is known', () => {
    expect(ageStageFromBand('6-8')).toBe('youngChild')
    expect(ageStageFromBand('9-12')).toBe('child')
    expect(ageStageFromBand('13-17')).toBe('teen')
    expect(ageStageFromBand('adult')).toBe('adult')
  })

  it('treats the boundary ages exactly once each', () => {
    expect(ageStageFor(7)).not.toBe(ageStageFor(8))
    expect(ageStageFor(12)).not.toBe(ageStageFor(13))
    expect(ageStageFor(17)).not.toBe(ageStageFor(18))
    expect(ageStageFor(64)).not.toBe(ageStageFor(65))
  })
})

describe('lesson position', () => {
  it('reports a fraction that never exceeds 1, even when overtime', () => {
    expect(lessonPosition(0, 50)).toBe(0)
    expect(lessonPosition(25 * 60, 50)).toBeCloseTo(0.5)
    expect(lessonPosition(90 * 60, 50)).toBe(1)
  })

  it('does not divide by zero on a malformed plan', () => {
    expect(lessonPosition(600, 0)).toBe(0)
  })
})
