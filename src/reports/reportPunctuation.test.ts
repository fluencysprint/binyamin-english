/* ==========================================================================
   Generated report text can never carry doubled punctuation or a malformed
   quote pair, in any of the five UI locales.
   --------------------------------------------------------------------------
   Presentation punctuation has exactly one owner (see src/utils/quotes.ts):
   the render layer adds quotes/commas/periods, content never does. This
   sweeps `reportToText` — the same function the "copy" buttons and the
   plain-text summary use — for the sample report AND for a report built from
   deliberately awkward data (a correction and a pronunciation note that
   already carry their own straight quotes, an activity title ending in
   punctuation), across every locale. Broad rather than aimed at one string:
   the class of defect this guards is structural.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { UI_LANGUAGES, UILanguage, LessonReport } from '../types'
import { locales } from '../locales'
import { flatten, interpolate } from '../i18n/dict'
import { DOUBLED_QUOTE_RE } from '../utils/quotes'
import { reportToText } from './ReportView'
import { SAMPLE_LESSON_REPORT } from './sampleReport'

/** No `<I18nProvider>` here — this is a plain-text sweep, not a render test —
 *  so build the same `t` the provider does, directly from the flattened
 *  dictionaries. */
function tFor(lang: UILanguage) {
  const active = flatten(locales[lang])
  const english = flatten(locales.en)
  return (key: string, params?: Record<string, string | number>) => {
    const template = active[key] ?? english[key] ?? key
    return interpolate(template, params, lang)
  }
}

/** Two commas, two periods, or a bang/question mark doubled — never
 *  intentional in this app's report copy. (`…` and `...` are legitimate and
 *  excluded; so is a single already-punctuated line followed by another.) */
const DOUBLED_PUNCTUATION_RE = /,,|\.\.(?!\.)|!!|\?\?/

function assertClean(label: string, text: string) {
  expect(DOUBLED_QUOTE_RE.test(text), `${label}: ${text}`).toBe(false)
  expect(DOUBLED_PUNCTUATION_RE.test(text), `${label}: ${text}`).toBe(false)
}

/** A report built to stress the quoting pipeline: a correction and a
 *  pronunciation note that arrive with their OWN straight quotes (as a
 *  tutor's freeform typing does), and an activity title that itself ends
 *  with closing punctuation. */
const AWKWARD_REPORT: LessonReport = {
  ...SAMPLE_LESSON_REPORT,
  workedOn: ['Ordering food (polite requests).', 'Talking about "the weekend"'],
  wentWell: [
    { kind: 'objectiveOutcome', outcome: 'correct', title: 'Talking about "the weekend"' },
    { kind: 'greatExpression', said: 'she said "hi" to me' },
  ],
  corrections: [{ said: 'I "go" yesterday', better: 'I went yesterday, actually.' }],
  pronunciation: [
    { area: 'th', rating: 'needsPractice', note: '"think" came out as "sink" — tongue between the teeth.' },
  ],
}

describe('report text carries no doubled punctuation or malformed quotes, in any locale', () => {
  for (const lang of UI_LANGUAGES as readonly UILanguage[]) {
    it(`sample report — ${lang}`, () => {
      const t = tFor(lang)
      assertClean(`${lang} student`, reportToText(SAMPLE_LESSON_REPORT, t, false, lang))
      assertClean(`${lang} parent`, reportToText(SAMPLE_LESSON_REPORT, t, true, lang))
    })

    it(`awkward pre-punctuated / pre-quoted data — ${lang}`, () => {
      const t = tFor(lang)
      assertClean(`${lang} student (awkward)`, reportToText(AWKWARD_REPORT, t, false, lang))
      assertClean(`${lang} parent (awkward)`, reportToText(AWKWARD_REPORT, t, true, lang))
    })
  }
})
