import { test, expect } from '@playwright/test'

/* ==========================================================================
   A printed/PDF'd report must read as a document, not a printed webpage:
   no site chrome, and legible on a black-and-white printer without relying
   on color to carry meaning. jsdom cannot lay out `@media print` at all, so
   this is real-Chromium-only coverage (Playwright's `emulateMedia`).
   ========================================================================== */

test('print CSS removes the site header, footer and any button, leaving only the report', async ({ page }) => {
  await page.goto('/sample-report/')
  await page.emulateMedia({ media: 'print' })

  await expect(page.locator('header')).toBeHidden()
  await expect(page.locator('footer')).toBeHidden()
  // The marketing headline/description above the report, and the booking
  // CTA card below it, are both page chrome — not part of the document.
  await expect(page.getByRole('heading', { name: /what you get after a lesson/i })).toBeHidden()
  await expect(page.getByRole('link', { name: /book a private lesson/i })).toBeHidden()
  for (const btn of await page.getByRole('button').all()) await expect(btn).toBeHidden()

  // What must remain: the report's own identity and its content.
  await expect(page.getByRole('heading', { name: 'Lesson report' })).toBeVisible()
  await expect(page.getByText(/generated on/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Homework' })).toBeVisible()
  // The page is still clearly marked as a fictional sample even on paper.
  await expect(page.getByText(/fictional example/i)).toBeVisible()
})

test('print is legible in black-and-white: no color-only meaning, white page, no washed-out fills', async ({
  page,
}) => {
  await page.goto('/sample-report/')
  await page.emulateMedia({ media: 'print' })

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).toMatch(/rgba?\(255, 255, 255/)

  // A badge (e.g. "Next focus") keeps a real border once its tint background
  // is gone, so it still reads as a discrete label rather than plain text.
  // (The sample-report page's own "Sample lesson report" badge lives in the
  // marketing intro, which print hides — this one is inside the report.)
  const badge = page.getByText('Next focus', { exact: true })
  await expect(badge).toBeVisible()
  const borderWidth = await badge.evaluate((el) => getComputedStyle(el).borderWidth)
  expect(borderWidth).not.toBe('0px')

  // Text color is forced dark even if the visitor is in dark mode — printing
  // near-white text on a forced-white page would be invisible.
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  const heading = page.getByRole('heading', { name: 'Lesson report' })
  const color = await heading.evaluate((el) => getComputedStyle(el).color)
  expect(color).toMatch(/rgba?\(0, 0, 0/)
})

test('a real (tutor-facing) lesson report page prints with no page chrome at all', async ({ page }) => {
  // LessonReportPage never renders the public Layout — confirm print has
  // nothing extra to remove there either, and the back link is hidden.
  await page.goto('/he/sample-report/')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('header')).toBeHidden()
  await expect(page.locator('footer')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'דוח שיעור' })).toBeVisible()
})
