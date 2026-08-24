/* ==========================================================================
   The lesson's closing feedback line used to interpolate a raw curriculum
   label straight into a spoken sentence — "Today your "The TH sounds (think
   / this)" was much clearer." These tests pin the natural-sounding output for
   every pronunciation area and a sample of grammar concepts, and the two
   fallback paths (a legacy plan with no params, and an id neither lookup
   table knows yet).
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { LessonActivity } from '../types'
import { activityGuidance } from './guidance'
import { pronunciationLibrary } from '../data/pronunciationLibrary'
import { grammarLibrary } from '../data/grammarLibrary'

function feedbackActivity(params: Record<string, string>): LessonActivity {
  return {
    id: 'act',
    kind: 'feedback',
    title: 'Feedback',
    studentPrompt: 'x',
    guide: { src: 'feedback', params },
  }
}

function say(params: Record<string, string>): string[] {
  const activity = feedbackActivity(params)
  return activityGuidance(activity, { lang: 'en' }).autopilot?.say ?? []
}

/** No SAY line ever leaks a raw label straight from a content bank: no
 *  parenthetical detail, no leading article doubling ("your the …"), and
 *  never the UI-only quote-wrapped label the old implementation produced. */
function isNaturalSentence(line: string) {
  expect(line).not.toMatch(/\(/)
  expect(line).not.toMatch(/your the /i)
  expect(line).not.toMatch(/^Today your ".*"/)
  expect(line).not.toMatch(/^Next time, let’s work on ".*"$/)
}

describe('feedback close: natural spoken lines', () => {
  it('gives the three examples from the bug report', () => {
    // "The TH sounds (think / this)" as this lesson's pronunciation moment.
    expect(say({ focusPronArea: 'th' })).toEqual([
      'Your TH sounds were much clearer today.',
      'Next time, let’s work on one thing you noticed today.',
    ])
    // Present perfect as next lesson's grammar objective.
    expect(say({ nextGrammarId: 'g_present_perfect' })).toEqual([
      'Today your speaking was much clearer.',
      'Next time, let’s work on the present perfect.',
    ])
  })

  it('every pronunciation area produces a grammatical subject line, in both S/V agreement and phrasing', () => {
    for (const p of pronunciationLibrary) {
      const [focusLine] = say({ focusPronArea: p.area })
      expect(focusLine).toMatch(/^Your .+ (was|were) much clearer today\.$/)
      isNaturalSentence(focusLine)
    }
  })

  it('every grammar concept produces a natural "work on" line', () => {
    for (const g of grammarLibrary) {
      const [, nextLine] = say({ nextGrammarId: g.id })
      expect(nextLine).toMatch(/^Next time, let’s work on .+\.$/)
      isNaturalSentence(nextLine)
    }
  })

  it('swaps which slot pronunciation fills when the lesson objective IS pronunciation', () => {
    // Today's objective was "vw"; the next proactive pronunciation pick is "linking".
    const [focusLine, nextLine] = say({ focusPronArea: 'vw', nextPronArea: 'linking' })
    expect(focusLine).toBe('Your V and W sounds were much clearer today.')
    expect(nextLine).toBe('Next time, let’s work on linking words together.')
  })

  it('quotes a pattern correction instead of naming it like a concept', () => {
    const [, nextLine] = say({ nextPattern: 'I go to school every day.' })
    expect(nextLine).toBe('Next time, let’s work on saying “I go to school every day.”.')
  })

  it('falls back to a concrete ready-to-say line when a legacy plan carries no params', () => {
    expect(say({})).toEqual([
      'Today your speaking was much clearer.',
      'Next time, let’s work on one thing you noticed today.',
    ])
  })

  it('still reads as prose for an id neither lookup table knows yet', () => {
    const [focusLine] = say({ focusPronArea: 'madeUpFutureArea' })
    // No matching library entry either, so the area code itself is the best
    // we can do — but it must not be wrapped in raw quotes or parentheses.
    expect(focusLine).toBe('Your madeUpFutureArea was much clearer today.')
  })
})
