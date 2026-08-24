/* ==========================================================================
   `translateSegments` isolates dynamic English/LTR content by VALUE — the
   caller names which `{{param}}`s are English (`ltrKeys`), so the boundary
   never has to be re-derived by scanning the finished, already-translated
   string. That is the fix for a class of bug `splitBidiRuns` cannot solve on
   its own: a single embedded English phrase's OWN trailing punctuation
   (`Just a moment, please.`) has no way to be told apart, after the fact,
   from Hebrew sentence-final punctuation that happens to sit in the same
   position. Here the value is never blended into the string in the first
   place, so there is nothing to tell apart.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { translateSegments } from './translate'

describe('translateSegments', () => {
  it('keeps a single embedded phrase — and its own trailing punctuation — as one ltr segment', () => {
    // report.homeworkItem.sayPhrases: 'אמרו את אלה בקול רם מהזיכרון, פעם ביום: {{phrases}}'
    const segments = translateSegments(
      'he',
      'report.homeworkItem.sayPhrases',
      { phrases: 'Just a moment, please.' },
      ['phrases'],
    )
    expect(segments).toEqual([
      { text: 'אמרו את אלה בקול רם מהזיכרון, פעם ביום: ', ltr: false },
      { text: 'Just a moment, please.', ltr: true },
    ])
  })

  it('keeps a question’s own "?" inside the isolated segment', () => {
    const segments = translateSegments(
      'he',
      'report.homeworkItem.sayPhrases',
      { phrases: 'Can you say that again, please?' },
      ['phrases'],
    )
    expect(segments[segments.length - 1]).toEqual({ text: 'Can you say that again, please?', ltr: true })
  })

  it('keeps a frame’s own trailing punctuation, and the Hebrew parenthetical that follows stays outside it', () => {
    // report.homeworkItem.usePhraseFrame: 'הרכיבו שלושה משפטים משלכם עם {{frame}} (אפשר לנסות: {{words}}).'
    const segments = translateSegments(
      'he',
      'report.homeworkItem.usePhraseFrame',
      { frame: 'Good ___.', words: 'morning, afternoon, evening' },
      ['frame', 'words'],
    )
    expect(segments).toEqual([
      { text: 'הרכיבו שלושה משפטים משלכם עם ', ltr: false },
      { text: 'Good ___.', ltr: true },
      { text: ' (אפשר לנסות: ', ltr: false },
      { text: 'morning, afternoon, evening', ltr: true },
      { text: ').', ltr: false },
    ])
  })

  it('splits an array param into its own segment with `items`, for one-per-line rendering', () => {
    const segments = translateSegments(
      'he',
      'report.homeworkItem.sayPhrases',
      { phrases: ['Goodbye.', 'Can you say that again, please?', 'Can you speak slowly, please?'] },
      ['phrases'],
    )
    expect(segments[1]).toEqual({
      text: 'Goodbye. · Can you say that again, please? · Can you speak slowly, please?',
      ltr: true,
      items: ['Goodbye.', 'Can you say that again, please?', 'Can you speak slowly, please?'],
    })
  })

  it('leaves a param NOT named in ltrKeys as plain text, unisolated', () => {
    const segments = translateSegments(
      'he',
      'report.homeworkItem.writeSentences',
      { count: 3, target: 'past simple' },
      [], // target not marked ltr
    )
    expect(segments.some((s) => s.ltr)).toBe(false)
    expect(segments.map((s) => s.text).join('')).toContain('past simple')
  })

  it('never isolates anything when the template has no RTL script (en/ru/es/fr stay untouched)', () => {
    for (const lang of ['en', 'ru', 'es', 'fr'] as const) {
      const segments = translateSegments(
        lang,
        'report.homeworkItem.sayPhrases',
        { phrases: 'Just a moment, please.' },
        ['phrases'],
      )
      expect(segments.every((s) => !s.ltr), lang).toBe(true)
      expect(segments.map((s) => s.text).join('')).toContain('Just a moment, please.')
    }
  })

  it('is lossless: segments rejoin to exactly what `translate` would have produced', () => {
    const params = { frame: 'Good ___.', words: 'morning, afternoon, evening' }
    const segments = translateSegments('he', 'report.homeworkItem.usePhraseFrame', params, ['frame', 'words'])
    const rejoined = segments.map((s) => s.text).join('')
    expect(rejoined).toBe(
      'הרכיבו שלושה משפטים משלכם עם Good ___. (אפשר לנסות: morning, afternoon, evening).',
    )
  })

  it('handles quotes and parentheses around an isolated value without dropping either', () => {
    const segments = translateSegments(
      'he',
      'report.homeworkItem.sayCorrected',
      { items: ['“I’m tired.”', '“It works.”'] },
      ['items'],
    )
    const ltrSeg = segments.find((s) => s.ltr)
    expect(ltrSeg?.items).toEqual(['“I’m tired.”', '“It works.”'])
  })
})
