import { test, expect, Page, Locator } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The step action bar — the tutor's control surface.
   --------------------------------------------------------------------------
   This file is the regression net for the redesign that replaced four stacked
   control clusters (Previous/Next row, "How did that go?" row, a full-bleed
   beige tray of five capture buttons in an auto-fit grid, and a "Skip this
   section" footer) with one pinned bar.

   What it holds the design to, at 320px upward and in every locale:

     • exactly ONE primary action on screen, and it is never dead
     • judge-then-advance reads top to bottom
     • infrequent tools cost two taps, not permanent screen area
     • the bar never covers content and never overflows sideways
     • dismissing the tools menu can never also navigate
   ========================================================================== */

const PHONE_WIDTHS = [320, 360, 390, 414]
const ALL_WIDTHS = [...PHONE_WIDTHS, 768, 1024, 1440]

/** The tallest the bar may grow on a phone. The clusters it replaced measured
 *  ~260px together; anything approaching that is the tray coming back. */
const MAX_BAR_HEIGHT = 180

async function noOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      { message: label, timeout: 5000 },
    )
    .toBeLessThanOrEqual(1)
}

async function unlockTutor(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
}

async function startLesson(page: Page): Promise<string> {
  await unlockTutor(page)
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson|start lesson|resume/i }).first().click()
  const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
  if (await orientation.isVisible().catch(() => false)) await orientation.click()
  await expect(page.getByTestId('step-action-bar')).toBeVisible()
  return page.url()
}

const bar = (page: Page): Locator => page.getByTestId('step-action-bar')

/** "Step 3 of 9" from the pacing strip — the cheapest honest proof that a
 *  click moved the lesson exactly one step, or did not move it at all. */
async function stepPosition(page: Page): Promise<string> {
  const text = (await page.getByLabel(/where we are/i).textContent()) ?? ''
  return (text.match(/step\s+\d+\s+of\s+\d+/i) ?? [''])[0]
}

test.describe('one obvious next action', () => {
  test('the bar carries exactly one filled primary, and it is never disabled', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)

    // One filled brand button anywhere on the screen. Four controls that all
    // looked pressable was the original complaint.
    await expect(page.locator('.btn-primary:visible')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /next step/i })).toBeEnabled()
  })

  test('judge sits directly above advance, so the read is score-then-go', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    const verdict = (await bar(page).getByRole('button', { name: /^correct$/i }).boundingBox())!
    const next = (await page.getByRole('button', { name: /next step/i }).boundingBox())!
    expect(verdict.y + verdict.height).toBeLessThanOrEqual(next.y + 1)
  })
})

test.describe('bar geometry at the narrowest widths', () => {
  for (const width of PHONE_WIDTHS) {
    test(`fits, pins and stays compact at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await startLesson(page)
      await noOverflow(page, `bar @ ${width}px`)

      const box = (await bar(page).boundingBox())!
      // Pinned to the foot of the viewport…
      expect(Math.round(box.y + box.height), 'bar sits on the viewport floor').toBe(800)
      // …and small enough that it is a bar, not a tray.
      expect(box.height, 'bar height').toBeLessThanOrEqual(MAX_BAR_HEIGHT)
      expect(box.width).toBe(width)

      // The primary is the biggest thing in it and a real touch target.
      const next = (await page.getByRole('button', { name: /next step/i }).boundingBox())!
      expect(next.height).toBeGreaterThanOrEqual(48)
      expect(next.width).toBeGreaterThan(width * 0.35)

      // Nothing in the bar is below the minimum comfortable target.
      const heights = await bar(page)
        .locator('button')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))
      for (const h of heights) expect(h).toBeGreaterThanOrEqual(40)
    })
  }

  test('never covers the end of the step card', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(200)

    // `position: sticky` keeps the bar in flow, so the last pixel of content is
    // always above it — the reason this is a bar and not a fixed overlay.
    const main = (await page.locator('main').boundingBox())!
    const box = (await bar(page).boundingBox())!
    expect(main.y + main.height).toBeLessThanOrEqual(box.y + 1)
  })

  test('leaves no dead vertical band between the content and the bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(200)

    const last = (await page.locator('main .container').last().boundingBox())!
    const box = (await bar(page).boundingBox())!
    // Page padding, not a hole where a control tray used to be.
    expect(box.y - (last.y + last.height)).toBeLessThanOrEqual(64)
  })

  test('a toast never lands on top of the primary action', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)

    await page.getByRole('button', { name: /tools/i }).click()
    await page.getByRole('button', { name: /add word/i }).click()
    await page.getByRole('dialog').getByRole('textbox', { name: /word or phrase/i }).fill('sunrise')
    await page.getByRole('button', { name: /^add$/i }).click()

    const toast = page.getByRole('status').locator('div').first()
    await expect(toast).toBeVisible()
    const t = (await toast.boundingBox())!
    const box = (await bar(page).boundingBox())!
    expect(t.y + t.height, 'toast clears the action bar').toBeLessThanOrEqual(box.y + 1)
  })
})

test.describe('progressive disclosure for the infrequent tools', () => {
  test('opens fully inside the viewport at 320px and offers both groups', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)

    await page.getByRole('button', { name: /tools/i }).click()
    const panel = page.getByRole('group', { name: /tools/i })
    await expect(panel).toBeVisible()

    const p = (await panel.boundingBox())!
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.x + p.width).toBeLessThanOrEqual(320 + 1)
    expect(p.y).toBeGreaterThanOrEqual(0)
    // Above the bar, not over it.
    const box = (await bar(page).boundingBox())!
    expect(p.y + p.height).toBeLessThanOrEqual(box.y + 1)

    await expect(panel.getByRole('button')).toHaveCount(6)
    await noOverflow(page, 'tools open @ 320px')
  })

  test('closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await startLesson(page)
    await page.getByRole('button', { name: /tools/i }).click()
    await expect(page.getByRole('group', { name: /tools/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('group', { name: /tools/i })).toHaveCount(0)
  })

  test('dismissing the menu never also advances the lesson', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await startLesson(page)
    const before = await stepPosition(page)

    await page.getByRole('button', { name: /tools/i }).click()
    await expect(page.getByRole('group', { name: /tools/i })).toBeVisible()

    /* Click straight through where "Next step" sits. A dismiss-by-outside-click
       listener would fire the button underneath; the backdrop must swallow it. */
    const next = (await page.getByRole('button', { name: /next step/i }).boundingBox())!
    await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2)

    await expect(page.getByRole('group', { name: /tools/i })).toHaveCount(0)
    expect(await stepPosition(page), 'step did not move').toBe(before)
  })

  test('scoring the step records a verdict without navigating', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    const before = await stepPosition(page)

    const partial = page.getByRole('button', { name: /^partial$/i })
    await partial.click()
    await expect(partial).toHaveAttribute('aria-pressed', 'true')
    expect(await stepPosition(page)).toBe(before)
  })
})

test.describe('the whole lesson, walked', () => {
  test('advances one step per tap and ends on “Finish lesson”, not a dead button', async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    // One tap, exactly one step.
    const before = await stepPosition(page)
    await page.getByRole('button', { name: /next step/i }).click()
    await expect.poll(() => stepPosition(page)).not.toBe(before)

    // Skip whole sections to reach the last phase quickly, then step out.
    for (let i = 0; i < 12; i++) {
      await page.getByRole('button', { name: /tools/i }).click()
      const skip = page.getByRole('button', { name: /skip this section/i })
      if (!(await skip.isVisible().catch(() => false))) {
        await page.keyboard.press('Escape')
        break
      }
      await skip.click()
      await page.waitForTimeout(80)
    }

    for (let i = 0; i < 40; i++) {
      const next = page.getByRole('button', { name: /next step/i })
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
      await page.waitForTimeout(60)
    }

    /* The primary MORPHS rather than greying out: the tutor is never left
       looking at a disabled main action wondering what closes the lesson. */
    const finish = page.getByTestId('step-action-bar').getByRole('button', { name: /finish lesson/i })
    await expect(finish).toBeVisible()
    await expect(page.locator('.btn-primary:visible')).toHaveCount(1)
    await finish.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

test.describe('locale, direction and theme', () => {
  test('no overflow at any width in Hebrew RTL, light or dark', async ({ page }) => {
    const lessonUrl = await startLesson(page)
    await page.goto('/tutor')
    await page.locator('header select').selectOption('he')
    await page.goto(lessonUrl)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    for (const theme of ['light', 'dark']) {
      await page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), theme)
      for (const width of ALL_WIDTHS) {
        await page.setViewportSize({ width, height: 800 })
        await noOverflow(page, `he ${theme} @ ${width}px`)
        const box = (await bar(page).boundingBox())!
        expect(box.height, `he ${theme} @ ${width}px bar height`).toBeLessThanOrEqual(
          MAX_BAR_HEIGHT,
        )
      }
    }
  })

  test('mirrors: the step-back control sits on the start edge in Hebrew', async ({ page }) => {
    const lessonUrl = await startLesson(page)
    await page.goto('/tutor')
    await page.locator('header select').selectOption('he')
    await page.goto(lessonUrl)
    await page.setViewportSize({ width: 360, height: 800 })

    const back = (await bar(page).locator('button').first().boundingBox())!
    // RTL start edge is the right-hand side.
    expect(back.x).toBeGreaterThan(180)

    await bar(page).getByRole('button', { name: /כלים/ }).click()
    const panel = page.getByRole('group', { name: /כלים/ })
    const p = (await panel.boundingBox())!
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.x + p.width).toBeLessThanOrEqual(361)
  })

  test('the longest locale still keeps the bar to two rows at 320px', async ({ page }) => {
    const lessonUrl = await startLesson(page)
    for (const lang of ['ru', 'fr', 'es'] as const) {
      await page.goto('/tutor')
      await page.locator('header select').selectOption(lang)
      await page.goto(lessonUrl)
      await page.setViewportSize({ width: 320, height: 800 })
      await noOverflow(page, `${lang} @ 320px`)
      const box = (await bar(page).boundingBox())!
      expect(box.height, `${lang} bar height`).toBeLessThanOrEqual(MAX_BAR_HEIGHT)
    }
  })

  test('reads as a distinct surface in dark mode, not a floating orphan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))

    const [barBg, pageBg] = await page.evaluate(() => [
      getComputedStyle(document.querySelector('[data-testid="step-action-bar"]')!).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    ])
    expect(barBg).not.toBe(pageBg)
    expect(barBg).not.toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('student mode', () => {
  test('shows no verdict buttons and no private capture tools', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const lessonUrl = await startLesson(page)

    // Student mode binds to whoever is on screen — switch from the student's
    // own dashboard, not the roster, which has no single student in view.
    await page.goto(lessonUrl.replace(/\/lesson\/.*/, ''))
    await page.getByRole('button', { name: /open menu/i }).click().catch(() => {})
    await page.getByRole('radio', { name: 'Student' }).click()
    await page.goto(lessonUrl)

    await expect(page.getByRole('button', { name: /needs work/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /tools/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /notes/i })).toHaveCount(0)
    // The learner can still be moved through the lesson.
    await expect(page.getByRole('button', { name: /next step/i })).toBeVisible()
  })
})
