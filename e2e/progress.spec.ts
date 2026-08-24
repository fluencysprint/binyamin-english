import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   Continuity between lessons, in a real browser.
   --------------------------------------------------------------------------
   The unit tests prove the classification and the loop. What only a browser
   can prove is that the tutor actually SEES it: that the briefing and the
   plan agree about today's focus, that the progress card fits a phone, and
   that a recall verdict captured mid-lesson comes back out in the report.
   ========================================================================== */

async function openDemoStudent(page: Page, who = /Morgan/) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: who }).click()
  await page.waitForURL(/\/tutor\/student\//)
  return page.url().split('/tutor/student/')[1].split('/')[0]
}

test('the dashboard opens with a briefing whose focus is the lesson the app will build', async ({
  page,
}) => {
  await openDemoStudent(page)

  const briefing = page.getByRole('region', { name: /where we left off/i })
  await expect(briefing).toBeVisible()
  // It says what last time was about, and gives the tutor something to check.
  await expect(briefing.getByText(/last lesson/i)).toBeVisible()
  await expect(briefing.getByText(/homework set last time/i)).toBeVisible()

  /* The guarantee that makes the briefing trustworthy: it never recommends a
     focus the generated lesson then refuses to teach. */
  const focusHeading = briefing.getByText(/^focus today$/i)
  await expect(focusHeading).toBeVisible()
  const briefedFocus = await briefing.locator('[class*="focusTitle"]').innerText()
  const plannedObjective = await page
    .locator('[class*="nextObjective"] strong')
    .innerText()
  expect(briefedFocus.trim()).toBe(plannedObjective.trim())

  // …and the progress card names the same thing, so one screen never gives
  // the tutor three different answers to "what are we doing today?".
  const progressFocus = await page
    .getByRole('region', { name: /^progress$/i })
    .locator('[class*="focusTitle"]')
    .innerText()
  expect(progressFocus.trim()).toBe(plannedObjective.trim())
})

test('the progress card answers "what matters now" without a wall of numbers', async ({ page }) => {
  await openDemoStudent(page)

  const progress = page.getByRole('region', { name: /^progress$/i })
  await expect(progress).toBeVisible()
  await expect(progress.getByText(/suggested next focus/i)).toBeVisible()
  await expect(progress.getByText(/still needs work/i)).toBeVisible()
  await expect(progress.getByText(/recent lessons/i)).toBeVisible()

  // One completed lesson is not a pattern, and the card says so rather than
  // presenting a single slip as a weakness.
  await expect(progress.getByText(/nothing is coming back repeatedly/i)).toBeVisible()
})

test('progress and briefing fit a phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await openDemoStudent(page)
  await expect(page.getByRole('region', { name: /where we left off/i })).toBeVisible()

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth, `@ ${width}px`).toBeLessThanOrEqual(clientWidth + 1)
  }
})

test('the "open practice set" button never touches the text above it', async ({ page }) => {
  /* Regression: the homework Block's children (a paragraph, this button, a
     chip cluster) relied on each child bringing its own top margin. Most
     brought none, so the button rendered flush against whatever preceded it
     — worst on Spanish/Russian, where the translated label is long enough
     to make the crowding obvious. ProgressView.module.css now gives every
     Block a single `gap`, so this checks a real rendered gap survives. */
  await openDemoStudent(page)

  const briefing = page.getByRole('region', { name: /where we left off/i })
  const openPractice = briefing.getByRole('link', { name: /open the practice set/i })
  await expect(openPractice).toBeVisible()

  const { gap, prevTag } = await openPractice.evaluate((el) => {
    const prev = el.previousElementSibling as HTMLElement
    const prevBox = prev.getBoundingClientRect()
    const ownBox = el.getBoundingClientRect()
    return { gap: ownBox.top - prevBox.bottom, prevTag: prev.tagName }
  })

  // Loose bounds: catches both the old flush-against-text bug (gap ~0) and a
  // doubled-margin regression (gap much larger than one spacing step), while
  // not pinning the test to one exact token value.
  expect(gap, `gap after <${prevTag}>`).toBeGreaterThan(4)
  expect(gap, `gap after <${prevTag}>`).toBeLessThan(40)
})

test('a word recalled mid-lesson is reported back and leaves the review queue', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const studentId = await openDemoStudent(page)

  /* Bring the demo student's saved words forward so they are genuinely due —
     the same state they reach on their own a couple of days after the lesson
     that introduced them. */
  await page.evaluate(async (id) => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open('english-with-benji')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('learningModels', 'readwrite')
      const store = tx.objectStore('learningModels')
      const get = store.get(id)
      get.onsuccess = () => {
        const model = get.result
        model.vocabulary = model.vocabulary.map((v: { reviewDue: number }) => ({
          ...v,
          reviewDue: Date.now() - 86_400_000,
        }))
        store.put(model)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }, studentId)

  await page.reload()
  await expect(page.getByText(/due for recall/i)).toBeVisible()

  await page.getByRole('button', { name: /start lesson|start first lesson|resume/i }).first().click()
  const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
  if (await orientation.isVisible().catch(() => false)) await orientation.click()

  // Spaced review rides at the front of the warm-up — one step in.
  await page.getByRole('button', { name: /next step/i }).click()
  const recall = page.getByRole('region', { name: /did they remember it/i })
  await expect(recall).toBeVisible()

  const firstRow = recall.locator('li').first()
  const term = (await firstRow.locator('[class*="recallTerm"]').innerText()).trim()
  await firstRow.getByRole('button', { name: /got it/i }).click()
  await expect(firstRow.getByRole('button', { name: /got it/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: /Morgan/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^finish$/i }).click()
  await page.waitForURL(/\/tutor\/student\/[^/]+$/)

  await page.getByRole('link', { name: /report/i }).first().click()
  await expect(page.getByText(/words we came back to/i)).toBeVisible()
  await expect(page.getByText(/^remembered$/i)).toBeVisible()
  await expect(page.getByText(term, { exact: true }).first()).toBeVisible()
})
