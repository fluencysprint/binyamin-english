import { test, expect } from '@playwright/test'

// Layout regression coverage for the About page redesign. The page is built
// almost entirely from type at large sizes, on a two-column hairline grid that
// collapses at 820px — exactly the shape that overflows sideways when a long
// localized string (ru/fr run ~2x English) meets a 320px phone. jsdom cannot
// see any of that, so it is checked here in a real layout engine.

const WIDTHS = [320, 360, 390, 414, 768, 834, 1024, 1440]
const LANGS = ['en', 'he', 'ru', 'es', 'fr'] as const

test('the language specimen renders all three scripts', async ({ page }) => {
  await page.goto('/about/')
  const items = page.locator('article ul li bdi')
  await expect(items).toHaveText(['English', 'עברית', 'Русский'])
})

test('the Hebrew endonym stays right-to-left and the Latin one left-to-right', async ({ page }) => {
  await page.goto('/about/')
  // <bdi> with no forced dir auto-detects per run, which is what keeps a mixed
  // script list from inheriting one direction for all of it.
  const dirs = await page
    .locator('article ul li bdi')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).direction))
  expect(dirs).toEqual(['ltr', 'rtl', 'ltr'])
})

for (const lang of LANGS) {
  test(`no horizontal overflow in ${lang} at any supported width`, async ({ page }) => {
    await page.goto('/about/')
    await page.locator('header select').selectOption(lang)

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      /* Poll rather than sampling once: a viewport change is not synchronous,
         and measuring mid-reflow reports a width that never actually rendered.
         1px of slack for sub-pixel rounding of the hairline column rules. */
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
          { message: `${lang} @ ${width}px`, timeout: 5000 },
        )
        .toBeLessThanOrEqual(1)
    }
  })
}

test('the two-column masthead collapses to one column on a phone', async ({ page }) => {
  await page.goto('/about/')

  await page.setViewportSize({ width: 1440, height: 900 })
  const title = page.getByRole('heading', { level: 1 })
  const lede = page.getByText('Hi, I’m Binyamin.')
  const wide = { t: (await title.boundingBox())!, l: (await lede.boundingBox())! }
  // Side by side, sharing a top edge (cap heights align within a few px).
  expect(wide.l.x).toBeGreaterThan(wide.t.x + wide.t.width)
  expect(Math.abs(wide.l.y - wide.t.y)).toBeLessThan(16)

  await page.setViewportSize({ width: 390, height: 844 })
  const narrow = { t: (await title.boundingBox())!, l: (await lede.boundingBox())! }
  // Stacked: the standfirst now sits below the headline, not beside it.
  expect(narrow.l.y).toBeGreaterThan(narrow.t.y + narrow.t.height)
})
