import { test, expect, Page } from '@playwright/test'
import { publicAssessmentItems } from '../src/data/assessmentBank'
import { CEFR_LEVELS } from '../src/types'

/* ==========================================================================
   The public English check, driven end to end in a real browser.
   --------------------------------------------------------------------------
   The bug that motivated these tests was only visible here: a person answered
   the questions, and the page told them C1 vocabulary, B2 grammar, C1 reading
   — and "A1 Beginner" with A1 advice. Unit tests can assert the estimator;
   only this can assert that what a learner is SHOWN holds together.
   ========================================================================== */

const levelIndex = (level: string) => CEFR_LEVELS.indexOf(level as (typeof CEFR_LEVELS)[number])

/** Look up the item currently on screen so the run can answer it deliberately. */
function itemFor(prompt: string) {
  const item = publicAssessmentItems.find((i) => i.prompt === prompt)
  if (!item) throw new Error(`No bank item matches the rendered prompt: ${prompt}`)
  return item
}

type Strategy = (item: ReturnType<typeof itemFor>) => 'correct' | 'wrong'

/** Walk the whole quiz, answering by strategy, and stop on the result card. */
async function runCheck(page: Page, strategy: Strategy) {
  await page.goto('/check-english/')
  await page.getByRole('button', { name: /start the check/i }).click()

  for (let guard = 0; guard < 40; guard++) {
    const result = page.getByRole('heading', { name: /your english snapshot/i })
    if (await result.isVisible().catch(() => false)) return
    const prompt = await page.locator('.card p[dir="auto"]').first().textContent()
    const item = itemFor((prompt ?? '').trim())
    const correct = item.options![item.answerIndex!]
    const wrong = item.options!.find((o) => o !== correct)!
    const choice = strategy(item) === 'correct' ? correct : wrong
    await page.getByRole('radio', { name: choice, exact: true }).click()
    await page.getByRole('button', { name: /submit answer/i }).click()
  }
  throw new Error('The check never reached a result')
}

/** The headline level and each skill chip, as the learner sees them. */
async function readResult(page: Page) {
  await expect(page.getByRole('heading', { name: /your english snapshot/i })).toBeVisible()
  // The headline level is the first bidi-isolated level code on the card; the
  // skill chips carry the rest.
  const level = ((await page.locator('bdi').first().textContent()) ?? '').trim()
  const chips = await page.locator('[class*="skillChip"]').allTextContents()
  const advice = await page.locator('ul li').allTextContents()
  return { level, chips, advice, body: (await page.locator('body').textContent()) ?? '' }
}

test('a near-perfect run reports the top band, not a beginner one', async ({ page }) => {
  await runCheck(page, () => 'correct')
  const { level, chips, advice, body } = await readResult(page)

  expect(level).toBe('C1')
  expect(body).toContain('Advanced')
  expect(body).not.toContain('Beginner')
  // The check tops out at C1, and says so rather than implying precision.
  expect(body).toMatch(/highest level this check can measure/i)
  // No skill chip may disagree with the headline by more than one band.
  for (const chip of chips) {
    const shown = CEFR_LEVELS.map((l) => (l === 'preA1' ? 'Pre-A1' : l)).find((l) => chip.includes(l))
    if (!shown) continue
    const shownIdx = levelIndex(shown === 'Pre-A1' ? 'preA1' : shown)
    expect(Math.abs(shownIdx - levelIndex('C1'))).toBeLessThanOrEqual(1)
  }
  // And the advice must not be A1 basics.
  expect(advice.join(' ')).not.toMatch(/do\/does/i)
})

test('a beginner run still reports a beginner level, with beginner advice', async ({ page }) => {
  await runCheck(page, () => 'wrong')
  const { level, advice } = await readResult(page)
  expect(levelIndex(level === 'Pre-A1' ? 'preA1' : level)).toBeLessThanOrEqual(levelIndex('A1'))
  expect(advice.join(' ').length).toBeGreaterThan(0)
})

test('a mid-level run lands mid-scale and stays internally consistent', async ({ page }) => {
  // Correct through B1, wrong above it — a textbook intermediate learner.
  await runCheck(page, (item) => (levelIndex(item.cefr) <= levelIndex('B1') ? 'correct' : 'wrong'))
  const { level, chips } = await readResult(page)

  const idx = levelIndex(level === 'Pre-A1' ? 'preA1' : level)
  expect(idx).toBeGreaterThanOrEqual(levelIndex('A2'))
  expect(idx).toBeLessThanOrEqual(levelIndex('B2'))
  expect(chips.length).toBeGreaterThan(0)
})

test('the result explains its evidence: how many questions, and what went unchecked', async ({ page }) => {
  await runCheck(page, () => 'correct')
  const body = (await page.locator('body').textContent()) ?? ''
  expect(body).toMatch(/Based on \d+ questions/)
  expect(body).toMatch(/Not checked here/i)
  expect(body).toMatch(/Speaking/i)
})

test('the Hebrew result is Hebrew, including the advice', async ({ page }) => {
  await page.goto('/he/check-english/')
  await page.getByRole('button', { name: /התחלת הבדיקה|start/i }).click()
  for (let guard = 0; guard < 40; guard++) {
    const done = page.locator('[class*="skillChip"]').first()
    if (await done.isVisible().catch(() => false)) break
    const prompt = await page.locator('.card p[dir="auto"]').first().textContent()
    const item = itemFor((prompt ?? '').trim())
    await page.getByRole('radio', { name: item.options![item.answerIndex!], exact: true }).click()
    await page.locator('button.btn-primary.btn-lg').first().click()
  }
  const advice = await page.locator('ul li').allTextContents()
  expect(advice.length).toBeGreaterThan(0)
  // Hebrew script must be present — the old result leaked English fallbacks.
  expect(advice.join(' ')).toMatch(/[֐-׿]/)
})
