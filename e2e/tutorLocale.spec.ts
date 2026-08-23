import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The lesson, taught in the tutor's own language — checked in the browser.
   --------------------------------------------------------------------------
   The unit audit proves the strings exist and resolve. This proves the screen
   actually uses them: the SAME saved lesson, reopened under a different
   interface language, shows its instructions in that language — while the
   English the learner is meant to hear comes back byte for byte.

   The runner deliberately has no language control of its own (it is a focused
   screen), so the switch happens where the control lives and the lesson is
   reopened by its own URL — which is also the strongest available proof that
   nothing instructional is baked into the stored record.
   ========================================================================== */

/** Instruction sections. SAY is deliberately excluded — it is English by design. */
const INSTRUCTION_SECTIONS = ['do', 'student', 'look', 'help', 'challenge'] as const

const SCRIPT = {
  he: /[֐-׿]/,
  ru: /[Ѐ-ӿ]/,
} as const

async function startLesson(page: Page): Promise<string> {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson|start lesson|resume/i }).first().click()
  await page.waitForURL(/\/lesson\//)
  await settle(page)
  return page.url()
}

/** Wait for the guidance panel, whatever language it is labelled in. */
async function settle(page: Page) {
  const orientation = page.getByRole('button', { name: /let’s go|let's go|קדימה|поехали|vamos|c’est parti/i })
  if (await orientation.isVisible().catch(() => false)) await orientation.click()
  await expect(page.locator('section[aria-label] header p').first()).toBeVisible({ timeout: 15000 })
}

/** The NOW line plus every instruction block, as one string. */
async function instructionText(page: Page): Promise<string> {
  return page.evaluate((sections) => {
    const panel = document.querySelector('section[aria-label]')
    if (!panel) return ''
    const parts: string[] = []
    const now = panel.querySelector('header p')
    if (now) parts.push(now.textContent ?? '')
    for (const tone of sections) {
      panel.querySelectorAll(`[class*="${tone}"] li`).forEach((li) => parts.push(li.textContent ?? ''))
    }
    return parts.join(' ¶ ')
  }, INSTRUCTION_SECTIONS as unknown as string[])
}

/** Switch the interface language, then reopen the same saved lesson.
 *  The teaching prose for a language is a separate chunk fetched when the
 *  tutor area opens, so the assertion waits for it to land rather than
 *  catching the English it falls back to for the first frame. */
async function reopenIn(page: Page, lang: string, lesson: string, was?: string) {
  await page.goto('/tutor')
  await page.locator('header select').selectOption(lang)
  await page.goto(lesson)
  await settle(page)
  if (was !== undefined) {
    /* The teaching prose for a language is a lazily-imported chunk. Under a
       fully parallel run the dev server can take several seconds to serve it,
       and until it lands the panel legitimately shows the English fallback —
       so this waits generously rather than racing the network. */
    await expect.poll(() => instructionText(page), { timeout: 25000 }).not.toBe(was)
  }
}

test.describe('the tutor reads the lesson in their own language', () => {
  test('the same saved lesson reads in whichever language is selected', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const lesson = await startLesson(page)

    const english = await instructionText(page)
    expect(english.length).toBeGreaterThan(40)

    for (const lang of ['he', 'ru'] as const) {
      await reopenIn(page, lang, lesson, english)
      const localized = await instructionText(page)
      expect(SCRIPT[lang].test(localized), `${lang}: ${localized}`).toBe(true)
      expect(localized, `${lang} still shows the English instructions`).not.toBe(english)
    }

    for (const lang of ['es', 'fr'] as const) {
      await reopenIn(page, lang, lesson, english)
    }

    // Back to English: the same lesson, the same words it started with.
    await reopenIn(page, 'en', lesson)
    expect(await instructionText(page)).toBe(english)
  })

  test('keeps the English the learner has to hear in English', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const lesson = await startLesson(page)
    /* Quotation MARKS follow the locale's typography — French sets « » — so
       they are stripped before comparing. What must not change is the English
       between them: that is the sentence the tutor says out loud. */
    const say = async () =>
      (
        await page.evaluate(() =>
          [...document.querySelectorAll('[class*="say"] li')].map((li) => li.textContent).join('|'),
        )
      ).replace(/[«»“”‘’"\u00A0\u202F]/g, '')
    const english = await say()
    expect(english.length).toBeGreaterThan(5)

    for (const lang of ['he', 'ru', 'es', 'fr']) {
      await reopenIn(page, lang, lesson)
      // The instructions around it change; these lines must not.
      await expect.poll(say, { timeout: 25000 }).toBe(english)
    }
  })

  test('Hebrew reads right-to-left with the English held left-to-right inside it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const lesson = await startLesson(page)
    await reopenIn(page, 'he', lesson)
    await expect
      .poll(async () => SCRIPT.he.test(await instructionText(page)), { timeout: 10000 })
      .toBe(true)

    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl')
    // The learner's own task is the screen that mixes the two scripts; every
    // embedded English run there is isolated rather than spaced by hand.
    const stray = await page.evaluate(() => {
      const text = document.body.innerText
      return /[‎‏‪-‮]/.test(text)
    })
    expect(stray, 'directional marks pasted into the text').toBe(false)
  })
})
