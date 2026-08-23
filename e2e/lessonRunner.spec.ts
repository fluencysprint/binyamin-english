import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   The lesson screen, walked the way a tutor actually walks it.
   --------------------------------------------------------------------------
   The question behind every assertion here is the one from the brief: could a
   tutor with no teaching experience know what to do within about two seconds?
   That means the nine sections are on screen, "next" is one obvious button,
   the pacing advice is present but never scolding, and — in Student mode —
   none of it exists at all.
   ========================================================================== */

const WIDTHS = [320, 360, 390, 414, 768, 1280]
const LOCALES = ['en', 'he', 'ru', 'es', 'fr'] as const

/* Every tutor-only section label, in English. Each pattern tolerates the
   leading space the inline icon contributes: Playwright does NOT normalize
   whitespace when matching by regular expression, only when matching by
   string. */
const SECTIONS = [
  /^\s*say\s*$/i,
  /^\s*do\s*$/i,
  /student does/i,
  /look for/i,
  /if they can/i,
  /if it.s easy/i,
  /move on when/i,
]

async function noOverflow(page: Page, label: string) {
  // Poll rather than sampling once: a viewport change is not synchronous, and
  // measuring mid-reflow reports a width that never actually rendered.
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

async function startLesson(page: Page, demo = /Casey/) {
  await unlockTutor(page)
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: demo }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson|start lesson|resume/i }).first().click()
  const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
  if (await orientation.isVisible().catch(() => false)) await orientation.click()
  await expect(page.getByRole('region', { name: /do this now/i })).toBeVisible()
}

test.describe('the tutor always knows what to do right now', () => {
  test('shows all nine sections of the current micro-step', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    const panel = page.getByRole('region', { name: /do this now/i })
    // NOW: the teaching move and a one-line description of what is happening.
    await expect(panel.locator('text=/meaning|model|notice|guided|recall|real use|feedback|record/i').first()).toBeVisible()
    for (const label of SECTIONS) {
      await expect(panel.getByText(label).first(), String(label)).toBeVisible()
    }
    // NEXT is a single obvious action, not a list of branches to choose from.
    await expect(page.getByRole('button', { name: /next step/i })).toBeVisible()
  })

  test('SAY gives verbatim wording, in quotes, at a readable size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    const say = page.getByRole('region', { name: /do this now/i }).locator('li').first()
    const text = (await say.textContent()) ?? ''
    expect(text).toMatch(/[“”]/)
    const size = await say.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    // Read at arm's length while looking at a student, not at the phone.
    expect(size).toBeGreaterThanOrEqual(18)
  })

  test('“Next step” advances one step at a time and rolls into the next phase', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    const nowLine = () => page.getByRole('region', { name: /do this now/i }).locator('p').first().textContent()
    const first = await nowLine()

    await page.getByRole('button', { name: /next step/i }).click()
    await expect.poll(nowLine).not.toBe(first)

    // Stepping repeatedly never dead-ends: either the step or the phase moves.
    // At the very end the primary becomes "Finish lesson" rather than a dead
    // "Next step", so the loop ends when the label is gone, not when it greys.
    for (let i = 0; i < 12; i++) {
      const before = await nowLine()
      const next = page.getByRole('button', { name: /next step/i })
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
      await expect.poll(nowLine).not.toBe(before)
    }
  })

  test('shows where we are in the lesson, and what to do about the time', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    const pacing = page.getByLabel(/where we are/i)
    await expect(pacing).toBeVisible()
    // Position in the lesson, in minutes, and position in the step sequence.
    await expect(pacing).toContainText(/\d+\s*\/\s*\d+/)
    await expect(pacing).toContainText(/step \d+ of \d+/i)
    // One clear recommendation.
    await expect(
      pacing.getByText(/keep going|make it easier|move on|change activity|start wrapping up/i),
    ).toBeVisible()
  })

  test('never paints the pacing advice as an error state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    const chip = page.getByLabel(/where we are/i).getByText(
      /keep going|make it easier|move on|change activity|start wrapping up/i,
    )
    const color = await chip.evaluate((el) => getComputedStyle(el).color)
    // The error red is rgb(168, 58, 75) — timing guidance must never use it.
    expect(color).not.toBe('rgb(168, 58, 75)')
  })

  test('keeps deeper methodology behind progressive disclosure', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    const more = page.getByText(/more teaching guidance/i).first()
    if (await more.isVisible().catch(() => false)) {
      // Collapsed by default: the lesson screen is not a place to read theory.
      const open = await more.evaluate((el) => (el.closest('details') as HTMLDetailsElement).open)
      expect(open).toBe(false)
      await more.click()
      await expect(page.getByText(/^goal$/i).first()).toBeVisible()
    }

    const outline = page.getByText(/the rest of this section/i)
    if (await outline.isVisible().catch(() => false)) {
      const open = await outline.evaluate((el) => (el.closest('details') as HTMLDetailsElement).open)
      expect(open).toBe(false)
    }
  })

  test('the closing whole-lesson score names the objective, not just "overall"', async ({ page }) => {
    // A tutor reaching the last phase has been tapping a per-step "How did
    // that go?" in the pinned bar on every step already. A second control
    // asking the near-identical question, with no visible reminder of what
    // it is scoring (the objective badge is long scrolled past), is exactly
    // the kind of thing a tired tutor mis-taps or skips without noticing.
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    for (let i = 0; i < 30; i++) {
      if (await page.getByRole('button', { name: /finish lesson/i }).isVisible().catch(() => false)) break
      const next = page.getByRole('button', { name: /next step/i })
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
    }

    const wholeLessonScore = page.getByText(/how did it go/i)
    await expect(wholeLessonScore).toBeVisible()
    // Self-contained: names the actual lesson objective in quotes, rather
    // than only repeating the pinned bar's generic "How did that go?".
    await expect(wholeLessonScore).toContainText(/[“"]/)
  })

  test('resuming after a reload does not stack the orientation modal on top of the recovery toast', async ({
    page,
  }) => {
    // Deliberately not using startLesson()/unlockTutor(): this test needs the
    // orientation modal ON (not pre-suppressed via localStorage), the same
    // state a tutor who has never dismissed it is actually in.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tutor')
    await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
    await page.getByRole('button', { name: /unlock/i }).click()
    await page.goto('/tutor/data')
    await page.getByRole('button', { name: /Casey/ }).click()
    await page.waitForURL(/\/tutor\/student\//)
    await page.getByRole('button', { name: /start first lesson|start lesson|resume/i }).first().click()

    // First time this lesson opens: the orientation modal shows, and is
    // dismissed WITHOUT checking "don't show this reminder again".
    const orientationTitle = page.getByRole('dialog', { name: /your job today/i })
    await expect(orientationTitle).toBeVisible()
    await page.getByRole('button', { name: /let’s go|let's go/i }).click()
    await expect(orientationTitle).not.toBeVisible()
    await page.getByRole('button', { name: /next step/i }).click()

    // Simulate an interruption: a dropped connection or a locked phone.
    await page.reload()
    await expect(page.getByRole('region', { name: /do this now/i })).toBeVisible()
    // The recovery toast is the only thing telling the tutor what happened —
    // the orientation modal must not reappear on top of it.
    await expect(orientationTitle).not.toBeVisible()
  })

  test('the back button’s confirmation never labels "leave the lesson" as "Cancel"', async ({ page }) => {
    // "Cancel" next to a primary "Finish" reads as "stay here, do nothing" —
    // the universal convention. This dialog's second button actually
    // navigates away from the lesson. A tutor who taps it expecting to just
    // dismiss the dialog would be unexpectedly dropped out of a live lesson.
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)

    await page.getByRole('button', { name: /casey/i }).click() // header back button
    await expect(page.getByRole('dialog', { name: /finish lesson/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^cancel$/i })).toHaveCount(0)
    const leave = page.getByRole('button', { name: /leave lesson/i })
    await expect(leave).toBeVisible()

    // The × closes the dialog and keeps the tutor on the same step — the
    // actual "changed my mind, stay here" action.
    const nowLine = () => page.getByRole('region', { name: /do this now/i }).locator('p').first().textContent()
    const before = await nowLine()
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByText(/finish this lesson and generate/i)).not.toBeVisible()
    expect(await nowLine()).toBe(before)

    // "Leave lesson" actually leaves, landing back on the student dashboard.
    await page.getByRole('button', { name: /casey/i }).click()
    await leave.click()
    await page.waitForURL(/\/tutor\/student\/[^/]+$/)
  })
})

test.describe('student mode leaks nothing', () => {
  test('hides every tutor section while showing the learner’s task', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await startLesson(page)
    const lessonUrl = page.url()

    // Student mode binds to whoever is on screen — switch from the student's
    // own dashboard, not the roster, which has no single student in view.
    await page.goto(lessonUrl.replace(/\/lesson\/.*/, ''))
    await page.getByRole('button', { name: /open menu/i }).click().catch(() => {})
    await page.getByRole('radio', { name: 'Student' }).click()
    await page.goto(lessonUrl)

    await expect(page.getByRole('region', { name: /do this now/i })).toHaveCount(0)
    await expect(page.getByLabel(/where we are/i)).toHaveCount(0)
    for (const label of SECTIONS) {
      await expect(page.getByText(label), String(label)).toHaveCount(0)
    }
    // But there IS a task on screen.
    await expect(page.locator('main')).not.toBeEmpty()
  })
})

test.describe('layout survives every viewport, locale and theme', () => {
  test('no horizontal overflow anywhere in the runner', async ({ page }) => {
    await startLesson(page)
    const lessonUrl = page.url()

    for (const lang of LOCALES) {
      await page.goto('/tutor')
      await page.locator('header select').selectOption(lang)
      await page.goto(lessonUrl)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 })
        await noOverflow(page, `${lang} @ ${width}px`)
      }
    }
  })

  test('survives dark mode and Hebrew RTL at 320px', async ({ page }) => {
    await startLesson(page)
    const lessonUrl = page.url()
    await page.goto('/tutor')
    await page.locator('header select').selectOption('he')
    await page.goto(lessonUrl)
    await page.setViewportSize({ width: 320, height: 800 })
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await noOverflow(page, 'he + dark @ 320px')

    // English exemplars stay left-to-right inside the RTL page. The panel's
    // accessible name is itself localized, so it is found by role rather than
    // by its English label here.
    const say = page.locator('main section[aria-label] li').first()
    await expect(say).toHaveAttribute('dir', 'ltr')
  })

  test('the primary action is a comfortable touch target on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await startLesson(page)
    const box = await page.getByRole('button', { name: /next step/i }).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('forms ask for the right keyboard and refuse impossible values', () => {
  test('the onboarding age field opens a numeric keypad and is bounded', async ({ page }) => {
    await unlockTutor(page)
    await page.goto('/tutor/new')

    const age = page.getByLabel(/^age$/i)
    await expect(age).toHaveAttribute('type', 'number')
    await expect(age).toHaveAttribute('inputmode', 'numeric')
    await expect(age).toHaveAttribute('min', '5')
    await expect(age).toHaveAttribute('max', '120')
  })

  test('rejects an impossible age with a friendly message, and blocks Next', async ({ page }) => {
    await unlockTutor(page)
    await page.goto('/tutor/new')

    await page.getByLabel(/first name or nickname/i).fill('Sam')
    const age = page.getByLabel(/^age$/i)
    await age.fill('200')
    await age.blur()

    await expect(page.getByRole('alert')).toContainText(/between 5 and 120/i)
    await expect(page.getByRole('button', { name: /^next$/i })).toBeDisabled()

    await age.fill('9')
    await expect(page.getByRole('button', { name: /^next$/i })).toBeEnabled()
  })

  test('keeps a Hebrew, Russian or accented name exactly as typed', async ({ page }) => {
    await unlockTutor(page)
    await page.goto('/tutor/new')
    const name = page.getByLabel(/first name or nickname/i)

    for (const value of ['בנימין', 'Биньямин', 'José Muñoz', 'Élodie']) {
      await name.fill(value)
      await name.blur()
      await expect(name).toHaveValue(value)
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  })

  test('school grade is chosen, not typed', async ({ page }) => {
    await unlockTutor(page)
    await page.goto('/tutor/new')
    await page.getByLabel(/first name or nickname/i).fill('Sam')
    await page.getByLabel(/^age$/i).fill('10')
    await expect(page.getByLabel(/school grade/i)).toHaveJSProperty('tagName', 'SELECT')
  })

  /* The booking form no longer asks how to reach you — it asks for an email,
     because that is the only route the site offers. What is left to check is
     that the field is typed for an email keyboard and that a malformed
     address is caught before an unanswerable enquiry is sent. */
  test('the booking email field asks the keyboard for an @ key', async ({ page }) => {
    await page.goto('/book/')
    const email = page.getByLabel(/^email$/i)
    await expect(email).toHaveAttribute('type', 'email')
    await expect(email).toHaveAttribute('inputmode', 'email')
    await expect(email).toHaveAttribute('autocomplete', 'email')
  })

  test('flags a malformed email address instead of sending an unanswerable inquiry', async ({ page }) => {
    await page.goto('/book/')
    await page.getByLabel(/your name/i).fill('Sam')
    await page.getByLabel(/^email$/i).fill('not-an-email')
    await page.getByRole('button', { name: /copy instead/i }).click()

    await expect(page.getByRole('alert').first()).toContainText(/email address/i)
    // Nothing was copied, so the manual fallback has not appeared either.
    await expect(page.getByText('heybinyamin@gmail.com')).toHaveCount(0)

    await page.getByLabel(/^email$/i).fill('sam@example.com')
    await page.getByRole('button', { name: /copy instead/i }).click()
    await expect(page.getByText('heybinyamin@gmail.com')).toBeVisible()
  })

  test('shows validation messages in the visitor’s own language', async ({ page }) => {
    await page.goto('/book/')
    await page.locator('header select').selectOption('ru')
    await page.getByLabel(/Ваше имя/i).fill('Сэм')
    await page.getByLabel(/Электронная почта/i).fill('не-почта')
    await page.getByRole('button', { name: /Скопировать$/i }).click()
    // Cyrillic, not an English fallback.
    await expect(page.getByRole('alert').first()).toContainText(/[Ѐ-ӿ]/)
  })
})
