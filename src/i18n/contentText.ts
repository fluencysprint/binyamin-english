/* ==========================================================================
   Library-authored tutor prose, resolved for the language on screen.
   --------------------------------------------------------------------------
   The grammar, pronunciation and beginner banks are the single source of
   truth for their own ENGLISH text — duplicating four hundred sentences into
   `en.ts` would only create two places to edit and one of them to forget.
   Every other locale overrides that text by CONTENT KEY (`grammar.g_plurals.
   meaningFirst`), so a concept keeps one identity across five languages.

   Resolution is deliberately silent: a missing key falls back to English
   rather than showing a raw key mid-lesson. What stops that from becoming an
   invisible English leak is the audit in src/tests/tutorLocalization.test.ts,
   which walks the same key list and fails when any locale is missing one.
   ========================================================================== */

import { UILanguage } from '../types'
import { contentTable } from './teachingStrings'

/** Resolve one library string: English from the bank, everything else by key. */
export function ct(lang: UILanguage, key: string, english: string): string {
  if (lang === 'en') return english
  const hit = contentTable(lang)?.[key]
  return hit && hit.trim() ? hit : english
}

/** Resolve a list, keyed by position (`…do.0`, `…do.1`). */
export function ctList(lang: UILanguage, base: string, english: readonly string[]): string[] {
  return english.map((s, i) => ct(lang, `${base}.${i}`, s))
}
