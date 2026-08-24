/* ==========================================================================
   Translate a key for a SPECIFIC language, independent of the active UI locale.
   --------------------------------------------------------------------------
   The lesson runner shows student-facing prompts in the STUDENT's interface
   language (which may differ from the tutor's UI language) — a non-reader of
   English must see instructions they can understand. Falls back to English,
   then to the key itself, matching the I18nProvider's own resolution.
   ========================================================================== */

import { UILanguage } from '../types'
import { flatten, interpolate } from './dict'
import { locales } from '../locales'
import { guideTable } from './teachingStrings'
import { hasRTL } from '../utils/bidi'

const cache = new Map<UILanguage, Record<string, string>>()
function flatFor(lang: UILanguage): Record<string, string> {
  let f = cache.get(lang)
  if (!f) {
    f = flatten(locales[lang])
    cache.set(lang, f)
  }
  return f
}

/**
 * One key, resolved down the fallback chain: this language's UI strings, then
 * its teaching guidance (loaded on demand), then English for both, then
 * nothing. Guidance is checked after the UI strings so a `guide.*` key still
 * resolves while its chunk is in flight — in English rather than as a key.
 */
function lookup(lang: UILanguage, key: string): string | undefined {
  return (
    flatFor(lang)[key] ??
    guideTable(lang)?.[key] ??
    flatFor('en')[key] ??
    guideTable('en')?.[key]
  )
}

export function translate(
  lang: UILanguage,
  key: string,
  params?: Record<string, string | number>,
): string {
  return interpolate(lookup(lang, key) ?? key, params, lang)
}

/**
 * A LIST written in the locale file as an array (`do: ['…', '…']`), read back
 * without the caller having to know how long it is. Guidance lists differ in
 * length between concepts, and a language may genuinely need a line the
 * English does not — reading until the first gap keeps that possible.
 */
export function translateList(
  lang: UILanguage,
  key: string,
  params?: Record<string, string | number>,
): string[] {
  const out: string[] = []
  for (let i = 0; ; i++) {
    const template = lookup(lang, `${key}.${i}`)
    if (template === undefined) return out
    out.push(interpolate(template, params, lang))
  }
}

/** True when the locale (or English) defines this key at all. */
export function hasKey(lang: UILanguage, key: string): boolean {
  return lookup(lang, key) !== undefined
}

/** One piece of a translated template: either literal locale text, or the
 *  value of a placeholder. `items` is set when the placeholder's value was
 *  supplied as an array (several English chunks, not one). */
export interface TranslateSegment {
  text: string
  /** True when this segment is dynamic English/LTR learning content that
   *  must render in its own isolate rather than participate in the
   *  surrounding RTL run — set by the caller via `ltrKeys`, never guessed
   *  from the text itself. */
  ltr: boolean
  items?: string[]
}

/**
 * Split a template into segments at its `{{name}}` placeholders, instead of
 * interpolating them into one finished string.
 *
 * `interpolate` (used by `translate`) has to hand back a single string, so a
 * consumer that later needs to isolate the English pieces has no choice but
 * to re-derive placeholder boundaries by scanning the finished text — which
 * cannot tell "this trailing period is the end of the English sentence" from
 * "this trailing period ends the Hebrew sentence", because by then both are
 * the same kind of character. Here the boundary is never lost: each
 * placeholder's value is kept as its own segment, exactly as the caller
 * supplied it (including any punctuation the value itself carries), so a
 * renderer can isolate precisely the values named in `ltrKeys` and leave
 * every other character exactly where the locale wrote it.
 *
 * Segments never isolate anything when the template itself has no RTL
 * script — an LTR locale (English, Russian, Spanish, French) gets the same
 * plain text `translate` would have produced.
 */
export function translateSegments(
  lang: UILanguage,
  key: string,
  params: Record<string, string | number | string[]>,
  ltrKeys: readonly string[],
): TranslateSegment[] {
  const template = lookup(lang, key) ?? key
  const isolateEligible = hasRTL(template)
  const ltrSet = new Set(ltrKeys)
  const segments: TranslateSegment[] = []
  const re = /\{\{\s*(\w+)\s*\}\}/g
  let cursor = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(template))) {
    if (m.index > cursor) segments.push({ text: template.slice(cursor, m.index), ltr: false })
    const name = m[1]
    const raw = name in params ? params[name] : undefined
    const ltr = isolateEligible && ltrSet.has(name)
    if (Array.isArray(raw)) {
      segments.push({ text: raw.join(' · '), ltr, items: raw })
    } else {
      segments.push({ text: raw === undefined ? m[0] : String(raw), ltr })
    }
    cursor = re.lastIndex
  }
  if (cursor < template.length) segments.push({ text: template.slice(cursor), ltr: false })
  return segments
}
