/* ==========================================================================
   Every quote pair a locale template writes around a {{placeholder}} must be
   a mark this app actually recognizes as a pair.
   --------------------------------------------------------------------------
   `interpolate()` (src/i18n/dict.ts) only demotes a placeholder's own quotes
   — the fix that stops content and template from BOTH adding quotation marks
   — when it recognizes the template's opener/closer as a matched pair via
   `CLOSER_FOR`. he.ts's Hebrew report templates wrote `„{{title}}”`: a
   low-9 opener with a curly closer, which is not a pair `CLOSER_FOR` knows
   (every other Hebrew template in the file uses `“…”`, matching
   `quoteMarks('he')`). Interpolation silently skipped demotion for those two
   lines — any title value carrying its own quote marks would double them,
   and nothing would catch it, because the mismatch itself was invisible
   until a title happened to contain a quote.

   This sweeps every locale's flattened dictionary for exactly that shape —
   a quote-like character immediately bordering a placeholder — and asserts
   its closer is one `CLOSER_FOR` actually maps it to. It would have failed
   on the original he.ts content.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'
import { CLOSER_FOR } from '../utils/quotes'
import { UI_LANGUAGES, UILanguage } from '../types'

const QUOTE_SPACE = /[\s\u00A0\u202F]/
const OPENERS = new Set(Object.keys(CLOSER_FOR))
const PLACEHOLDER_RE = /\{\{\s*\w+\s*\}\}/g

describe('locale templates: quote marks around a {{placeholder}} are a pair interpolate() recognizes', () => {
  for (const lang of UI_LANGUAGES as readonly UILanguage[]) {
    it(lang, () => {
      const flat = flatten(locales[lang])
      for (const [key, value] of Object.entries(flat)) {
        if (typeof value !== 'string') continue
        for (const m of value.matchAll(PLACEHOLDER_RE)) {
          const start = m.index ?? 0
          let l = start - 1
          while (l >= 0 && QUOTE_SPACE.test(value[l])) l--
          const open = l >= 0 ? value[l] : ''
          if (!OPENERS.has(open)) continue // not quote-flanked at all — fine

          let r = start + m[0].length
          while (r < value.length && QUOTE_SPACE.test(value[r])) r++
          const close = value[r] ?? ''

          expect(
            CLOSER_FOR[open],
            `${lang} "${key}": "${value}" — opener ${JSON.stringify(open)} is followed by ` +
              `${JSON.stringify(close)}, not the closer CLOSER_FOR expects`,
          ).toBe(close)
        }
      }
    })
  }
})
