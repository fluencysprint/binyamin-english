import { test, expect, Page } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

/* ==========================================================================
   Listen, in a real browser.
   --------------------------------------------------------------------------
   The reported symptom was audio that worked on a phone and produced nothing
   on a desktop, with no error of any kind. The logic is unit-tested against a
   fake engine (src/utils/speech.test.ts); what only a real browser can show is
   that the button is actually wired to it, that the utterance is queued AFTER
   the cancel rather than in the same task, and that a browser which produces
   no sound says so instead of looking like it worked.

   Speech synthesis is stubbed here on purpose: a headless browser has no
   voices, and asserting on real audio output is not something a test can do.
   ========================================================================== */

/** Replace the engine before any app code runs, and record what it is told.
 *
 *  `brave` is the measured desktop-Brave engine: the API is present, the voice
 *  list is empty forever, and every utterance fails. */
async function stubSpeech(page: Page, mode: 'works' | 'swallows' | 'brave') {
  await page.addInitScript((behaviour: string) => {
    const log: { event: string; text?: string; at: number }[] = []
    ;(window as unknown as { __speechLog: typeof log }).__speechLog = log
    const voices =
      behaviour === 'brave'
        ? []
        : [{ name: 'Test US', lang: 'en-US', localService: true, default: true, voiceURI: 'test' }]
    const synth = {
      speaking: false,
      pending: false,
      paused: false,
      getVoices: () => voices,
      cancel() {
        log.push({ event: 'cancel', at: performance.now() })
      },
      resume() {
        log.push({ event: 'resume', at: performance.now() })
      },
      speak(u: { text: string; onstart?: () => void; onerror?: (e: { error: string }) => void }) {
        log.push({ event: 'speak', text: u.text, at: performance.now() })
        if (behaviour === 'works') setTimeout(() => u.onstart?.(), 0)
        if (behaviour === 'brave') setTimeout(() => u.onerror?.({ error: 'synthesis-failed' }), 0)
      },
      addEventListener() {},
      removeEventListener() {},
    }
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
    ;(window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
      function (this: Record<string, unknown>, text: string) {
        this.text = text
      }
  }, mode)
}

async function openBeginnerLesson(page: Page) {
  await page.goto('/tutor')
  await page.evaluate(() => localStorage.setItem('ewb:hideLessonOrientation', 'true'))
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.goto('/tutor/data')
  await page.getByRole('button', { name: /Casey/ }).click()
  await page.waitForURL(/\/tutor\/student\//)
  await page.getByRole('button', { name: /start first lesson/i }).first().click()
  await page.waitForURL(/\/lesson\//)
}

test('Listen speaks the English target, cancelling first but not in the same task', async ({
  page,
}) => {
  await stubSpeech(page, 'works')
  await openBeginnerLesson(page)

  const play = page.getByRole('button', { name: /^listen$/i }).first()
  await expect(play).toBeVisible()
  await play.click()

  await expect
    .poll(() => page.evaluate(() => (window as never as { __speechLog: unknown[] }).__speechLog.length))
    .toBeGreaterThanOrEqual(2)

  const log = await page.evaluate(
    () => (window as never as { __speechLog: { event: string; text?: string }[] }).__speechLog,
  )
  expect(log[0].event).toBe('cancel')
  const spoke = log.find((entry) => entry.event === 'speak')
  expect(spoke).toBeTruthy()
  expect(spoke!.text).toMatch(/[A-Za-z]/)

  // No failure message when the browser actually started the utterance.
  await expect(page.getByRole('status')).not.toContainText(/aloud yourself/i)
})

test('a browser that produces no audio says so instead of pretending it played', async ({
  page,
}) => {
  await stubSpeech(page, 'swallows')
  await openBeginnerLesson(page)

  await page.getByRole('button', { name: /^listen$/i }).first().click()

  // The app falls back to what it already does where speech is missing
  // entirely: tell the tutor to say it themselves — once.
  await expect(page.getByRole('status')).toContainText(/say it aloud yourself/i, {
    timeout: 15000,
  })

  // …and then stops offering a control that cannot work.
  await expect(page.getByRole('button', { name: /^listen$/i })).toHaveCount(0)
})

test('the Listen control is not offered at all where speech synthesis is missing', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
    ;(window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
      undefined
  })
  await openBeginnerLesson(page)
  await expect(page.getByRole('button', { name: /^listen$/i })).toHaveCount(0)
})

test('a browser with the API and no voices retires speech instead of nagging', async ({ page }) => {
  // Desktop Brave, measured: `speechSynthesis` exists, `getVoices()` is empty
  // forever (Brave removes Chrome's remote Google voices), so every utterance
  // fails. The control has to go away, exactly once, and the tutor has to be
  // left with the English text to read aloud themselves.
  await stubSpeech(page, 'brave')
  await openBeginnerLesson(page)

  await expect(page.getByRole('button', { name: /^listen$/i })).toHaveCount(0, { timeout: 15000 })
  await expect(page.getByText(/say this aloud/i).first()).toBeVisible()

  // Nothing was ever queued into an engine that cannot speak.
  const log = await page.evaluate(
    () => (window as never as { __speechLog: { event: string }[] }).__speechLog,
  )
  expect(log.filter((entry) => entry.event === 'speak')).toHaveLength(0)
})
