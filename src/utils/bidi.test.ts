/* ==========================================================================
   Mixed Hebrew + English: where one direction ends and the other begins.
   --------------------------------------------------------------------------
   These assert the SPLIT, which is what decides where the `<bdi>` boundaries
   go. Whether the browser then lays the runs out correctly is a bidi-engine
   question and is covered in e2e/bidi.spec.ts, in real Chromium.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { isMixedDirection, splitBidiRuns } from './bidi'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'

/** The isolated runs, in order — the thing the component wraps in <bdi>. */
function isolates(text: string): string[] {
  return splitBidiRuns(text)
    .filter((r) => r.isolate)
    .map((r) => r.text)
}

/** Reassembly must be lossless: isolation never edits the text. */
function rejoin(text: string): string {
  return splitBidiRuns(text)
    .map((r) => r.text)
    .join('')
}

describe('splitBidiRuns', () => {
  it('leaves left-to-right text completely alone', () => {
    const runs = splitBidiRuns('Listen, then say: “My name is ___.”')
    expect(runs).toEqual([{ text: 'Listen, then say: “My name is ___.”', isolate: false }])
  })

  it('keeps the quotes AND the blank with the English run', () => {
    expect(isolates('הקשיבו, ואז אמרו: “My name is ___”.')).toEqual(['“My name is ___”'])
  })

  it('leaves the Hebrew sentence’s final period outside the isolate', () => {
    const runs = splitBidiRuns('הקשיבו, ואז אמרו: “My name is ___”.')
    expect(runs[runs.length - 1]).toEqual({ text: '.', isolate: false })
  })

  it('keeps punctuation that belongs INSIDE the quotes inside them', () => {
    expect(isolates('נופפו ואמרו “Hello!” ואז נופפו ואמרו “Bye!”')).toEqual(['“Hello!”', '“Bye!”'])
    expect(isolates('שאלו: “What is this?” וענו: “It’s a ___”.')).toEqual([
      '“What is this?”',
      '“It’s a ___”',
    ])
  })

  it('isolates an English run with no quotes at all', () => {
    expect(isolates('ספרו יחד: one, two, three.')).toEqual(['one, two, three'])
  })

  it('isolates parenthesised English', () => {
    expect(isolates('הערה (see below) בסוף.')).toEqual(['(see below)'])
  })

  it('never adds, drops or reorders a character', () => {
    const samples = [
      'הקשיבו, ואז אמרו: “My name is ___”.',
      'ענו על “How are you?” אמרו “I’m good”, “I’m tired” או “I’m okay”.',
      'למדו להגיד: “Again, please.” “I don’t understand.” “How do you say…?”',
      'plain English only',
      'עברית בלבד',
      '',
    ]
    for (const s of samples) expect(rejoin(s)).toBe(s)
  })

  it('reports mixed direction only when there is something to isolate', () => {
    expect(isMixedDirection('הקשיבו ואמרו “Hello”.')).toBe(true)
    expect(isMixedDirection('עברית בלבד')).toBe(false)
    expect(isMixedDirection('English only')).toBe(false)
  })
})

describe('the Hebrew locale’s own strings', () => {
  const he = flatten(locales.he)

  it('has learner instructions that embed English, and every one of them splits cleanly', () => {
    const mixed = Object.entries(he).filter(([, v]) => isMixedDirection(v))
    // If this ever hits zero the fixture has drifted and the suite proves nothing.
    expect(mixed.length).toBeGreaterThan(10)
    for (const [key, value] of mixed) {
      expect(rejoin(value), key).toBe(value)
      // An isolate that swallowed the whole string would isolate the Hebrew too.
      for (const run of isolates(value)) expect(run.length, key).toBeLessThan(value.length)
    }
  })
})
