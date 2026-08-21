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
