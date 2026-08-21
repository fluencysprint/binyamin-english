import { test, expect, Page } from '@playwright/test'

/* ==========================================================================
   The public conversion path, in a real browser.
   --------------------------------------------------------------------------
   Everything here is about a stranger deciding whether to book a lesson:
   does the format reach them before they invest effort, does the enquiry form
   stay short, does what they typed survive, and does the site avoid claiming
   things that are not true. jsdom cannot see the layout half of that, and the
   honesty half is worth pinning wherever it runs. The site never states a
   lesson price, so nothing here asserts one either — see branding.test.ts for
   the regression check that pricing copy stays gone.
   ========================================================================== */

const LANGS = ['en', 'he', 'ru', 'es', 'fr'] as const
const WIDTHS = [320, 360, 390, 414, 768, 1024, 1440]

/** "50 minutes" is the lesson length stated in the default (English) locale. */
const LESSON_LENGTH = /50 minutes/

async function expectNoOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      { message: label, timeout: 5000 },
    )
    .toBeLessThanOrEqual(1)
}

test.describe('landing page', () => {
  test('states the lesson format and what a lesson leaves behind, above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')

    const hero = page.locator('section').first()
    await expect(hero.getByText(LESSON_LENGTH).first()).toBeVisible()
    // The four deliverables are the whole premium argument; they are not
    // allowed to drift below the age cards again.
    const deliverables = page.getByRole('complementary')
    await expect(deliverables.locator('li')).toHaveCount(4)
    await expect(deliverables).toBeInViewport()
  })

  test('leads with booking, not with the free check', async ({ page }) => {
    await page.goto('/')
    const first = page.locator('main a.btn').first()
    await expect(first).toHaveClass(/btn-primary/)
    await expect(first).toHaveAttribute('href', /\/book\/$/)
  })

  test('has no horizontal overflow in any locale at any width', async ({ page }) => {
    for (const lang of LANGS) {
      await page.goto('/')
      await page.locator('header select').selectOption(lang)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await expectNoOverflow(page, `landing ${lang} @ ${width}px`)
      }
    }
  })
})

test.describe('booking', () => {
  test('asks four things and nothing more', async ({ page }) => {
    await page.goto('/book/')
    // Two text inputs (name, email) and one textarea. The fourteen-field
    // version of this form is what this test exists to prevent coming back.
    await expect(page.locator('form input:not([type="button"])')).toHaveCount(2)
    await expect(page.locator('form textarea')).toHaveCount(1)
    await expect(page.getByText(LESSON_LENGTH).first()).toBeVisible()
  })

  test('keeps what the visitor typed when they leave and come back', async ({ page }) => {
    await page.goto('/book/')
    await page.getByLabel(/your name/i).fill('Dana')
    await page.getByLabel(/anything else/i).fill('Evenings are easier')

    await page.goto('/')
    await page.goto('/book/')
    await expect(page.getByLabel(/your name/i)).toHaveValue('Dana')
    await expect(page.getByLabel(/anything else/i)).toHaveValue('Evenings are easier')
  })

  test('never claims an enquiry was submitted, and offers the address only on request', async ({ page }) => {
    await page.goto('/book/')
    expect(await page.content()).not.toContain('heybinyamin')

    await page.getByLabel(/your name/i).fill('Dana')
    await page.getByLabel(/^email$/i).fill('dana@example.com')
    await page.getByRole('button', { name: /copy instead/i }).click()

    // A manual route appears; nothing anywhere says "sent" or "submitted".
    await expect(page.getByText('heybinyamin@gmail.com')).toBeVisible()
    await expect(page.getByText(/nothing is sent automatically/i)).toBeVisible()
  })

  test('has no horizontal overflow in any locale at any width', async ({ page }) => {
    for (const lang of LANGS) {
      await page.goto('/book/')
      await page.locator('header select').selectOption(lang)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await expectNoOverflow(page, `booking ${lang} @ ${width}px`)
      }
    }
  })
})

test.describe('honesty of the public copy', () => {
  test('claims no credentials, testimonials or guarantees, in any locale', async ({ page }) => {
    /* Twenty full page loads — five locales across four public pages — so this
       one is slow by construction rather than by fault. */
    test.slow()
    /* Written as one alternation across the five locales: the thing being
       prevented is a claim the tutor cannot back, whatever language it
       arrives in. */
    const FORBIDDEN = [
      /TEFL|TESOL|CELTA/i,
      /certified|certificado|certifié|сертифицирован|מוסמך/i,
      /guaranteed|garantizado|garanti|гарантированн|מובטח/i,
      /testimonial|testimonio|témoignage|отзыв|המלצות/i,
      /years of experience|años de experiencia|ans d’expérience|лет опыта|שנות ניסיון/i,
      /AI-powered|revolutionary|revolucionario|révolutionnaire|революционн/i,
      /open[- ]source|GitHub|IndexedDB/i,
    ]
    for (const lang of LANGS) {
      for (const path of ['/', '/about/', '/book/', '/check-english/']) {
        await page.goto(path)
        await page.locator('header select').selectOption(lang)
        const text = await page.locator('main').innerText()
        for (const pattern of FORBIDDEN) {
          expect(text, `${lang}${path} — ${pattern}`).not.toMatch(pattern)
        }
      }
    }
  })
})

test.describe('assessment funnel', () => {
  test('the intro says what the check cannot measure', async ({ page }) => {
    await page.goto('/check-english/')
    await expect(page.getByText(/cannot hear you speak/i)).toBeVisible()
  })
})
