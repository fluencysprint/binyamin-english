/* ==========================================================================
   The success criterion, made executable.
   --------------------------------------------------------------------------
   "An inexperienced tutor should be able to select a student, press Start
   Lesson, and confidently conduct ~50 minutes of useful English teaching with
   the app continuously guiding what to say, ask, observe, correct and do next.
   The student should leave with a clear summary and small useful homework."

   So: for six representative learners, walk the WHOLE lesson step by step and
   assert that the tutor is never left without an instruction — and that the
   lesson ends with a report and homework.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { Correction, LessonRecord, StudentProfile } from '../types'
import { initLearningModel, addVocabulary, applyCorrections } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { buildMicroSteps, buildRetrievalStep, MicroStep } from '../lessons/microSteps'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { overallCefr } from '../utils/cefr'

const now = 1_700_000_000_000

function profile(over: Partial<StudentProfile>): StudentProfile {
  return {
    id: 'x',
    createdAt: now,
    updatedAt: now,
    name: 'Learner',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'ru',
    goals: ['conversation'],
    interests: ['music'],
    speakingConfidence: 3,
    pronunciationImportance: 4,
    ...over,
  }
}

const LEARNERS = [
  {
    label: 'young beginner (6, from zero)',
    student: profile({ id: 'a', name: 'Noa', age: 6, ageBand: '6-8', englishReading: 'cannot', nativeLanguageLiteracy: 'no' }),
    level: 'preA1' as const,
  },
  {
    label: 'older beginner (68, literate in Russian, not in English)',
    student: profile({ id: 'b', name: 'Yosef', age: 68, englishReading: 'cannot', englishWriting: 'cannot', nativeLanguageLiteracy: 'yes' }),
    level: 'preA1' as const,
  },
  {
    label: 'intermediate teenager (15)',
    student: profile({ id: 'c', name: 'Dana', age: 15, ageBand: '13-17', goals: ['school', 'confidence'] }),
    level: 'A2' as const,
  },
  {
    label: 'B1 adult',
    student: profile({ id: 'd', name: 'Igor', age: 34 }),
    level: 'B1' as const,
  },
  {
    label: 'B2 adult',
    student: profile({ id: 'e', name: 'Rina', age: 41, goals: ['work'] }),
    level: 'B2' as const,
  },
  {
    label: 'C1 adult',
    student: profile({ id: 'f', name: 'Maya', age: 45, goals: ['work', 'confidence'] }),
    level: 'C1' as const,
  },
]

/** Every micro-step of a whole lesson, in the order the runner shows them. */
function walkLesson(student: StudentProfile, model: ReturnType<typeof initLearningModel>, plan = generateFirstLesson(student, model)) {
  const level = overallCefr(model.skillEstimates)
  const steps: MicroStep[] = []
  plan.phases.forEach((phase) => {
    const built = phase.activities.flatMap((activity, activityIndex) =>
      buildMicroSteps(activity, { student, model, level, lang: 'en', activityIndex }),
    )
    if (phase.kind === 'warmup' && phase.activities[0]) {
      const retrieval = buildRetrievalStep(
        { student, model, level, lang: 'en', activityIndex: 0 },
        phase.activities[0].id,
        now,
      )
      if (retrieval) built.splice(1, 0, retrieval)
    }
    steps.push(...built)
  })
  return { plan, steps }
}

describe.each(LEARNERS)('$label', ({ student, level }) => {
  const model = initLearningModel(student.id, level, now)

  it('gets a lesson that fills the hour and ends when it says it will', () => {
    const { plan } = walkLesson(student, model)
    expect(plan.phases[0].startMin).toBe(0)
    expect(plan.phases[plan.phases.length - 1].endMin).toBe(plan.totalMinutes)
    expect(plan.totalMinutes).toBeGreaterThanOrEqual(40)
    expect(plan.totalMinutes).toBeLessThanOrEqual(55)
    // Phases run back to back with no gap and no overlap — a tutor reading
    // "5–15" then "20–27" has lost five minutes with no instruction for them.
    plan.phases.forEach((p, i) => {
      if (i > 0) expect(p.startMin).toBe(plan.phases[i - 1].endMin)
      expect(p.endMin).toBeGreaterThan(p.startMin)
    })
  })

  it('never shows the tutor an empty instruction, at any step of the lesson', () => {
    const { steps } = walkLesson(student, model)
    expect(steps.length).toBeGreaterThan(4)
    steps.forEach((step) => {
      const where = `${student.name} / ${step.move} / ${step.id}`
      expect(step.now.trim().length, `now: ${where}`).toBeGreaterThan(5)
      expect(step.say.filter(Boolean).length, `say: ${where}`).toBeGreaterThan(0)
      expect(step.do.filter(Boolean).length, `do: ${where}`).toBeGreaterThan(0)
      expect(step.studentDoes.filter(Boolean).length, `studentDoes: ${where}`).toBeGreaterThan(0)
      expect(step.lookFor.filter(Boolean).length, `lookFor: ${where}`).toBeGreaterThan(0)
      expect(step.help.filter(Boolean).length, `help: ${where}`).toBeGreaterThan(0)
      expect(step.challenge.filter(Boolean).length, `challenge: ${where}`).toBeGreaterThan(0)
      expect(step.doneWhen.trim().length, `doneWhen: ${where}`).toBeGreaterThan(5)
      expect(step.next.trim().length, `next: ${where}`).toBeGreaterThan(5)
      expect(step.minutes, `minutes: ${where}`).toBeGreaterThanOrEqual(2)
    })
  })

  it('never tells the tutor something as useless as "discuss this topic"', () => {
    const { steps } = walkLesson(student, model)
    const vague = /^(discuss|talk about it|practice|continue|do the activity)\.?$/i
    steps.forEach((step) => {
      const lines = [...step.say, ...step.do]
      lines.forEach((line) => {
        expect(vague.test(line.trim()), `vague line in ${step.id}: "${line}"`).toBe(false)
      })
    })
  })

  it('finishes with a report and homework the student can actually do', () => {
    const { plan } = walkLesson(student, model)
    const corrections: Correction[] = [
      {
        id: 'c1',
        studentId: student.id,
        category: 'grammar',
        said: 'I go yesterday',
        better: 'I went yesterday',
        priority: 'high',
        at: now,
      },
    ]
    const record: LessonRecord = {
      id: 'l1',
      studentId: student.id,
      plan,
      status: 'completed',
      currentPhaseIndex: plan.phases.length - 1,
      elapsedSeconds: plan.totalMinutes * 60,
      responses: [],
      correctionIds: corrections.map((c) => c.id),
      audioIds: [],
      vocabularyAdded: ['on purpose'],
      objectiveOutcome: 'partial',
    }
    const { report } = applyCompletedLesson(model, record, student, corrections, now)

    expect(report.workedOn.length).toBeGreaterThan(0)
    expect(report.wentWell.length).toBeGreaterThan(0)
    expect(report.homework?.length ?? 0).toBeGreaterThanOrEqual(1)
    expect(report.homework?.length ?? 0).toBeLessThanOrEqual(3)

    // A learner who cannot write English is never sent home to write.
    if (student.englishWriting === 'cannot') {
      expect(report.homework?.map((h) => h.kind)).not.toContain('writeSentences')
    }
    // Minors get the parent section; adults do not.
    expect(Boolean(report.parent)).toBe(student.age < 18)
  })
})

describe('the student never reads the tutor’s stage directions', () => {
  it('keeps tutor asides out of every student-facing prompt', () => {
    // "Describe your ideal day (try connecting it to travel if it fits)" was
    // printed on the learner's own task card and on the report their parents
    // read. Personalization is a note to the tutor; it belongs in DO.
    const tutorAside = /\(try connecting|if it fits\)|your tutor will|gently probe/i
    for (const { student, level } of LEARNERS) {
      const model = initLearningModel(student.id, level, now)
      const plan = generateLesson(student, model, { label: 'Lesson 3' })
      plan.phases
        .flatMap((p) => p.activities)
        .forEach((a) => {
          expect(tutorAside.test(a.studentPrompt), `${student.name}: ${a.studentPrompt}`).toBe(false)
        })
    }
  })
})

describe('a returning student with history', () => {
  const student = profile({ id: 'ret', name: 'Sasha', age: 27 })

  it('has last month’s vocabulary and errors pulled into this lesson’s recall step', () => {
    let model = initLearningModel(student.id, 'B1', now - 30 * 86_400_000)
    model = addVocabulary(model, [{ term: 'reluctant' }, { term: 'blunt' }], now - 30 * 86_400_000)
    model = applyCorrections(
      model,
      [
        {
          id: 'c',
          studentId: student.id,
          category: 'grammar',
          said: 'He don’t like',
          better: 'He doesn’t like',
          priority: 'high',
          at: now - 30 * 86_400_000,
        },
      ],
      now - 30 * 86_400_000,
    )

    const plan = generateLesson(student, model, { label: 'Lesson 5' })
    const warmup = plan.phases[0]
    const retrieval = buildRetrievalStep(
      { student, model, level: 'B1', lang: 'en', activityIndex: 0 },
      warmup.activities[0].id,
      now,
    )
    expect(retrieval, 'a student with due material should get a recall step').toBeTruthy()
    expect(retrieval!.say.join(' ')).toMatch(/reluctant|blunt/)
    expect(retrieval!.lookFor.join(' ')).toMatch(/don’t like|slips/i)
  })

  it('does not hand a returning student the same conversation topic every week', () => {
    let model = initLearningModel(student.id, 'B1', now)
    const seen = new Set<string>()
    for (let i = 0; i < 6; i++) {
      const plan = generateLesson(student, model, { label: `Lesson ${i}` })
      const record: LessonRecord = {
        id: `l${i}`,
        studentId: student.id,
        plan,
        status: 'completed',
        currentPhaseIndex: 0,
        elapsedSeconds: 3000,
        responses: [],
        correctionIds: [],
        audioIds: [],
        vocabularyAdded: [],
        objectiveOutcome: 'correct',
      }
      plan.phases
        .filter((p) => p.kind === 'communication' || p.kind === 'fluency')
        .flatMap((p) => p.activities)
        .forEach((a) => a.ref && seen.add(a.ref))
      model = applyCompletedLesson(model, record, student, [], now).model
    }
    // Six lessons, every speaking task different — the recency window works.
    expect(seen.size).toBeGreaterThanOrEqual(6)
  })
})
