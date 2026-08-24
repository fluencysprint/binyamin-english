/* ==========================================================================
   Mixed Hebrew + English: where one direction ends and the other begins.
   --------------------------------------------------------------------------
   These assert the SPLIT, which is what decides where the `<bdi>` boundaries
   go. Whether the browser then lays the runs out correctly is a bidi-engine
   question and is covered in e2e/bidi.spec.ts, in real Chromium.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { hasRTL, isMixedDirection, splitBidiRuns } from './bidi'
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

  /* Regression: a Hebrew pronunciation note quoting TWO separate English
     words — `TH: "think" came out as "sink" — tongue between the teeth` —
     has no Hebrew character anywhere after the em dash, so the whole English
     tail grows into ONE run. The run-absorption loop only looked for a
     closer AT THE RUN'S FAR END to pull in a matching leading opener; the
     closer for "think" sits partway through instead (before "sink"), so the
     leading quote before "think" was left stranded in the Hebrew text next
     to it — a lone `"` the bidi algorithm then placed on the wrong side. */
  it('pulls a leading quote into the run even when its closer lands mid-run, not at the far end', () => {
    const text = 'צליל TH: דורש תרגול — "think" came out as "sink" — tongue between the teeth'
    const runs = isolates(text)
    // "TH" (the sound label, right after "צליל") is its own separate isolate;
    // what this test guards is the SECOND one, which used to leave its
    // leading quote behind.
    expect(runs).toEqual(['TH', '"think" came out as "sink" — tongue between the teeth'])
    expect(rejoin(text)).toBe(text)
  })

  it('still absorbs a leading opener with no closer at all, without crashing', () => {
    const text = 'עברית "orphaned open quote with no close'
    expect(() => splitBidiRuns(text)).not.toThrow()
    expect(rejoin(text)).toBe(text)
  })

  /* Regression: an English phrase whose OWN parenthetical sits at its tail —
     `Talking about last weekend (past simple)` — starts several words before
     the `(`, so the opener is not adjacent to the run's start the way
     `(see below)` is. The core-growth only widens `end` on letters, so the
     trailing `)` was left one character short of the run, and worse: when
     the whole phrase is itself quoted, the stranded `)` then blocked the
     outer-quote lookup below from ever finding its closer at the true end. */
  it('keeps a tail parenthetical inside the run, even a quoted one', () => {
    expect(isolates('בתרגיל: Talking about last weekend (past simple) בסדר.')).toEqual([
      'Talking about last weekend (past simple)',
    ])
    expect(
      isolates('השתמשת ב-"Talking about last weekend (past simple)" בצורה מדוייקת.'),
    ).toEqual(['"Talking about last weekend (past simple)"'])
  })

  it('keeps a tail bracketed phrase inside the run', () => {
    expect(isolates('כתבו את המילה החסרה [past simple] במשפט.')).toEqual([
      '[past simple]',
    ])
  })

  it('keeps commas and hyphens with the English run they punctuate, and leaves an unwrapped trailing period to the outer Hebrew sentence', () => {
    const runs = splitBidiRuns('אמרו: Yes, I did — but not on time. בבקשה.')
    expect(runs.some((r) => r.isolate && r.text === 'Yes, I did — but not on time')).toBe(true)
    expect(isolates('שימו לב ל-well-known idioms בטקסט.')).toEqual(['well-known idioms'])
    expect(isolates('הוא אמר It’s a well-known fact לפני שהמשיך.')).toEqual([
      'It’s a well-known fact',
    ])
  })

  it('never adds, drops or reorders a character even with a tail parenthetical', () => {
    const samples = [
      'בתרגיל: Talking about last weekend (past simple) בסדר.',
      'השתמשת ב-"Talking about last weekend (past simple)" בצורה מדוייקת.',
      'כתבו את המילה החסרה [past simple] במשפט.',
    ]
    for (const s of samples) expect(rejoin(s)).toBe(s)
  })
})

describe('splitBidiRuns phrase lists', () => {
  /* Regression: `guide.title.phrase.meet` etc join several full English
     sentences with " · " (`phraseList`), and `report.homeworkItem.sayPhrases`
     does the same. Two or more of them inside one Hebrew sentence must come
     back as a `phrases` array so a caller can render them as their own LTR
     block instead of one long inline run that scatters punctuation when it
     wraps across a line inside the RTL paragraph. */
  it('splits a run of 2+ " · "-joined phrases into a phrases array', () => {
    const text = 'חדש: Goodbye. · Can you say that again, please? · Can you speak slowly, please?'
    const runs = splitBidiRuns(text).filter((r) => r.isolate)
    expect(runs).toHaveLength(1)
    expect(runs[0].phrases).toEqual([
      'Goodbye.',
      'Can you say that again, please?',
      'Can you speak slowly, please?',
    ])
  })

  it('does not treat a single phrase as a phrase list', () => {
    const runs = splitBidiRuns('חדש: Just a moment, please.').filter((r) => r.isolate)
    expect(runs[0].phrases).toBeUndefined()
  })

  it('does not treat a comma-joined word list as a phrase list', () => {
    const runs = splitBidiRuns('נסו: afternoon, evening').filter((r) => r.isolate)
    expect(runs[0].phrases).toBeUndefined()
  })

  it('never adds, drops or reorders a character for a phrase-list run', () => {
    const text = 'חדש: Goodbye. · Can you say that again, please? · Can you speak slowly, please?'
    expect(rejoin(text)).toBe(text)
  })
})

describe('hasRTL', () => {
  it('is true for any text containing a Hebrew character, mixed or not', () => {
    expect(hasRTL('עברית בלבד')).toBe(true)
    expect(hasRTL('הקשיבו ואמרו “Hello”.')).toBe(true)
  })

  it('is false for English-only or punctuation-only text', () => {
    expect(hasRTL('Talking about last weekend (past simple)')).toBe(false)
    expect(hasRTL('1, 2, 3…')).toBe(false)
    expect(hasRTL('')).toBe(false)
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
