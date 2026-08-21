import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData } from '../data/db'
import { createStudent, createLesson, loadStudentBundle } from '../students/studentService'
import { cefrIndex } from '../utils/cefr'
import { TUTOR_GATE_PHRASE } from '../app/config'

function renderApp(initialPath = '/') {
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

const CYRILLIC = /[Ѐ-ӿ]/

beforeEach(async () => {
  localStorage.clear()
  _resetDBForTests()
  await clearAllData()
})

describe('Scenario B/C — a Russian speaker who cannot read English', () => {
  it('runs a picture/listening check with Russian instructions and no English text to read', async () => {
    const user = userEvent.setup()
    renderApp('/assessment')

    // Russian interface.
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'ru')
    await waitFor(() => expect(document.documentElement.lang).toBe('ru'))

    // "I can't read English yet" → foundational branch.
    await user.click(screen.getByRole('button', { name: /Пока не читаю по-английски/ }))
    await user.click(screen.getByRole('button', { name: /Начать проверку/ }))

    // The INSTRUCTION is in Russian (never English navigation the learner can't read).
    await waitFor(() =>
      expect(screen.getByText(/Нажмите на (картинку|цвет|группу|букву|написанное)/)).toBeInTheDocument(),
    )
    // Options are pictures (emoji), not English words to read.
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThan(0)
    expect(radios.some((r) => /\p{Extended_Pictographic}|[A-Z🟥🟦🟩]/u.test(r.textContent ?? ''))).toBe(true)

    // Answer through to a result (wrong answers trigger the zero-English early stop).
    for (let i = 0; i < 12; i++) {
      const submit = screen.queryByRole('button', { name: /Отправить ответ/ })
      if (!submit) break
      await user.click(screen.getAllByRole('radio')[0])
      await user.click(submit)
    }

    // A supportive Pre-A1 result, in Russian.
    await waitFor(() => expect(screen.getAllByText(/Pre-A1/).length).toBeGreaterThan(0))
  })
})

describe('Scenario B — adult absolute-beginner first lesson', () => {
  it('gives Binyamin a beginner lesson with nine-section micro-step guidance and a Russian student prompt', async () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ tutorUnlocked: true, mode: 'tutor' }))
    const student = await createStudent({
      name: 'Nadia',
      age: 65,
      ageBand: 'adult',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      interfaceLanguage: 'ru',
      goals: ['conversation', 'travel'],
      interests: [],
      speakingConfidence: 1,
      pronunciationImportance: 3,
      englishListening: 'none',
      englishSpeaking: 'none',
      englishReading: 'cannot',
    })
    const bundle = (await loadStudentBundle(student.id))!
    // Zero spoken English pins her at Pre-A1, stage P0.
    expect(bundle.model.preA1Stage).toBe('P0')

    const lesson = await createLesson(bundle.student, bundle.model, [])
    expect(lesson.plan.objective.ref).toMatch(/^beginner:/)

    renderApp(`/tutor/student/${student.id}/lesson/${lesson.id}`)

    // The brief tutor orientation ("Your job today") appears at startup.
    await waitFor(() => expect(screen.getByText(/your job today/i)).toBeInTheDocument())
    await user_dismissOrientation()

    // The prominent micro-step guidance is visible: the tutor is told what is
    // happening now, exactly what to say, and what to watch for — the nine
    // sections of the autopilot, not a phase heading.
    expect(screen.getByRole('region', { name: /do this now/i })).toBeInTheDocument()
    for (const label of [/^say$/i, /^do$/i, /student does/i, /look for/i, /if they can/i, /if it.s easy/i, /move on when/i]) {
      expect(screen.getAllByText(label).length, String(label)).toBeGreaterThan(0)
    }

    /* The tutor can see exactly what the learner is being shown — in the
       language selected in the header, which is what the learner is actually
       looking at. (Reading it from the profile instead is what used to put two
       languages on one screen; see modeIsolation.test.tsx.) */
    expect(screen.getAllByText(/student sees/i).length).toBeGreaterThan(0)
    const main = document.querySelector('main')!
    expect(CYRILLIC.test(main.textContent ?? '')).toBe(false)
  })

  it('shows that same instruction in Russian once Russian is selected', async () => {
    localStorage.setItem(
      'ewb:settings',
      JSON.stringify({ tutorUnlocked: true, mode: 'together', language: 'ru' }),
    )
    const student = await createStudent({
      name: 'Nadia',
      age: 65,
      ageBand: 'adult',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      // Deliberately NOT 'ru': the screen must follow what is selected now,
      // not what was stored when the profile was created.
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: [],
      speakingConfidence: 1,
      pronunciationImportance: 3,
      englishListening: 'none',
      englishSpeaking: 'none',
      englishReading: 'cannot',
    })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    renderApp(`/tutor/student/${student.id}/lesson/${lesson.id}`)

    await waitFor(() => {
      const main = document.querySelector('main')!
      expect(CYRILLIC.test(main.textContent ?? '')).toBe(true)
    })
  })
})

/** Dismiss the orientation modal if present. */
async function user_dismissOrientation() {
  const btn = screen.queryByRole('button', { name: /let’s go|let's go/i })
  if (btn) {
    const user = userEvent.setup()
    await user.click(btn)
  }
}

describe('Scenario D — oral English can exceed English literacy', () => {
  it('models a 10-year-old’s speaking above his reading, and never hands him a paragraph', async () => {
    const student = await createStudent({
      name: 'Daniel',
      age: 10,
      ageBand: '9-12',
      nativeLanguage: 'Hebrew',
      otherLanguages: [],
      interfaceLanguage: 'he',
      goals: ['conversation'],
      interests: ['games'],
      speakingConfidence: 3,
      pronunciationImportance: 3,
      englishListening: 'simplePhrases',
      englishSpeaking: 'simplePhrases',
      englishReading: 'cannot',
    })
    // Non-reader of English → native scaffolding on, even though he can speak some.
    expect(student.needsNativeLanguageScaffolding).toBe(true)
    const bundle = (await loadStudentBundle(student.id))!
    // Skills are modeled apart: speaking sits above reading.
    expect(cefrIndex(bundle.model.skillEstimates.speaking.level)).toBeGreaterThan(
      cefrIndex(bundle.model.skillEstimates.reading.level),
    )
    // The generated lesson gates reading on his reading skill (Pre-A1) → an
    // early letter/sound/picture task, not a paragraph to read.
    const lesson = await createLesson(bundle.student, bundle.model, [])
    const reading = lesson.plan.phases.find((p) => p.kind === 'reading')
    if (reading) {
      expect(reading.activities[0].studentPrompt.toLowerCase()).toMatch(/letter|sound|picture/)
    }
  })
})

describe('audited flows (section 20) — onboarding step 2 + About', () => {
  it('onboarding step 2 shows the beginner English questions', async () => {
    const user = userEvent.setup()
    renderApp('/tutor')
    await user.type(screen.getByPlaceholderText(/access phrase/i), TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    await screen.findByText(/no students yet/i)

    await user.click(screen.getAllByRole('link', { name: /new student/i })[0])
    await user.type(screen.getByLabelText(/first name or nickname/i), 'Misha')
    await user.type(screen.getByLabelText(/^age$/i), '5')
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    // Choosing "just starting out" leads to the beginner detail questions.
    await user.click(screen.getByRole('radio', { name: /just starting out/i }))
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    // The independent oral/literacy questions are present, no jargon.
    expect(screen.getByText(/your english right now/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i can’t read english yet|i can't read english yet/i })).toBeInTheDocument()
    // Parent-answer toggle appears for a young child.
    expect(screen.getByText(/answering for a young child/i)).toBeInTheDocument()
  })

  it('About page renders', () => {
    renderApp('/about/')
    expect(screen.getByRole('heading', { level: 1, name: /^about$/i })).toBeInTheDocument()
  })
})

describe('Scenario E — established adult flow is unharmed', () => {
  it('a B1 adult still gets the standard grammar-focused lesson, not the beginner path', async () => {
    const student = await createStudent({
      name: 'Leo',
      age: 34,
      ageBand: 'adult',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: ['travel'],
      speakingConfidence: 4,
      pronunciationImportance: 3,
      selfEstimatedLevel: 'B1',
    })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])
    expect(lesson.plan.objective.ref).not.toMatch(/^beginner:/)
    expect(lesson.plan.totalMinutes).toBe(50)
    // Standard lesson keeps its reading + writing phases for a literate learner.
    const kinds = lesson.plan.phases.map((p) => p.kind)
    expect(kinds).toContain('reading')
    expect(kinds).toContain('writing')
  })
})
