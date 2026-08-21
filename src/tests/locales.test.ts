import { describe, it, expect } from 'vitest'
import { UI_LANGUAGES, UILanguage } from '../types'
import { languageNames, locales, normalizeUILanguage, RTL_LANGUAGES } from '../locales'
import { flatten } from '../i18n/dict'
import { DEMO_PROFILES } from '../data/exampleData'

const en = flatten(locales.en)
const enKeys = Object.keys(en).sort()

describe('localization completeness', () => {
  it('English defines a non-trivial number of keys', () => {
    expect(enKeys.length).toBeGreaterThan(200)
  })

  for (const lang of UI_LANGUAGES) {
    describe(`locale: ${lang}`, () => {
      const flat = flatten(locales[lang])
      const keys = Object.keys(flat).sort()

      it('has exactly the same keys as English (no missing, no extra)', () => {
        const missing = enKeys.filter((k) => !(k in flat))
        const extra = keys.filter((k) => !(k in en))
        expect({ missing, extra }).toEqual({ missing: [], extra: [] })
      })

      it('has no empty strings', () => {
        const empty = keys.filter((k) => flat[k].trim() === '')
        expect(empty).toEqual([])
      })

      it('preserves all interpolation placeholders from English', () => {
        const placeholderRe = /\{\{\s*\w+\s*\}\}/g
        const mismatches: string[] = []
        for (const k of enKeys) {
          const enVars = (en[k].match(placeholderRe) ?? []).map((s) => s.replace(/\s/g, '')).sort()
          const locVars = (flat[k].match(placeholderRe) ?? []).map((s) => s.replace(/\s/g, '')).sort()
          if (JSON.stringify(enVars) !== JSON.stringify(locVars)) mismatches.push(k)
        }
        expect(mismatches).toEqual([])
      })

      // Non-Latin scripts are a strong signal: a real translation almost always
      // uses at least one native-script character. A long string with none is
      // very likely an untranslated copy-paste of the English source (this is
      // exactly how the assessment-snapshot priorities/notes leaked English
      // into every locale). Short strings (numbers, "CEFR", "C1"...) are fine
      // and excluded by the length threshold.
      //
      // "Binyamin English" is the one deliberate exception: the brand name is
      // never translated or transliterated in any locale (per brand guidance),
      // so common.appName stays pure Latin script everywhere on purpose.
      const scriptRe: Record<string, RegExp> = {
        he: /[֐-׿]/,
        ru: /[Ѐ-ӿ]/,
      }
      const UNTRANSLATED_BY_DESIGN = new Set(['common.appName'])
      const re = scriptRe[lang]
      if (re) {
        it('translates long strings into the native script (no leftover English)', () => {
          const untranslated = keys.filter(
            (k) => flat[k].length > 15 && !re.test(flat[k]) && !UNTRANSLATED_BY_DESIGN.has(k),
          )
          expect(untranslated).toEqual([])
        })
      }
    })
  }
})

/* -------------------------------------------------------------------------- */
/* Naturalness — the failures a key-completeness check cannot see              */
/* -------------------------------------------------------------------------- */

/**
 * A locale can have every key, every placeholder and the right script, and
 * still read like it came out of a machine. These are the specific ways this
 * app's translations went wrong, kept as regressions.
 */
describe('translations read like a person wrote them', () => {
  const ru = flatten(locales.ru)

  it('Russian never calls a level result a «снимок» (that is a photograph or an X-ray)', () => {
    const offenders = Object.entries(ru).filter(([, v]) => /снимок|снимк/i.test(v))
    expect(offenders.map(([k]) => k)).toEqual([])
  })

  it('Russian does not open every validation message with «Пожалуйста»', () => {
    // Russian interfaces do not apologise before telling you a field is empty.
    const polite = Object.entries(ru).filter(
      ([k, v]) => k.startsWith('validation.') && /^Пожалуйста/.test(v),
    )
    expect(polite.map(([k]) => k)).toEqual([])
  })

  it('no locale ships an English sentence in a long user-facing string', () => {
    // Latin-script locales are excluded (es/fr legitimately look like English
    // at a glance); this catches the copy-paste-the-source failure in ru/he.
    const bad: string[] = []
    for (const lang of ['ru', 'he'] as const) {
      const flat = flatten(locales[lang])
      for (const [k, v] of Object.entries(flat)) {
        if (k === 'common.appName') continue
        // Quoted English is the POINT in a language app — «This is a cup» is
        // the target being taught, not an untranslated string. Strip quotes
        // first, then look for English prose in what is left.
        const outsideQuotes = v
          .replace(/«[^»]*»/g, '')
          .replace(/[“"][^”"]*[”"]/g, '')
          .replace(/‘[^’]*’/g, '')
        // Four or more consecutive ASCII words is prose, not a term like
        // "present simple" or "Pre-A1" that stays English on purpose.
        if (/\b[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\b/.test(outsideQuotes)) {
          bad.push(`${lang}:${k}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  // Spanish and French share the Latin script with English, so the prose-
  // pattern check above would flag real translations as false positives
  // (a Spanish sentence is still four-or-more ASCII words). What a genuine
  // translation essentially never does, though, is come out BYTE-IDENTICAL
  // to the English source once it is more than a short phrase — so identity,
  // not script, is the signal here. This is the same copy-paste failure the
  // ru/he check above catches, just detected the way that is safe for a
  // Latin-script locale.
  it('Spanish and French do not ship an untranslated copy of the English string', () => {
    const en = flatten(locales.en)
    const bad: string[] = []
    for (const lang of ['es', 'fr'] as const) {
      const flat = flatten(locales[lang])
      for (const k of Object.keys(en)) {
        if (k === 'common.appName') continue
        if (en[k].length > 20 && flat[k] === en[k]) bad.push(`${lang}:${k}`)
      }
    }
    expect(bad).toEqual([])
  })
})


/* ==========================================================================
   The supported set is exactly five, and everything agrees on which five.
   --------------------------------------------------------------------------
   A sixth language half-added — a dictionary with no display name, a demo
   profile pointing at a locale that does not ship, a stored tag from an older
   build — is how a locale ends up rendering as raw dot-path keys. Quality of
   these five beats breadth.
   ========================================================================== */
describe('supported locales', () => {
  it('is exactly English, Hebrew, Russian, Spanish and French', () => {
    expect([...UI_LANGUAGES].sort()).toEqual(['en', 'es', 'fr', 'he', 'ru'])
  })

  it('has a dictionary, a native display name and a direction for each — and no extras', () => {
    expect(Object.keys(locales).sort()).toEqual([...UI_LANGUAGES].sort())
    expect(Object.keys(languageNames).sort()).toEqual([...UI_LANGUAGES].sort())
    for (const lang of UI_LANGUAGES) expect(languageNames[lang], lang).toBeTruthy()
    for (const lang of RTL_LANGUAGES) expect(UI_LANGUAGES).toContain(lang)
  })

  it('every demo profile uses a locale that actually ships', () => {
    for (const profile of DEMO_PROFILES) {
      expect(UI_LANGUAGES, profile.id).toContain(profile.input.interfaceLanguage)
    }
  })

  it('coerces a stored or legacy tag to a locale that ships', () => {
    expect(normalizeUILanguage('he')).toBe('he')
    expect(normalizeUILanguage('en-GB')).toBe('en')
    expect(normalizeUILanguage('RU')).toBe('ru')
    // Legacy ISO code for Hebrew, still emitted by some platforms.
    expect(normalizeUILanguage('iw')).toBe('he')
    // Not a supported locale — including one deliberately NOT added.
    expect(normalizeUILanguage('pt-BR')).toBe('en')
    expect(normalizeUILanguage('de')).toBe('en')
    expect(normalizeUILanguage(undefined)).toBe('en')
    expect(normalizeUILanguage(null)).toBe('en')
    expect(normalizeUILanguage(42)).toBe('en')
    expect(normalizeUILanguage('pt', 'ru' as UILanguage)).toBe('ru')
  })
})
