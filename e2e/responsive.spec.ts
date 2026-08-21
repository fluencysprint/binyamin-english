import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   Narrow-viewport regression coverage for the three headers.
   --------------------------------------------------------------------------
   All three failures this guards against were only visible in a real layout
   engine on a real phone: the public nav wrapped onto three rows and ate ~150px
   of viewport before any content; the tutor mode switcher pushed the header
   wider still; and the lesson runner squeezed eleven controls into one sticky
   bar until they overlapped and clipped. jsdom cannot see any of it.
   ========================================================================== */

const PHONE_WIDTHS = [320, 360, 390, 414]
const ALL_WIDTHS = [...PHONE_WIDTHS, 768, 1024, 1440]
const LANGS = ['en', 'he', 'ru', 'es', 'fr'] as const

async function expectNoOverflow(page: Page, label: string) {
  // Polled, not sampled once: a viewport change is not synchronous, so reading
  // the width immediately after setViewportSize can report the PREVIOUS
  // layout — which is how this occasionally reported 843px at a 320px
  // viewport. A steady-state overflow still fails, it just no longer flakes.
  // 1px of slack for sub-pixel rounding of hairline borders.
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
  // The lesson-runner orientation modal is dismissible and remembered. Opt out
  // up front: waiting for it to appear and then clicking it through is a race,
  // and its backdrop swallows every click in the meantime.
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
}

test.describe('public header', () => {
  test('stays a single compact row at every phone width, in every locale', async ({ page }) => {
    for (const lang of LANGS) {
      await page.setViewportSize({ width: 320, height: 800 })
      await page.goto('/')
      await page.locator('header select').selectOption(lang)

      for (const width of PHONE_WIDTHS) {
        await page.setViewportSize({ width, height: 800 })
        const header = await page.locator('header').boundingBox()
        // One row of 40px controls plus padding. The wrapped version was 150px+.
        expect(header!.height, `${lang} @ ${width}px header height`).toBeLessThanOrEqual(72)
        await expectNoOverflow(page, `${lang} @ ${width}px`)
      }
    }
  })

  test('hides the nav links behind one menu button below the nav breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')

    const menu = page.getByRole('button', { name: /open menu/i })
    await expect(menu).toBeVisible()
    // The links exist for crawlers but are not shown until the menu opens.
    await expect(page.locator('header nav a').first()).toBeHidden()

    await menu.click()
    const links = page.locator('header nav a')
    await expect(links).toHaveCount(4)
    for (let i = 0; i < 4; i++) await expect(links.nth(i)).toBeVisible()
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible()
  })

  test('the mobile menu closes on Escape and on navigating', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/')

    await page.getByRole('button', { name: /open menu/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.locator('header nav a').first()).toBeHidden()

    await page.getByRole('button', { name: /open menu/i }).click()
    await page.locator('header nav').getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.locator('header nav a').first()).toBeHidden()
  })

  test('shows the full nav inline on a desktop, with no menu button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await expect(page.locator('header nav a')).toHaveCount(4)
    await expect(page.getByRole('button', { name: /open menu/i })).toHaveCount(0)
  })

  test('stays pinned to the top of a long page while scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 })
    await page.goto('/')
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(150)
    const box = await page.locator('header').boundingBox()
    expect(box!.y).toBeLessThanOrEqual(1)
  })

  test('survives dark mode and Hebrew RTL at the narrowest width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/')
    await page.locator('header select').selectOption('he')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // Cycle the theme control until dark is active.
    for (let i = 0; i < 3; i++) {
      if ((await page.locator('html').getAttribute('data-theme')) === 'dark') break
      await page.getByRole('button', { name: /theme|ערכת נושא/i }).click()
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expectNoOverflow(page, 'he + dark @ 320px')

    await page.getByRole('button', { name: /פתיחת תפריט/ }).click()
    await expect(page.locator('header nav a')).toHaveCount(4)
    await expectNoOverflow(page, 'he + dark @ 320px, menu open')
  })
})

test.describe('tutor header', () => {
  test('keeps the mode switcher reachable without growing the header', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await unlockTutor(page)
    await expect(page.getByText(/no students yet/i)).toBeVisible()

    const header = await page.locator('header').boundingBox()
    expect(header!.height).toBeLessThanOrEqual(72)
    // Mode controls are not in the collapsed header row…
    await expect(page.getByRole('radiogroup')).toBeHidden()

    // …but are one tap away, inside the same menu as the nav.
    await page.getByRole('button', { name: /open menu/i }).click()
    await expect(page.getByRole('radiogroup')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Together' })).toBeVisible()
    await expectNoOverflow(page, 'tutor menu @ 360px')
  })

  test('shows the mode switcher inline on a desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await unlockTutor(page)
    await expect(page.locator('header').getByRole('radiogroup')).toBeVisible()
  })

  test('has no horizontal overflow anywhere in the tutor area', async ({ page }) => {
    await unlockTutor(page)
    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 800 })
      await expectNoOverflow(page, `tutor home @ ${width}px`)
      await page.goto('/tutor/data')
      await expectNoOverflow(page, `data page @ ${width}px`)
    }
  })
})

test.describe('data & backups', () => {
  test('renders backup actions as SVG icons, never as missing-glyph boxes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await unlockTutor(page)
    await page.goto('/tutor/data')

    for (const name of [/export backup/i, /import backup/i]) {
      const button = page.getByRole('button', { name })
      await expect(button).toBeVisible()
      await expect(button.locator('svg')).toHaveCount(1)
      // The original bug shipped U+2B73 / U+2B71 as text. Nothing outside the
      // label's own script may remain in the accessible name.
      const text = (await button.textContent()) ?? ''
      expect(text).not.toMatch(/[⬀-⯿\u{1F000}-\u{1FAFF}]/u)
    }
    await expectNoOverflow(page, 'data page @ 360px')
  })
})

test.describe('lesson runner', () => {
  async function startLesson(page: Page) {
    await unlockTutor(page)
    await page.goto('/tutor/data')
    await page.getByRole('button', { name: /Casey/ }).click()
    await page.waitForURL(/\/tutor\/student\//)
    await page.getByRole('button', { name: /start first lesson/i }).click()
    const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
    if (await orientation.isVisible().catch(() => false)) await orientation.click()
    await expect(page.getByTestId('step-action-bar')).toBeVisible()
  }

  test('fits the sticky header and all actions at 320px without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)

    await expectNoOverflow(page, 'lesson runner @ 320px')

    // The sticky header carries session state only, and stays shallow enough
    // to leave the phase content visible.
    const header = page.locator('header').first()
    const headerBox = (await header.boundingBox())!
    expect(headerBox.height).toBeLessThanOrEqual(140)

    // Nothing in the top row overlaps: compare rendered rectangles, not DOM
    // order — this is exactly what the screenshot showed going wrong.
    const boxes = await header.locator(':scope > div').first().evaluate((row) =>
      Array.from(row.children).map((child) => {
        const r = child.getBoundingClientRect()
        return { left: r.left, right: r.right, width: r.width }
      }),
    )
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].left, `header child ${i} overlaps ${i - 1}`).toBeGreaterThanOrEqual(boxes[i - 1].right - 1)
      expect(boxes[i].width).toBeGreaterThan(0)
    }
  })

  test('keeps every secondary action at most two taps away', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)

    /* Frequent work is on the bar itself: judge the step, then advance. */
    const bar = page.getByTestId('step-action-bar')
    for (const name of [/previous/i, /next step/i, /^correct$/i, /^partial$/i, /needs work/i]) {
      await expect(bar.getByRole('button', { name }).first(), String(name)).toBeVisible()
    }

    /* Everything infrequent is behind ONE disclosure rather than a permanent
       five-button tray: capture tools plus the two session utilities. */
    await page.getByRole('button', { name: /tools/i }).click()
    for (const name of [
      /quick correction/i,
      /record sample/i,
      /add word/i,
      /notes/i,
      /skip this section/i,
      /hide timer|show timer/i,
    ]) {
      await expect(page.getByRole('button', { name }).first(), String(name)).toBeVisible()
    }

    await page.getByRole('button', { name: /quick correction/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('has no overflow at any width, in Hebrew RTL too', async ({ page }) => {
    await startLesson(page)
    const lessonUrl = page.url()

    // The runner has no language control of its own (by design — it is a
    // focused screen), so switch locale on a page that does and come back.
    await page.goto('/tutor')
    await page.locator('header select').selectOption('he')
    await page.goto(lessonUrl)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 800 })
      await expectNoOverflow(page, `lesson runner he @ ${width}px`)
    }
  })
})
