/* ==========================================================================
   Build-time prerendering for the public pages.
   --------------------------------------------------------------------------
   GitHub Pages has no server, so an SPA normally answers every public URL with
   the same empty shell: one title, one description, no canonical, no content.
   This module turns Vite's shell into one real HTML file per (page × locale) —
   dist/about/index.html, dist/he/about/index.html and so on — each with its
   own title, description, canonical, hreflang set and a crawlable copy of the
   page's headline, summary and links.

   The fallback body is not a second version of the page: every string in it is
   read from the same locale dictionary React renders from, and React deletes
   the block on mount. Imported by vite.config.ts, so: pure TS, Node-safe, no
   React, no CSS, no browser globals.
   ========================================================================== */

import { UILanguage } from '../types'
import { isRTL, languageNames } from '../locales'
import { buildHeadMeta, seoText } from './head'
import {
  HREFLANG,
  OG_IMAGE,
  PUBLIC_PAGES,
  PublicPageId,
  SEO_LANGUAGES,
  SITE_NAME,
  alternatesFor,
  pageOutDir,
  pagePath,
  pageUrl,
} from './site'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Body copy for the no-JS/first-byte version of a page, in locale order. */
function fallbackCopy(id: PublicPageId, lang: UILanguage): { heading: string; paragraphs: string[] } {
  const T = (key: string) => seoText(lang, key)
  switch (id) {
    case 'home':
      return {
        heading: T('landing.heroTitle'),
        paragraphs: [
          T('landing.heroSubtitle'),
          T('landing.heroStrengths'),
          T('landing.why1Body'),
          T('landing.why2Body'),
          T('landing.why3Body'),
        ],
      }
    case 'about':
      return { heading: T('about.title'), paragraphs: [T('about.intro'), T('about.body1'), T('about.body2')] }
    case 'assessment':
      return {
        heading: T('assessment.introTitle'),
        paragraphs: [T('assessment.introBody'), T('assessment.introPrivacy')],
      }
    case 'book':
      return {
        heading: T('booking.title'),
        paragraphs: [T('booking.subtitle'), T('booking.pricingTitle')],
      }
    case 'sampleReport':
      return {
        heading: T('sampleReport.title'),
        paragraphs: [T('sampleReport.intro'), T('sampleReport.fictionalNote')],
      }
  }
}

/** Site-relative href for a page, including the deployment base path. */
function href(id: PublicPageId, lang: UILanguage, base: string): string {
  return base.replace(/\/$/, '') + pagePath(id, lang)
}

function headTags(id: PublicPageId, lang: UILanguage): string {
  const meta = buildHeadMeta(id, lang)
  const e = escapeHtml
  const lines = [
    `<meta name="description" content="${e(meta.description)}" />`,
    `<meta name="robots" content="${e(meta.robots)}" />`,
    `<link rel="canonical" href="${e(meta.canonical)}" />`,
    ...meta.alternates.map(
      (alt) => `<link rel="alternate" hreflang="${e(alt.hreflang)}" href="${e(alt.href)}" data-seo="alternate" />`,
    ),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(meta.canonical)}" />`,
    `<meta property="og:locale" content="${e(meta.ogLocale)}" />`,
    `<meta property="og:image" content="${e(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(OG_IMAGE)}" />`,
  ]
  if (meta.jsonLd) {
    // `<` inside a script body would end the element; JSON has no other escape
    // hazard here because the payload is generated, not user input.
    lines.push(
      `<script type="application/ld+json" data-seo="jsonld">${meta.jsonLd.replace(/</g, '\\u003c')}</script>`,
    )
  }
  return lines.map((line) => `    ${line}`).join('\n')
}

function fallbackBody(id: PublicPageId, lang: UILanguage, base: string): string {
  const e = escapeHtml
  const { heading, paragraphs } = fallbackCopy(id, lang)
  const nav = PUBLIC_PAGES.map(
    (page) =>
      `        <li><a href="${e(href(page.id, lang, base))}">${e(seoText(lang, `nav.${page.id}`))}</a></li>`,
  ).join('\n')
  const locales = SEO_LANGUAGES.filter((other) => other !== lang)
    .map(
      (other) =>
        `        <li><a href="${e(href(id, other, base))}" hreflang="${HREFLANG[other]}" lang="${HREFLANG[other]}">${e(
          languageNames[other],
        )}</a></li>`,
    )
    .join('\n')

  return `    <div id="seo-fallback">
      <h1>${e(heading)}</h1>
${paragraphs.map((p) => `      <p>${e(p)}</p>`).join('\n')}
      <nav aria-label="${e(seoText(lang, 'nav.menu'))}">
        <ul>
${nav}
        </ul>
      </nav>
      <nav aria-label="${e(seoText(lang, 'nav.language'))}">
        <ul>
${locales}
        </ul>
      </nav>
    </div>`
}

/** Turn Vite's index.html shell into the static page for one page × locale. */
export function renderPage(shell: string, id: PublicPageId, lang: UILanguage, base: string): string {
  const meta = buildHeadMeta(id, lang)
  return shell
    .replace(/<html[^>]*>/, `<html lang="${meta.lang}" dir="${isRTL(lang) ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace('<!--seo-head-->', headTags(id, lang))
    .replace('<!--seo-body-->', fallbackBody(id, lang, base))
}

/** The SPA fallback GitHub Pages serves for anything not prerendered — the
 *  tutor area and genuinely wrong URLs. Never indexable. */
export function renderNotFound(shell: string): string {
  return shell
    .replace('<!--seo-head-->', '    <meta name="robots" content="noindex, nofollow" />')
    .replace('<!--seo-body-->', '')
}

/** Sitemap with the full hreflang cluster on every URL, which is what tells a
 *  search engine the five locales are one page in five languages rather than
 *  five thin near-duplicates. */
export function renderSitemap(lastmod: string): string {
  const urls = PUBLIC_PAGES.flatMap((page) => {
    const alternates = alternatesFor(page.id)
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeHtml(alt.href)}" />`,
      )
      .join('\n')
    return SEO_LANGUAGES.map(
      (lang) => `  <url>
    <loc>${escapeHtml(pageUrl(page.id, lang))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
${alternates}
  </url>`,
    )
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

/** Every file the prerenderer writes, as path → contents. */
export function buildStaticPages(shell: string, base: string, lastmod: string): Record<string, string> {
  const files: Record<string, string> = {
    '404.html': renderNotFound(shell),
    'sitemap.xml': renderSitemap(lastmod),
  }
  for (const page of PUBLIC_PAGES) {
    for (const lang of SEO_LANGUAGES) {
      const dir = pageOutDir(page.id, lang)
      files[dir ? `${dir}/index.html` : 'index.html'] = renderPage(shell, page.id, lang, base)
    }
  }
  return files
}
