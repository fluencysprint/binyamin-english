/* ==========================================================================
   Does the system actually remember the student between lessons?
   --------------------------------------------------------------------------
   progress.test.ts proves the classification. This proves the loop closes:
   a lesson happens → it produces evidence → the evidence changes what the
   report says, what the tutor is briefed on, and what the next lesson teaches
   — and all of it survives a reload of the app.
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  Correction,
  LearningModel,
  LessonRecord,
  StudentProfile,
  VocabRecallOutcome,
} from '../types'
import {
  addVocabulary,
  deferVocabularyReview,
  initLearningModel,
  reviewVocabulary,
} from '../students/learningModel'
import { buildProgress } from '../students/progress'
import { buildBriefing } from '../lessons/briefing'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { retrievalMaterial } from '../lessons/microSteps'
import {
  _resetDBForTests,
  clearAllData,
  putCorrection,
  putLearningModel,
  putLesson,
  putStudent,
} from '../data/db'
import { loadStudentBundle, loadBriefing } from '../students/studentService'
import { testCorrection, testLesson, testStudent } from './fixtures'

const DAY = 24 * 60 * 60 * 1000
const T0 = 1_700_000_000_000

/* -------------------------------------------------------------------------- */
/* Vocabulary: spaced recall actually moves                                    */
/* -------------------------------------------------------------------------- */

describe('vocabulary recall and review', () => {
  const seed = (): LearningModel =>
    addVocabulary(
      initLearningModel('stu1', 'A2', T0),
      [
        { term: 'stubborn', meaning: 'will not change their mind' },
        { term: 'commute', meaning: 'the trip to work' },
      ],
      T0,
    )

  it('offers a word for recall once its review date arrives, and not before', () => {
    const model = seed()
    expect(retrievalMaterial(model, T0 + 60_000).vocabulary).toEqual([])
    const due = retrievalMaterial(model, T0 + 3 * DAY).vocabulary
    expect(due).toEqual(['stubborn', 'commute'])
  })

  it('cues from meaning where the tutor captured one, so the learner produces the word', () => {
    const material = retrievalMaterial(seed(), T0 + 3 * DAY)
    expect(material.fromMeaning.map((v) => v.term)).toEqual(['stubborn', 'commute'])
  })

  it('advances a remembered word and pushes its next review out', () => {
    const before = seed()
    const after = reviewVocabulary(before, { stubborn: 'recalled' }, T0 + 3 * DAY)
    const word = after.vocabulary.find((v) => v.term === 'stubborn')!
    expect(word.strength).toBe('developing')
    expect(word.evidenceCount).toBe(1)
    expect(Math.round((word.reviewDue - (T0 + 3 * DAY)) / DAY)).toBe(7)
    // It is no longer in the queue, so newer words get their turn.
    expect(retrievalMaterial(after, T0 + 3 * DAY).vocabulary).toEqual(['commute'])
  })

  it('takes a forgotten word back a step and asks again soon', () => {
    let model = reviewVocabulary(seed(), { stubborn: 'recalled' }, T0 + 3 * DAY)
    model = reviewVocabulary(model, { stubborn: 'missed' }, T0 + 12 * DAY)
    const word = model.vocabulary.find((v) => v.term === 'stubborn')!
    expect(word.strength).toBe('emerging')
    expect(Math.round((word.reviewDue - (T0 + 12 * DAY)) / DAY)).toBe(2)
  })

  it('only calls a word secure after it has been produced repeatedly', () => {
    let model = seed()
    let at = T0
    const outcomes: VocabRecallOutcome[] = ['recalled', 'recalled', 'recalled']
    for (const outcome of outcomes) {
      at += 30 * DAY
      model = reviewVocabulary(model, { stubborn: outcome }, at)
    }
    const word = model.vocabulary.find((v) => v.term === 'stubborn')!
    expect(word.strength).toBe('secure')
    // A secure word stops dominating the queue it used to sit at the front of.
    expect(retrievalMaterial(model, at + 30 * DAY).vocabulary).not.toContain('stubborn')
    expect(buildProgress({
      student: testStudent(),
      model,
      lessons: [],
      corrections: [],
      now: at + 30 * DAY,
    }).secureVocabulary).toContain('stubborn')
  })

  it('claims nothing about a word that was offered but never judged, and re-queues it', () => {
    const before = seed()
    const after = deferVocabularyReview(before, ['stubborn'], T0 + 3 * DAY)
    const word = after.vocabulary.find((v) => v.term === 'stubborn')!
    expect(word.strength).toBe('emerging')
    expect(word.evidenceCount).toBeUndefined()
    expect(word.reviewDue).toBeGreaterThan(T0 + 3 * DAY)
  })

  it('folds the tutor’s verdicts in when the lesson is completed, and records them', () => {
    const model = seed()
    const lesson: LessonRecord = {
      ...testLesson(1),
      startedAt: T0 + 3 * DAY,
      vocabularyReview: { stubborn: 'recalled' },
      vocabularyAdded: ['reluctant'],
    }
    const { model: after, report } = applyCompletedLesson(
      model,
      lesson,
      testStudent(),
      [],
      T0 + 3 * DAY,
    )
    expect(after.vocabulary.find((v) => v.term === 'stubborn')!.strength).toBe('developing')
    // 'commute' was offered and not judged: re-queued, but nothing claimed.
    const commute = after.vocabulary.find((v) => v.term === 'commute')!
    expect(commute.strength).toBe('emerging')
    expect(commute.reviewDue).toBeGreaterThan(T0 + 3 * DAY)
    // A word captured today was never offered, so it must not be treated as reviewed.
    expect(after.vocabulary.find((v) => v.term === 'reluctant')!.evidenceCount).toBeUndefined()
    expect(report.reviewed).toEqual({ recalled: ['stubborn'], missed: [] })
  })
})

/* -------------------------------------------------------------------------- */
/* The next lesson reflects what actually happened                             */
/* -------------------------------------------------------------------------- */

const THIRD_PERSON: [string, string][] = [
  ['She go to school every day.', 'She goes to school every day.'],
  ['He go to work by bus.', 'He goes to work by bus.'],
  ['My sister go to the gym.', 'My sister goes to the gym.'],
]

function planNext(
  student: StudentProfile,
  model: LearningModel,
  lessons: LessonRecord[],
  corrections: Correction[],
  now: number,
) {
  const progress = buildProgress({ student, model, lessons, corrections, now })
  return generateLesson(student, model, {
    label: `Lesson ${lessons.length + 1}`,
    previousObjectiveRefs: lessons.map((l) => l.plan.objective.ref),
    seed: 7,
    progress,
    rng: () => 0.5,
  })
}

describe('the next lesson reflects prior evidence', () => {
  const student = testStudent()
  const model = initLearningModel('stu1', 'A2', T0)

  it('teaches the concept behind a weakness heard across several lessons', () => {
    const lessons = [1, 2, 3].map((n) => testLesson(n))
    const corrections = THIRD_PERSON.map(([said, better], i) => testCorrection(i + 1, said, better))
    const plan = planNext(student, model, lessons, corrections, T0 + 28 * DAY)
    expect(plan.objective.ref).toBe('g_present_simple')
    expect(plan.objective.rationale).toContain('3 lessons')
  })

  it('does not rearrange the whole plan around a single slip', () => {
    const lessons = [1, 2, 3].map((n) => testLesson(n))
    const corrections = [testCorrection(3, ...THIRD_PERSON[0])]
    const plan = planNext(student, model, lessons, corrections, T0 + 28 * DAY)
    expect(plan.objective.ref).not.toBe('g_present_simple')
  })

  it('stops teaching a weakness the learner has stopped making', () => {
    const lessons = [1, 2, 3, 4, 5, 6].map((n) => testLesson(n))
    const corrections = [
      testCorrection(1, ...THIRD_PERSON[0]),
      testCorrection(2, ...THIRD_PERSON[1]),
    ]
    const plan = planNext(student, model, lessons, corrections, T0 + 49 * DAY)
    expect(plan.objective.ref).not.toBe('g_present_simple')
  })

  it('does not repeat the same objective four weeks running, even for a live weakness', () => {
    const lessons = [1, 2, 3].map((n) =>
      testLesson(n, {
        plan: {
          ...testLesson(n).plan,
          objective: { ref: 'g_present_simple', title: 'Present simple', rationale: 'x' },
        },
      }),
    )
    const corrections = THIRD_PERSON.map(([said, better], i) => testCorrection(i + 1, said, better))
    const plan = planNext(student, model, lessons, corrections, T0 + 28 * DAY)
    expect(plan.objective.ref).not.toBe('g_present_simple')
  })

  it('gives a student with no history a first lesson, with no evidence to lean on', () => {
    const plan = generateFirstLesson(student, model, () => 0.5)
    expect(plan.source).toBe('firstLesson')
    expect(plan.phases.length).toBeGreaterThan(0)
    const progress = buildProgress({ student, model, lessons: [], corrections: [], now: T0 })
    expect(progress.focus).toEqual([])
  })
})

/* -------------------------------------------------------------------------- */
/* The whole journey                                                           */
/* -------------------------------------------------------------------------- */

describe('completed lesson → report → progress → briefing → next lesson', () => {
  const student = testStudent()

  function runLesson(
    model: LearningModel,
    lessons: LessonRecord[],
    corrections: Correction[],
    n: number,
  ) {
    const progress = buildProgress({
      student,
      model,
      lessons,
      corrections,
      now: T0 + n * 7 * DAY,
    })
    const plan =
      lessons.length === 0
        ? generateFirstLesson(student, model, () => 0.5)
        : generateLesson(student, model, {
            label: `Lesson ${n}`,
            previousObjectiveRefs: lessons.map((l) => l.plan.objective.ref),
            seed: n,
            progress,
            rng: () => 0.5,
          })
    const said = THIRD_PERSON[(n - 1) % THIRD_PERSON.length]
    const correction: Correction = {
      ...testCorrection(n, said[0], said[1]),
      lessonId: plan.id,
      at: T0 + n * 7 * DAY - 1000,
    }
    const record: LessonRecord = {
      id: plan.id,
      studentId: student.id,
      plan,
      status: 'inProgress',
      startedAt: T0 + n * 7 * DAY - 3000,
      currentPhaseIndex: 0,
      elapsedSeconds: 3000,
      responses: [],
      correctionIds: [correction.id],
      audioIds: [],
      vocabularyAdded: [`word${n}`],
      vocabularyMeanings: { [`word${n}`]: `meaning ${n}` },
      objectiveOutcome: 'partial',
    }
    const allCorrections = [...corrections, correction]
    const result = applyCompletedLesson(
      model,
      record,
      student,
      allCorrections,
      T0 + n * 7 * DAY,
      lessons,
    )
    return {
      model: result.model,
      report: result.report,
      progress: result.progress,
      lessons: [...lessons, { ...record, status: 'completed' as const, completedAt: T0 + n * 7 * DAY, report: result.report }],
      corrections: allCorrections,
    }
  }

  it('accumulates across three lessons and hands the tutor a briefing that says why', () => {
    let state = runLesson(initLearningModel('stu1', 'A2', T0), [], [], 1)
    expect(state.progress.needsWork).toEqual([]) // one lesson is not a pattern

    state = runLesson(state.model, state.lessons, state.corrections, 2)
    state = runLesson(state.model, state.lessons, state.corrections, 3)

    const issue = state.progress.needsWork[0]
    expect(issue.status).toBe('recurring')
    expect(issue.lessonsSeen).toBe(3)
    expect(state.report.nextFocusTitle).toBe(issue.label)

    const next = generateLesson(student, state.model, {
      label: 'Lesson 4',
      previousObjectiveRefs: state.lessons.map((l) => l.plan.objective.ref),
      progress: state.progress,
      rng: () => 0.5,
    })

    const briefing = buildBriefing(
      { student, model: state.model, lessons: state.lessons, corrections: state.corrections, progress: state.progress },
      T0 + 22 * DAY,
      next,
    )
    expect(briefing.isFirstLesson).toBe(false)
    expect(briefing.lessonNumber).toBe(4)
    expect(briefing.lastLesson?.objectiveOutcome).toBe('partial')
    expect(briefing.recurringWeaknesses[0].key).toBe(issue.key)
    expect(briefing.keyCorrections).toHaveLength(1)
    expect(briefing.homework?.length ?? 0).toBeGreaterThan(0)
    // The briefing never recommends a focus the generated lesson will not teach.
    expect(briefing.recommendedFocus?.ref).toBe(next.objective.ref)
    expect(briefing.recommendedFocus?.title).toBe(next.objective.title)
  })

  it('briefs a first lesson honestly instead of showing empty sections', () => {
    const model = initLearningModel('stu1', 'A1', T0)
    const progress = buildProgress({ student, model, lessons: [], corrections: [], now: T0 })
    const briefing = buildBriefing({ student, model, lessons: [], corrections: [], progress }, T0)
    expect(briefing.isFirstLesson).toBe(true)
    expect(briefing.lessonNumber).toBe(1)
    expect(briefing.lastLesson).toBeUndefined()
    expect(briefing.recurringWeaknesses).toEqual([])
    expect(briefing.keyCorrections).toEqual([])
  })
})

/* -------------------------------------------------------------------------- */
/* Persistence                                                                 */
/* -------------------------------------------------------------------------- */

describe('progress survives a reload', () => {
  beforeEach(async () => {
    _resetDBForTests()
    await clearAllData()
  })

  it('rebuilds the same recurring weakness, review queue and briefing from storage', async () => {
    const student = testStudent()
    let model = initLearningModel(student.id, 'A2', T0)
    model = addVocabulary(model, [{ term: 'stubborn', meaning: 'will not change their mind' }], T0)

    const lessons = [1, 2, 3].map((n) => testLesson(n, { studentId: student.id }))
    const corrections = THIRD_PERSON.map(([said, better], i) =>
      testCorrection(i + 1, said, better, { studentId: student.id }),
    )

    await putStudent(student)
    await putLearningModel(model)
    for (const l of lessons) await putLesson(l)
    for (const c of corrections) await putCorrection(c)

    // Reload: a brand new connection, exactly as a page refresh gives you.
    _resetDBForTests()

    const bundle = await loadStudentBundle(student.id)
    expect(bundle).not.toBeNull()
    expect(bundle!.progress.lessonCount).toBe(3)
    expect(bundle!.progress.needsWork[0].lessonsSeen).toBe(3)
    expect(bundle!.progress.needsWork[0].grammarRef).toBe('g_present_simple')
    expect(bundle!.progress.dueVocabulary.map((v) => v.term)).toContain('stubborn')

    const briefing = await loadBriefing(student.id)
    expect(briefing!.recommendedFocus?.ref).toBe('g_present_simple')
    expect(briefing!.vocabularyToRecall.map((v) => v.term)).toContain('stubborn')
  })
})
