import { UI_LANGUAGES, UILanguage } from '../types'
import { Dict } from '../i18n/dict'
import en from './en'
import he from './he'
import ru from './ru'
import es from './es'
import fr from './fr'

/* The UI's own strings. The tutor's teaching guidance is a namespace of its own
 * and is NOT here: it is far larger, it is useless outside a lesson, and it is
 * loaded on demand instead (see src/i18n/teachingStrings.ts). */
export const locales: Record<UILanguage, Dict> = { en, he, ru, es, fr }

/** Languages that read right-to-left. */
export const RTL_LANGUAGES: UILanguage[] = ['he']

export function isRTL(lang: UILanguage): boolean {
  return RTL_LANGUAGES.includes(lang)
}

/** Native display names for the language switcher. */
export const languageNames: Record<UILanguage, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
  es: 'Español',
  fr: 'Français',
}

/**
 * Coerce a stored or legacy language tag to one this app actually ships.
 *
 * Records survive releases: a profile saved when the picker offered a
 * different set, a hand-edited backup, a regional tag like `en-GB`, or plain
 * corruption would otherwise index `locales` with `undefined` and take the
 * screen down. The supported set is deliberately the five in UI_LANGUAGES —
 * five locales kept complete beats six kept half-translated.
 */
export function normalizeUILanguage(value: unknown, fallback: UILanguage = 'en'): UILanguage {
  if (typeof value !== 'string') return fallback
  const tag = value.trim().toLowerCase().replace('_', '-')
  const base = tag.split('-')[0]
  // Legacy ISO codes for Hebrew, still emitted by some platforms.
  const canonical = base === 'iw' ? 'he' : base
  return (UI_LANGUAGES as readonly string[]).includes(canonical)
    ? (canonical as UILanguage)
    : fallback
}
