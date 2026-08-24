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

/**
 * Walk forward through the lesson until the learner's own instruction is a
 * Hebrew sentence with English quoted inside it.
 *
 * A beginner lesson opens on the step where the tutor is ACTING the meaning
 * out and the learner's screen is deliberately bare, so the mixed-script case
 * is a step or two in. Which step it lands on is a curriculum decision and is
 * allowed to change; that there is one, and that it renders correctly, is not.
 */
async function firstMixedInstruction(page: import('@playwright/test').Page) {
  for (let i = 0; i < 6; i++) {
    const instruction = page.locator('section[dir="rtl"] p').first()
    await expect(instruction).toBeVisible()
    const text = await instruction.innerText()
    if (/[֐-׿]/.test(text) && (await instruction.locator('bdi').count()) > 0) return instruction
    await page.getByRole('button', { name: /השלב הבא/ }).click()
  }
  throw new Error('no Hebrew instruction with an embedded English target in this lesson')
}

test('an English phrase inside a Hebrew instruction keeps its quotes and reads left-to-right', async ({
  page,
}) => {
  await startHebrewLesson(page)

  const instruction = await firstMixedInstruction(page)
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
  const instruction = await firstMixedInstruction(page)
  const text = await instruction.innerText()

  // No doubled marks anywhere on the learner's screen.
  expect(text).not.toMatch(/([“”‘’«»„"])\1|“”|«»/)

  // Isolation must not have edited the string: the Hebrew is still there, the
  // English is still there, and nothing was respaced to fake the layout.
  expect(text).not.toContain('  ')
})

/* ==========================================================================
   A fully-English report line (a lesson topic name) inside an otherwise
   Hebrew report renders as its OWN left-to-right unit — bullet included —
   rather than inheriting the RTL container's marker gutter.
   ========================================================================== */

test('an English-only "worked on" line gets its own LTR bullet, on the left, inside a Hebrew report', async ({
  page,
}) => {
  await page.goto('/he/sample-report/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const item = page.getByText('Talking about last weekend (past simple)', { exact: true })
  await expect(item).toBeVisible()
  expect(await item.evaluate((el) => el.tagName.toLowerCase())).toBe('li')
  expect(await item.evaluate((el) => el.getAttribute('dir'))).toBe('ltr')
  expect(await item.evaluate((el) => getComputedStyle(el).direction)).toBe('ltr')

  // The manually-drawn bullet (`::before`) sits at the LI's own start edge —
  // for an LTR item that is its LEFT edge, not the right edge the
  // surrounding RTL list would otherwise reserve space on.
  const { bulletLeft, itemLeft } = await item.evaluate((el) => {
    const itemBox = el.getBoundingClientRect()
    const beforeLeft = parseFloat(getComputedStyle(el, '::before').left || '0') + itemBox.left
    return { bulletLeft: beforeLeft, itemLeft: itemBox.left }
  })
  expect(Math.abs(bulletLeft - itemLeft)).toBeLessThan(2)
})

/* ==========================================================================
   Correction arrow direction — student/original form must always visually
   point toward the improved form, whichever side of the row that is.
   ========================================================================== */

test('the correction arrow points from the original toward the correction, in EN (left-to-right) and HE (right-to-left)', async ({
  page,
}) => {
  await page.goto('/sample-report/')
  const saidEn = page.getByText('I go to my cousin house', { exact: true })
  await expect(saidEn).toBeVisible()
  const rowEn = saidEn.locator('xpath=..')
  const betterEn = rowEn.getByText("I went to my cousin's house", { exact: true })
  const arrowEn = rowEn.locator('svg')
  await expect(arrowEn).toBeVisible()

  const saidBoxEn = await saidEn.boundingBox()
  const betterBoxEn = await betterEn.boundingBox()
  const arrowBoxEn = await arrowEn.boundingBox()
  expect(saidBoxEn && betterBoxEn && arrowBoxEn).toBeTruthy()
  // LTR: said (original) is on the left, the arrow sits to its right, the
  // correction is further right still — the arrow points rightward, from
  // said toward better, matching an unflipped "→".
  expect(arrowBoxEn!.x).toBeGreaterThan(saidBoxEn!.x)
  expect(betterBoxEn!.x).toBeGreaterThan(arrowBoxEn!.x)
  const rotationEn = await arrowEn.evaluate((el) => getComputedStyle(el).transform)
  expect(rotationEn === 'none' || rotationEn === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)

  await page.goto('/he/sample-report/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  const saidHe = page.getByText('I go to my cousin house', { exact: true })
  await expect(saidHe).toBeVisible()
  const rowHe = saidHe.locator('xpath=..')
  const betterHe = rowHe.getByText("I went to my cousin's house", { exact: true })
  const arrowHe = rowHe.locator('svg')

  const saidBoxHe = await saidHe.boundingBox()
  const betterBoxHe = await betterHe.boundingBox()
  expect(saidBoxHe && betterBoxHe).toBeTruthy()
  // RTL: the flex row reverses, so the original now sits on the RIGHT and
  // the correction on the LEFT — the arrow icon must be mirrored
  // (`flip-in-rtl`, scaleX(-1)) so it still points from said toward better,
  // i.e. now pointing LEFT.
  expect(saidBoxHe!.x).toBeGreaterThan(betterBoxHe!.x)
  const transformHe = await arrowHe.evaluate((el) => getComputedStyle(el).transform)
  expect(transformHe).toBe('matrix(-1, 0, 0, 1, 0, 0)')

  // Screen readers get an explicit relationship, not just an arrow glyph.
  await expect(rowHe.getByText('תוקן ל')).toHaveCount(1)
})

/* ==========================================================================
   A full English sentence embedded in a Hebrew homework instruction must
   stay isolated and readable at phone width, not overflow or get clipped by
   a blunt `white-space: nowrap`.
   ========================================================================== */

test('an English sentence inside Hebrew homework wraps cleanly at 320px with no horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/he/sample-report/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const homework = page.getByRole('heading', { name: 'שיעורי בית' })
  await expect(homework).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)

  // The first homework task quotes TWO corrections joined by the app's
  // phrase separator (" · "). BidiText's `block` prop renders 2+ joined
  // phrases as their own LTR list — one `.bidi-phrase` per item — rather
  // than one long inline run, which is what stops a phrase from scattering
  // its punctuation when it has to wrap inside the surrounding RTL
  // paragraph. "She doesn't like it" must render as an intact, LTR phrase.
  const phrase = page.locator('.bidi-phrase', { hasText: "She doesn't like it" })
  await expect(phrase.first()).toBeVisible()
  expect(await phrase.first().evaluate((el) => getComputedStyle(el).direction)).toBe('ltr')
  const box = await phrase.first().boundingBox()
  expect(box).toBeTruthy()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(321)

  // The task's OTHER correction is a separate phrase line, not glued to this
  // one with a bullet in between — the exact defect the screenshots behind
  // this fix showed (several English phrases run together inside Hebrew
  // prose, hard to parse and prone to wrapping mid-sentence).
  const otherPhrase = page.locator('.bidi-phrase', { hasText: "I went to my cousin's house" })
  await expect(otherPhrase.first()).toBeVisible()
  const otherBox = await otherPhrase.first().boundingBox()
  expect(otherBox).toBeTruthy()
  expect(Math.abs(otherBox!.y - box!.y)).toBeGreaterThan(10)
})

/* ==========================================================================
   Regression: an embedded English phrase that ends in its OWN parenthetical
   — `"Talking about last weekend (past simple)"` — inside a Hebrew "what
   went well" sentence. The opening quote sits right before "Talking", not
   right before "past", so the `(past simple)` parenthetical's own opener is
   INSIDE the isolate rather than at its edge; the closing `)` (and the `”`
   past it) used to fall outside the <bdi> and land on the wrong side of the
   Hebrew sentence, exactly as shown in the reported screenshot.
   ========================================================================== */

test('a quoted English phrase with a trailing parenthetical stays one LTR isolate inside a Hebrew sentence', async ({
  page,
}) => {
  await page.goto('/he/sample-report/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const sentence = page.getByText(/השתמשתם ב-.*בצורה מדויקת\./).first()
  await expect(sentence).toBeVisible()

  // The whole quoted phrase — opener, parenthetical, closer — is ONE isolate.
  const isolate = sentence.locator('bdi[dir="ltr"]', { hasText: 'Talking about last weekend' }).first()
  await expect(isolate).toBeVisible()
  expect(await isolate.innerText()).toBe('“Talking about last weekend (past simple)”')
  expect(await isolate.evaluate((el) => getComputedStyle(el).direction)).toBe('ltr')

  // Visual proof: the opening quote renders to the LEFT of the closing one,
  // and the closing paren renders to the left of the closing quote — i.e.
  // nothing was reordered by the surrounding RTL paragraph.
  const { openX, closeParenX, closeQuoteX } = await isolate.evaluate((el) => {
    const node = el.firstChild as Text
    const rect = (start: number, end: number) => {
      const range = document.createRange()
      range.setStart(node, start)
      range.setEnd(node, end)
      return range.getBoundingClientRect().x
    }
    const text = node.textContent!
    return {
      openX: rect(0, 1),
      closeParenX: rect(text.length - 2, text.length - 1),
      closeQuoteX: rect(text.length - 1, text.length),
    }
  })
  expect(closeParenX).toBeGreaterThan(openX)
  expect(closeQuoteX).toBeGreaterThan(closeParenX)

  // No stray quote/paren left stranded in the Hebrew text around it.
  const sentenceText = await sentence.innerText()
  expect(sentenceText).not.toMatch(/([“”])\1/)
  expect(sentenceText).toContain('“Talking about last weekend (past simple)” בצורה')
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

/* ==========================================================================
   The beginner phrase curriculum's lesson-preview list joins several full
   English phrases with " · " inside a Hebrew phase title (e.g.
   `חדש: Hello. · Good ___.`). Screenshotted failure: that run wrapped as one
   long inline isolate inside the RTL list, so a trailing "?" could lead the
   wrapped line and separate phrases ran together behind a bullet. BidiText's
   `block` prop renders each phrase as its own line instead — this checks
   that shape actually lands in a real layout, at phone width, in Hebrew.
   ========================================================================== */

test('a multi-phrase lesson-preview title renders each English phrase on its own line, not glued behind a bullet', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByLabel(/language/i).selectOption('he')
  // Alex is the preA1 beginner profile the phrase curriculum drives — its
  // first lesson preview always opens on a multi-phrase "meet" block.
  await page.getByRole('button', { name: /Alex/ }).click()
  await page.waitForURL(/\/tutor\/student\//)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)

  const phraseGroup = page.locator('.bidi-phrases').first()
  await expect(phraseGroup).toBeVisible()
  expect(await phraseGroup.evaluate((el) => getComputedStyle(el).direction)).toBe('ltr')

  const phrases = phraseGroup.locator('.bidi-phrase')
  const count = await phrases.count()
  expect(count).toBeGreaterThan(1)

  // No bullet/middle-dot leaks into a rendered phrase line — the whole point
  // of splitting on it was to stop phrases running together behind one.
  for (const text of await phrases.allInnerTexts()) expect(text).not.toContain('·')

  // Each phrase sits on its own line and inside the viewport — never
  // overlapping the one before it, never clipped past the right edge.
  const boxes = await phrases.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y)
  }
  for (const box of boxes) {
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(391)
  }
})

/* ==========================================================================
   The "where we left off" briefing card, at the exact production defect this
   is a follow-up to: a homework instruction that embeds BOTH a single English
   sentence frame ("Good ___.") AND a short comma-joined example list
   ("morning, afternoon, evening") inside one Hebrew sentence, with a Hebrew
   parenthetical wrapping the second one.

   Screenshotted failure: the frame's own trailing period and the closing
   `).` after the word list were never inside an isolate (the OLD heuristic
   only absorbed trailing punctuation for a run of 2+ " · "-joined phrases —
   see bidi.test.ts), so both landed on the wrong side of their English
   content. `HomeworkItemText`/`BidiTrans` fix this structurally: `frame` and
   `words` are isolated by their own VALUE, never recovered by scanning the
   finished translated string, so nothing is left to fall outside either
   isolate. Finishing Casey's first phrase lesson is what makes this exact
   instruction reproducible — it always yields a "usePhraseFrame" homework
   task for "Good ___." with slots morning/afternoon/evening.
   ========================================================================== */

async function finishCaseysFirstLesson(page: import('@playwright/test').Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByLabel(/language/i).selectOption('he')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /התחלת שיעור ראשון/ }).click()
  await page.waitForURL(/\/lesson\//)
  await page.getByRole('button', { name: /Casey/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^סיום$/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
}

for (const width of [390, 820, 1280]) {
  test(`usePhraseFrame homework isolates the frame and the example words at ${width}px, punctuation on the right side of each`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await finishCaseysFirstLesson(page)

    const item = page.locator('li', { hasText: 'הרכיבו' }).first()
    await expect(item).toBeVisible()

    const bdis = item.locator('bdi')
    await expect(bdis).toHaveCount(2)
    await expect(bdis.nth(0)).toHaveText('Good ___.')
    await expect(bdis.nth(1)).toHaveText('morning, afternoon, evening')
    for (const bdi of await bdis.all()) {
      expect(await bdi.evaluate((el) => (el as HTMLElement).getAttribute('dir'))).toBe('ltr')
    }

    // Lossless: the line reads exactly like the acceptance screenshot, in
    // logical order, with both trailing marks — "Good ___." and the closing
    // ").") — attached to the English/Hebrew content they actually belong to.
    const text = (await item.innerText()).replace(/\s+/g, ' ').trim()
    expect(text).toBe(
      'הרכיבו שלושה משפטים משלכם עם Good ___. (אפשר לנסות: morning, afternoon, evening).',
    )

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('the same homework line renders as plain, unisolated text in English — no visible regression', async ({
  page,
}) => {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson/i }).click()
  await page.waitForURL(/\/lesson\//)
  await page.getByRole('button', { name: /Casey/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^finish$/i }).click()
  await page.waitForURL(/\/tutor\/student\//)

  const item = page.locator('li', { hasText: 'Make three sentences' }).first()
  await expect(item).toBeVisible()
  // English has no RTL script anywhere in the sentence, so nothing needs an
  // isolate — this is the "pay nothing" path `translateSegments` documents.
  await expect(item.locator('bdi')).toHaveCount(0)
  await expect(item).toContainText('Good ___. (try: morning, afternoon, evening).')
})
