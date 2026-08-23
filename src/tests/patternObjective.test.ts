/* ==========================================================================
   When the learner's evidence outranks the content taxonomy.
   --------------------------------------------------------------------------
   "I am agree" → "I agree" is the case this exists for. No entry in the
   grammar library teaches it, so before this the app could drill it inside a
   lesson but could never make it the POINT of one — the objective always fell
   through to whatever concept happened to be next at B1.

   The two failure modes being guarded against are opposite and equally bad:

     • a persistent habit that can never become a teaching target
     • every typo becoming curriculum

   so these tests assert the promotion happens, and assert just as hard on the
   cases where it must not.
   ========================================================================== */

import { describe, it, expect, beforeAll } from 'vitest'
import { loadTeachingStrings } from '../i18n/teachingStrings'
import { buildProgress, PATTERN_MIN_LESSONS, isPatternRef } from '../students/progress'
import { initLearningModel } from '../students/learningModel'
import { chooseObjective, generateLesson } from '../lessons/lessonGenerator'
import { buildMicroSteps, MicroStepContext } from '../lessons/microSteps'
import { buildStudentBoard } from '../lessons/studentBoard'
import { activityGuidance, localizedTitle } from '../lessons/guidance'
import { DAY, T0, testCorrection, testLesson, testStudent } from './fixtures'
import { Correction, LearningModel, LessonRecord, PracticeSessionRecord } from '../types'

const student = testStudent({ name: 'Dana', goals: ['work'], age: 34 })

/* The teaching prose is fetched on demand in the app; ask for it up front so
 * the localization assertions see real strings rather than English fallback. */
beforeAll(async () => {
  await Promise.all(['en', 'ru'].map((l) => loadTeachingStrings(l as 'en')))
})

/** N lessons in which the learner said the same untaught thing every time. */
function history(n: number, said = 'I am agree', better = 'I agree') {
  const lessons: LessonRecord[] = Array.from({ length: n }, (_, i) => testLesson(i + 1))
  const corrections: Correction[] = Array.from({ length: n }, (_, i) =>
    testCorrection(i + 1, said, better),
  )
  return { lessons, corrections }
}

function progressFor(lessons: LessonRecord[], corrections: Correction[], model?: LearningModel) {
  return buildProgress({
    student,
    model: model ?? initLearningModel('stu1', 'B1', T0),
    lessons,
    corrections,
    now: T0 + (lessons.length + 1) * 7 * DAY,
  })
}

describe('promotion is earned, not automatic', () => {
  it('a slip seen once is not a lesson', () => {
    const { lessons, corrections } = history(1)
    expect(progressFor(lessons, corrections).focus.some((f) => f.kind === 'pattern')).toBe(false)
  })

  it('two lessons make it a drill, still not an objective', () => {
    const { lessons, corrections } = history(2)
    const progress = progressFor(lessons, corrections)
    // It IS a recurring weakness by now — that is what feeds the fix drill.
    expect(progress.needsWork.some((i) => i.said === 'I am agree')).toBe(true)
    // But not yet something a whole lesson is built around.
    expect(progress.focus.some((f) => f.kind === 'pattern')).toBe(false)
  })

  it(`survives ${PATTERN_MIN_LESSONS} lessons of being corrected — now it is the objective`, () => {
    const { lessons, corrections } = history(PATTERN_MIN_LESSONS)
    const candidate = progressFor(lessons, corrections).focus.find((f) => f.kind === 'pattern')
    expect(candidate).toBeDefined()
    expect(candidate!.said).toBe('I am agree')
    expect(candidate!.better).toBe('I agree')
    expect(isPatternRef(candidate!.ref)).toBe(true)
  })

  it('never promotes something the grammar library can actually teach', () => {
    // Third-person -s IS in the library, so it goes down the ordinary route
    // where there is real material for it.
    const { lessons, corrections } = history(4, 'She go to school', 'She goes to school')
    const progress = progressFor(lessons, corrections)
    expect(progress.focus.some((f) => f.kind === 'pattern')).toBe(false)
    expect(progress.focus.some((f) => f.kind === 'grammar')).toBe(true)
  })

  it('never promotes a fluency note or a compliment', () => {
    const lessons = Array.from({ length: 4 }, (_, i) => testLesson(i + 1))
    const corrections = Array.from({ length: 4 }, (_, i) =>
      testCorrection(i + 1, 'long pause before answering', 'answer sooner', { category: 'fluency' }),
    )
    expect(progressFor(lessons, corrections).focus.some((f) => f.kind === 'pattern')).toBe(false)
  })

  it('never promotes a correction with no corrected version to teach towards', () => {
    const lessons = Array.from({ length: 4 }, (_, i) => testLesson(i + 1))
    const corrections = Array.from({ length: 4 }, (_, i) => testCorrection(i + 1, 'I am agree', ''))
    expect(progressFor(lessons, corrections).focus.some((f) => f.kind === 'pattern')).toBe(false)
  })

  it('retires it once the learner has produced it unaided twice on their own', () => {
    const { lessons, corrections } = history(PATTERN_MIN_LESSONS)
    const key = progressFor(lessons, corrections).needsWork.find((i) => i.said === 'I am agree')!.key
    /* AFTER the last failure, on two separate days — practice that predates
       the most recent slip proves nothing about the habit today. */
    const sessions: PracticeSessionRecord[] = [22, 29].map((i) => ({
      id: `p${i}`,
      studentId: 'stu1',
      source: 'homework',
      startedAt: T0 + i * DAY,
      updatedAt: T0 + i * DAY,
      itemCount: 1,
      results: [
        {
          itemId: 'a',
          targetKind: 'correction',
          targetKey: key,
          label: 'I agree',
          outcome: 'independent',
          at: T0 + i * DAY,
        },
      ],
    }))
    const model = { ...initLearningModel('stu1', 'B1', T0), practiceSessions: sessions }
    const progress = progressFor(lessons, corrections, model)
    expect(progress.focus.some((f) => f.kind === 'pattern')).toBe(false)
  })
})

/* -------------------------------------------------------------------------- */

describe('a promoted pattern produces a real lesson, not a slogan on a slide', () => {
  const { lessons, corrections } = history(PATTERN_MIN_LESSONS)
  const model = initLearningModel('stu1', 'B1', T0)
  const progress = progressFor(lessons, corrections, model)

  it('becomes the chosen objective, carrying both sentences', () => {
    const objective = chooseObjective(model, 'B1', [], progress)
    expect(objective.kind).toBe('pattern')
    expect(objective.said).toBe('I am agree')
    expect(objective.better).toBe('I agree')
  })

  it('names itself in the tutor’s language without inventing a concept', () => {
    const objective = chooseObjective(model, 'B1', [], progress)
    expect(localizedTitle('en', objective)).toContain('I agree')
    // And it localizes — the pair stays English, the framing does not.
    expect(localizedTitle('ru', objective)).toContain('I agree')
    expect(localizedTitle('ru', objective)).not.toBe(localizedTitle('en', objective))
  })

  it('builds a five-step teaching sequence, split across the two phases', () => {
    const plan = generateLesson(student, model, { label: 'Lesson 4', previousObjectiveRefs: [], progress })
    const micro = plan.phases.find((p) => p.kind === 'microLesson')!.activities[0]
    const guided = plan.phases.find((p) => p.kind === 'guidedPractice')!.activities[0]
    const ctx: MicroStepContext = {
      student,
      model,
      level: 'B1',
      lang: 'en',
      activityIndex: 0,
    }
    const moves = [
      ...buildMicroSteps(micro, ctx).map((s) => s.move),
      ...buildMicroSteps(guided, { ...ctx, activityIndex: 1 }).map((s) => s.move),
    ]
    expect(moves).toEqual(['notice', 'retrieval', 'guided', 'realUse', 'feedback'])
  })

  it('every step is complete — no blank section reaches the tutor', () => {
    const plan = generateLesson(student, model, { label: 'Lesson 4', previousObjectiveRefs: [], progress })
    const activities = plan.phases
      .filter((p) => p.kind === 'microLesson' || p.kind === 'guidedPractice')
      .flatMap((p) => p.activities)
    for (const [i, activity] of activities.entries()) {
      for (const step of buildMicroSteps(activity, {
        student,
        model,
        level: 'B1',
        lang: 'en',
        activityIndex: i,
      })) {
        expect(step.now.length, step.id).toBeGreaterThan(0)
        expect(step.say.length, step.id).toBeGreaterThan(0)
        expect(step.do.length, step.id).toBeGreaterThan(0)
        expect(step.studentDoes.length, step.id).toBeGreaterThan(0)
        expect(step.lookFor.length, step.id).toBeGreaterThan(0)
        expect(step.help.length, step.id).toBeGreaterThan(0)
        expect(step.challenge.length, step.id).toBeGreaterThan(0)
        expect(step.doneWhen.length, step.id).toBeGreaterThan(0)
        expect(step.next.length, step.id).toBeGreaterThan(0)
        // Nothing may reach the tutor as an unresolved i18n key.
        for (const text of [step.now, step.doneWhen, step.next, ...step.do, ...step.help]) {
          expect(text, step.id).not.toMatch(/^guide\./)
        }
      }
    }
  })

  it('gives the tutor a card built from the pair, with the pair to listen for', () => {
    const plan = generateLesson(student, model, { label: 'Lesson 4', previousObjectiveRefs: [], progress })
    const micro = plan.phases.find((p) => p.kind === 'microLesson')!.activities[0]
    const card = activityGuidance(micro, { lang: 'en', student, level: 'B1' }).card!
    expect(card.listenFor).toEqual(['I am agree → I agree'])
    expect(card.model).toEqual(['I agree'])
    expect(card.goal).toContain('I agree')
  })

  it('puts the contrast on the learner’s screen and the frame in their hand', () => {
    const plan = generateLesson(student, model, { label: 'Lesson 4', previousObjectiveRefs: [], progress })
    const micro = plan.phases.find((p) => p.kind === 'microLesson')!.activities[0]
    const guided = plan.phases.find((p) => p.kind === 'guidedPractice')!.activities[0]
    const ctx = { lang: 'en' as const, student, model, level: 'B1' as const }

    const [notice] = buildMicroSteps(micro, { ...ctx, activityIndex: 0 })
    const noticeBoard = buildStudentBoard(notice, micro, ctx)
    // Both versions, because the learner has to see WHICH habit is replaced.
    expect(noticeBoard.corrections).toEqual([{ said: 'I am agree', better: 'I agree' }])

    const guidedSteps = buildMicroSteps(guided, { ...ctx, activityIndex: 1 })
    const [guidedStep] = guidedSteps
    const guidedBoard = buildStudentBoard(guidedStep, guided, ctx)
    // In production the frame is open: the point is saying it many times, not
    // remembering what it was.
    expect(guidedBoard.phrases).toEqual(['I agree'])
    expect(guidedBoard.phrasesOpen).toBe(true)
    expect(guidedBoard.corrections).toEqual([])

    /* Real use has to be a CONVERSATION, with enough questions to fill the
       block — not the activity's own English instruction sitting where the
       learner expects something to answer. */
    const realUse = guidedSteps.find((s) => s.move === 'realUse')!
    const realUseBoard = buildStudentBoard(realUse, guided, ctx)
    expect(realUseBoard.prompt).toMatch(/\?$/)
    expect(realUseBoard.questions.length).toBeGreaterThanOrEqual(2)
    expect(realUseBoard.prompt).not.toContain('Use the new pattern')
    // And the tutor is asking exactly those questions, so the two screens
    // cannot drift apart.
    expect(realUse.say).toEqual([realUseBoard.prompt, ...realUseBoard.questions])
  })

  it('still runs a full ~50-minute lesson around it', () => {
    const plan = generateLesson(student, model, { label: 'Lesson 4', previousObjectiveRefs: [], progress })
    expect(plan.totalMinutes).toBe(50)
    expect(plan.phases.some((p) => p.kind === 'communication')).toBe(true)
    expect(plan.phases.some((p) => p.kind === 'warmup')).toBe(true)
  })
})
