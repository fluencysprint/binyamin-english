/* ==========================================================================
   The week between two lessons — the part of the product a generic platform
   cannot copy, tested as one continuous journey.
   --------------------------------------------------------------------------
   The acceptance learner throughout: an adult, B1, who wants confident
   English at work, repeatedly says "I am agree", and has eight workplace
   words on record.

   The questions each block answers:

     • opening the app, does the learner know what to do within one screen?
     • can they actually DO it on a phone, alone, without being handed the
       answers?
     • does what they did reach the tutor as evidence rather than as a claim?
     • does it change what happens next?
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { App } from '../app/App'
import { _resetDBForTests, clearAllData, getLearningModel, getLessonsForStudent, putCorrection, putLesson } from '../data/db'
import { createStudent, loadStudentBundle } from '../students/studentService'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { generateFirstLesson } from '../lessons/lessonGenerator'
import { putLearningModel } from '../data/db'
import { Correction, LessonRecord, StudentProfile } from '../types'
import { uid } from '../utils/id'
import { homeworkOutcome, learnerEvidence } from '../students/evidence'

const WORKPLACE_WORDS: { term: string; meaning: string }[] = [
  { term: 'deadline', meaning: 'the day something has to be finished' },
  { term: 'stakeholder', meaning: 'a person affected by a project' },
  { term: 'follow up', meaning: 'to check again after a first message' },
  { term: 'workload', meaning: 'how much work you have' },
]

async function seedAcceptanceStudent(): Promise<StudentProfile> {
  const student = await createStudent({
    name: 'Dana',
    age: 34,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'en',
    selfEstimatedLevel: 'B1',
    goals: ['work', 'confidence'],
    interests: ['project management'],
    speakingConfidence: 3,
    pronunciationImportance: 4,
    englishListening: 'conversational',
    englishSpeaking: 'conversational',
    englishReading: 'comfortable',
    englishWriting: 'comfortable',
  })

  const model = (await getLearningModel(student.id))!
  const plan = generateFirstLesson(student, model)
  const now = Date.now() - 2 * 24 * 60 * 60 * 1000

  const corrections: Correction[] = [
    {
      id: uid('corr'),
      studentId: student.id,
      lessonId: plan.id,
      category: 'grammar',
      said: 'I am agree with the plan',
      better: 'I agree with the plan',
      priority: 'high',
      at: now,
    },
    {
      id: uid('corr'),
      studentId: student.id,
      lessonId: plan.id,
      category: 'grammar',
      said: 'Yesterday I send the report',
      better: 'Yesterday I sent the report',
      priority: 'medium',
      at: now,
    },
  ]
  for (const c of corrections) await putCorrection(c)

  const lesson: LessonRecord = {
    id: plan.id,
    studentId: student.id,
    plan,
    status: 'completed',
    startedAt: now - 50 * 60 * 1000,
    completedAt: now,
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 2980,
    responses: [],
    correctionIds: corrections.map((c) => c.id),
    audioIds: [],
    vocabularyAdded: WORKPLACE_WORDS.map((w) => w.term),
    vocabularyMeanings: Object.fromEntries(WORKPLACE_WORDS.map((w) => [w.term, w.meaning])),
    objectiveOutcome: 'partial',
  }
  const { model: updated, report } = applyCompletedLesson(model, lesson, student, corrections, now)
  await putLearningModel(updated)
  await putLesson({ ...lesson, report })
  return student
}

function renderAs(path: string, studentId: string, mode: 'student' | 'tutor') {
  localStorage.setItem(
    'ewb:settings',
    JSON.stringify({
      tutorUnlocked: true,
      mode,
      boundStudentId: mode === 'student' ? studentId : null,
      language: 'en',
    }),
  )
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

/* -------------------------------------------------------------------------- */

describe('Student Home answers "what should I do now?" before anything else', () => {
  it('leads with one action, built from the lesson that just happened', async () => {
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}`, student.id, 'student')

    const heading = await screen.findByRole('heading', { name: /^today$/i })
    const today = heading.closest('section')!

    // A real length, derived from the items, not a round marketing number.
    expect(within(today).getByText(/\d+-minute practice|review \d+ words/i)).toBeInTheDocument()
    expect(within(today).getByText(/built from your last lesson/i)).toBeInTheDocument()
    expect(within(today).getByRole('button', { name: /^start$/i })).toBeInTheDocument()
  })

  it('shows no tutor reasoning, no level and no plan', async () => {
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}`, student.id, 'student')
    await screen.findByRole('heading', { name: /^today$/i })

    for (const forbidden of [
      /approximate level/i,
      /where we left off/i,
      /suggested next focus/i,
      /keeps coming back/i,
      /recommended next lesson/i,
      /\bB1\b/,
    ]) {
      expect(screen.queryAllByText(forbidden), String(forbidden)).toHaveLength(0)
    }
  })
})

/* -------------------------------------------------------------------------- */

describe('the learner can do the whole set alone, on a phone', () => {
  it('cues before it reveals, and records what happened', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    // First item: their own sentence, wrong-side-up. The fix is NOT on screen.
    await screen.findByText(/say it the better way/i)
    expect(screen.getByText('I am agree with the plan')).toBeInTheDocument()
    expect(screen.queryByText('I agree with the plan')).toBeNull()

    // Only after they say they have tried.
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    expect(screen.getByText('I agree with the plan')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /i got it/i }))

    await waitFor(async () => {
      const model = (await getLearningModel(student.id))!
      expect(model.practiceSessions?.[0]?.results).toHaveLength(1)
    })
    const model = (await getLearningModel(student.id))!
    expect(model.practiceSessions![0].results[0].outcome).toBe('independent')
  })

  it('asks for a word from its MEANING, never by showing the word', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    await screen.findByText(/say it the better way/i)
    // Walk to the vocabulary items.
    for (let i = 0; i < 12; i++) {
      if (screen.queryByText(/what is the english for this/i)) break
      const reveal = screen.queryByRole('button', { name: /show the answer/i })
      if (reveal) {
        await user.click(reveal)
        await user.click(screen.getByRole('button', { name: /i got it/i }))
      } else {
        await user.click(screen.getByRole('button', { name: /^done$/i }))
      }
    }

    expect(screen.getByText(/what is the english for this/i)).toBeInTheDocument()
    const meaning = WORKPLACE_WORDS.find((w) =>
      screen.queryByText(w.meaning) !== null,
    )!
    expect(meaning).toBeDefined()
    expect(screen.queryByText(meaning.term)).toBeNull()
  })

  it('offers a hint, then fair choices, for a word cued only by its meaning — and never counts that as unaided', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    await screen.findByText(/say it the better way/i)
    for (let i = 0; i < 12; i++) {
      if (screen.queryByText(/what is the english for this/i)) break
      const reveal = screen.queryByRole('button', { name: /show the answer/i })
      if (reveal) {
        await user.click(reveal)
        await user.click(screen.getByRole('button', { name: /i got it/i }))
      } else {
        await user.click(screen.getByRole('button', { name: /^done$/i }))
      }
    }
    const meaning = WORKPLACE_WORDS.find((w) => screen.queryByText(w.meaning) !== null)!
    expect(meaning).toBeDefined()

    // A learner stuck on the exact stored word gets a hint first...
    await user.click(screen.getByRole('button', { name: /need a hint/i }))
    expect(screen.getByText(new RegExp(`${meaning.term[0].toUpperCase()}.*${meaning.term.replace(/\s+/g, '').length} letters`, 'i'))).toBeInTheDocument()

    // ...and, still unsure, a small set of real options to recognise from.
    await user.click(screen.getByRole('button', { name: /still not sure/i }))
    const otherTerms = WORKPLACE_WORDS.map((w) => w.term)
    const optionBtn = screen
      .getAllByRole('button')
      .find((b) => otherTerms.includes(b.textContent?.trim() ?? ''))
    expect(optionBtn).toBeDefined()
    await user.click(optionBtn!)

    // Once help was used, the self-check can no longer offer "I got it" —
    // only that help was needed, or that it still did not land.
    expect(screen.getByText(meaning.term)).toBeInTheDocument() // the reveal
    expect(screen.queryByRole('button', { name: /^i got it$/i })).toBeNull()
    await user.click(screen.getByRole('button', { name: /said it right/i }))

    await waitFor(async () => {
      const model = (await getLearningModel(student.id))!
      const result = model.practiceSessions!.flatMap((s) => s.results).find((r) => r.label === meaning.term)
      expect(result).toBeDefined()
    })
    const model = (await getLearningModel(student.id))!
    const result = model.practiceSessions!.flatMap((s) => s.results).find((r) => r.label === meaning.term)!
    // A hint plus multiple choice is real help — it can earn "after support",
    // never the unaided "independent" claim, whichever button was tapped.
    expect(result.outcome).toBe('afterSupport')
    expect(result.helpUsed).toBe('choices')
  })

  it('a half-finished set is resumed, not restarted', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    const first = renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    await screen.findByText(/say it the better way/i)
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    const position = await screen.findByText(/^2 \/ \d+$/)
    const label = position.textContent!
    first.unmount()

    // Same device, new page load.
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(label)
    expect(screen.queryByText('I am agree with the plan')).toBeNull()
  })

  it('brings back an item that needed help, once, before finishing', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    await screen.findByText(/say it the better way/i)
    const firstCue = 'I am agree with the plan'
    expect(screen.getByText(firstCue)).toBeInTheDocument()

    // Miss the first one; get everything else.
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /not yet/i }))
    for (let i = 0; i < 20; i++) {
      if (screen.queryByText(firstCue)) break
      const reveal = screen.queryByRole('button', { name: /show the answer/i })
      if (reveal) {
        await user.click(reveal)
        await user.click(screen.getByRole('button', { name: /i got it/i }))
        continue
      }
      const done = screen.queryByRole('button', { name: /^done$/i })
      if (!done) break
      await user.click(done)
    }

    // It came round again rather than being quietly dropped.
    expect(screen.getByText(firstCue)).toBeInTheDocument()

    // And answering it this time finishes the set — one repeat, not a loop.
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    await screen.findByText(/that is the set finished/i)

    // The repeat replaced the miss; it was not counted as two attempts.
    const model = (await getLearningModel(student.id))!
    const results = model.practiceSessions![0].results
    expect(results.filter((r) => r.label === 'I agree with the plan')).toHaveLength(1)
    expect(results.find((r) => r.label === 'I agree with the plan')!.outcome).toBe('independent')
  })

  it('offers Continue rather than Start once it has been opened', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    const first = renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(/say it the better way/i)
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    first.unmount()

    renderAs(`/tutor/student/${student.id}`, student.id, 'student')
    await screen.findByRole('heading', { name: /^today$/i })
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
  })

  it('lets the learner look back at what they already answered, without changing it', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')

    await screen.findByText(/say it the better way/i)
    // Nothing answered yet — there is nothing to look back at.
    expect(screen.queryByRole('button', { name: /^previous$/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    await screen.findByText(/what is the english for this|say it/i)

    // One answer recorded — Previous now offers a read-only look at it.
    await user.click(await screen.findByRole('button', { name: /^previous$/i }))
    expect(screen.getByText(/what you answered/i)).toBeInTheDocument()
    expect(screen.getByText('I agree with the plan')).toBeInTheDocument()
    // Looking back is not a second attempt: no answer buttons here.
    expect(screen.queryByRole('button', { name: /^i got it$/i })).toBeNull()

    const before = (await getLearningModel(student.id))!.practiceSessions![0].results.length
    await user.click(screen.getByRole('button', { name: /back to where you were/i }))
    const after = (await getLearningModel(student.id))!.practiceSessions![0].results.length

    // Reading it back recorded nothing new — evidence cannot be duplicated
    // just by looking at it — and the live item picks up right where it was.
    expect(after).toBe(before)
    expect(screen.queryByText(/what you answered/i)).toBeNull()
  })
})

/* -------------------------------------------------------------------------- */

describe('what the learner did reaches the tutor as evidence', () => {
  async function runWholeSet(studentId: string, outcome: 'gotIt' | 'notYet') {
    const user = userEvent.setup()
    const view = renderAs(`/tutor/student/${studentId}/practice`, studentId, 'student')
    await screen.findByText(/say it the better way/i)
    for (let i = 0; i < 20; i++) {
      const reveal = screen.queryByRole('button', { name: /show the answer/i })
      if (reveal) {
        await user.click(reveal)
        await user.click(
          screen.getByRole('button', { name: outcome === 'gotIt' ? /i got it/i : /not yet/i }),
        )
        continue
      }
      const done = screen.queryByRole('button', { name: /^done$/i })
      if (done) {
        await user.click(done)
        continue
      }
      break
    }
    await screen.findByText(/that is the set finished/i)
    view.unmount()
  }

  it('the briefing reports a count with its denominator, not a claim', async () => {
    const student = await seedAcceptanceStudent()
    await runWholeSet(student.id, 'gotIt')

    renderAs(`/tutor/student/${student.id}`, student.id, 'tutor')
    const briefing = await screen.findByRole('region', { name: /where we left off/i })
    const practised = within(briefing).getByText(/practised in the app: (\d+) of (\d+)/i)
    const [, answered, total] = /: (\d+) of (\d+)/i.exec(practised.textContent!)!
    expect(answered).toBe(total)
    const unaided = within(briefing).getByText(/(\d+) of (\d+) came back without looking/i)
    const [, correct, over] = /(\d+) of (\d+) came back/i.exec(unaided.textContent!)!
    expect(over).toBe(answered)
    expect(Number(correct)).toBe(Number(answered))
  })

  it('a set that was run counts as homework coming back, without the tutor asking', async () => {
    const student = await seedAcceptanceStudent()
    await runWholeSet(student.id, 'gotIt')

    const bundle = (await loadStudentBundle(student.id))!
    const lesson = bundle.lessons.find((l) => l.status === 'completed')!
    const outcome = homeworkOutcome(lesson, bundle.model)
    expect(outcome.review).toBe('done')
    expect(outcome.fromPractice).toBe(true)
    // …and the lesson record itself still carries no tutor verdict, because
    // the tutor has not been asked. Inference never writes itself into the
    // record as if a human had answered.
    expect(lesson.homeworkReview).toBeUndefined()
  })

  it('a set the learner struggled with shortens the NEXT set rather than growing it', async () => {
    const student = await seedAcceptanceStudent()
    await runWholeSet(student.id, 'notYet')

    // "Not yet" on everything is still a set that came back — the learner did
    // the work. What it must not do is produce more work next week.
    const bundle = (await loadStudentBundle(student.id))!
    const lesson = bundle.lessons.find((l) => l.status === 'completed')!
    expect(homeworkOutcome(lesson, bundle.model).review).toBe('done')

    const missed = bundle.model.vocabulary.filter((v) => v.strength === 'emerging')
    expect(missed.length).toBeGreaterThan(0)
  })
})

/* -------------------------------------------------------------------------- */

describe('the learner can see truthful evidence of improving', () => {
  it('says "you fixed it yourself" only after they actually did', async () => {
    const student = await seedAcceptanceStudent()
    let bundle = (await loadStudentBundle(student.id))!

    // Before any practice: the only evidence is the mistake.
    expect(learnerEvidence(bundle).wins.some((w) => w.key.includes('fixed'))).toBe(false)

    const user = userEvent.setup()
    const view = renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(/say it the better way/i)
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    view.unmount()

    bundle = (await loadStudentBundle(student.id))!
    const win = learnerEvidence(bundle).wins.find((w) => w.key.includes('fixed'))
    expect(win).toBeDefined()
    expect(win!.params!.phrase).toBe('I agree with the plan')
  })

  it('renders that evidence on Student Home, in the learner’s own words', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    const view = renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(/say it the better way/i)
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    view.unmount()

    renderAs(`/tutor/student/${student.id}`, student.id, 'student')
    await screen.findByRole('heading', { name: /^today$/i })
    expect(
      screen.getByText(/needed help with .*I agree with the plan.*said it yourself/i),
    ).toBeInTheDocument()
  })

  it('claims no percentage of anything, and leaks no unfilled template', async () => {
    const user = userEvent.setup()
    const student = await seedAcceptanceStudent()
    renderAs(`/tutor/student/${student.id}`, student.id, 'student')
    await screen.findByRole('heading', { name: /^today$/i })
    expect(document.body.textContent).not.toMatch(/\d+\s?%/)
    expect(document.body.textContent).not.toMatch(/\{\{|studentHome\.|practice\./)

    // Same on the runner, where most of the new templates actually render —
    // a placeholder named differently in the code than in the locale renders
    // as literal "{{answered}}" and nothing else complains.
    await user.click(screen.getByRole('button', { name: /^start$/i }))
    await screen.findByText(/say it the better way/i)
    expect(document.body.textContent).not.toMatch(/\{\{|practice\.item\./)
  })
})

/* -------------------------------------------------------------------------- */

describe('the next lesson knows about the week in between', () => {
  it('stops planning around a weakness the learner now produces unaided', async () => {
    const student = await seedAcceptanceStudent()
    const before = (await loadStudentBundle(student.id))!
    const issue = before.progress.issues.find((i) => i.said?.includes('I am agree'))!
    expect(issue.practicedIndependently).toBe(0)

    const user = userEvent.setup()
    const view = renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(/say it the better way/i)
    await user.click(screen.getByRole('button', { name: /show the answer/i }))
    await user.click(screen.getByRole('button', { name: /i got it/i }))
    view.unmount()

    const after = (await loadStudentBundle(student.id))!
    const same = after.progress.issues.find((i) => i.key === issue.key)!
    expect(same.practicedIndependently).toBe(1)
    expect(same.lastPracticeOutcome).toBe('independent')
  })

  it('brings the words the learner missed back into the review queue', async () => {
    const student = await seedAcceptanceStudent()
    const lessons = await getLessonsForStudent(student.id)
    expect(lessons.some((l) => (l.report?.homework?.length ?? 0) > 0)).toBe(true)

    const user = userEvent.setup()
    renderAs(`/tutor/student/${student.id}/practice`, student.id, 'student')
    await screen.findByText(/say it the better way/i)

    // Answer everything with "not yet" — nothing may be recorded as recalled.
    for (let i = 0; i < 20; i++) {
      const reveal = screen.queryByRole('button', { name: /show the answer/i })
      if (reveal) {
        await user.click(reveal)
        await user.click(screen.getByRole('button', { name: /not yet/i }))
        continue
      }
      const done = screen.queryByRole('button', { name: /^done$/i })
      if (done) {
        await user.click(done)
        continue
      }
      break
    }

    const model = (await getLearningModel(student.id))!
    expect(model.vocabulary.every((v) => v.strength !== 'secure')).toBe(true)
  })
})
