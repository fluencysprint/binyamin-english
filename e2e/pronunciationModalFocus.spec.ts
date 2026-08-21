import { test, expect } from '@playwright/test'
import { TUTOR_GATE_PHRASE } from '../src/app/config'

// Real-Chromium regression test for a focus-loss bug in the pronunciation
// recordings modal: the lesson runner re-renders on a 1s elapsed-time timer,
// which (before the fix) recreated the modal's `onClose` closure every tick
// and re-triggered a `useEffect` in <Modal> that called `.focus()` on the
// dialog wrapper — stealing focus away from whatever input the user was
// typing into. Types full sentences with real per-key delays so several
// timer ticks land mid-sentence, in a real browser.

const SENTENCE = 'I worked there for three years.'

async function createStudentAndStartLesson(page: import('@playwright/test').Page) {
  await page.goto('/tutor')
  await page.getByPlaceholder(/access phrase/i).fill(TUTOR_GATE_PHRASE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await expect(page.getByText(/no students yet/i)).toBeVisible()

  await page.getByRole('link', { name: /new student/i }).first().click()
  await page.getByLabel(/first name or nickname/i).fill('Ana')
  await page.getByLabel(/^age$/i).fill('30')
  await page.getByRole('button', { name: /^next$/i }).click()
  await page.getByRole('radio', { name: /already fluent/i }).click()
  await page.getByRole('button', { name: /^next$/i }).click()
  await page.getByRole('button', { name: /create student/i }).click()

  await expect(page.getByRole('heading', { name: 'Ana' })).toBeVisible()
  await page.getByRole('button', { name: /start first lesson/i }).click()
  await expect(page.getByTestId('step-action-bar')).toBeVisible()

  const orientation = page.getByRole('button', { name: /let’s go|let's go/i })
  if (await orientation.isVisible().catch(() => false)) {
    await orientation.click()
  }
}

async function openRecordingModal(page: import('@playwright/test').Page) {
  // Capture tools live behind the action bar's "Tools" disclosure now, rather
  // than in a permanent tray under the step.
  await page.getByRole('button', { name: /tools/i }).click()
  await page.getByRole('button', { name: /record sample/i }).click()
  const dialog = page.getByRole('dialog', { name: /pronunciation recordings/i })
  await expect(dialog).toBeVisible()

  const privacyAck = dialog.getByRole('button', { name: /i understand/i })
  if (await privacyAck.isVisible().catch(() => false)) {
    await privacyAck.click()
  }
  return dialog
}

test('target-sentence input keeps focus while typing across timer ticks', async ({ page }) => {
  await createStudentAndStartLesson(page)
  const dialog = await openRecordingModal(page)

  const target = dialog.getByLabel(/target word or sentence/i)
  await target.click()
  await expect(target).toBeFocused()

  // Real per-key delay so the lesson's 1s elapsed-timer interval genuinely
  // fires mid-sentence in this real browser.
  await target.pressSequentially(SENTENCE, { delay: 150 })

  await expect(target).toHaveValue(SENTENCE)
  await expect(target).toBeFocused()
})

test('note field keeps focus while typing, after recording a sample', async ({ page }) => {
  await createStudentAndStartLesson(page)
  const dialog = await openRecordingModal(page)

  await dialog.getByRole('button', { name: /record/i }).click()
  await expect(dialog.getByRole('button', { name: /stop/i })).toBeVisible()
  // Let the (fake) mic capture a bit of audio before stopping.
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /stop/i }).click()

  const note = dialog.getByLabel(/note \(optional\)/i)
  await expect(note).toBeVisible()
  await note.click()
  await expect(note).toBeFocused()

  await note.pressSequentially(SENTENCE, { delay: 150 })

  await expect(note).toHaveValue(SENTENCE)
  await expect(note).toBeFocused()
})
