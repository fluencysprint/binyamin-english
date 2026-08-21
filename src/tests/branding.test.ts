/* ==========================================================================
   Two standing audits of the UI surface.

   1. Name discipline. "Binyamin English" is the brand and belongs in the
      logo, page metadata, the About page and a booking identity. It does not
      belong in ordinary product copy — a nav item, a button, a section
      heading. Copy drifts back toward the founder's name one string at a
      time, so the allowlist below is the record of where it is deliberate.

   2. Glyph safety. Export/Import backup shipped U+2B73 and U+2B71 as button
      icons; neither exists in the default Android system fonts, so both
      rendered as empty boxes on a real phone. Emoji are no better — they are
      a different picture on every platform. UI symbols are inline SVG now
      (src/components/icons.tsx) and this test keeps them that way.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { UI_LANGUAGES } from '../types'
import { locales } from '../locales'
import { flatten } from '../i18n/dict'

/** Latin, Hebrew and Russian spellings, including inflected Russian forms. */
const PERSONAL_NAME = /Binyamin|בנימין|Биньямин/i

/**
 * Keys where the name is intentional:
 *   common.appName        — the brand mark itself
 *   seo.*.title           — brand suffix in the browser tab / search result
 *   about.intro           — a person introducing themselves, in first person
 *   booking.inquiryHeading — the subject line of an inquiry sent to a person
 */
const NAME_ALLOWED = new Set([
  'common.appName',
  'about.intro',
  'booking.inquiryHeading',
  'seo.home.title',
  'seo.about.title',
  'seo.assessment.title',
  'seo.book.title',
  'seo.sampleReport.title',
])

describe('brand vs. personal name', () => {
  for (const lang of UI_LANGUAGES) {
    it(`${lang}: uses the personal name only where it is deliberate`, () => {
      const flat = flatten(locales[lang])
      const unexpected = Object.keys(flat).filter(
        (key) => PERSONAL_NAME.test(flat[key]) && !NAME_ALLOWED.has(key),
      )
      expect(unexpected).toEqual([])
    })
  }

  it('keeps the brand out of everyday navigation and action labels', () => {
    const flat = flatten(locales.en)
    for (const key of ['nav.home', 'nav.about', 'nav.assessment', 'nav.book', 'landing.whyTitle', 'gate.body']) {
      expect(flat[key], key).not.toMatch(PERSONAL_NAME)
    }
  })

  it('still shows the brand where it identifies the product', () => {
    for (const lang of UI_LANGUAGES) {
      expect(flatten(locales[lang])['common.appName']).toBe('Binyamin English')
    }
  })

  it('offers no WhatsApp contact route and no phone number anywhere in the UI copy', () => {
    for (const lang of UI_LANGUAGES) {
      const flat = flatten(locales[lang])
      for (const [key, value] of Object.entries(flat)) {
        expect(value, `${lang}:${key}`).not.toMatch(/whatsapp|וואטסאפ/i)
      }
    }
  })

  /* The repository stays public; the PRODUCT does not advertise itself as
     open source or point users at its own source. Dependency licences and
     third-party notices are a separate, legal matter and are untouched. */
  it('never markets itself as open source, in any locale', () => {
    const OPEN_SOURCE = /open[- ]?source|c[oó]digo abierto|code source|открыт\w* (код|исходн\w*)|קוד פתוח/i
    for (const lang of UI_LANGUAGES) {
      for (const [key, value] of Object.entries(flatten(locales[lang]))) {
        expect(value, `${lang}:${key}`).not.toMatch(OPEN_SOURCE)
      }
    }
  })

  /* Binyamin English does not state lesson pricing anywhere public. This
     catches a shekel figure or currency word creeping back into copy, in
     any locale, without depending on a specific number. */
  it('never states a lesson price, in any locale', () => {
    const PRICING = /₪\s*\d|\d\s*₪|\d[\d,.]*\s*(ILS|NIS|shekels?|шекел\w*|shéquel\w*)|\b(ILS|NIS)\s*\d/i
    for (const lang of UI_LANGUAGES) {
      for (const [key, value] of Object.entries(flatten(locales[lang]))) {
        expect(value, `${lang}:${key}`).not.toMatch(PRICING)
      }
    }
  })
})

/* Source files, read raw, so the check is on what ships rather than on what a
   given test happens to render. */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

/** Ranges that are unreliable or platform-dependent in a UI label. */
/* Written as an alternation, not one character class: a class mixing emoji
   with the variation selector trips eslint's misleading-character-class rule,
   and the rule has a point — those are different kinds of thing. */
const RISKY_GLYPHS = new RegExp(
  [
    '[\\u{1F000}-\\u{1FAFF}]', // emoji and pictographs
    '[\\u{2600}-\\u{27BF}]', // misc symbols and dingbats (✓ ✕ ✎ ✨ …)
    '[\\u{2B00}-\\u{2BFF}]', // the ⭳ / ⭱ arrows that shipped as tofu on Android
    '[\\u{23E9}-\\u{23FA}]', // media controls (⏱ ⏸ ▶ …)
    '[\\u{2190}\\u{2191}\\u{2193}]', // ← ↑ ↓ used as icons
    '\\u{FE0F}', // emoji variation selector
  ].join('|'),
  'u',
)

/* Curriculum data is exempt: the beginner picture check deliberately uses
   emoji AS the pictures a child taps, and the pronunciation library uses ↑/↓
   as intonation notation. Neither is chrome. icons.tsx is exempt because its
   header comment names the broken glyph it replaced. */
const EXEMPT = /\/(data|lessons)\/|components\/icons\.tsx$/

describe('no source-repository promotion in the app', () => {
  it('links to no code-hosting URL from any shipped module', () => {
    const CODE_HOST = /https?:\/\/(www\.)?(github|gitlab|bitbucket|sourceforge)\.com/i
    for (const [path, source] of Object.entries(SOURCES)) {
      // The SEO module legitimately names the Pages HOST the site is served
      // from; that is a deployment address, not a link to the source.
      if (path.includes('/seo/') || path.endsWith('.test.ts') || path.endsWith('.test.tsx')) continue
      const hits = source
        .split('\n')
        .map((line, i) => [i + 1, line] as const)
        .filter(([, line]) => CODE_HOST.test(line))
      expect(hits, path).toEqual([])
    }
  })
})

describe('no unreliable glyphs in the UI', () => {
  it('uses inline SVG rather than emoji or exotic Unicode symbols', () => {
    const offenders: string[] = []
    for (const [path, source] of Object.entries(SOURCES)) {
      if (path.includes('/tests/') || /\.(test|spec)\.tsx?$/.test(path) || EXEMPT.test(path)) continue
      source.split('\n').forEach((line, index) => {
        const match = line.match(RISKY_GLYPHS)
        if (match) offenders.push(`${path}:${index + 1} ${JSON.stringify(match[0])}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('exports the icons the replaced glyphs needed', async () => {
    const icons = await import('../components/icons')
    for (const name of [
      'DownloadIcon',
      'UploadIcon',
      'LockIcon',
      'TimerIcon',
      'PauseIcon',
      'PlayIcon',
      'PencilIcon',
      'RecordIcon',
      'NoteIcon',
      'MenuIcon',
      'MailIcon',
    ]) {
      expect(icons, name).toHaveProperty(name)
    }
  })
})
