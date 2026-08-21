/* ==========================================================================
   ONE quoting strategy for the whole app.
   --------------------------------------------------------------------------
   Presentation quotes belong to whoever RENDERS a value, never to the value
   itself. Two rules follow, and this module is both of them:

     1. `quoted()` — a view that shows something inside quotes calls this. It
        drops a redundant outer pair the content already carried, and demotes
        any remaining primary marks to secondary ones, so an inner quote stays
        a valid NESTED quote instead of reading as a second opening quote.

     2. `embedQuoted()` — a translated template that writes its own quotes
        around a placeholder (`Nice expression: “{{said}}”.`) gets the VALUE
        demoted the same way, automatically, from `interpolate`.

   Both exist because the two layers used to quote independently: a generated
   SAY line already read `Let's revisit: “X.”`, and the micro-step view wrapped
   every line in quotes again, which is how `““Let's revisit: “X.”””` reached
   the screen. Content now never supplies presentation quotes twice.
   ========================================================================== */

import { UILanguage } from '../types'

interface Marks {
  /** Primary (outermost) pair for this locale. */
  open: string
  close: string
  /** Secondary pair, used for anything nested inside the primary one. */
  innerOpen: string
  innerClose: string
}

/* Natural per locale: English and Hebrew set quoted speech in curly double
   marks; Russian, Spanish and French use guillemets, French with the
   narrow no-break space its typography requires. */
const MARKS: Record<UILanguage, Marks> = {
  en: { open: '“', close: '”', innerOpen: '‘', innerClose: '’' },
  he: { open: '“', close: '”', innerOpen: '‘', innerClose: '’' },
  ru: { open: '«', close: '»', innerOpen: '„', innerClose: '“' },
  es: { open: '«', close: '»', innerOpen: '“', innerClose: '”' },
  fr: { open: '« ', close: ' »', innerOpen: '“', innerClose: '”' },
}

/** French sets its guillemets with a narrow no-break space; comparing marks
 *  has to ignore it. */
function stripSpaces(mark: string): string {
  return mark.replace(/[\s\u00A0\u202F]/g, '')
}

export function quoteMarks(lang: UILanguage = 'en'): Marks {
  return MARKS[lang] ?? MARKS.en
}

/** Every primary mark this app can emit, mapped to its closer. */
const PAIRS: Record<string, string> = {
  '“': '”', // “ ”
  '‘': '’', // ‘ ’
  '«': '»', // « »
  '„': '“', // „ “
  '"': '"',
}

/** True when `text` is one balanced quoted run — an outer pair we can drop. */
function isWrapped(text: string): boolean {
  const open = text[0]
  const close = PAIRS[open]
  if (!close || text.length < 2 || text[text.length - 1] !== close) return false
  if (open === close) {
    // Symmetric marks carry no nesting information: only a plain "…" qualifies.
    return text.indexOf(close, 1) === text.length - 1
  }
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === open) depth++
    else if (text[i] === close) {
      depth--
      if (depth === 0) return i === text.length - 1
    }
  }
  return false
}

/** Remove outer quote pairs a value carried with it (however many). */
export function stripOuterQuotes(raw: string): string {
  let text = raw.trim()
  // Bounded: a value nested more than a few deep is malformed, not meaningful.
  for (let i = 0; i < 4 && isWrapped(text); i++) {
    text = text.slice(1, -1).trim()
  }
  return text
}

/**
 * Turn primary marks inside a value into secondary ones, so wrapping the value
 * in this locale's primary marks yields valid nesting rather than a doubled
 * opening quote. Marks that are ALREADY distinct from the outer pair are left
 * exactly as they are — `«… “X” …»` is correct Russian and needs no rewrite.
 */
export function demoteQuotes(
  raw: string,
  lang: UILanguage = 'en',
  outer?: { open: string; close: string },
): string {
  const m = quoteMarks(lang)
  const outerOpen = stripSpaces(outer?.open ?? m.open)
  const outerClose = stripSpaces(outer?.close ?? m.close)
  let text = raw
  if (outerOpen !== outerClose) {
    text = text.split(outerOpen).join(m.innerOpen).split(outerClose).join(m.innerClose)
  }
  // Straight double quotes are ambiguous in every locale: always demote them.
  text = text.replace(/"([^"]*)"/g, (_, inner: string) => `${m.innerOpen}${inner}${m.innerClose}`)
  return text
}

/**
 * Render `text` inside this locale's quotation marks — the single entry point
 * for any view that shows quoted content. Idempotent: quoting an already
 * quoted value returns the same string rather than a doubled one.
 */
export function quoted(raw: string, lang: UILanguage = 'en'): string {
  const m = quoteMarks(lang)
  const text = demoteQuotes(stripOuterQuotes(raw), lang)
  if (!text) return ''
  return `${m.open}${text}${m.close}`
}

/**
 * Convert every straight-double-quoted span in free prose to this locale's
 * PRIMARY marks. For a value some OTHER function wraps as a whole, use
 * `quoted`/`embedQuoted` instead — this is for text that quotes a word or two
 * inline, like a pronunciation note (`"think" came out as "sink"`), where the
 * quoted words are standalone, not nested inside an outer pair.
 */
export function localizeInlineQuotes(text: string, lang: UILanguage = 'en'): string {
  const m = quoteMarks(lang)
  return text.replace(/"([^"]*)"/g, (_, inner: string) => `${m.open}${inner}${m.close}`)
}

/**
 * The value for a placeholder that a TEMPLATE has already put quotes around.
 * Same normalization, without adding marks of its own — the template supplies
 * those. Called from `interpolate`, so every locale gets it for free.
 */
export function embedQuoted(
  raw: string,
  lang: UILanguage = 'en',
  outer?: { open: string; close: string },
): string {
  return demoteQuotes(stripOuterQuotes(raw), lang, outer)
}

/** Closing mark for each opening mark a locale template may use. */
export const CLOSER_FOR: Record<string, string> = PAIRS

/** The visible artifacts these helpers exist to prevent: the same quote mark
 *  twice in a row, or an empty pair. Exported so tests can sweep generated
 *  content. Two SEPARATE quoted phrases side by side ("A." "B.") are normal
 *  and deliberately not matched. */
export const DOUBLED_QUOTE_RE = /([“”‘’«»„"])\1|“”|«»|‘’/
