/* ==========================================================================
   Regression coverage for the public SEO architecture.
   --------------------------------------------------------------------------
   The failure modes this guards against are all silent — nothing crashes when
   two pages share a canonical, when an hreflang cluster stops being reciprocal,
   or when a tutor screen quietly loses its noindex. They only show up weeks
   later, in a search console.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { UI_LANGUAGES, UILanguage } from '../types'
import { buildHeadMeta, buildPrivateHeadMeta } from '../seo/head'
import {
  DEFAULT_LANGUAGE,
  PUBLIC_PAGES,
  SEO_LANGUAGES,
  SITE_URL,
  alternatesFor,
  matchPublicPath,
  pagePath,
  pageUrl,
} from '../seo/site'
import { buildStaticPages, renderSitemap } from '../seo/prerender'

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!--seo-head-->
    <title>Binyamin English</title>
  </head>
  <body>
    <div id="root"></div>
    <!--seo-body-->
  </body>
</html>
`

const every = PUBLIC_PAGES.flatMap((page) => SEO_LANGUAGES.map((lang) => ({ page, lang })))

describe('public URL map', () => {
  it('gives English the un-prefixed URL and every other locale its own prefix', () => {
    expect(pagePath('home')).toBe('/')
    expect(pagePath('about')).toBe('/about/')
    expect(pagePath('assessment')).toBe('/check-english/')
    expect(pagePath('book', 'he')).toBe('/he/book/')
    expect(pagePath('home', 'ru')).toBe('/ru/')
  })

  it('round-trips every public path back to its page and locale', () => {
    for (const { page, lang } of every) {
      expect(matchPublicPath(pagePath(page.id, lang))).toEqual({ id: page.id, lang })
    }
  })

  it('does not treat tutor or unknown paths as public', () => {
    expect(matchPublicPath('/tutor')).toBeNull()
    expect(matchPublicPath('/tutor/student/abc')).toBeNull()
    expect(matchPublicPath('/nope')).toBeNull()
  })

  it('covers all five UI languages — a locale added to the app is a locale indexed', () => {
    expect([...SEO_LANGUAGES].sort()).toEqual([...UI_LANGUAGES].sort())
  })
})

describe('page metadata', () => {
  it('gives every page in every locale a unique, non-empty title and description', () => {
    const titles = new Set<string>()
    const descriptions = new Set<string>()
    for (const { page, lang } of every) {
      const meta = buildHeadMeta(page.id, lang)
      expect(meta.title.length, `${page.id}/${lang} title`).toBeGreaterThan(10)
      expect(meta.description.length, `${page.id}/${lang} description`).toBeGreaterThan(50)
      titles.add(meta.title)
      descriptions.add(meta.description)
    }
    expect(titles.size).toBe(every.length)
    expect(descriptions.size).toBe(every.length)
  })

  it('keeps titles and descriptions inside the lengths search results actually show', () => {
    for (const { page, lang } of every) {
      const meta = buildHeadMeta(page.id, lang)
      expect(meta.title.length, `${page.id}/${lang} title`).toBeLessThanOrEqual(80)
      expect(meta.description.length, `${page.id}/${lang} description`).toBeLessThanOrEqual(210)
    }
  })

  it('emits an absolute canonical per page+locale, all distinct', () => {
    const canonicals = every.map(({ page, lang }) => buildHeadMeta(page.id, lang).canonical)
    for (const canonical of canonicals) {
      expect(canonical.startsWith(SITE_URL)).toBe(true)
      expect(canonical.endsWith('/')).toBe(true)
    }
    expect(new Set(canonicals).size).toBe(every.length)
  })

  it('emits a complete, reciprocal hreflang cluster with x-default on English', () => {
    for (const page of PUBLIC_PAGES) {
      const alternates = alternatesFor(page.id)
      expect(alternates.map((a) => a.hreflang)).toEqual([...SEO_LANGUAGES, 'x-default'])

      const xDefault = alternates.find((a) => a.hreflang === 'x-default')!
      expect(xDefault.href).toBe(pageUrl(page.id, DEFAULT_LANGUAGE))

      // Every locale's page points at the same cluster — a one-way alternate
      // is ignored by search engines.
      for (const lang of SEO_LANGUAGES) {
        expect(buildHeadMeta(page.id, lang).alternates).toEqual(alternates)
      }
    }
  })

  it('marks public pages indexable and tutor screens not', () => {
    for (const { page, lang } of every) {
      expect(buildHeadMeta(page.id, lang).robots).toBe('index, follow')
    }
    const priv = buildPrivateHeadMeta('en', 'Tutor')
    expect(priv.robots).toBe('noindex, nofollow')
    expect(priv.canonical).toBe('')
    expect(priv.alternates).toEqual([])
  })

  it('ships valid JSON-LD on the home page only, and never invents facts', () => {
    for (const { page, lang } of every) {
      const meta = buildHeadMeta(page.id, lang)
      if (page.id !== 'home') {
        expect(meta.jsonLd, `${page.id}/${lang}`).toBeNull()
        continue
      }
      const parsed = JSON.parse(meta.jsonLd!)
      expect(parsed['@context']).toBe('https://schema.org')
      const types = parsed['@graph'].map((node: { '@type': string }) => node['@type'])
      expect(types).toContain('Service')
      expect(types).toContain('WebSite')
      // No review, rating, price or address exists, so none may be claimed.
      const serialized = meta.jsonLd!
      for (const forbidden of ['aggregateRating', 'review', 'priceRange', 'offers', 'address', 'telephone']) {
        expect(serialized, forbidden).not.toContain(forbidden)
      }
    }
  })
})

describe('prerendered output', () => {
  const files = buildStaticPages(SHELL, '/binyamin-english/', '2026-01-01')

  it('writes one real HTML file per page per locale, plus 404 and sitemap', () => {
    expect(Object.keys(files).length).toBe(every.length + 2)
    expect(files['index.html']).toBeDefined()
    expect(files['about/index.html']).toBeDefined()
    expect(files['check-english/index.html']).toBeDefined()
    expect(files['he/book/index.html']).toBeDefined()
    expect(files['404.html']).toBeDefined()
    expect(files['sitemap.xml']).toBeDefined()
  })

  it('leaves no unreplaced placeholder in any generated page', () => {
    for (const [name, html] of Object.entries(files)) {
      if (!name.endsWith('.html')) continue
      expect(html, name).not.toContain('<!--seo-head-->')
      expect(html, name).not.toContain('<!--seo-body-->')
    }
  })

  it('gives each page its own title, canonical, description and lang/dir', () => {
    for (const { page, lang } of every) {
      const dir = pagePath(page.id, lang).replace(/^\/|\/$/g, '')
      const html = files[dir ? `${dir}/index.html` : 'index.html']
      const meta = buildHeadMeta(page.id, lang)
      expect(html, `${page.id}/${lang}`).toContain(`<title>`)
      expect(html).toContain(`rel="canonical" href="${meta.canonical}"`)
      expect(html).toContain('name="description"')
      expect(html).toContain(`<html lang="${lang}" dir="${lang === 'he' ? 'rtl' : 'ltr'}">`)
      expect(html).toContain('rel="alternate" hreflang="x-default"')
    }
  })

  it('ships crawlable <a href> links to every page of the locale, no fragment routes', () => {
    const html = files['he/about/index.html']
    for (const page of PUBLIC_PAGES) {
      expect(html).toContain(`href="/binyamin-english${pagePath(page.id, 'he')}"`)
    }
    expect(html).not.toContain('href="#/')
  })

  it('links out to the same page in every other locale', () => {
    const html = files['index.html']
    for (const lang of SEO_LANGUAGES) {
      if (lang === DEFAULT_LANGUAGE) continue
      expect(html).toContain(`href="/binyamin-english${pagePath('home', lang)}" hreflang="${lang}"`)
    }
  })

  it('makes the SPA fallback noindex and content-free', () => {
    expect(files['404.html']).toContain('content="noindex, nofollow"')
    expect(files['404.html']).not.toContain('seo-fallback')
  })

  it('lists every public URL in the sitemap with its hreflang cluster', () => {
    const xml = renderSitemap('2026-01-01')
    for (const { page, lang } of every) {
      expect(xml, `${page.id}/${lang}`).toContain(`<loc>${pageUrl(page.id, lang)}</loc>`)
    }
    expect(xml.match(/<url>/g)?.length).toBe(every.length)
    expect(xml).toContain('hreflang="x-default"')
    // Nothing private ever reaches the sitemap.
    expect(xml).not.toContain('/tutor')
  })
})

describe('search positioning', () => {
  // The brand belongs in the title; the ranking work is done by service
  // intent. A description that leans on the personal name instead of what is
  // being offered is the exact failure this project asked to avoid.
  const INTENT_TERMS: Record<UILanguage, RegExp> = {
    en: /english/i,
    he: /אנגלית/,
    ru: /английск/i,
    es: /inglés/i,
    fr: /anglais/i,
  }

  it('describes the service, in the page language, on every public page', () => {
    for (const { page, lang } of every) {
      const meta = buildHeadMeta(page.id, lang)
      expect(meta.description, `${page.id}/${lang}`).toMatch(INTENT_TERMS[lang])
      expect(meta.title, `${page.id}/${lang}`).toMatch(INTENT_TERMS[lang])
    }
  })

  it('never emits a meta keywords tag', () => {
    const files = buildStaticPages(SHELL, '/binyamin-english/', '2026-01-01')
    for (const [name, html] of Object.entries(files)) {
      expect(html.toLowerCase(), name).not.toContain('name="keywords"')
    }
  })
})
