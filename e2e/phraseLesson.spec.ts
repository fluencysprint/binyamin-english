import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The beginner lesson, in a real browser.
   --------------------------------------------------------------------------
   Casey is the demo record this is written for: sixty-eight, no English at
   all, reading the app in Hebrew. Everything below is a promise the phrase
   curriculum makes that only a browser can check — what is on which screen,
   and what is still there after a refresh.
   ========================================================================== */

const PANEL = /what did you actually see/i

async function openCaseysLesson(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson/i }).click()
  await page.waitForURL(/\/lesson\//)
}

/** Step forward until the tutor is being asked to mark what they saw. */
async function walkToVerdicts(page: Page) {
  for (let i = 0; i < 8; i++) {
    if (await page.getByRole('region', { name: PANEL }).isVisible().catch(() => false)) return
    await page.getByRole('button', { name: /next step/i }).click()
  }
  throw new Error('no phrase-verdict step in this lesson')
}

test('the tutor is not asked for a verdict before the learner has been asked for anything', async ({
  page,
}) => {
  await openCaseysLesson(page)
  /* The lesson opens on the step where the tutor is acting the meaning out.
     Nothing has been asked for, so a verdict there would be a guess — and a
     screen that asks for one teaches the tutor that guessing is expected. */
  await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0)
})

test('a phrase marked mid-lesson is still marked after a refresh', async ({ page }) => {
  await openCaseysLesson(page)
  await walkToVerdicts(page)

  const panel = page.getByRole('region', { name: PANEL })
  const row = panel.getByRole('group').first()
  const phrase = await row.getAttribute('aria-label')
  await row.getByRole('button', { name: /said it alone/i }).click()
  await expect(row.getByRole('button', { name: /said it alone/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  /* The whole point of writing on every tap. A tutor whose tab reloads
     mid-lesson has not lost the evidence they just recorded. */
  await page.reload()
  const after = page.getByRole('region', { name: PANEL }).getByRole('group', { name: phrase! })
  await expect(after.getByRole('button', { name: /said it alone/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('a word captured mid-lesson is still there after a refresh', async ({ page }) => {
  /* A regression, and it was silent: `persist` closed over the captured state,
     so every capture made a new one — and the autosave effect's cleanup then
     wrote the record back through the PREVIOUS closure, i.e. as it stood just
     before the capture. Nothing on screen changed, because each field is React
     state of its own; only a refresh revealed that nothing had been saved. */
  await openCaseysLesson(page)

  await page.getByRole('button', { name: /tools/i }).first().click()
  await page.getByRole('button', { name: /word|vocab/i }).first().click()
  await page.getByRole('textbox').first().fill('serendipity')
  await page.getByRole('button', { name: /^save$|^add$/i }).first().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  /* Read the record itself rather than the screen: the word is held in React
     state either way, so only what reached IndexedDB distinguishes a real save
     from the bug. */
  await expect
    .poll(async () => storedLesson(page), { timeout: 10_000 })
    .toContain('serendipity')
})

/** Every in-progress lesson record on this device, as JSON. */
async function storedLesson(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const dbs = await indexedDB.databases()
    const name = dbs.map((d) => d.name).find((n) => n && /english|ewb|binyamin/i.test(n))
    if (!name) return ''
    return new Promise<string>((resolve) => {
      const req = indexedDB.open(name)
      req.onerror = () => resolve('')
      req.onsuccess = () => {
        const tx = req.result.transaction('lessons', 'readonly')
        const all = tx.objectStore('lessons').getAll()
        all.onsuccess = () =>
          resolve(
            JSON.stringify(
              (all.result as { status: string }[]).filter((l) => l.status === 'inProgress'),
            ),
          )
        all.onerror = () => resolve('')
      }
    })
  })
}

test('the learner is cued from the meaning, never from the English', async ({ page }) => {
  await openCaseysLesson(page)
  // Hebrew, on the screen they are both looking at.
  await page.goto('/tutor')
  await page.locator('header select').selectOption('he')
  await page.getByRole('radiogroup').getByRole('radio').nth(1).click()
  await page.goBack()

  /* Walk to the cold-retrieval step: the one that makes unaided evidence
     possible, and the one that would be quietly turned into a reading test by
     any English on the learner's screen. */
  let found = false
  for (let i = 0; i < 10 && !found; i++) {
    const cues = page.locator('[lang="he"], section[dir="rtl"]').getByText(/[֐-׿]/)
    const hasCue = await cues.count()
    const english = await page.locator('section[dir="rtl"] [lang="en"]').count()
    if (hasCue > 0 && english === 0 && i > 0) found = true
    else await page.getByRole('button', { name: /השלב הבא|next step/i }).click()
  }
  expect(found).toBe(true)
})
