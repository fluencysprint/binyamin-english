import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { UILanguage } from '../types'
import { flatten, interpolate } from './dict'
import { locales, isRTL } from '../locales'

type TParams = Record<string, string | number>

interface I18nValue {
  lang: UILanguage
  dir: 'ltr' | 'rtl'
  setLang: (lang: UILanguage) => void
  /** Translate a dot-path key. Falls back to English, then the key itself. */
  t: (key: string, params?: TParams) => string
  /** True when a key is missing in the active locale (English fallback used). */
  has: (key: string) => boolean
}

const I18nContext = createContext<I18nValue | null>(null)

const flatCache = new Map<UILanguage, Record<string, string>>()
function flatFor(lang: UILanguage): Record<string, string> {
  let f = flatCache.get(lang)
  if (!f) {
    f = flatten(locales[lang])
    flatCache.set(lang, f)
  }
  return f
}

export function I18nProvider({
  children,
  initialLang = 'en',
  onLangChange,
}: {
  children: ReactNode
  initialLang?: UILanguage
  onLangChange?: (lang: UILanguage) => void
}) {
  const [lang, setLangState] = useState<UILanguage>(initialLang)

  const dir = isRTL(lang) ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback(
    (next: UILanguage) => {
      setLangState(next)
      onLangChange?.(next)
    },
    [onLangChange],
  )

  const value = useMemo<I18nValue>(() => {
    const active = flatFor(lang)
    const english = flatFor('en')
    return {
      lang,
      dir,
      setLang,
      has: (key) => key in active,
      t: (key, params) => {
        const template = active[key] ?? english[key] ?? key
        return interpolate(template, params, lang)
      },
    }
  }, [lang, dir, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
