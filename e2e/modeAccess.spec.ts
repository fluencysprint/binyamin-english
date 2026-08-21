import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The mode boundary and the backup reminder, in a real browser.
   --------------------------------------------------------------------------
   The unit tests render routes into jsdom. These two things need an actual
   browser to mean anything:

     · a typed URL and a reload, which is how a student would really get to
       /tutor/data — not by finding a link
     · a download, which is the entire point of the backup action

   Everything here runs at 390px first, because the device being handed to a
   learner is a phone.
   ========================================================================== */

async function unlockTutor(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByRole('heading', { name: /^students$/i })).toBeVisible()
}

/** A demo profile with a completed lesson behind it — real history, so the
 *  tutor-only sections have something in them to leak. */
async function seedStudentWithHistory(page: Page): Promise<string> {
  await page.goto('/tutor/data')
  // Morgan ships with a completed lesson, corrections and a report; Casey is
  // the freshly-onboarded profile and would leave every panel empty.
  await page.getByRole('button', { name: /Morgan/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  return page.url()
}

/** The header collapses its controls into a menu on a phone, and the menu
 *  stays open between clicks — so this opens it only when it is shut. */
async function switchMode(page: Page, name: RegExp) {
  const toggle = page.locator('header button[aria-expanded]')
  if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click()
  }
  await page.getByRole('radio', { name }).click()
}

test.describe('a handed-over device', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('the dashboard keeps its tutor material off the learner’s screen', async ({ page }) => {
    await unlockTutor(page)
    const dashboard = await seedStudentWithHistory(page)

    await expect(page.getByText(/approximate level/i)).toBeVisible()
    await switchMode(page, /^Student$/)

    for (const label of [
      /where we left off/i,
      /keeps coming back/i,
      /worth re-hearing/i,
      /approximate level/i,
      /recommended next lesson/i,
      /generate next lesson/i,
      /still needs work/i,
      /pronunciation targets/i,
    ]) {
      await expect(page.getByText(label), String(label)).toHaveCount(0)
    }
    // Their own work is still there.
    await expect(page.getByText(/^Vocabulary$/)).toBeVisible()

    // A reload is not a way back in.
    await page.goto(dashboard)
    await expect(page.getByText(/approximate level/i)).toHaveCount(0)
  })

  test('typing /tutor/data in the address bar shows a notice, not the backup controls', async ({
    page,
  }) => {
    await unlockTutor(page)
    await seedStudentWithHistory(page)
    await switchMode(page, /^Student$/)

    await page.goto('/tutor/data')
    await expect(page.getByRole('heading', { name: /not available in this mode/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /export backup/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /clear all local data/i })).toHaveCount(0)

    // The roster is other learners' names, and it is blocked the same way.
    await page.goto('/tutor')
    await expect(page.getByRole('heading', { name: /not available in this mode/i })).toBeVisible()
    await expect(page.getByText('Morgan')).toHaveCount(0)
  })

  test('editing the URL to another student while in Student mode resolves back to the bound student', async ({
    page,
  }) => {
    await unlockTutor(page)
    const morganUrl = await seedStudentWithHistory(page)
    const morganId = morganUrl.match(/\/tutor\/student\/([^/]+)/)![1]

    // Seed a second student — Student mode must never be able to reach them.
    await page.goto('/tutor/data')
    await page.getByRole('button', { name: /Casey/ }).click()
    await page.waitForURL(/\/tutor\/student\//)
    const caseyId = page.url().match(/\/tutor\/student\/([^/]+)/)![1]
    await expect(page.getByRole('heading', { name: 'Casey' })).toBeVisible()

    // Back on Morgan's dashboard, hand the device over — Student mode binds
    // to whoever is on screen.
    await page.goto(morganUrl)
    await expect(page.getByRole('heading', { name: 'Morgan' })).toBeVisible()
    await switchMode(page, /^Student$/)
    await expect(page.getByText(/approximate level/i)).toHaveCount(0)

    // The address bar is edited to Casey's id — the device is still Morgan's.
    await page.goto(`/tutor/student/${caseyId}`)
    await expect(page).toHaveURL(new RegExp(`/tutor/student/${morganId}$`))
    await expect(page.getByRole('heading', { name: 'Morgan' })).toBeVisible()
    await expect(page.getByText('Casey')).toHaveCount(0)

    // A reload with Casey's id still in the bar resolves back the same way.
    await page.goto(`/tutor/student/${caseyId}`)
    await expect(page).toHaveURL(new RegExp(`/tutor/student/${morganId}$`))
    await expect(page.getByRole('heading', { name: 'Morgan' })).toBeVisible()
  })

  test('getting back out costs the access phrase', async ({ page }) => {
    await unlockTutor(page)
    await seedStudentWithHistory(page)
    await switchMode(page, /^Student$/)

    await switchMode(page, /^Tutor$/)
    await expect(page.getByText(/approximate level/i)).toHaveCount(0)

    const field = page.getByLabel(/access phrase to leave student mode/i)
    await field.fill('wrong')
    await page.getByRole('button', { name: /^unlock$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/approximate level/i)).toHaveCount(0)

    await field.fill(TUTOR_GATE_PHRASE)
    await page.getByRole('button', { name: /^unlock$/i }).click()
    await expect(page.getByText(/approximate level/i)).toBeVisible()
  })
})

test.describe('the backup reminder', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('stays away until there is teaching to lose', async ({ page }) => {
    await unlockTutor(page)
    await expect(page.getByRole('region', { name: /back up your students/i })).toHaveCount(0)
  })

  test('offers a real file, then gets out of the way — across a reload', async ({ page }) => {
    await unlockTutor(page)
    await seedStudentWithHistory(page)

    await page.goto('/tutor')
    const card = page.getByRole('region', { name: /back up your students/i })
    await expect(card).toBeVisible()
    await expect(card).toContainText(/nothing on this device has been backed up yet/i)
    await expect(card).toContainText(/this browser, on this device only/i)

    const download = page.waitForEvent('download')
    await card.getByRole('button', { name: /back up now/i }).click()
    expect((await download).suggestedFilename()).toMatch(/^binyamin-english-backup-\d{4}-\d{2}-\d{2}\.json$/)

    await expect(card).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: /^students$/i })).toBeVisible()
    await expect(page.getByRole('region', { name: /back up your students/i })).toHaveCount(0)
  })

  test('does not crowd the page it sits on', async ({ page }) => {
    await unlockTutor(page)
    await seedStudentWithHistory(page)
    await page.goto('/tutor')
    await expect(page.getByRole('region', { name: /back up your students/i })).toBeVisible()

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 })
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
          { message: `${width}px`, timeout: 5000 },
        )
        .toBeLessThanOrEqual(1)
    }
  })
})
