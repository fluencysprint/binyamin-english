import { test, expect } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

// Real-Chromium regression coverage for bidi isolation of embedded LTR
// content (English sentences, CEFR codes, lesson target text) inside Hebrew
// (RTL) UI. jsdom-based unit tests (src/tests/bidi.test.tsx) check the
// isolation markup is present; this spec checks it actually renders
// left-to-right in a real bidi-aware layout engine.

test('About page renders the localized personal name and no leftover pronunciation note, in Hebrew', async ({
  page,
}) => {
  await page.goto('/about/')
  await page.getByLabel(/language/i).selectOption('he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  await expect(page.getByRole('heading', { name: 'עליי' })).toBeVisible()
  await expect(page.getByText('שלום, אני בנימין.')).toBeVisible()
  // The removed pronunciation sentence must not reappear.
  await expect(page.getByText(/נהגה/)).toHaveCount(0)
  // No stray Latin "Binyamin" in personal-name prose (the brand mark alone
  // stays Latin, in the header).
  const bodyText = await page.locator('article').innerText()
  expect(bodyText).not.toContain('Binyamin')
})

test('CEFR level codes stay visually left-to-right inside Hebrew tutor UI', async ({ page }) => {
  await page.goto('/tutor')
  await page.getByLabel(/language/i).selectOption('he')
  await page.getByPlaceholder(/ביטוי גישה/).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /פתיחה/ }).click()

  await page.getByRole('link', { name: /תלמיד\/ה חדש\/ה/ }).first().click()
  await page.getByLabel(/שם פרטי או כינוי/).fill('בדיקה')
  await page.getByLabel(/^גיל$/).fill('30')
  await page.getByRole('button', { name: /^הבא$/ }).click()
  await page.getByRole('radio', { name: /שוטף\/ה — רוצה תרגול/ }).click()
  await page.getByRole('button', { name: /^הבא$/ }).click()
  await page.getByRole('button', { name: /יצירת תלמיד\/ה/ }).click()

  await expect(page.getByRole('heading', { name: 'בדיקה' })).toBeVisible()

  const level = page.locator('bdi', { hasText: 'C1' }).first()
  await expect(level).toBeVisible()

  // A <bdi> with no forced dir auto-detects LTR for Latin text — assert the
  // computed direction is actually ltr, not inherited rtl from the page.
  const computedDir = await level.evaluate((el) => getComputedStyle(el).direction)
  expect(computedDir).toBe('ltr')
})

test('a "mistake → correction" pair keeps its logical left-to-right order inside Hebrew UI', async ({
  page,
}) => {
  // Regression: isolating "mistake" and "correction" as two SEPARATE <bdi>
  // runs kept each one internally LTR, but an RTL paragraph still reordered
  // the two isolates relative to each other, so the correction visually
  // appeared BEFORE the mistake. The fix renders them as one
  // unicode-bidi:plaintext unit instead (StudentDashboardPage.module.css
  // .issueText) so they stay in source order.
  await page.goto('/tutor')
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByLabel(/language/i).selectOption('he')
  await page.getByRole('button', { name: /Morgan/ }).click()
  await page.waitForURL(/\/tutor\/student\//)

  /* Pick the pair by its content, not by position: which issue ranks first is
     a teaching decision that belongs to the progress engine and changes as
     evidence accumulates. What must never change is that both halves of a
     pair stay in source order under an RTL page. */
  const issue = page
    .locator('[class*="issueText"]')
    .filter({ hasText: 'I explained him the situation' })
    .first()
  await expect(issue).toBeVisible()
  expect(await issue.innerText()).toContain(
    'I explained him the situation carefully → I explained the situation to him carefully',
  )

  // DOM order is correct by construction — the real regression was VISUAL:
  // compare actual rendered positions, not just text-node order, since an RTL
  // paragraph can still reorder isolated runs on screen. The pair is long
  // enough to wrap in a narrow column, so "after" means a later line, or the
  // same line further to the right — never earlier on the same line.
  const { first, correction } = await issue.evaluate((el) => {
    const firstTextNode = el.childNodes[0] as Text
    const range = document.createRange()
    range.setStart(firstTextNode, 0)
    range.setEnd(firstTextNode, 1)
    const a = range.getBoundingClientRect()
    // The first FRAGMENT of the correction, not its union box: a span that
    // wraps reports a union starting at the left edge of line two, which hides
    // exactly the reordering this test exists to catch.
    const correctionSpan = el.querySelector('span')!
    const b = correctionSpan.getClientRects()[0]
    return { first: { x: a.x, y: a.y }, correction: { x: b.x, y: b.y } }
  })
  const sameLine = Math.abs(correction.y - first.y) < 2
  expect(sameLine ? correction.x > first.x : correction.y > first.y).toBe(true)
})

/* ==========================================================================
   Mixed Hebrew + English in the learner's own instruction.
   --------------------------------------------------------------------------
   `הקשיבו, ואז אמרו “Hello”. נסו כמה פעמים.` is one string with no markup, so
   the bidi algorithm used to resolve its quotes and its final period against
   the RTL paragraph and fling them to the far left of the line. The fix is
   isolation (BidiText → `<bdi dir="ltr">`), never rearranged punctuation, and
   only a real bidi-aware engine can confirm it worked.
   ========================================================================== */

async function startHebrewLesson(page: import('@playwright/test').Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  // Casey is the Hebrew-speaking absolute beginner: her lesson is exactly the
  // "Hebrew instruction wrapped around an English target" case.
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson/i }).click()
  await page.waitForURL(/\/lesson\//)
  const lessonUrl = page.url()

  await page.goto('/tutor')
  await page.locator('header select').selectOption('he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  // Together mode is the shared screen the learner actually reads.
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click()
  await page.goto(lessonUrl)
  return lessonUrl
}

test('an English phrase inside a Hebrew instruction keeps its quotes and reads left-to-right', async ({
  page,
}) => {
  await startHebrewLesson(page)

  const instruction = page.locator('section[dir="rtl"] p').first()
  await expect(instruction).toBeVisible()
  expect(await instruction.innerText()).toMatch(/[֐-׿]/)

  // The embedded English is in its own isolate, and the isolate carries the
  // quotes with it rather than leaving them to the Hebrew paragraph.
  const isolate = instruction.locator('bdi').first()
  await expect(isolate).toBeVisible()
  const isolateText = await isolate.innerText()
  expect(isolateText).toMatch(/[A-Za-z]/)
  expect(isolateText.startsWith('“')).toBe(true)
  expect(isolateText.endsWith('”')).toBe(true)

  expect(await isolate.evaluate((el) => getComputedStyle(el).direction)).toBe('ltr')

  /* The visual proof: inside the isolate the OPENING quote is to the left of
     the closing one. Under the old unisolated rendering the pair was split and
     reordered by the RTL paragraph, which is what the screenshot showed. */
  const { open, close } = await isolate.evaluate((el) => {
    const node = el.firstChild as Text
    const rect = (start: number, end: number) => {
      const range = document.createRange()
      range.setStart(node, start)
      range.setEnd(node, end)
      return range.getBoundingClientRect()
    }
    return { open: rect(0, 1).x, close: rect(node.length - 1, node.length).x }
  })
  expect(close).toBeGreaterThan(open)
})

test('the Hebrew sentence keeps its own punctuation, and never doubles a quote', async ({
  page,
}) => {
  await startHebrewLesson(page)
  const instruction = page.locator('section[dir="rtl"] p').first()
  const text = await instruction.innerText()

  // No doubled marks anywhere on the learner's screen.
  expect(text).not.toMatch(/([“”‘’«»„"])\1|“”|«»/)

  // Isolation must not have edited the string: the Hebrew is still there, the
  // English is still there, and nothing was respaced to fake the layout.
  expect(text).not.toContain('  ')
})

test('the tutor SAY block quotes a line exactly once', async ({ page }) => {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  // Morgan is the C1 profile whose recurring-error review echoes an already
  // quoted correction back into a SAY line.
  await page.getByRole('button', { name: /Morgan/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start (this|the next|first) lesson/i }).click()
  await page.waitForURL(/\/lesson\//)

  const say = page.locator('[class*="quotes"] li')
  await expect(say.first()).toBeVisible()
  for (const line of await say.allInnerTexts()) {
    expect(line, line).not.toMatch(/([“”‘’«»„"])\1|“”|«»/)
    // Exactly one outer pair.
    expect(line.startsWith('“') && line.endsWith('”'), line).toBe(true)
    expect(line.slice(1, -1)).not.toContain('“')
  }
})
