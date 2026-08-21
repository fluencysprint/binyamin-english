import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   One screen, one language — whichever one is selected right now.
   --------------------------------------------------------------------------
   Profiles store an `interfaceLanguage`, and the lesson runner used to read
   the learner-facing instruction from it. The result was a screen in two
   languages at once: Morgan (a French profile) showed French instructions
   under an English UI, and switching the header language did not change them.

   The rule these lock down:
     • tutor/system instructions follow the SELECTED locale, immediately
     • the English being taught stays English
     • nothing the tutor typed about a student is ever translated
   ========================================================================== */

const HEBREW = /[֐-׿]/
const CYRILLIC = /[Ѐ-ӿ]/
const FRENCH_ONLY = /Écoutez|Répétez|Parlez|Votre tour|Regardez/i

async function unlockTutor(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
}

/** Start a lesson for a demo student and return its URL. */
async function startLesson(page: Page, name: RegExp) {
  await page.goto('/tutor/data')
  await page.getByRole('button', { name }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start (this|the next|first) lesson/i }).first().click()
  await page.waitForURL(/\/lesson\//)
  return page.url()
}

async function setLocale(page: Page, lang: string) {
  await page.goto('/tutor')
  await page.locator('header select').selectOption(lang)
}

async function learnerText(page: Page) {
  const section = page.locator('section[aria-live="polite"]').first()
  await expect(section).toBeVisible()
  return section.innerText()
}

test('a French profile does not show French instructions under an English UI', async ({ page }) => {
  await unlockTutor(page)
  // Morgan's stored interfaceLanguage is French.
  const lesson = await startLesson(page, /Morgan/)

  await setLocale(page, 'en')
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click() // Together
  await page.goto(lesson)

  const text = await learnerText(page)
  expect(text, text).not.toMatch(FRENCH_ONLY)
  expect(text, text).not.toMatch(HEBREW)
  expect(text, text).not.toMatch(CYRILLIC)
})

test('switching the UI locale changes the instruction immediately, with no stale strings', async ({
  page,
}) => {
  await unlockTutor(page)
  const lesson = await startLesson(page, /Morgan/)
  await setLocale(page, 'en')
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click()
  await page.goto(lesson)
  const english = await learnerText(page)

  // Switch on a screen that HAS a language control, then come back: the runner
  // is a focused screen with none of its own.
  await setLocale(page, 'ru')
  await page.goto(lesson)
  const russian = await learnerText(page)
  expect(russian, russian).toMatch(CYRILLIC)
  expect(russian).not.toBe(english)

  await setLocale(page, 'he')
  await page.goto(lesson)
  const hebrew = await learnerText(page)
  expect(hebrew, hebrew).toMatch(HEBREW)
  expect(hebrew, hebrew).not.toMatch(CYRILLIC)

  await setLocale(page, 'en')
  await page.goto(lesson)
  const backToEnglish = await learnerText(page)
  expect(backToEnglish, backToEnglish).not.toMatch(HEBREW)
  expect(backToEnglish).toBe(english)
})

test('two different profiles show the same locale as each other', async ({ page }) => {
  await unlockTutor(page)
  // Morgan is stored as French, Sam as Russian, Casey as Hebrew. Under one
  // selected locale all three must agree.
  const morgan = await startLesson(page, /Morgan/)
  const casey = await startLesson(page, /Casey/)

  await setLocale(page, 'ru')
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click()

  await page.goto(morgan)
  expect(await learnerText(page)).toMatch(CYRILLIC)
  await page.goto(casey)
  const caseyText = await learnerText(page)
  expect(caseyText, caseyText).toMatch(CYRILLIC)
  expect(caseyText, caseyText).not.toMatch(HEBREW)
})

test('the English being taught is never translated with the interface', async ({ page }) => {
  await unlockTutor(page)
  const lesson = await startLesson(page, /Casey/)
  await setLocale(page, 'he')
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click()
  await page.goto(lesson)

  // The target block is the thing being learned: English, marked as English,
  // and explicitly left-to-right whatever the page direction is.
  const target = page.locator('[lang="en"]').first()
  await expect(target).toBeVisible()
  await expect(target).toHaveAttribute('dir', 'ltr')
  expect(await target.innerText()).toMatch(/[A-Za-z]/)
})

test('a tutor-written correction is shown verbatim, never translated', async ({ page }) => {
  await unlockTutor(page)
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Morgan/ }).click()
  await page.waitForURL(/\/tutor\/student\//)

  const original = 'I explained him the situation carefully'
  await expect(page.getByText(original).first()).toBeVisible()

  for (const lang of ['ru', 'he', 'fr', 'en']) {
    await page.locator('header select').selectOption(lang)
    await expect(page.getByText(original).first(), lang).toBeVisible()
  }
})
