import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The end of the journey the whole app exists for: the tutor finishes, and
   the learner walks away with a summary AND homework.

   The report page is the only place homework is ever shown, so if it is not
   here it does not exist for the learner at all.
   ========================================================================== */

async function startLesson(page: Page, demo = /Casey/) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: demo }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson|start lesson|resume/i }).first().click()
  const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
  if (await orientation.isVisible().catch(() => false)) await orientation.click()
  await expect(page.getByRole('region', { name: /do this now/i })).toBeVisible()
}

test('a finished lesson produces a report with a small, real homework block', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startLesson(page)

  // Capture the two things a tutor captures most: a word and a correction.
  await page.getByRole('button', { name: /tools/i }).click()
  await page.getByRole('button', { name: /add word/i }).click()
  await page.getByRole('dialog').getByRole('textbox', { name: /word or phrase/i }).fill('reluctant')
  await page.getByRole('dialog').getByRole('textbox', { name: /meaning/i }).fill('not wanting to do something')
  await page.getByRole('button', { name: /^add$/i }).click()

  await page.getByRole('button', { name: /tools/i }).click()
  await page.getByRole('button', { name: /correction/i }).click()
  await page.getByRole('dialog').getByRole('textbox', { name: /student said/i }).fill('I go yesterday')
  await page.getByRole('dialog').getByRole('textbox', { name: /better form/i }).fill('I went yesterday')
  await page.getByRole('dialog').getByRole('button', { name: /^save$/i }).click()

  // Finish from wherever we are — the bar's back control opens the same modal.
  await page.getByRole('button', { name: /Casey/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^finish$/i }).click()
  await page.waitForURL(/\/tutor\/student\//)

  await page.getByRole('link', { name: /report/i }).first().click()
  await expect(page.getByRole('heading', { name: /^homework$/i })).toBeVisible()

  const tasks = page.locator('ol li')
  await expect(tasks.first()).toBeVisible()
  const count = await tasks.count()
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(3)

  // Homework is about what actually happened, not a generic template.
  await expect(tasks.filter({ hasText: 'I went yesterday' })).toHaveCount(1)

  // And it survives printing as one block rather than being split or dropped.
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: /^homework$/i })).toBeVisible()
})
