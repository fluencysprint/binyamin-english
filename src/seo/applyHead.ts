/* ==========================================================================
   Browser-side applier for the metadata described by ./head.ts.
   --------------------------------------------------------------------------
   Client-side navigation does not reload the document, so without this a
   visitor who lands on /check-english/ and clicks through to /book/ would keep
   the level-check page's title, description and canonical. Separate from
   head.ts because that module is also compiled into the Node-side build.
   ========================================================================== */

import { HeadMeta } from './head'
import { OG_IMAGE, SITE_NAME } from './site'


/** Marks every tag this module owns, so a route change can replace the set
 *  wholesale without disturbing tags shipped in the static HTML shell. */
const OWNED = 'data-seo'

function upsertMeta(doc: Document, attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = doc.head.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    el?.remove()
    return
  }
  if (!el) {
    el = doc.createElement('meta')
    el.setAttribute(attr, key)
    doc.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyHead(meta: HeadMeta, doc: Document = document): void {
  doc.title = meta.title

  upsertMeta(doc, 'name', 'description', meta.description)
  upsertMeta(doc, 'name', 'robots', meta.robots)
  upsertMeta(doc, 'property', 'og:type', 'website')
  upsertMeta(doc, 'property', 'og:site_name', SITE_NAME)
  upsertMeta(doc, 'property', 'og:title', meta.title)
  upsertMeta(doc, 'property', 'og:description', meta.description)
  upsertMeta(doc, 'property', 'og:url', meta.canonical)
  upsertMeta(doc, 'property', 'og:locale', meta.ogLocale)
  upsertMeta(doc, 'property', 'og:image', OG_IMAGE)
  upsertMeta(doc, 'name', 'twitter:card', 'summary_large_image')
  upsertMeta(doc, 'name', 'twitter:title', meta.title)
  upsertMeta(doc, 'name', 'twitter:description', meta.description)
  upsertMeta(doc, 'name', 'twitter:image', OG_IMAGE)

  // Canonical.
  let canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!meta.canonical) {
    canonical?.remove()
  } else {
    if (!canonical) {
      canonical = doc.createElement('link')
      canonical.rel = 'canonical'
      doc.head.appendChild(canonical)
    }
    canonical.href = meta.canonical
  }

  // hreflang alternates — replaced as a set.
  doc.head.querySelectorAll(`link[${OWNED}="alternate"]`).forEach((el) => el.remove())
  for (const alt of meta.alternates) {
    const link = doc.createElement('link')
    link.rel = 'alternate'
    link.hreflang = alt.hreflang
    link.href = alt.href
    link.setAttribute(OWNED, 'alternate')
    doc.head.appendChild(link)
  }

  // JSON-LD.
  doc.head.querySelectorAll(`script[${OWNED}="jsonld"]`).forEach((el) => el.remove())
  if (meta.jsonLd) {
    const script = doc.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(OWNED, 'jsonld')
    script.textContent = meta.jsonLd
    doc.head.appendChild(script)
  }
}
