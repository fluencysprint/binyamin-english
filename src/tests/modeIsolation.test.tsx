/* ==========================================================================
   Student and Together modes must never show the tutor's side.
   --------------------------------------------------------------------------
   The device is handed to the learner. If SAY leaks, the lesson stops being a
   conversation and becomes a script read off a screen; if LOOK FOR or HELP
   leaks, a nervous beginner reads the tutor's contingency plan for their own
   failure. So the guidance is not hidden with CSS in those modes — it is never
   rendered at all, and these tests assert the absence in the DOM, not just
   visually.
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData } from '../data/db'
import { createLesson, createStudent, loadStudentBundle } from '../students/studentService'
import { AppMode, StudentProfile } from '../types'

const HEBREW = /[֐-׿]/
const CYRILLIC = /[Ѐ-ӿ]/

async function seedStudent(over: Partial<Parameters<typeof createStudent>[0]> = {}) {
  return createStudent({
    name: 'Nadia',
    age: 65,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'ru',
    goals: ['conversation'],
    interests: [],
    speakingConfidence: 1,
    pronunciationImportance: 3,
    englishListening: 'none',
    englishSpeaking: 'none',
    englishReading: 'cannot',
    ...over,
  } as Parameters<typeof createStudent>[0])
}

function renderAt(path: string, mode: AppMode, language: 'en' | 'he' | 'ru' = 'en') {
  // Bind Student mode to whatever student id is in `path` — every caller in
  // this file means "Student mode for the student this URL is about".
  const boundStudentId = mode === 'student' ? (path.match(/^\/tutor\/student\/([^/]+)/)?.[1] ?? null) : null
  localStorage.setItem('ewb:settings', JSON.stringify({ tutorUnlocked: true, mode, boundStudentId, language }))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  )
}

/** Every tutor-only label, by its English UI string. */
const TUTOR_LABELS = [/^say$/i, /^do$/i, /look for/i, /if they can/i, /if it.s easy/i, /move on when/i, /student does/i]

beforeEach(async () => {
  await _resetDBForTests()
  await clearAllData()
  localStorage.clear()
})

describe('student mode shows the learner’s task and nothing else', () => {
  let student: StudentProfile
  let lessonId: string

  beforeEach(async () => {
    student = await seedStudent()
    const bundle = (await loadStudentBundle(student.id))!
    lessonId = (await createLesson(bundle.student, bundle.model, [])).id
  })

  for (const mode of ['student', 'together'] as const) {
    it(`${mode} mode renders no tutor guidance at all`, async () => {
      renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, mode)
      await waitFor(() => expect(document.querySelector('main')).toBeTruthy())

      for (const label of TUTOR_LABELS) {
        expect(screen.queryAllByText(label), String(label)).toHaveLength(0)
      }
      // The whole panel, by its accessible name.
      expect(screen.queryByRole('region', { name: /do this now/i })).toBeNull()
      // And the pacing advice, which is a tutor decision aid.
      expect(screen.queryByLabelText(/where we are/i)).toBeNull()
    })

    it(`${mode} mode shows the instruction in the SELECTED interface language`, async () => {
      renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, mode, 'ru')
      await waitFor(() => {
        const main = document.querySelector('main')!
        expect(CYRILLIC.test(main.textContent ?? '')).toBe(true)
      })
    })

    it(`${mode} mode hides the score buttons — the learner does not grade themselves`, async () => {
      renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, mode)
      await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
      expect(screen.queryByText(/how did that go/i)).toBeNull()
    })

    it(`${mode} mode never exposes the tutor's private notes`, async () => {
      // "Notes" opens stored, private, tutor-written text about this learner.
      // On a device the student can see, that button must not exist.
      renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, mode)
      await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
      expect(screen.queryByRole('button', { name: /^notes$/i })).toBeNull()
    })

    it(`${mode} mode hides the tutor-facing objective and level`, async () => {
      renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, mode)
      await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
      // The CEFR level is a verdict about the learner, written for the tutor.
      expect(screen.queryByText('preA1')).toBeNull()
      expect(screen.queryByText(/today’s focus|today's focus/i)).toBeNull()
    })
  }

  it('student mode removes the capture toolbar entirely', async () => {
    // In Together mode the tutor is still driving the same screen, so the
    // capture tools stay. In Student mode the device is the learner's — and
    // the disclosure that holds them is not rendered at all, so there is
    // nothing to open.
    renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, 'student')
    await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
    for (const name of [/tools/i, /quick correction/i, /record sample/i, /add word/i]) {
      expect(screen.queryByRole('button', { name }), String(name)).toBeNull()
    }
  })

  it('student mode hides the countdown — a learner is not on a deadline', async () => {
    renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, 'student')
    await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
    expect(screen.queryByText(/^\d+:\d\d$/)).toBeNull()
  })

  it('together mode keeps the capture tools the tutor still needs', async () => {
    const user = userEvent.setup()
    renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, 'together')
    await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
    await user.click(await screen.findByRole('button', { name: /tools/i }))
    for (const name of [/quick correction/i, /record sample/i, /add word/i]) {
      expect(screen.queryByRole('button', { name }), String(name)).not.toBeNull()
    }
    // Notes are the tutor's private record, and Together mode is a shared
    // screen — they stay out of the menu there.
    expect(screen.queryByRole('button', { name: /^notes$/i })).toBeNull()
  })

  it('tutor mode DOES show the guidance (so the absence above is meaningful)', async () => {
    renderAt(`/tutor/student/${student.id}/lesson/${lessonId}`, 'tutor')
    await waitFor(() => expect(screen.getByRole('region', { name: /do this now/i })).toBeInTheDocument())
    for (const label of TUTOR_LABELS) {
      expect(screen.getAllByText(label).length, String(label)).toBeGreaterThan(0)
    }
  })
})

/* ==========================================================================
   The SELECTED interface language, never one stored on a profile.
   --------------------------------------------------------------------------
   Profiles carry an `interfaceLanguage`, and the lesson runner used to read
   the instruction from it. The result was a screen in two languages at once:
   a French profile showed French instructions with the whole rest of the UI
   in English, and switching the header language did not change them. What is
   on screen now follows the language that is selected NOW, for every profile.
   ========================================================================== */
describe('the selected interface language, not a stored one', () => {
  it('shows the instruction in the language selected in the header', async () => {
    const student = await seedStudent({ interfaceLanguage: 'he', nativeLanguage: 'Hebrew' })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    renderAt(`/tutor/student/${student.id}/lesson/${lesson.id}`, 'student', 'he')
    await waitFor(() => {
      const main = document.querySelector('main')!
      expect(HEBREW.test(main.textContent ?? '')).toBe(true)
    })
  })

  it('does not leak a profile’s stored language into an English UI', async () => {
    // The exact reported bug, with Hebrew standing in for French because a
    // script check cannot be fooled by a shared Latin alphabet.
    const student = await seedStudent({ interfaceLanguage: 'he', nativeLanguage: 'Hebrew' })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    renderAt(`/tutor/student/${student.id}/lesson/${lesson.id}`, 'student', 'en')
    await waitFor(() => expect(document.querySelector('main')?.textContent).toBeTruthy())
    const main = document.querySelector('main')!
    expect(HEBREW.test(main.textContent ?? '')).toBe(false)
  })

  it('the English target stays English and is marked LTR', async () => {
    const student = await seedStudent({ interfaceLanguage: 'he', nativeLanguage: 'Hebrew' })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])
    renderAt(`/tutor/student/${student.id}/lesson/${lesson.id}`, 'student')

    await waitFor(() => expect(document.querySelector('main')).toBeTruthy())
    // Any English target block is explicitly LTR and lang="en", so a Hebrew
    // page direction cannot reorder the words being taught.
    for (const el of Array.from(document.querySelectorAll('[lang="en"]'))) {
      expect(el.getAttribute('dir')).toBe('ltr')
    }
  })
})
