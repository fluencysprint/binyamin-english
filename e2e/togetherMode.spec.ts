import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   Together mode — the screen the learner is actually looking at.
   --------------------------------------------------------------------------
   This is the screen a paying student sees for fifty minutes over a shared
   Zoom window, so the question behind every assertion is blunt: is there
   enough on it to sustain the activity, and is any of it the tutor's?

   It used to hold exactly one localized sentence — "Now talk about you." —
   for a six-minute speaking task, while the topic, the follow-up questions
   and the target language all existed and went only to the tutor's device.
   Everything below exists to stop that coming back.
   ========================================================================== */

const TUTOR_SECTIONS = [/^\s*say\s*$/i, /look for/i, /if they can/i, /move on when/i]

async function openTogetherLesson(page: Page, lang = 'en') {
  await page.goto('/tutor')
  await page.evaluate(() => {
    localStorage.setItem('ewb:hideLessonOrientation', 'true')
  })
  await page.goto('/tutor')
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  // Taylor: an adult around B2 with a completed lesson behind them — the
  // closest demo record to a real paying student.
  await page.getByRole('button', { name: /Taylor/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.evaluate(
    (l) =>
      localStorage.setItem(
        'ewb:settings',
        JSON.stringify({ tutorUnlocked: true, mode: 'together', language: l }),
      ),
    lang,
  )
  await page.reload()
  await page
    .getByRole('button', { name: /start lesson|resume|start first|התחל|המשך|שיעור/i })
    .first()
    .click()
  await page.waitForURL(/\/lesson\//)
}

/** Walk the lesson, collecting what the learner is shown at every step. */
async function walk(page: Page, max = 24): Promise<string[]> {
  const seen: string[] = []
  for (let i = 0; i < max; i++) {
    seen.push((await page.locator('main').innerText()) ?? '')
    const next = page.getByRole('button', { name: /next step|השלב הבא/i }).last()
    if (!(await next.isVisible().catch(() => false))) break
    await next.click()
    await page.waitForTimeout(120)
  }
  return seen
}

test('the opening speaking block puts a real question on the shared screen', async ({ page }) => {
  await openTogetherLesson(page)
  const task = page.locator('main')
  // The localized instruction is there…
  await expect(task).toContainText(/chat|talk|answer/i)
  // …and so is an English prompt the learner can actually answer. It ends in a
  // question mark or is a full sentence — never a two-word stub.
  const prompt = page.locator('p[lang="en"]').first()
  await expect(prompt).toBeVisible()
  expect((await prompt.innerText()).trim().length).toBeGreaterThan(20)
})

test('a talking step carries several prompts, one at a time', async ({ page }) => {
  await openTogetherLesson(page)
  const pager = page.getByRole('button', { name: /next question/i })
  await expect(pager).toBeVisible()
  const first = await page.locator('p[lang="en"]').first().innerText()
  await pager.click()
  const second = await page.locator('p[lang="en"]').first().innerText()
  expect(second).not.toBe(first)
  // Only ever one on screen: the follow-ups are paged, not listed.
  await expect(page.locator('main').getByText(first, { exact: true })).toHaveCount(0)
})

test('target language is available but never on screen before the attempt', async ({ page }) => {
  await openTogetherLesson(page)
  const support = page.getByRole('group').filter({ hasText: /useful language/i }).first()
  const summary = page.getByText(/useful language/i).first()
  await expect(summary).toBeVisible()
  // Closed for a learner who can start without it…
  await expect(page.getByText('___', { exact: false }).first()).toBeHidden()
  await summary.click()
  // …and one tap away when they cannot.
  await expect(page.getByText('___', { exact: false }).first()).toBeVisible()
  void support
})

test('none of the tutor’s side reaches the shared screen, at any step', async ({ page }) => {
  await openTogetherLesson(page)
  for (const screen of await walk(page)) {
    for (const section of TUTOR_SECTIONS) {
      expect(screen, section.source).not.toMatch(section)
    }
    // Nor the tutor's verdict about the learner, nor a phase plan.
    expect(screen).not.toMatch(/how did that go|B2|phase \d/i)
  }
})

test('every step of the lesson shows the learner something to work with', async ({ page }) => {
  await openTogetherLesson(page)
  const screens = await walk(page)
  expect(screens.length).toBeGreaterThan(8)
  /* At most two steps in a whole lesson may be instruction-only, and both are
     the closing ones that report what the session actually produced. Anything
     more than that is the old empty-screen problem returning. */
  const thin = screens.filter((s) => s.trim().split('\n').filter(Boolean).length < 2)
  expect(thin.length).toBeLessThanOrEqual(2)
})

test('reads right-to-left in Hebrew with the English held left-to-right', async ({ page }) => {
  await openTogetherLesson(page, 'he')
  const instruction = page.locator('main p').first()
  await expect(instruction).toBeVisible()
  // The instruction follows the page direction…
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl')
  // …while the English the learner has to read is explicitly isolated.
  const english = page.locator('main [lang="en"]').first()
  await expect(english).toHaveAttribute('dir', 'ltr')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('fits a phone without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await openTogetherLesson(page)
  for (let i = 0; i < 8; i++) {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `step ${i}`).toBeLessThanOrEqual(1)
    const next = page.getByRole('button', { name: /next step/i }).last()
    if (!(await next.isVisible().catch(() => false))) break
    await next.click()
    await page.waitForTimeout(120)
  }
})
