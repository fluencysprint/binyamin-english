import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData, getAllStudents } from '../data/db'
import { createStudent, createLesson, loadStudentBundle } from '../students/studentService'
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

beforeEach(async () => {
  localStorage.clear()
  _resetDBForTests()
  await clearAllData()
})

describe('public experience', () => {
  it('renders the landing page with primary CTAs', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    // Two assessment CTAs (hero + final) — at least one link to the assessment.
    expect(screen.getAllByRole('link', { name: /check your english/i }).length).toBeGreaterThan(0)
  })

  it('runs the adaptive assessment through to a snapshot with a level + CTA', async () => {
    const user = userEvent.setup()
    renderApp('/assessment')

    await user.click(screen.getByRole('button', { name: /start the check/i }))

    // Answer questions until the result appears. Always click the first option.
    for (let i = 0; i < 30; i++) {
      const submit = screen.queryByRole('button', { name: /submit answer/i })
      if (!submit) break
      const radios = screen.getAllByRole('radio')
      await user.click(radios[0])
      await user.click(screen.getByRole('button', { name: /submit answer/i }))
    }

    await waitFor(() => expect(screen.getByText(/Your English Snapshot/i)).toBeInTheDocument())
    // Snapshot shows an approximate level and a booking CTA.
    expect(screen.getByText(/approximate level/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /book a lesson/i }).length).toBeGreaterThan(0)
  })

  it('never exposes the tutor address until the visitor asks to send', async () => {
    const user = userEvent.setup()
    renderApp('/book')
    // No "Email Binyamin" CTA and no address on the page as served.
    expect(
      screen.queryByRole('button', {
        name: /email binyamin|envoyer un e-mail|написать|correo a binyamin|מייל לבנימין/i,
      }),
    ).not.toBeInTheDocument()
    expect(document.body.innerHTML).not.toContain('heybinyamin')

    // Copy works from a complete enquiry, and only then reveals the address.
    await user.type(screen.getByLabelText(/your name/i), 'Sam')
    await user.type(screen.getByLabelText(/^email$/i), 'sam@example.com')
    await user.click(screen.getByRole('button', { name: /copy instead/i }))
    await waitFor(() => expect(screen.getByText('heybinyamin@gmail.com')).toBeInTheDocument())
  })
})

describe('tutor gate', () => {
  it('blocks the tutor area until the correct phrase is entered', async () => {
    const user = userEvent.setup()
    renderApp('/tutor')
    // The tutor route is a lazy chunk (see App.tsx), so the gate is not on
    // screen synchronously after render.
    expect(await screen.findByText(/tutor area/i)).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/access phrase/i)
    await user.type(input, 'wrong-phrase')
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /unlock/i }))

    // Now inside the tutor area — the empty-students prompt appears.
    await waitFor(() => expect(screen.getByText(/no students yet/i)).toBeInTheDocument())
  })
})

describe('localization + RTL', () => {
  it('switches language and applies RTL direction for Hebrew', async () => {
    const user = userEvent.setup()
    renderApp('/')
    const select = screen.getByLabelText(/language/i)
    await user.selectOptions(select, 'he')
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'))
    expect(document.documentElement.lang).toBe('he')

    await user.selectOptions(screen.getByLabelText(/שפה|language/i), 'en')
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'))
  })

  it('runs the assessment in Hebrew: result copy is Hebrew, English examples stay LTR', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.selectOptions(screen.getByLabelText(/language/i), 'he')
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'))

    await user.click(screen.getAllByRole('link', { name: /בדקו את רמת האנגלית שלכם/i })[0])
    await waitFor(() => expect(screen.getByRole('button', { name: /להתחלת הבדיקה/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /להתחלת הבדיקה/i }))

    for (let i = 0; i < 30; i++) {
      const submit = screen.queryByRole('button', { name: /שליחת תשובה/i })
      if (!submit) break
      const radios = screen.getAllByRole('radio')
      await user.click(radios[radios.length - 1])
      await user.click(screen.getByRole('button', { name: /שליחת תשובה/i }))
    }

    await waitFor(() => expect(screen.getByText(/רמת האנגלית שלכם/)).toBeInTheDocument())

    // The focus-priorities list must be Hebrew, not the English fallback that
    // leaked through before snapshot.priorities/notes were localized.
    const hebrewRe = /[֐-׿]/
    const prioritiesHeading = screen.getByText(/כמה דברים להתמקד בהם/)
    const prioritiesList = prioritiesHeading.parentElement!.querySelector('ul')!
    expect(prioritiesList.querySelectorAll('li').length).toBeGreaterThan(0)
    for (const li of Array.from(prioritiesList.querySelectorAll('li'))) {
      expect(li.textContent).toMatch(hebrewRe)
    }

    // The English "said"/"better" example sentence must render LTR even
    // though the page direction is RTL.
    expect(document.querySelectorAll('[dir="ltr"]').length).toBeGreaterThan(0)
  })
})

describe('not found', () => {
  it('shows a 404 for unknown routes', () => {
    renderApp('/does-not-exist')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})

describe('lesson runner', () => {
  it('renders a 50-minute lesson with a timer, phase, and objective', async () => {
    // Pre-unlock the tutor gate.
    localStorage.setItem('ewb:settings', JSON.stringify({ tutorUnlocked: true }))
    const student = await createStudent({
      name: 'Leo',
      age: 30,
      ageBand: 'adult',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      interfaceLanguage: 'en',
      goals: ['conversation'],
      interests: ['travel'],
      speakingConfidence: 3,
      pronunciationImportance: 4,
    })
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])

    const user = userEvent.setup()
    renderApp(`/tutor/student/${student.id}/lesson/${lesson.id}`)

    // Timer (0:00) and the first phase (Warm-up) should be visible.
    await waitFor(() => expect(screen.getAllByText(/warm-?up/i).length).toBeGreaterThan(0))
    // Timer total (50:00) is rendered.
    expect(screen.getByText(/50:00/)).toBeInTheDocument()
    // The objective badge is shown.
    expect(screen.getByText(/today.?s focus/i)).toBeInTheDocument()
    // Key tutor controls are present: the primary progression and the verdict
    // buttons on the action bar itself, the capture tools one tap inside its
    // "Tools" disclosure.
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /needs work/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /tools/i }))
    expect(screen.getByRole('button', { name: /quick correction/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /record sample/i })).toBeInTheDocument()
  })
})

describe('new student onboarding', () => {
  it('creates a student and lands on their dashboard', async () => {
    const user = userEvent.setup()
    renderApp('/tutor')
    // Unlock first.
    await user.type(screen.getByPlaceholderText(/access phrase/i), TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    await screen.findByText(/no students yet/i)

    await user.click(screen.getAllByRole('link', { name: /new student/i })[0])
    await user.type(screen.getByLabelText(/first name or nickname/i), 'Nadia')
    await user.type(screen.getByLabelText(/^age$/i), '9')
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    // Starting point is now an explicit choice; "already fluent" skips the
    // placement check and goes straight to the details step.
    await user.click(screen.getByRole('radio', { name: /already fluent/i }))
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    await user.click(screen.getByRole('button', { name: /create student/i }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Nadia' })).toBeInTheDocument())
    // Dashboard shows the recommended next lesson.
    expect(screen.getByText(/recommended next lesson/i)).toBeInTheDocument()
  })

  it('a fluent student is placed at C1 even with a stale public snapshot in storage', async () => {
    // The original bug: a leftover Pre-A1 result from the public self-check
    // (anyone's, from any earlier visit) silently decided every new student's
    // level, so a fluent adult was handed the absolute-beginner curriculum.
    localStorage.setItem(
      'ewb:lastSnapshot',
      JSON.stringify({
        snapshot: {
          overallCEFR: 'preA1',
          perSkill: { speaking: 'preA1', listening: 'preA1', reading: 'preA1' },
          strongestSkill: 'speaking',
          priorities: [],
        },
        savedAt: Date.now(),
      }),
    )

    const user = userEvent.setup()
    renderApp('/tutor')
    await user.type(screen.getByPlaceholderText(/access phrase/i), TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /unlock/i }))
    await screen.findByText(/no students yet/i)

    await user.click(screen.getAllByRole('link', { name: /new student/i })[0])
    await user.type(screen.getByLabelText(/first name or nickname/i), 'Viktor')
    await user.type(screen.getByLabelText(/^age$/i), '40')
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    await user.click(screen.getByRole('radio', { name: /already fluent/i }))
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    await user.click(screen.getByRole('button', { name: /create student/i }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Viktor' })).toBeInTheDocument())

    const viktor = (await getAllStudents()).find((s) => s.name === 'Viktor')!
    const bundle = (await loadStudentBundle(viktor.id))!
    const lesson = await createLesson(bundle.student, bundle.model, [])
    expect(lesson.plan.objective.ref).toBe('c1-communication')
  })
})
