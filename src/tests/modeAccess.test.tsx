/* ==========================================================================
   The mode boundary, enforced everywhere it can be reached.
   --------------------------------------------------------------------------
   The bug these tests exist for: the student dashboard had no mode logic at
   all. Handing the device to a learner in Student mode showed them their own
   recurring weaknesses, the corrections the tutor thought were "worth
   re-hearing", the stated reasoning behind the next lesson, and a button to
   regenerate the plan.

   So every assertion here is about the DOM, not about styling — hidden is not
   good enough, because "hidden" is one devtools inspection or one screen
   reader away from being read aloud. And every route is entered directly by
   its URL, because a page that only hides its nav link is not protected: the
   address bar, the back button and a bookmark all bypass a missing link.
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData } from '../data/db'
import { seedDemoStudent } from '../data/exampleData'
import { loadStudentBundle } from '../students/studentService'
import { accessFor, modesWith } from '../app/modeAccess'
import { AppMode } from '../types'
import { TUTOR_GATE_PHRASE } from '../app/config'
import { loadSettings } from '../data/settings'

/**
 * `boundStudentId` defaults to whatever student id is in `path` (matching
 * every existing caller's implicit assumption: "the mode is for the student
 * this URL is for"). Pass it explicitly to test a mismatch — a URL edited to
 * point at a different student than Student mode is bound to — or `null` to
 * simulate Student mode with no binding at all.
 */
function renderAt(path: string, mode: AppMode, boundStudentId?: string | null) {
  const fromPath = path.match(/^\/tutor\/student\/([^/]+)/)?.[1] ?? null
  const bound = mode === 'student' ? (boundStudentId !== undefined ? boundStudentId : fromPath) : null
  localStorage.setItem(
    'ewb:settings',
    JSON.stringify({ tutorUnlocked: true, mode, boundStudentId: bound, language: 'en' }),
  )
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  )
}

/** A learner with real history: a completed lesson, corrections, a report,
 *  vocabulary and a learning model with something in it. Without history the
 *  tutor-only sections are empty and the test proves nothing. */
async function seedStudentWithHistory(profile = 'jordan'): Promise<string> {
  const id = await seedDemoStudent(profile)
  const bundle = (await loadStudentBundle(id))!
  expect(bundle.lessons.some((l) => l.status === 'completed')).toBe(true)
  expect(bundle.corrections.length).toBeGreaterThan(0)
  return id
}

beforeEach(async () => {
  await _resetDBForTests()
  await clearAllData()
  localStorage.clear()
})

/* -------------------------------------------------------------------------- */
/* The table itself                                                            */
/* -------------------------------------------------------------------------- */

describe('the capability table is the single source of truth', () => {
  it('gives the tutor everything and the learner nothing that is about them', () => {
    expect(modesWith('tutorGuidance')).toEqual(['tutor'])
    expect(modesWith('privateNotes')).toEqual(['tutor'])
    expect(modesWith('diagnostics')).toEqual(['tutor'])
    expect(modesWith('scoring')).toEqual(['tutor'])
    expect(modesWith('pacing')).toEqual(['tutor'])
    expect(modesWith('roster')).toEqual(['tutor'])
    expect(modesWith('dataAdmin')).toEqual(['tutor'])
    // Together keeps the tutor working beside the learner.
    expect(modesWith('captureTools')).toEqual(['tutor', 'together'])
    expect(modesWith('timer')).toEqual(['tutor', 'together'])
    expect(modesWith('lessonPlanning')).toEqual(['tutor', 'together'])
  })

  it('fails closed on a mode it does not recognise', () => {
    // A settings blob written by an older build, or edited by hand, must not
    // be able to open the tutor's side by naming a mode that does not exist.
    for (const junk of ['admin', '', 'TUTOR', undefined, null]) {
      expect(accessFor(junk as never)).toEqual(accessFor('student'))
    }
  })
})

/* -------------------------------------------------------------------------- */
/* The dashboard — the page the bug was reported against                       */
/* -------------------------------------------------------------------------- */

/** Every tutor-only surface on the dashboard, by the text it renders. */
const TUTOR_ONLY_ON_DASHBOARD = [
  /where we left off/i, // the briefing card as a whole
  /keeps coming back/i, // recurring weaknesses
  /worth re-hearing/i, // corrections the tutor wants repeated
  /approximate level/i, // a CEFR verdict about the learner
  /recommended next lesson/i, // tutor-facing plan preview (Together keeps it)
  /generate next lesson/i, // rewriting the learner's plan
  /suggested next focus/i, // ranked reasoning
  /still needs work/i, // weakness list
  /pronunciation targets/i, // per-sound ratings of their speech
]

describe('student mode cannot expose tutor-only material on the dashboard', () => {
  let id: string
  beforeEach(async () => {
    id = await seedStudentWithHistory()
  })

  it('renders none of the tutor-only sections', async () => {
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    for (const label of TUTOR_ONLY_ON_DASHBOARD) {
      expect(screen.queryAllByText(label), String(label)).toHaveLength(0)
    }
    expect(screen.queryByRole('region', { name: /where we left off/i })).toBeNull()
  })

  it('does not name any other student, or link to the roster', async () => {
    // A second learner exists on this device. Their name is private to them.
    await seedDemoStudent('taylor')
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    expect(screen.queryByText('Taylor')).toBeNull()
    expect(document.querySelector('a[href="/tutor"]')).toBeNull()
  })

  it('offers no control that edits the learner’s record', async () => {
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    for (const name of [/generate next lesson/i, /start this lesson/i, /start lesson/i, /resume/i]) {
      expect(screen.queryByRole('button', { name }), String(name)).toBeNull()
    }
  })

  it('still shows the learner their own work', async () => {
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    // Their words, their progress so far, their recordings — all encouraging,
    // none of it a judgement written for somebody else.
    expect(screen.getByText(/^vocabulary$/i)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^progress$/i })).toBeInTheDocument()
    expect(screen.getByText(/audio samples/i)).toBeInTheDocument()
    expect(screen.getByText(/1 lesson so far/i)).toBeInTheDocument()
  })

  it('keeps the report reachable — it is written for the learner', async () => {
    renderAt(`/tutor/student/${id}`, 'student')
    const progress = await screen.findByRole('region', { name: /^progress$/i })
    expect(within(progress).getByRole('link', { name: /view report/i })).toBeInTheDocument()
  })
})

describe('together mode keeps the lesson usable and the reasoning private', () => {
  let id: string
  beforeEach(async () => {
    id = await seedStudentWithHistory()
  })

  it('hides every judgement about the learner', async () => {
    renderAt(`/tutor/student/${id}`, 'together')
    await screen.findByRole('heading', { name: 'Jordan' })

    for (const label of TUTOR_ONLY_ON_DASHBOARD.filter((r) => !/recommended next/i.test(r.source))) {
      expect(screen.queryAllByText(label), String(label)).toHaveLength(0)
    }
  })

  it('still lets the tutor plan and start the lesson beside them', async () => {
    renderAt(`/tutor/student/${id}`, 'together')
    await screen.findByRole('heading', { name: 'Jordan' })

    expect(screen.getByText(/recommended next lesson/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start this lesson/i })).toBeInTheDocument()
    // …but not to rewrite the plan on a screen the learner is reading.
    expect(screen.queryByRole('button', { name: /generate next lesson/i })).toBeNull()
  })
})

describe('tutor mode keeps everything, so the absences above are meaningful', () => {
  it('shows every tutor-only section on the dashboard', async () => {
    const id = await seedStudentWithHistory()
    renderAt(`/tutor/student/${id}`, 'tutor')
    await screen.findByRole('heading', { name: 'Jordan' })

    await waitFor(() => expect(screen.getByRole('region', { name: /where we left off/i })).toBeInTheDocument())
    expect(screen.getByText(/approximate level/i)).toBeInTheDocument()
    expect(screen.getByText(/recommended next lesson/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate next lesson/i })).toBeInTheDocument()
    expect(screen.getByText(/still needs work/i)).toBeInTheDocument()
    expect(screen.getByText(/pronunciation targets/i)).toBeInTheDocument()
    expect(document.querySelector('a[href="/tutor"]')).not.toBeNull()
  })
})

/* -------------------------------------------------------------------------- */
/* Deep links — the address bar is not a navigation link                       */
/* -------------------------------------------------------------------------- */

describe('typing a tutor URL directly does not render the page', () => {
  const TUTOR_ROUTES: { path: string; proof: RegExp }[] = [
    { path: '/tutor', proof: /new student/i },
    { path: '/tutor/new', proof: /new student/i },
    { path: '/tutor/data', proof: /export backup/i },
  ]

  for (const mode of ['student', 'together'] as const) {
    for (const { path, proof } of TUTOR_ROUTES) {
      it(`${mode} mode: ${path} shows the notice, not the page`, async () => {
        await seedStudentWithHistory()
        renderAt(path, mode)

        await screen.findByRole('heading', { name: /not available in this mode/i })
        expect(screen.queryByText(proof), path).toBeNull()
        // And nothing about any other learner leaked while rendering it.
        expect(screen.queryByText('Jordan')).toBeNull()
      })
    }
  }

  it('tutor mode opens all three', async () => {
    for (const { path, proof } of TUTOR_ROUTES) {
      const { unmount } = renderAt(path, 'tutor')
      await waitFor(() => expect(screen.getAllByText(proof).length, path).toBeGreaterThan(0))
      expect(screen.queryByRole('heading', { name: /not available in this mode/i })).toBeNull()
      unmount()
    }
  })

  it('the backup and delete controls are unreachable in student mode', async () => {
    await seedStudentWithHistory()
    renderAt('/tutor/data', 'student')
    await screen.findByRole('heading', { name: /not available in this mode/i })

    for (const name of [/export backup/i, /import backup/i, /clear all local data/i, /delete student/i]) {
      expect(screen.queryByRole('button', { name }), String(name)).toBeNull()
    }
  })
})

/* -------------------------------------------------------------------------- */
/* The lesson report                                                           */
/* -------------------------------------------------------------------------- */

describe('the lesson report shows the learner their lesson, not the file on them', () => {
  async function openReport(mode: AppMode) {
    const id = await seedStudentWithHistory()
    const bundle = (await loadStudentBundle(id))!
    const lesson = bundle.lessons.find((l) => l.status === 'completed' && l.report)!
    renderAt(`/tutor/student/${id}/lesson/${lesson.id}/report`, mode)
    await screen.findByText(/today we worked on/i)
  }

  it('student mode drops the parent section and its level verdict', async () => {
    await openReport('student')
    expect(screen.queryByText(/for parents/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /copy parent/i })).toBeNull()
  })

  it('tutor mode keeps it', async () => {
    await openReport('tutor')
    expect(screen.getByRole('button', { name: /copy parent/i })).toBeInTheDocument()
  })
})

/* -------------------------------------------------------------------------- */
/* Getting back out                                                            */
/* -------------------------------------------------------------------------- */

describe('leaving student mode costs the access phrase', () => {
  it('a tap on “Tutor” does not switch by itself', async () => {
    const user = userEvent.setup()
    const id = await seedStudentWithHistory()
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    await user.click(screen.getByRole('radio', { name: /^tutor$/i }))

    // Still the learner's screen: the prompt appeared, the content did not.
    expect(screen.getByLabelText(/access phrase to leave student mode/i)).toBeInTheDocument()
    expect(screen.queryByText(/where we left off/i)).toBeNull()
    expect(screen.queryByText(/approximate level/i)).toBeNull()
  })

  it('a wrong phrase changes nothing', async () => {
    const user = userEvent.setup()
    const id = await seedStudentWithHistory()
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    await user.click(screen.getByRole('radio', { name: /^tutor$/i }))
    await user.type(screen.getByLabelText(/access phrase to leave student mode/i), 'guess')
    await user.click(screen.getByRole('button', { name: /^unlock$/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/approximate level/i)).toBeNull()
    expect(screen.getByRole('radio', { name: /^student$/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('the right phrase gives the tutor their screen back', async () => {
    const user = userEvent.setup()
    const id = await seedStudentWithHistory()
    renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    await user.click(screen.getByRole('radio', { name: /^tutor$/i }))
    await user.type(screen.getByLabelText(/access phrase to leave student mode/i), TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /^unlock$/i }))

    await waitFor(() => expect(screen.getByText(/approximate level/i)).toBeInTheDocument())
  })

  it('switching between tutor and together is free — the tutor is present in both', async () => {
    const user = userEvent.setup()
    const id = await seedStudentWithHistory()
    renderAt(`/tutor/student/${id}`, 'tutor')
    await screen.findByRole('heading', { name: 'Jordan' })

    await user.click(screen.getByRole('radio', { name: /^together$/i }))
    await waitFor(() => expect(screen.queryByText(/approximate level/i)).toBeNull())
    expect(screen.queryByLabelText(/access phrase to leave student mode/i)).toBeNull()
  })
})

/* -------------------------------------------------------------------------- */
/* Persistence                                                                 */
/* -------------------------------------------------------------------------- */

describe('the mode survives a reload', () => {
  it('a page opened fresh in student mode is still student mode', async () => {
    const id = await seedStudentWithHistory()
    const { unmount } = renderAt(`/tutor/student/${id}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })
    unmount()

    // Same localStorage, brand-new tree — exactly what a refresh does.
    render(
      <MemoryRouter initialEntries={[`/tutor/student/${id}`]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Jordan' })
    expect(screen.queryByText(/approximate level/i)).toBeNull()
    expect(loadSettings().boundStudentId).toBe(id)
  })
})

/* -------------------------------------------------------------------------- */
/* Student mode is bound to exactly one student                                */
/* -------------------------------------------------------------------------- */

describe('Student mode is bound to one student — the URL cannot pick another', () => {
  it('editing the URL to another student resolves back to the bound student, not their data', async () => {
    const idA = await seedStudentWithHistory('jordan')
    const idB = await seedStudentWithHistory('taylor')

    // The address bar names Taylor; the device is bound to Jordan.
    renderAt(`/tutor/student/${idB}`, 'student', idA)

    await screen.findByRole('heading', { name: 'Jordan' })
    expect(screen.queryByText('Taylor')).toBeNull()
  })

  it('the same protection holds on the lesson runner and the lesson report', async () => {
    const idA = await seedStudentWithHistory('jordan')
    const idB = await seedStudentWithHistory('taylor')
    const bundleB = (await loadStudentBundle(idB))!
    const lessonB = bundleB.lessons.find((l) => l.status === 'completed' && l.report)!

    const { unmount } = renderAt(`/tutor/student/${idB}/lesson/${lessonB.id}`, 'student', idA)
    await screen.findByRole('heading', { name: 'Jordan' })
    unmount()

    renderAt(`/tutor/student/${idB}/lesson/${lessonB.id}/report`, 'student', idA)
    await screen.findByRole('heading', { name: 'Jordan' })
  })

  it('Student mode with no binding shows a learner-safe notice and no student data', async () => {
    await seedStudentWithHistory('jordan')
    renderAt('/tutor/student/anything', 'student', null)

    await screen.findByRole('heading', { name: /no student selected/i })
    expect(screen.queryByText('Jordan')).toBeNull()
  })

  it('a bound student that no longer exists fails closed, without leaking another student', async () => {
    await seedStudentWithHistory('taylor')
    // Nothing was ever seeded under this id — same shape as a deleted student.
    renderAt('/tutor/student/ghost-id', 'student', 'ghost-id')

    await screen.findByText(/student not found/i)
    expect(screen.queryByText('Taylor')).toBeNull()
  })

  it('leaving Student mode releases the binding, and the tutor can bind a different student next', async () => {
    const user = userEvent.setup()
    const idA = await seedStudentWithHistory('jordan')
    const idB = await seedStudentWithHistory('taylor')

    const first = renderAt(`/tutor/student/${idA}`, 'student')
    await screen.findByRole('heading', { name: 'Jordan' })

    await user.click(screen.getByRole('radio', { name: /^tutor$/i }))
    await user.type(screen.getByLabelText(/access phrase to leave student mode/i), TUTOR_GATE_PHRASE)
    await user.click(screen.getByRole('button', { name: /^unlock$/i }))
    await waitFor(() => expect(screen.getByText(/approximate level/i)).toBeInTheDocument())
    expect(loadSettings().boundStudentId).toBeNull()
    first.unmount()

    // The tutor opens a different student's dashboard (still in tutor mode)…
    const second = render(
      <MemoryRouter initialEntries={[`/tutor/student/${idB}`]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Taylor' })

    // …and switches to Student mode for them — free, no phrase, since the
    // tutor is present. It binds to Taylor, not the previously-bound Jordan.
    await user.click(screen.getByRole('radio', { name: /^student$/i }))
    await waitFor(() => expect(screen.queryByText(/approximate level/i)).toBeNull())
    expect(loadSettings().boundStudentId).toBe(idB)
    second.unmount()

    // And the new binding resists a URL edit back to Jordan.
    const third = render(
      <MemoryRouter initialEntries={[`/tutor/student/${idA}`]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Taylor' })
    expect(screen.queryByText('Jordan')).toBeNull()
    third.unmount()
  })

  it('the "Student" option is disabled with no student in view, so entering never guesses', async () => {
    await seedStudentWithHistory('jordan')
    renderAt('/tutor', 'tutor')
    await screen.findByRole('heading', { name: /students/i })

    const studentRadio = screen.getByRole('radio', { name: /^student$/i })
    expect(studentRadio).toBeDisabled()
  })

  it('tutor and together mode keep normal multi-student access — the binding gate does not apply', async () => {
    const idA = await seedStudentWithHistory('jordan')
    const idB = await seedStudentWithHistory('taylor')

    for (const mode of ['tutor', 'together'] as const) {
      const a = renderAt(`/tutor/student/${idA}`, mode)
      await screen.findByRole('heading', { name: 'Jordan' })
      a.unmount()

      const b = renderAt(`/tutor/student/${idB}`, mode)
      await screen.findByRole('heading', { name: 'Taylor' })
      b.unmount()
    }
  })
})

/* -------------------------------------------------------------------------- */
/* Settings normalization — fail closed on corrupt or legacy data              */
/* -------------------------------------------------------------------------- */

describe('a corrupt or legacy settings blob fails closed', () => {
  beforeEach(() => localStorage.clear())

  it('an unrecognised mode coerces to Student mode with no binding', () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ mode: 'teacher', boundStudentId: 'abc123' }))
    const s = loadSettings()
    expect(s.mode).toBe('student')
    expect(s.boundStudentId).toBeNull()
  })

  it('a non-string boundStudentId is dropped', () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ mode: 'student', boundStudentId: 42 }))
    expect(loadSettings().boundStudentId).toBeNull()
  })

  it('a boundStudentId left over outside Student mode is dropped', () => {
    localStorage.setItem('ewb:settings', JSON.stringify({ mode: 'tutor', boundStudentId: 'abc123' }))
    expect(loadSettings().boundStudentId).toBeNull()
  })
})
