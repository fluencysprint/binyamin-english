import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The header, at realistic widths, in every locale we ship.
   --------------------------------------------------------------------------
   The header used to switch layouts at a fixed `min-width: 900px` chosen for
   ENGLISH label widths. Russian and French labels are up to ~30% longer, so
   between roughly 900 and 1200px the wordmark was squeezed to zero width and
   painted straight over the navigation, and the page scrolled sideways. None
   of that is visible to jsdom: it needs a real layout engine, which is why
   this lives here and not in a unit test.

   The assertions are deliberately geometric — actual rendered rectangles —
   rather than "the class is applied". A class name cannot tell you two things
   overlapped.
   ========================================================================== */

const LANGS = ['en', 'he', 'ru', 'es', 'fr'] as const
/** Desktop, small laptop, tablet and phone, plus the widths either side of
 *  where the English-sized breakpoint used to sit. */
const WIDTHS = [1440, 1280, 1112, 1024, 940, 900, 820, 768, 600, 414, 360, 320]

interface HeaderGeometry {
  stage: string
  overflow: number
  overlap: string | null
  clipped: string | null
  height: number
}

async function headerGeometry(page: Page): Promise<HeaderGeometry> {
  return page.evaluate(() => {
    const header = document.querySelector('header')!
    const row = header.firstElementChild as HTMLElement
    const children = Array.from(row.children) as HTMLElement[]
    const boxes = children
      .map((el) => ({ el: el.tagName, ...el.getBoundingClientRect().toJSON() }))
      .sort((a, b) => a.left - b.left)

    let overlap: string | null = null
    for (let i = 1; i < boxes.length; i++) {
      // 1px of slack for sub-pixel rounding.
      if (boxes[i].left < boxes[i - 1].right - 1) {
        overlap = `${boxes[i - 1].el} (ends ${boxes[i - 1].right}) over ${boxes[i].el} (starts ${boxes[i].left})`
      }
    }

    // A child whose content is wider than its box is a label spilling out of
    // it — exactly how the wordmark ended up on top of the nav.
    let clipped: string | null = null
    for (const el of children) {
      if (el.scrollWidth > el.getBoundingClientRect().width + 1) {
        clipped = `${el.tagName}: content ${el.scrollWidth} in box ${Math.round(el.getBoundingClientRect().width)}`
      }
    }

    return {
      stage: header.dataset.stage ?? '',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overlap,
      clipped,
      height: Math.round(header.getBoundingClientRect().height),
    }
  })
}

async function unlockTutor(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
}

async function sweep(page: Page, label: string) {
  for (const lang of LANGS) {
    await page.setViewportSize({ width: 1440, height: 800 })
    await page.locator('header select').selectOption(lang)
    await page.waitForTimeout(120)

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 })
      const at = `${label} ${lang} @ ${width}px`
      await expect
        .poll(async () => (await headerGeometry(page)).overflow, { message: at, timeout: 4000 })
        .toBeLessThanOrEqual(1)

      const geometry = await headerGeometry(page)
      expect(geometry.overlap, `${at}: overlap`).toBeNull()
      expect(geometry.clipped, `${at}: clipped label`).toBeNull()
      // One row, always — never a wrapped header eating the viewport.
      expect(geometry.height, `${at}: header height`).toBeLessThanOrEqual(72)
      expect(geometry.stage, `${at}: stage`).not.toBe('')
    }
  }
}

test('the public header never overlaps or overflows, in any locale at any width', async ({ page }) => {
  await page.goto('/')
  await sweep(page, 'public')
})

test('the tutor header never overlaps or overflows, in any locale at any width', async ({ page }) => {
  // The densest header in the app: four nav links, three mode buttons, a lock,
  // a theme toggle and a language picker on one row.
  await unlockTutor(page)
  await sweep(page, 'tutor')
})

test('gives things up in order as the row narrows, and takes them back', async ({ page }) => {
  await page.goto('/')
  await page.setViewportSize({ width: 1440, height: 800 })
  await expect(page.locator('header')).toHaveAttribute('data-stage', 'full')
  await expect(page.getByText('Binyamin English', { exact: true })).toBeVisible()

  /* Narrowing must only ever remove things. Asserting the ORDER rather than a
     magic width is the point: the width at which each stage kicks in is a
     measurement and differs per locale, but a narrower row can never be
     richer than a wider one. */
  const stages = ['full', 'compact', 'menu', 'mini']
  let previous = 0
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 })
    await expect
      .poll(async () => (await headerGeometry(page)).overflow, { timeout: 4000 })
      .toBeLessThanOrEqual(1)
    const stage = (await headerGeometry(page)).stage
    const index = stages.indexOf(stage)
    expect(index, `unknown stage at ${width}px: ${stage}`).toBeGreaterThanOrEqual(0)
    expect(index, `${width}px is richer than the wider viewport before it`).toBeGreaterThanOrEqual(
      previous,
    )
    previous = index
  }

  // At the narrowest width the nav is behind one button, and still in the DOM
  // for a crawler.
  await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
  await expect(page.locator('header nav a').first()).toBeHidden()

  // Growing back restores exactly what fits again — the stage is measured, not
  // latched.
  await page.setViewportSize({ width: 1440, height: 800 })
  await expect(page.locator('header')).toHaveAttribute('data-stage', 'full')
  await expect(page.getByText('Binyamin English', { exact: true })).toBeVisible()
})

test('the language control shows a readable label until the row runs out of room', async ({
  page,
}) => {
  await page.goto('/')
  await page.setViewportSize({ width: 1440, height: 800 })
  const select = page.locator('header select')
  await select.selectOption('ru')

  // Wide: a labelled select, and NO globe icon crowding it.
  await expect(select).toHaveJSProperty('value', 'ru')
  expect(await select.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(60)
  await expect(page.locator('header label svg')).toHaveCount(0)

  await select.selectOption('he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('the language control collapses to a globe button only where the row needs it', async ({
  page,
}) => {
  // The tutor header is the dense one: at 320px it has to give up the labelled
  // select as well as the nav. The public header at the same width does not,
  // and keeps the more readable labelled control — which is the point of
  // measuring instead of picking one breakpoint for both.
  await unlockTutor(page)
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(page.locator('header')).toHaveAttribute('data-stage', 'mini')
  await expect(page.locator('header label svg')).toHaveCount(1)
  const box = await page.locator('header label').boundingBox()
  expect(Math.round(box!.width)).toBeLessThanOrEqual(44)

  // Still a real <select>: the native picker is the accessible control.
  await page.locator('header select').selectOption('he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('no footer link promotes the source repository', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(footer).toBeVisible()
  await expect(footer.locator('a')).toHaveCount(0)
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0)
  expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('open source')
})
