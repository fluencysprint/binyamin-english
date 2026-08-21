/* ==========================================================================
   Quotation handling — one strategy, applied once.
   --------------------------------------------------------------------------
   The reported bug rendered `““Let's revisit: “I explained him the situation
   carefully.”””` because content carried its own quotes AND the view added
   its own. These lock down both halves of the fix.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  DOUBLED_QUOTE_RE,
  demoteQuotes,
  embedQuoted,
  quoteMarks,
  quoted,
  stripOuterQuotes,
} from './quotes'
import { interpolate } from '../i18n/dict'
import { UI_LANGUAGES } from '../types'

describe('quoted', () => {
  it('wraps plain content in the locale primary marks', () => {
    expect(quoted('Hello there.', 'en')).toBe('“Hello there.”')
    expect(quoted('Hello there.', 'ru')).toBe('«Hello there.»')
  })

  it('is idempotent — quoting an already quoted value does not double it', () => {
    expect(quoted(quoted('Hello there.', 'en'), 'en')).toBe('“Hello there.”')
    expect(quoted('“Hello there.”', 'en')).toBe('“Hello there.”')
  })

  it('nests a quote the content already carried instead of repeating the mark', () => {
    // The exact reported string.
    const line = 'Let’s revisit: “I explained him the situation carefully.”'
    expect(quoted(line, 'en')).toBe('“Let’s revisit: ‘I explained him the situation carefully.’”')
    expect(DOUBLED_QUOTE_RE.test(quoted(line, 'en'))).toBe(false)
  })

  it('leaves an apostrophe inside a word alone', () => {
    expect(quoted('I’m fine, don’t worry.', 'en')).toBe('“I’m fine, don’t worry.”')
  })

  it('demotes straight double quotes, which are ambiguous in every locale', () => {
    expect(quoted('a "conversation" task', 'en')).toBe('“a ‘conversation’ task”')
  })

  it('leaves marks that are already distinct from the outer pair as they are', () => {
    // Russian primary is « », so an inner “ ” is already correct nesting.
    expect(quoted('Let’s revisit: “X.”', 'ru')).toBe('«Let’s revisit: “X.”»')
  })

  it('never produces a doubled mark, for any locale or any nesting depth', () => {
    const inputs = [
      'plain',
      '“wrapped”',
      '““double wrapped””',
      '«guillemets»',
      'said “hi” then left',
      '"straight"',
      'ends with a quote “X”',
    ]
    for (const lang of UI_LANGUAGES) {
      for (const input of inputs) {
        const out = quoted(input, lang)
        expect(DOUBLED_QUOTE_RE.test(out), `${lang}: ${input} → ${out}`).toBe(false)
      }
    }
  })

  it('returns nothing at all rather than an empty pair', () => {
    expect(quoted('  ', 'en')).toBe('')
    expect(quoted('“”', 'en')).toBe('')
  })
})

describe('stripOuterQuotes / demoteQuotes', () => {
  it('removes however many outer pairs a value arrived with', () => {
    expect(stripOuterQuotes('““X””')).toBe('X')
    expect(stripOuterQuotes('«X»')).toBe('X')
  })

  it('does not strip marks that are part of the content', () => {
    expect(stripOuterQuotes('“A” and “B”')).toBe('“A” and “B”')
  })

  it('demotes only the marks that would collide with the outer pair', () => {
    expect(demoteQuotes('“X”', 'en')).toBe('‘X’')
    expect(demoteQuotes('“X”', 'ru')).toBe('“X”')
  })
})

describe('interpolate', () => {
  it('normalizes a value the template has already put quotes around', () => {
    const out = interpolate('Nice expression: “{{said}}”.', { said: 'he said “hi”' }, 'en')
    expect(out).toBe('Nice expression: “he said ‘hi’”.')
    expect(DOUBLED_QUOTE_RE.test(out)).toBe(false)
  })

  it('drops an outer pair the value arrived with rather than doubling it', () => {
    const out = interpolate('Nice expression: “{{said}}”.', { said: '“hi”' }, 'en')
    expect(out).toBe('Nice expression: “hi”.')
  })

  it('handles guillemets, including the French narrow no-break space', () => {
    expect(interpolate('Belle expression : « {{said}} ».', { said: '« bonjour »' }, 'fr')).toBe(
      'Belle expression : « bonjour ».',
    )
    expect(interpolate('Удачное выражение: «{{said}}».', { said: '«привет»' }, 'ru')).toBe(
      'Удачное выражение: «привет».',
    )
  })

  it('leaves an UNQUOTED placeholder exactly as it is', () => {
    expect(interpolate('Words: {{terms}}', { terms: 'a “b” c' }, 'en')).toBe('Words: a “b” c')
  })

  it('still leaves an unknown placeholder in place', () => {
    expect(interpolate('Hi {{name}}', {}, 'en')).toBe('Hi {{name}}')
  })
})

describe('quoteMarks', () => {
  it('defines a distinct primary and secondary pair for every supported locale', () => {
    for (const lang of UI_LANGUAGES) {
      const m = quoteMarks(lang)
      expect(m.open, lang).toBeTruthy()
      expect(m.close, lang).toBeTruthy()
      expect(m.innerOpen, lang).not.toBe(m.open)
    }
  })
})

describe('embedQuoted', () => {
  it('normalizes without adding marks of its own', () => {
    expect(embedQuoted('“X”', 'en')).toBe('X')
    expect(embedQuoted('said “X” once', 'en')).toBe('said ‘X’ once')
  })
})
