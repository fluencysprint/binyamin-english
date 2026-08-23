import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The learner's phone.
   --------------------------------------------------------------------------
   Everything here runs at 390×844, because that is the device this part of
   the product is for. The questions being asked are the ones a paying student
   asks in the first three seconds:

     what am I supposed to do?
     is this about me, or is it a worksheet?
     am I actually getting better?

   and the one the tutor asks a week later: did any of it come back?
   ========================================================================== */

const PHONE = { width: 390, height: 844 }

/* Taylor: an adult with a completed lesson, corrections and words behind
   them — the closest demo record to a real paying student, and the only kind
   of record for which "what should I do now?" has an answer at all. */
async function handOverDevice(page: Page, demo = /Taylor/) {
  await page.goto('/tutor')
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: demo }).click()
  await page.waitForURL(/\/tutor\/student\//)
  const url = page.url()
  const id = url.match(/\/tutor\/student\/([^/]+)/)![1]
  await page.evaluate(
    (studentId) =>
      localStorage.setItem(
        'ewb:settings',
        JSON.stringify({
          tutorUnlocked: true,
          mode: 'student',
          boundStudentId: studentId,
          language: 'en',
        }),
      ),
    id,
  )
  await page.goto(url)
  await expect(page.getByRole('heading', { name: /^today$/i })).toBeVisible()
  return { url, id }
}

/** Open the practice runner and wait for the first item to actually render —
 *  the set is loaded from IndexedDB, so the URL arriving is not the card
 *  arriving. */
async function openPractice(page: Page) {
  await page.getByRole('button', { name: /^start$|^continue$/i }).click()
  await page.waitForURL(/\/practice$/)
  await expect(page.getByRole('button', { name: /show the answer|^done$/i }).first()).toBeVisible()
}

/** Answer every item, taking the recall path where there is one.
 *  Returns how many items were answered. */
async function answerAll(page: Page, outcome: RegExp = /i got it/i, check?: () => Promise<void>) {
  let answered = 0
  for (let i = 0; i < 30; i++) {
    /* Wait for the NEXT item's controls before deciding there are none: after
       a tap, React remounts the card, and a bare isVisible() in that window
       reports false for both and ends the walk one item early. */
    const control = page.getByRole('button', { name: /show the answer|^done$/i }).first()
    if (!(await control.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false))) {
      break
    }
    await check?.()
    /* Every interaction here is bounded and re-evaluated rather than awaited
       indefinitely. Between two items React briefly holds the old card and the
       new one, so a control that was visible a tick ago can be detached by the
       time the click lands — which used to leave the walk waiting thirty
       seconds for a button the finished set no longer had. `.first()` for the
       same reason: a bare multi-match throws under strict mode. */
    const reveal = page.getByRole('button', { name: /show the answer/i }).first()
    const done = page.getByRole('button', { name: /^done$/i }).first()
    const tap = (l: ReturnType<typeof page.getByRole>) =>
      l.click({ timeout: 3000 }).then(() => true, () => false)

    if (await reveal.isVisible().catch(() => false)) {
      if (!(await tap(reveal))) continue
      if (!(await tap(page.getByRole('button', { name: outcome }).first()))) continue
    } else if (!(await tap(done))) {
      continue
    }
    answered++
  }
  return answered
}

async function overflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(PHONE)
})

test('the first screenful is one action and nothing competing with it', async ({ page }) => {
  await handOverDevice(page)

  const today = page.locator('section').filter({ has: page.getByRole('heading', { name: /^today$/i }) })
  await expect(today.getByRole('button')).toHaveCount(1)

  /* The action has to be reachable without scrolling: a primary action below
     the fold on a phone is not a primary action. */
  const box = await today.getByRole('button').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y + box!.height).toBeLessThanOrEqual(PHONE.height)
  // And it is a real touch target, not a link-sized one.
  expect(box!.height).toBeGreaterThanOrEqual(40)

  expect(await overflow(page)).toBeLessThanOrEqual(1)
})

test('nothing written for the tutor is on the learner’s home screen', async ({ page }) => {
  await handOverDevice(page)
  const text = await page.locator('main').innerText()
  for (const forbidden of [
    /approximate level/i,
    /where we left off/i,
    /keeps coming back/i,
    /suggested next focus/i,
    /recommended next lesson/i,
    /look for/i,
    /\bCEFR\b/,
  ]) {
    expect(text, forbidden.source).not.toMatch(forbidden)
  }
})

test('a homework item shows the cue before the answer, and records the attempt', async ({ page }) => {
  await handOverDevice(page)
  await openPractice(page)

  const card = page.locator('main section')
  await expect(card).toBeVisible()
  const before = await card.innerText()

  const reveal = page.getByRole('button', { name: /show the answer/i })
  if (await reveal.isVisible().catch(() => false)) {
    await reveal.click()
    // The answer is new text — it genuinely was not on screen before.
    expect((await card.innerText()).length).toBeGreaterThan(before.length)
    await page.getByRole('button', { name: /i got it/i }).click()
  } else {
    await page.getByRole('button', { name: /^done$/i }).click()
  }

  // Recorded immediately: there is no submit step to lose on a closed tab.
  const stored = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open('english-with-benji')
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('learningModels', 'readonly')
          const all = tx.objectStore('learningModels').getAll()
          all.onsuccess = () => {
            const sessions = all.result.flatMap(
              (m: { practiceSessions?: { results: unknown[] }[] }) => m.practiceSessions ?? [],
            )
            resolve(sessions.reduce((n: number, s: { results: unknown[] }) => n + s.results.length, 0))
          }
        }
      }),
  )
  expect(stored).toBeGreaterThan(0)
})

test('the whole set can be finished on a phone without horizontal overflow', async ({ page }) => {
  await handOverDevice(page)
  await openPractice(page)

  const answered = await answerAll(page, /i got it/i, async () => {
    expect(await overflow(page)).toBeLessThanOrEqual(1)
  })
  expect(answered).toBeGreaterThan(3)

  await expect(page.getByText(/that is the set finished/i)).toBeVisible()
  // A count with its denominator — never a percentage or a score.
  await expect(page.getByText(/\d+ of \d+ on your own/i)).toBeVisible()
  expect(await page.locator('main').innerText()).not.toMatch(/\d+\s?%/)
})

test('finishing the set changes what Student Home says next', async ({ page }) => {
  const { url } = await handOverDevice(page)
  await openPractice(page)
  await answerAll(page)
  await expect(page.getByText(/that is the set finished/i)).toBeVisible()
  await page.getByRole('button', { name: /back/i }).click()
  await page.waitForURL(url)

  // The homework is done, so TODAY moves on rather than offering it again.
  const today = page.locator('section').filter({ has: page.getByRole('heading', { name: /^today$/i }) })
  await expect(today).not.toContainText(/built from your last lesson/i)
})

test('the tutor sees the run as evidence, not as a claim', async ({ page }) => {
  const { url } = await handOverDevice(page)
  await openPractice(page)
  await page.getByRole('button', { name: /show the answer/i }).click()
  await page.getByRole('button', { name: /i got it/i }).click()

  await page.evaluate(() =>
    localStorage.setItem(
      'ewb:settings',
      JSON.stringify({ tutorUnlocked: true, mode: 'tutor', boundStudentId: null, language: 'en' }),
    ),
  )
  await page.goto(url)
  await expect(page.getByText(/practised in the app: \d+ of \d+/i)).toBeVisible()
})

test('reads right-to-left in Hebrew, with the English held left-to-right', async ({ page }) => {
  const { url, id } = await handOverDevice(page)
  await page.evaluate(
    (studentId) =>
      localStorage.setItem(
        'ewb:settings',
        JSON.stringify({
          tutorUnlocked: true,
          mode: 'student',
          boundStudentId: studentId,
          language: 'he',
        }),
      ),
    id,
  )
  await page.goto(url)
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl')
  expect(await overflow(page)).toBeLessThanOrEqual(1)

  await page.goto(`${url}/practice`)
  await expect(page.locator('main section').first()).toBeVisible()
  const english = page.locator('main [lang="en"]').first()
  if (await english.isVisible().catch(() => false)) {
    await expect(english).toHaveAttribute('dir', 'ltr')
  }
  expect(await overflow(page)).toBeLessThanOrEqual(1)
})
