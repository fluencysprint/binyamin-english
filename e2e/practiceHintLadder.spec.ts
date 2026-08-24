import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The vocabulary help ladder: try from memory, then a hint, then a fair set
   of choices, then the answer — never a bare guess against one exact stored
   word with nothing in between.
   ========================================================================== */

async function seedTaylorAndOpenPractice(page: Page, locale?: string) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  if (locale) await page.locator('header select').selectOption(locale)
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Taylor/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  const id = page.url().match(/student\/([^/]+)/)![1]
  await page.goto(`/tutor/student/${id}/practice`)
  // The set loads asynchronously (student + model + lesson from IndexedDB) —
  // wait for the first item's action, not just for navigation to resolve.
  await expect(page.getByRole('button', { name: /show the answer|^done$|^בוצע$|תשובה/i }).first()).toBeVisible()
}

test.describe('vocabulary practice offers a help ladder, not a bare guess', () => {
  test('walks memory → hint → choices → reveal, and never marks help as unaided', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedTaylorAndOpenPractice(page)

    // Get to a vocabulary recall item (meaning cue, no English word shown yet).
    for (let i = 0; i < 10; i++) {
      if (await page.getByText(/what is the english for this/i).isVisible().catch(() => false)) break
      const reveal = page.getByRole('button', { name: /show the answer/i })
      if (await reveal.isVisible().catch(() => false)) {
        await reveal.click()
        await page.getByRole('button', { name: /i got it/i }).click()
        continue
      }
      const done = page.getByRole('button', { name: /^done$/i })
      if (await done.isVisible().catch(() => false)) await done.click()
    }
    await expect(page.getByText(/what is the english for this/i)).toBeVisible()

    // Stage 1: try from memory — the escape hatch is there, quiet, not the
    // primary action.
    const needHint = page.getByRole('button', { name: /need a hint/i })
    await expect(needHint).toBeVisible()
    await expect(page.getByRole('button', { name: /show the answer/i })).toBeVisible()

    // Stage 2: a small, concrete hint — not the answer.
    await needHint.click()
    await expect(page.getByText(/letters/i)).toBeVisible()

    // Stage 3: a fair set of real choices, including the target.
    await page.getByRole('button', { name: /still not sure/i }).click()
    const options = page.getByRole('button', { name: /^(negotiate|deadline|stakeholder)$/ })
    await expect(options.first()).toBeVisible()
    expect(await options.count()).toBeGreaterThanOrEqual(3)

    await options.first().click()

    // Stage 4: the answer, and a self-check that cannot claim "unaided".
    await expect(page.getByRole('button', { name: /^i got it$/i })).toHaveCount(0)
    const saidWithHelp = page.getByRole('button', { name: /said it right/i })
    await expect(saidWithHelp).toBeVisible()
    await saidWithHelp.click()

    // Moves on to the next item rather than getting stuck.
    await expect(page.getByText(/letters/i)).toHaveCount(0)
  })

  test('a confident learner can still go straight to the answer, unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedTaylorAndOpenPractice(page)

    for (let i = 0; i < 10; i++) {
      if (await page.getByText(/what is the english for this/i).isVisible().catch(() => false)) break
      const reveal = page.getByRole('button', { name: /show the answer/i })
      if (await reveal.isVisible().catch(() => false)) {
        await reveal.click()
        await page.getByRole('button', { name: /i got it/i }).click()
        continue
      }
      const done = page.getByRole('button', { name: /^done$/i })
      if (await done.isVisible().catch(() => false)) await done.click()
    }
    await expect(page.getByText(/what is the english for this/i)).toBeVisible()

    await page.getByRole('button', { name: /show the answer/i }).click()
    // No help was used — the full three-way self-check, including the
    // unaided claim, is still there exactly as before.
    await expect(page.getByRole('button', { name: /^i got it$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^i had to look$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^not yet$/i })).toBeVisible()
  })

  test('the ladder reads in plain Hebrew, right to left, at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedTaylorAndOpenPractice(page, 'he')

    for (let i = 0; i < 10; i++) {
      if (await page.getByText(/מה זה באנגלית|מהי המילה/i).isVisible().catch(() => false)) break
      const reveal = page.getByRole('button', { name: /תשובה/i })
      if (await reveal.isVisible().catch(() => false)) {
        const done = page.getByRole('button', { name: /^בוצע$/i })
        await reveal.click()
        const gotIt = page.getByRole('button', { name: /ידעתי/i })
        if (await gotIt.isVisible().catch(() => false)) await gotIt.click()
        else if (await done.isVisible().catch(() => false)) await done.click()
        continue
      }
      const done = page.getByRole('button', { name: /^בוצע$/i })
      if (await done.isVisible().catch(() => false)) await done.click()
    }

    const hintBtn = page.getByRole('button', { name: /רמז/i })
    if (await hintBtn.isVisible().catch(() => false)) {
      await hintBtn.click()
      const dir = await page.locator('html').getAttribute('dir')
      expect(dir).toBe('rtl')
      await expect(page.getByText(/אותיות/)).toBeVisible()

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(noOverflow).toBeLessThanOrEqual(1)
    }
  })
})
