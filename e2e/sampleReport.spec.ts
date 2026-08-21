import { test, expect, Page } from '@playwright/test'

/* ==========================================================================
   The public sample lesson report — the funnel's proof of the deliverable.
   --------------------------------------------------------------------------
   jsdom coverage (src/tests/sampleReport.test.tsx) checks the fixture shape
   and the labeling text; this file checks what only a real browser can show:
   the CTA actually reaches the page, the URL is real and locale-prefixed,
   RTL renders correctly, nothing overflows, and back navigation is clean.
   ========================================================================== */

const LANGS = ['en', 'he', 'ru', 'es', 'fr'] as const
const WIDTHS = [320, 360, 390, 414, 768, 1024, 1440]

async function expectNoOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      { message: label, timeout: 5000 },
    )
    .toBeLessThanOrEqual(1)
}

test('the landing CTA opens the sample report at its own crawlable URL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('link', { name: /see a sample report/i }).click()
  await expect(page).toHaveURL(/\/sample-report\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('loads directly at the sample report URL, in every locale', async ({ page }) => {
  for (const path of ['/sample-report/', '/he/sample-report/', '/ru/sample-report/']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('clearly labels the report as a fictional sample, never a real result', async ({ page }) => {
  await page.goto('/sample-report/')
  const main = page.locator('main')
  await expect(main.getByText('Sample lesson report').first()).toBeVisible()
  await expect(main.getByText(/fictional example/i)).toBeVisible()
  await expect(main.getByText(/not a testimonial/i)).toBeVisible()
})

test('shows the report content real students receive, with no parent/diagnostic section', async ({ page }) => {
  await page.goto('/sample-report/')
  const main = page.locator('main')
  await expect(main.getByText(/Talking about last weekend/).first()).toBeVisible()
  await expect(main.getByText("I went to my cousin's house", { exact: true }).first()).toBeVisible()
  await expect(main.getByRole('heading', { name: 'Homework' })).toBeVisible()
  // Parent-facing section (CEFR band, priorities) is never rendered here —
  // it matches what a learner's own device actually shows in the app.
  await expect(main.getByText('For parents')).toHaveCount(0)
  await expect(main.getByText('Approximate level')).toHaveCount(0)
})

test('offers a clear path back to booking and the level check', async ({ page }) => {
  await page.goto('/sample-report/')
  await expect(page.getByRole('link', { name: /book a private lesson/i })).toHaveAttribute('href', '/book/')
  await expect(page.getByRole('link', { name: /check your english level/i })).toHaveAttribute(
    'href',
    '/check-english/',
  )
})

test('browser back from the sample report returns cleanly to the landing page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('link', { name: /see a sample report/i }).click()
  await expect(page).toHaveURL(/\/sample-report\/$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Book a lesson', exact: true })).toBeVisible()
})

test('renders right-to-left in Hebrew and keeps the English correction left-to-right', async ({ page }) => {
  await page.goto('/he/sample-report/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('main').getByText('דוגמה לסיכום שיעור').first()).toBeVisible()

  const correction = page.getByText("I went to my cousin's house", { exact: true })
  await expect(correction).toBeVisible()
  expect(await correction.evaluate((el) => el.getAttribute('dir'))).toBe('ltr')
})

test('has no horizontal overflow in any locale at any width', async ({ page }) => {
  for (const lang of LANGS) {
    await page.goto('/sample-report/')
    await page.locator('header select').selectOption(lang)
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 })
      await expectNoOverflow(page, `sample report ${lang} @ ${width}px`)
    }
  }
})
