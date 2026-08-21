import { test, expect } from '@playwright/test'

/* ==========================================================================
   The runtime half of the SEO architecture.
   --------------------------------------------------------------------------
   The build-time half (prerendered HTML, sitemap, hreflang clusters) is
   asserted in src/tests/seo.test.ts against the generated files. What only a
   real browser can show is the part that happens after boot: that a public URL
   loads directly, that client-side navigation rewrites the head instead of
   leaving the previous page's canonical in place, that the links are real
   hrefs a crawler can follow, and that tutor screens turn indexing off again.
   ========================================================================== */

const head = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? null,
    alternates: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((el) => ({
      hreflang: el.getAttribute('hreflang'),
      href: el.getAttribute('href'),
    })),
    jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent ?? null,
  }))

test('every public URL loads directly, not only through the SPA', async ({ page }) => {
  for (const path of ['/', '/about/', '/check-english/', '/book/', '/he/', '/ru/about/', '/es/book/']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('the home page carries its own title, canonical, hreflang cluster and JSON-LD', async ({ page }) => {
  await page.goto('/')
  const meta = await head(page)

  expect(meta.title).toContain('Binyamin English')
  expect(meta.title.toLowerCase()).toContain('english tutor')
  expect(meta.description).toBeTruthy()
  expect(meta.canonical).toBe('https://fluencysprint.github.io/binyamin-english/')
  expect(meta.robots).toBe('index, follow')
  expect(meta.ogTitle).toBe(meta.title)

  expect(meta.alternates.map((a) => a.hreflang)).toEqual(['en', 'he', 'ru', 'es', 'fr', 'x-default'])
  expect(meta.alternates.find((a) => a.hreflang === 'x-default')?.href).toBe(
    'https://fluencysprint.github.io/binyamin-english/',
  )

  const parsed = JSON.parse(meta.jsonLd!)
  expect(parsed['@graph'].map((n: { '@type': string }) => n['@type'])).toContain('Service')
})

test('client-side navigation rewrites the head rather than leaving the last page behind', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const home = await head(page)

  await page.getByRole('link', { name: 'Book a lesson', exact: true }).click()
  await expect(page).toHaveURL(/\/book\/$/)
  // The head is rewritten in an effect, so it lands a tick after the route.
  await expect
    .poll(() => page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href')))
    .toBe('https://fluencysprint.github.io/binyamin-english/book/')
  const book = await head(page)

  expect(book.title).not.toBe(home.title)
  expect(book.description).not.toBe(home.description)
  expect(book.canonical).toBe('https://fluencysprint.github.io/binyamin-english/book/')
  // JSON-LD belongs to the home page only and must not linger.
  expect(book.jsonLd).toBeNull()
})

test('each locale gets its own URL, canonical and document language', async ({ page }) => {
  await page.goto('/he/about/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const meta = await head(page)
  expect(meta.canonical).toBe('https://fluencysprint.github.io/binyamin-english/he/about/')
  expect(meta.title).toMatch(/[֐-׿]/)
})

test('switching language navigates to that locale URL instead of only re-rendering', async ({ page }) => {
  await page.goto('/about/')
  await page.locator('header select').selectOption('ru')
  await expect(page).toHaveURL(/\/ru\/about\/$/)
  await expect
    .poll(() => page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href')))
    .toBe('https://fluencysprint.github.io/binyamin-english/ru/about/')
  const meta = await head(page)
  expect(meta.canonical).toBe('https://fluencysprint.github.io/binyamin-english/ru/about/')
  expect(meta.title).toMatch(/[Ѐ-ӿ]/)
})

test('public navigation is real crawlable hrefs, with no fragment routes anywhere', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((el) => el.getAttribute('href')!))

  expect(hrefs.some((href) => href.startsWith('#/'))).toBe(false)
  for (const path of ['/', '/about/', '/check-english/', '/book/']) {
    expect(hrefs, path).toContain(path)
  }
})

test('tutor screens ask not to be indexed and drop the public canonical', async ({ page }) => {
  await page.goto('/')
  expect((await head(page)).robots).toBe('index, follow')

  await page.goto('/tutor')
  const meta = await head(page)
  expect(meta.robots).toBe('noindex, nofollow')
  expect(meta.canonical).toBeNull()
  expect(meta.alternates).toEqual([])
})

test('a bookmarked hash URL from the old routing still lands on the real page', async ({ page }) => {
  await page.goto('/#/about')
  await expect(page).toHaveURL(/\/about\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible()
  expect(await page.evaluate(() => window.location.hash)).toBe('')
})
