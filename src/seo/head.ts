/* ==========================================================================
   Head metadata — one description of a page's <head>, two renderers.
   --------------------------------------------------------------------------
   `buildHeadMeta` produces a plain object. The build-time prerenderer turns it
   into static tags in each page's index.html under dist (so crawlers get real
   metadata on the first byte), and the browser-side applier in ./applyHead.ts
   re-applies it on client-side navigation (so SPA route changes, and the
   service worker's navigation fallback, never leave a stale title or canonical
   behind). Both read the same function, so the two cannot drift.

   Deliberately free of DOM types: this module is compiled into the Vite config
   and runs in Node during the build.
   ========================================================================== */

import { UILanguage } from '../types'
import { flatten } from '../i18n/dict'
import { locales, isRTL } from '../locales'
import { HREFLANG, PublicPageId, SITE_NAME, SITE_URL, alternatesFor, pageUrl, seoKeys } from './site'

export interface Alternate {
  hreflang: string
  href: string
}

export interface HeadMeta {
  lang: string
  dir: 'ltr' | 'rtl'
  title: string
  description: string
  canonical: string
  robots: string
  ogLocale: string
  alternates: Alternate[]
  jsonLd: string | null
}

const flatCache = new Map<UILanguage, Record<string, string>>()
function flatFor(lang: UILanguage): Record<string, string> {
  let flat = flatCache.get(lang)
  if (!flat) {
    flat = flatten(locales[lang])
    flatCache.set(lang, flat)
  }
  return flat
}

/** Translate for SEO output, falling back to English exactly like the UI does. */
export function seoText(lang: UILanguage, key: string): string {
  const active = flatFor(lang)
  const english = flatFor('en')
  return active[key] ?? english[key] ?? key
}

/** JSON-LD for the home page only: one truthful service + site description.
 *  Nothing here claims a rating, a price, a street address or an opening hour
 *  — none of which exist — because fabricated structured data is a penalty
 *  waiting to happen, not an SEO win. */
function homeJsonLd(lang: UILanguage): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: HREFLANG[lang],
        description: seoText(lang, 'seo.home.description'),
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}#service`,
        name: SITE_NAME,
        serviceType: 'Online English tutoring',
        description: seoText(lang, 'seo.home.description'),
        url: SITE_URL,
        areaServed: { '@type': 'Place', name: 'Worldwide (online)' },
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: pageUrl('book', lang),
          availableLanguage: ['English', 'Hebrew', 'Russian'],
        },
        audience: { '@type': 'Audience', audienceType: 'Children, teenagers and adults' },
        provider: {
          '@type': 'Person',
          name: 'Binyamin',
          jobTitle: 'English tutor',
          knowsLanguage: ['English', 'Hebrew', 'Russian'],
        },
      },
    ],
  }
  return JSON.stringify(graph)
}

/** Metadata for one public page in one locale. */
export function buildHeadMeta(id: PublicPageId, lang: UILanguage): HeadMeta {
  const keys = seoKeys(id)
  return {
    lang: HREFLANG[lang],
    dir: isRTL(lang) ? 'rtl' : 'ltr',
    title: seoText(lang, keys.title),
    description: seoText(lang, keys.description),
    canonical: pageUrl(id, lang),
    robots: 'index, follow',
    ogLocale: HREFLANG[lang],
    alternates: alternatesFor(id),
    jsonLd: id === 'home' ? homeJsonLd(lang) : null,
  }
}

/** Metadata for a private (tutor) or non-canonical screen: never indexed. */
export function buildPrivateHeadMeta(lang: UILanguage, title: string): HeadMeta {
  return {
    lang: HREFLANG[lang],
    dir: isRTL(lang) ? 'rtl' : 'ltr',
    title,
    description: '',
    canonical: '',
    robots: 'noindex, nofollow',
    ogLocale: HREFLANG[lang],
    alternates: [],
    jsonLd: null,
  }
}
