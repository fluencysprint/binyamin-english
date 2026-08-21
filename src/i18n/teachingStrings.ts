/* ==========================================================================
   The teaching prose, loaded only where teaching happens.
   --------------------------------------------------------------------------
   Five complete languages of tutor guidance is a lot of text — and every byte
   of it is useless to somebody reading the public pages, who will never open a
   lesson. So it is not part of the app's initial payload: the four non-English
   sets are fetched the first time the tutor area opens (see TutorGate), and the
   English set stays bundled because it is the fallback everything else resolves
   against.

   `translate` and `ct` read whatever is loaded and fall back to English rather
   than a raw key — which is the right behaviour for a genuinely missing
   translation, but wrong for a chunk that simply has not landed yet: read
   during that window, they hand back English content indistinguishable from
   a real translation. `teachingStringsStatus` below exists so a screen can
   tell the two apart and gate on it instead — see LessonRunnerPage.
   ========================================================================== */

import { useEffect, useSyncExternalStore } from 'react'
import { UILanguage } from '../types'
import { Dict, flatten } from './dict'
import guideEn from '../locales/guide/en'

type Table = Record<string, string>

/** Guidance keys keep their `guide.` prefix, the namespace they had when the
 *  dictionaries were one object. */
const flatGuide = (dict: Dict): Table => flatten(dict, 'guide')

const guides = new Map<UILanguage, Table>([['en', flatGuide(guideEn)]])
const contents = new Map<UILanguage, Table>()
const pending = new Map<UILanguage, Promise<void>>()
/** Languages whose chunk fetch has failed and not yet been retried. */
const errored = new Set<UILanguage>()

const loaders: Record<Exclude<UILanguage, 'en'>, () => Promise<{ guide: Dict; content: Dict }>> = {
  he: async () => ({
    guide: (await import('../locales/guide/he')).default,
    content: (await import('../locales/content/he')).default,
  }),
  ru: async () => ({
    guide: (await import('../locales/guide/ru')).default,
    content: (await import('../locales/content/ru')).default,
  }),
  es: async () => ({
    guide: (await import('../locales/guide/es')).default,
    content: (await import('../locales/content/es')).default,
  }),
  fr: async () => ({
    guide: (await import('../locales/guide/fr')).default,
    content: (await import('../locales/content/fr')).default,
  }),
}

/* Everything that reads these tables is a pure function called during render,
   so arrival has to invalidate memoized work. One counter, one subscription:
   `useTeachingStrings` returns it, and anything that caches derived guidance
   (the lesson runner's micro-steps) depends on it. */
let version = 0
const listeners = new Set<() => void>()
function bump() {
  version += 1
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Make sure this language's teaching prose is loaded, and re-render when it
 * lands. Returns a value that changes on arrival, for memo dependencies.
 */
export function useTeachingStrings(lang: UILanguage): number {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  )
  useEffect(() => {
    void loadTeachingStrings(lang)
  }, [lang])
  return v
}

/** Guidance strings written in code, for `guide.*` keys. */
export function guideTable(lang: UILanguage): Table | undefined {
  return guides.get(lang)
}

/** Translations of the content banks' own prose, by content key. */
export function contentTable(lang: UILanguage): Table | undefined {
  return contents.get(lang)
}

export type TeachingStringsStatus = 'ready' | 'loading' | 'error'

/**
 * Where this language's teaching prose currently stands. English is always
 * ready (it ships in the main bundle); every other language is 'loading'
 * until its chunk lands, or 'error' if the fetch failed and has not been
 * retried since. A screen that reads `guide.*`/`ct` content should gate on
 * this rather than render whatever `translate`/`ct` fall back to, or it shows
 * English for the frame(s) before arrival — the exact flash this exists to
 * prevent.
 */
export function teachingStringsStatus(lang: UILanguage): TeachingStringsStatus {
  if (lang === 'en' || guides.has(lang)) return 'ready'
  return errored.has(lang) ? 'error' : 'loading'
}

/** Fetch one language's teaching prose. Idempotent, and a no-op for English. */
export function loadTeachingStrings(lang: UILanguage): Promise<void> {
  if (guides.has(lang)) return Promise.resolve()
  let p = pending.get(lang)
  if (!p) {
    errored.delete(lang)
    p = loaders[lang as Exclude<UILanguage, 'en'>]()
      .then(({ guide, content }) => {
        guides.set(lang, flatGuide(guide))
        contents.set(lang, flatten(content))
      })
      /* A failed chunk fetch must not take the lesson down: English is still
         a complete, readable fallback. What it must not do is masquerade as
         the selected language — `teachingStringsStatus` reports 'error' so
         the screen can say so, rather than silently rendering English under
         a Hebrew or Russian label. */
      .catch(() => {
        errored.add(lang)
      })
      // Runs on both outcomes, so a subscriber re-renders whether the chunk
      // landed or failed — and a later retry starts from a clean slate.
      .finally(() => {
        pending.delete(lang)
        bump()
      })
    pending.set(lang, p)
  }
  return p
}
