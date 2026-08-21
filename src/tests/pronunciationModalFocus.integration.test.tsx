import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData } from '../data/db'
import { createStudent, createLesson, loadStudentBundle } from '../students/studentService'

// End-to-end coverage for the pronunciation recordings modal: opens it from
// a real lesson, types a full sentence into the target field and the note
// field, and checks the text lands and focus isn't lost. The deterministic
// regression test for the underlying root cause (an unstable `onClose`
// closure re-triggering a focus-stealing effect in <Modal>) lives in
// ../components/Modal.test.tsx.

class FakeMediaRecorder {
  static isTypeSupported() {
    return true
  }
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  state: 'inactive' | 'recording' = 'inactive'
  mimeType: string
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? 'audio/webm'
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['fake-audio'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

beforeEach(async () => {
  localStorage.clear()
  _resetDBForTests()
  await clearAllData()

  vi.stubGlobal('MediaRecorder', FakeMediaRecorder as unknown as typeof MediaRecorder)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  })
  // jsdom doesn't implement object URLs.
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
})

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  )
}

async function openRecordingModal(user: ReturnType<typeof userEvent.setup>) {
  const orientationBtn = screen.queryByRole('button', { name: /let’s go|let's go/i })
  if (orientationBtn) await user.click(orientationBtn)

  // The capture tools live behind the action bar's "Tools" disclosure.
  await user.click(screen.getByRole('button', { name: /tools/i }))
  await user.click(screen.getByRole('button', { name: /record sample/i }))
  await screen.findByRole('dialog', { name: /pronunciation recordings/i })

  const privacyAck = screen.queryByRole('button', { name: /i understand/i })
  if (privacyAck) await user.click(privacyAck)
}

describe('Pronunciation recordings modal — input focus regression', () => {
  it('keeps the target-sentence input focused across timer ticks while typing', async () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ tutorUnlocked: true, mode: 'tutor' }))
    const student = await createStudent({
      name: 'Ana',
      age: 30,
      ageBand: 'adult',
      nativeLanguage: 'Spanish',
      otherLanguages: [],
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: [],
      speakingConfidence: 3,
      pronunciationImportance: 4,
      selfEstimatedLevel: 'B1',
    })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    const user = userEvent.setup()
    renderApp(`/tutor/student/${student.id}/lesson/${lesson.id}`)
    await waitFor(() => expect(screen.getByRole('button', { name: /tools/i })).toBeInTheDocument())

    await openRecordingModal(user)

    const target = await screen.findByLabelText(/target word or sentence/i)
    await user.click(target)
    expect(target).toHaveFocus()

    const sentence = 'I worked there for three years.'
    await user.type(target, sentence)

    expect(target).toHaveValue(sentence)
    expect(target).toHaveFocus()
  }, 20000)

  it('keeps the optional note input focused across timer ticks, before and after recording', async () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ tutorUnlocked: true, mode: 'tutor' }))
    const student = await createStudent({
      name: 'Leo',
      age: 34,
      ageBand: 'adult',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: [],
      speakingConfidence: 4,
      pronunciationImportance: 3,
      selfEstimatedLevel: 'B1',
    })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    const user = userEvent.setup()
    renderApp(`/tutor/student/${student.id}/lesson/${lesson.id}`)
    await waitFor(() => expect(screen.getByRole('button', { name: /tools/i })).toBeInTheDocument())

    await openRecordingModal(user)

    // Record a sample so the note field (only shown once `recorded`) appears.
    const dialog = screen.getByRole('dialog', { name: /pronunciation recordings/i })
    await user.click(within(dialog).getByRole('button', { name: /record/i }))
    await user.click(await within(dialog).findByRole('button', { name: /stop/i }))
    const note = await screen.findByLabelText(/note \(optional\)/i)

    await user.click(note)
    expect(note).toHaveFocus()

    const sentence = 'I worked there for three years.'
    await user.type(note, sentence)

    expect(note).toHaveValue(sentence)
    expect(note).toHaveFocus()
  }, 20000)
})
