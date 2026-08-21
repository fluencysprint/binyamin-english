/* ==========================================================================
   Site-wide SEO facts and the public URL map.
   --------------------------------------------------------------------------
   This module is the single source of truth for public routing + metadata. It
   is imported by THREE very different consumers, so it must stay pure TS with
   no React, no CSS and no browser globals:

     1. the router (src/app/App.tsx) — to declare the crawlable routes
     2. the runtime <Seo> component  — to update the head on SPA navigation
     3. vite.config.ts at build time — to prerender one real HTML file per
        (page × locale) plus sitemap.xml, so GitHub Pages serves a 200 with
        full metadata instead of an empty SPA shell

   Anything indexable lives here. Tutor screens deliberately do not.
   ========================================================================== */

import { UILanguage, UI_LANGUAGES } from '../types'

/** Canonical production origin + base path. Canonicals always point here,
 *  even when the app is running on localhost, so dev never emits a canonical
 *  that would compete with the live site if it ever got crawled. */
export const SITE_ORIGIN = 'https://fluencysprint.github.io'
export const SITE_BASE = '/binyamin-english/'
export const SITE_URL = SITE_ORIGIN + SITE_BASE

/** Brand — used for og:site_name and the JSON-LD entity name. */
export const SITE_NAME = 'Binyamin English'

export const OG_IMAGE = `${SITE_URL}icon-512.png`

export const DEFAULT_LANGUAGE: UILanguage = 'en'

/** Locales that get their own crawlable URLs + hreflang relationships. */
export const SEO_LANGUAGES: readonly UILanguage[] = UI_LANGUAGES

/** BCP-47 tags for hreflang. Our UI codes are already valid tags, but keep the
 *  mapping explicit so a future regional variant has one place to change. */
export const HREFLANG: Record<UILanguage, string> = {
  en: 'en',
  he: 'he',
  ru: 'ru',
  es: 'es',
  fr: 'fr',
}

export type PublicPageId = 'home' | 'about' | 'assessment' | 'book' | 'sampleReport'

export interface PublicPage {
  id: PublicPageId
  /** URL segment under the locale root. '' is the locale home page. */
  segment: string
  /** sitemap.xml priority. */
  priority: string
}

/* The four pages worth indexing. "check-english" instead of "assessment":
   it is the phrase a person actually searches, and it survives translation
   as a stable, readable slug in every locale. */
export const PUBLIC_PAGES: readonly PublicPage[] = [
  { id: 'home', segment: '', priority: '1.0' },
  { id: 'assessment', segment: 'check-english', priority: '0.9' },
  { id: 'book', segment: 'book', priority: '0.9' },
  { id: 'about', segment: 'about', priority: '0.7' },
  { id: 'sampleReport', segment: 'sample-report', priority: '0.6' },
]

export function pageById(id: PublicPageId): PublicPage {
  const page = PUBLIC_PAGES.find((p) => p.id === id)
  if (!page) throw new Error(`Unknown public page: ${id}`)
  return page
}

/**
 * In-app path for a page in a locale, e.g. '/', '/about/', '/he/', '/he/about/'.
 * Router-relative (no base): react-router adds the basename itself.
 * English has no prefix — it is the x-default and the shortest URL.
 */
export function pagePath(id: PublicPageId, lang: UILanguage = DEFAULT_LANGUAGE): string {
  const { segment } = pageById(id)
  const prefix = lang === DEFAULT_LANGUAGE ? '' : `${lang}/`
  return `/${prefix}${segment ? `${segment}/` : ''}`
}

/** Absolute production URL for a page in a locale. */
export function pageUrl(id: PublicPageId, lang: UILanguage = DEFAULT_LANGUAGE): string {
  return SITE_ORIGIN + SITE_BASE.replace(/\/$/, '') + pagePath(id, lang)
}

/** Directory the prerenderer writes index.html into, relative to dist/. */
export function pageOutDir(id: PublicPageId, lang: UILanguage): string {
  return pagePath(id, lang).replace(/^\/|\/$/g, '')
}

/** The full hreflang alternate set for a page, including x-default. */
export function alternatesFor(id: PublicPageId): { hreflang: string; href: string }[] {
  return [
    ...SEO_LANGUAGES.map((lang) => ({ hreflang: HREFLANG[lang], href: pageUrl(id, lang) })),
    { hreflang: 'x-default', href: pageUrl(id, DEFAULT_LANGUAGE) },
  ]
}

/** Locale + page for a router path, or null when the path is not public. */
export function matchPublicPath(path: string): { id: PublicPageId; lang: UILanguage } | null {
  const clean = `/${path.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
  for (const lang of SEO_LANGUAGES) {
    for (const page of PUBLIC_PAGES) {
      if (pagePath(page.id, lang) === clean) return { id: page.id, lang }
    }
  }
  return null
}

/** Translation keys for the SEO title/description of each page. */
export function seoKeys(id: PublicPageId): { title: string; description: string } {
  return { title: `seo.${id}.title`, description: `seo.${id}.description` }
}
