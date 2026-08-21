/* ==========================================================================
   The validation layer, exercised against the inputs that actually break it.
   --------------------------------------------------------------------------
   Two obligations pull in opposite directions and both are tested here:

     • Reject or flag what is genuinely wrong — empty required fields, absurd
       ages, decimals where an integer belongs, over-long text, unknown enum
       values, malformed structures.

     • Leave meaningful text ALONE. A Hebrew name, a Russian note, a French
       accent, a Spanish ñ, an emoji, a combining mark, an apostrophe, a "<" —
       none of these are attacks and none of them get stripped, transliterated
       or "cleaned".

   The XSS case is deliberately asserted the other way round from what a naive
   reading suggests: `<script>` is STORED verbatim, because React escapes on
   render and mangling user text to defend against a hole that does not exist
   would corrupt legitimate input like "a < b".
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  AGE_MAX,
  AGE_MIN,
  LIMITS,
  coerceEnum,
  collectIssues,
  hasUnsafeControlCharacters,
  isValid,
  looksLikeEmail,
  sanitizeText,
  validateAge,
  validateEmail,
  validateEnum,
  validateInteger,
  validateOptionalText,
  validateRequiredText,
  validateTagList,
  validateText,
} from '../utils/validation'

describe('sanitizeText — strips only what cannot be typed', () => {
  it('trims surrounding whitespace and collapses interior runs', () => {
    expect(sanitizeText('   Alex   ')).toBe('Alex')
    expect(sanitizeText('Alex    Smith')).toBe('Alex Smith')
  })

  it('turns newlines and tabs into spaces in single-line fields', () => {
    expect(sanitizeText('one\ntwo\tthree')).toBe('one two three')
  })

  it('keeps paragraph structure in multiline fields', () => {
    expect(sanitizeText('first\n\nsecond', { multiline: true })).toBe('first\n\nsecond')
    // Trailing spaces on a line are noise; the line break itself is not.
    expect(sanitizeText('first   \nsecond', { multiline: true })).toBe('first\nsecond')
  })

  it('removes control characters', () => {
    expect(sanitizeText('Al\u0000ex\u0007')).toBe('Alex')
    expect(hasUnsafeControlCharacters('Al\u0000ex')).toBe(true)
    expect(hasUnsafeControlCharacters('Alex')).toBe(false)
  })

  it('removes bidi OVERRIDES (a real display-spoofing vector)', () => {
    expect(sanitizeText('safe\u202etxt.exe')).toBe('safetxt.exe')
    expect(hasUnsafeControlCharacters('a\u2066b')).toBe(true)
  })

  it('keeps LRM/RLM, which Hebrew text legitimately uses', () => {
    // U+200F RIGHT-TO-LEFT MARK. Written as an escape rather than pasted: an
    // invisible character in source is unreviewable, and it is the whole point
    // of this test that it survives.
    const RLM = '\u200F'
    const withMarks = `\u05E9\u05DC\u05D5\u05DD${RLM} (Hello)`
    expect(sanitizeText(withMarks)).toContain(RLM)
    expect(hasUnsafeControlCharacters(withMarks)).toBe(false)
  })

  it('normalizes to NFC without changing what the text says', () => {
    // "e" + combining acute (NFD) is stored as the single precomposed
    // character (NFC), so two identical-looking names compare and deduplicate
    // as equal instead of silently becoming two different students.
    const decomposed = 'Andr\u0065\u0301'
    expect(decomposed).toHaveLength(6)
    expect(sanitizeText(decomposed)).toBe('Andr\u00e9')
    expect(sanitizeText(decomposed)).toHaveLength(5)
  })

  it('returns an empty string for non-string input rather than throwing', () => {
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(42)).toBe('')
    expect(sanitizeText({ toString: () => 'nope' })).toBe('')
  })
})

describe('international text survives untouched', () => {
  const names = [
    ['Hebrew', 'בנימין'],
    ['Russian', 'Биньямин'],
    ['Ukrainian', 'Володимир'],
    ['Spanish', 'José Muñoz'],
    ['French', 'Élodie Lefèvre'],
    ['Portuguese', 'João Gonçalves'],
    ['German', 'Jürgen Straße'],
    ['Arabic', 'محمد'],
    ['Greek', 'Γιώργος'],
    ['Chinese', '李明'],
    ['Emoji', 'Sam 🎈'],
    ['Hyphenated', 'Anne-Marie O’Brien'],
  ] as const

  for (const [label, name] of names) {
    it(`${label}: "${name}" is stored exactly as typed`, () => {
      const result = validateRequiredText(name, { maxLength: LIMITS.name })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBe(name.normalize('NFC'))
    })
  }

  it('does not strip accents, and does not transliterate', () => {
    const result = validateRequiredText('  Éloïse Ñuñez  ', { maxLength: LIMITS.name })
    expect(result.ok && result.value).toBe('Éloïse Ñuñez')
  })
})

describe('markup-looking input is preserved, not mangled', () => {
  /* React escapes on render and the app uses no dangerouslySetInnerHTML, so
     angle brackets are ordinary characters. Stripping them would break real
     writing ("a < b", "<3") for no security benefit at all. */
  const hostile = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    "'; DROP TABLE students; --",
    '{{constructor.constructor("alert(1)")()}}',
    '=1+1+cmd|" /C calc"!A0',
  ]

  for (const value of hostile) {
    it(`stores ${JSON.stringify(value.slice(0, 24))}… verbatim`, () => {
      const result = validateText(value, { maxLength: LIMITS.note })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBe(value)
    })
  }

  it('keeps ordinary text containing angle brackets intact', () => {
    const result = validateText('a < b and b > c, <3', { maxLength: LIMITS.line })
    expect(result.ok && result.value).toBe('a < b and b > c, <3')
  })
})

describe('required / optional text', () => {
  it('rejects empty and whitespace-only required fields', () => {
    for (const value of ['', '   ', '\n\t ', ' '.repeat(0)]) {
      const result = validateRequiredText(value, { maxLength: LIMITS.name })
      expect(result.ok, JSON.stringify(value)).toBe(false)
      if (!result.ok) expect(result.issue.key).toBe('validation.required')
    }
  })

  it('accepts an empty optional field as undefined, not an empty string', () => {
    const result = validateOptionalText('   ', { maxLength: LIMITS.name })
    expect(result.ok && result.value).toBeUndefined()
  })

  it('rejects over-long input with the limit in the message params', () => {
    const result = validateRequiredText('x'.repeat(LIMITS.name + 1), { maxLength: LIMITS.name })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issue.key).toBe('validation.tooLong')
      expect(result.issue.params).toEqual({ max: LIMITS.name })
    }
  })

  it('does not silently truncate over-long input', () => {
    const long = 'x'.repeat(LIMITS.name + 50)
    const result = validateRequiredText(long, { maxLength: LIMITS.name })
    // Rejected with a message — never quietly cut down behind the user's back.
    expect(result.ok).toBe(false)
  })
})

describe('numbers and ages', () => {
  it('accepts sensible ages across the whole supported range', () => {
    for (const age of [AGE_MIN, 5, 7, 12, 17, 30, 65, 99, AGE_MAX]) {
      const result = validateAge(String(age))
      expect(result.ok, String(age)).toBe(true)
    }
  })

  it('rejects impossible ages', () => {
    for (const age of ['0', '-1', '-30', '4', '121', '999', '1000000']) {
      const result = validateAge(age)
      expect(result.ok, age).toBe(false)
      if (!result.ok) {
        expect(['validation.outOfRange', 'validation.notANumber']).toContain(result.issue.key)
      }
    }
  })

  it('rejects decimals rather than silently flooring them', () => {
    for (const age of ['9.5', '9,5', '10.0']) {
      const result = validateAge(age)
      expect(result.ok, age).toBe(false)
      if (!result.ok) expect(result.issue.key).toBe('validation.wholeNumber')
    }
  })

  it('rejects text and mixed input that parseInt would happily accept', () => {
    // parseInt('12abc') is 12 and parseInt('') is NaN — neither is what the
    // user meant, so both are refused here.
    for (const value of ['12abc', 'abc', 'ten', '1e3', ' ', '', '٩']) {
      const result = validateAge(value)
      expect(result.ok, JSON.stringify(value)).toBe(false)
    }
  })

  it('reports the real bounds so the message can be localized with them', () => {
    const result = validateAge('200')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issue.params).toEqual({ min: AGE_MIN, max: AGE_MAX })
  })

  it('validates arbitrary integer ranges', () => {
    expect(validateInteger('3', { min: 1, max: 5 }).ok).toBe(true)
    expect(validateInteger('6', { min: 1, max: 5 }).ok).toBe(false)
    expect(validateInteger(4, { min: 1, max: 5 }).ok).toBe(true)
  })
})

describe('email', () => {
  it('accepts ordinary and international addresses', () => {
    for (const value of [
      'a@b.co',
      'first.last+tag@example.co.uk',
      'binyamin@gmail.com',
      'josé@correo.es',
      'учитель@почта.рф',
    ]) {
      expect(looksLikeEmail(value), value).toBe(true)
    }
  })

  it('rejects malformed addresses', () => {
    for (const value of ['a@b', 'no-at-sign', '@example.com', 'a b@example.com', 'a@@b.com', 'a@.com']) {
      expect(looksLikeEmail(value), value).toBe(false)
    }
  })

  it('treats an empty optional email as absent, not invalid', () => {
    const result = validateEmail('', false)
    expect(result.ok && result.value).toBeUndefined()
  })

  it('flags an empty required email', () => {
    const result = validateEmail('', true)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issue.key).toBe('validation.required')
  })
})

describe('enums', () => {
  const LEVELS = ['A1', 'A2', 'B1'] as const

  it('accepts a known value', () => {
    expect(validateEnum('A2', LEVELS)).toEqual({ ok: true, value: 'A2' })
  })

  it('rejects unknown, wrong-case and injected values', () => {
    for (const value of ['C1', 'a2', 'A2 ', '__proto__', 'constructor', '']) {
      const result = validateEnum(value, LEVELS)
      // "A2 " trims to a valid value; everything else must be refused.
      expect(result.ok, value).toBe(value === 'A2 ')
    }
  })

  it('coerces persisted or URL values to a fallback rather than blocking', () => {
    // A stale value in localStorage or a hand-edited query string should
    // degrade to a sane default, not break the page.
    expect(coerceEnum('B1', LEVELS, 'A1')).toBe('B1')
    expect(coerceEnum('Z9', LEVELS, 'A1')).toBe('A1')
    expect(coerceEnum(null, LEVELS, 'A1')).toBe('A1')
    expect(coerceEnum({ toString: () => 'B1' }, LEVELS, 'A1')).toBe('A1')
  })
})

describe('tag lists (interests, other languages)', () => {
  it('drops blanks and duplicates while keeping order and script', () => {
    const result = validateTagList(['cooking', '  ', 'Cooking', 'ריקוד', 'cooking'], {
      maxLength: LIMITS.shortText,
    })
    expect(result.ok && result.value).toEqual(['cooking', 'ריקוד'])
  })

  it('rejects a non-array, an over-long entry, and too many entries', () => {
    expect(validateTagList('cooking' as unknown, { maxLength: 10 }).ok).toBe(false)
    expect(validateTagList(['x'.repeat(99)], { maxLength: 10 }).ok).toBe(false)
    const many = Array.from({ length: LIMITS.tags + 1 }, (_, i) => `tag${i}`)
    expect(validateTagList(many, { maxLength: 20 }).ok).toBe(false)
  })
})

describe('form helpers', () => {
  it('collects one issue per invalid field and reports overall validity', () => {
    const results = {
      name: validateRequiredText('', { maxLength: 10 }),
      age: validateAge('200'),
      language: validateOptionalText('Hebrew', { maxLength: 20 }),
    }
    expect(isValid(results)).toBe(false)
    const issues = collectIssues(results)
    expect(Object.keys(issues).sort()).toEqual(['age', 'name'])
    expect(issues.name.key).toBe('validation.required')
  })

  it('reports a fully valid form as valid with no issues', () => {
    const results = {
      name: validateRequiredText('בנימין', { maxLength: 10 }),
      age: validateAge('65'),
    }
    expect(isValid(results)).toBe(true)
    expect(collectIssues(results)).toEqual({})
  })
})
