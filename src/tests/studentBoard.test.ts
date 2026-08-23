/* ==========================================================================
   What the LEARNER actually sees.
   --------------------------------------------------------------------------
   Every assertion here is a version of one question: is there enough on the
   screen to sustain the minutes the plan allocates to it? A six-minute
   speaking activity whose learner-facing screen holds a single sentence is
   not a lesson, and that is exactly what this file exists to catch.

   The learner throughout is the acceptance scenario: an adult around B1 who
   wants to speak confidently at work, keeps saying "I am agree", and has
   trouble with /th/.
   ========================================================================== */

import { describe, expect, it } from 'vitest'
import { generateLesson } from '../lessons/lessonGenerator'
import { buildFixStep, buildPhaseMicroSteps, buildRetrievalStep } from '../lessons/microSteps'
import { boardHasMaterial, buildStudentBoard } from '../lessons/studentBoard'
import { initLearningModel } from '../students/learningModel'
import { overallCefr } from '../utils/cefr'
import { LearningModel, LessonActivity, LessonPlan, StudentProfile } from '../types'
import { testStudent, T0 } from './fixtures'

const DAY = 24 * 60 * 60 * 1000

function b1Learner(): { student: StudentProfile; model: LearningModel } {
  const student = testStudent({
    name: 'Dan',
    age: 34,
    interfaceLanguage: 'en',
    goals: ['work', 'confidence'],
    interests: ['travel'],
    speakingConfidence: 2,
    pronunciationImportance: 4,
  })
  const model = initLearningModel(student.id, 'B1', T0)
  return { student, model }
}

/** Every (step, activity) pair a plan produces, with its learner-facing board. */
function boardsFor(plan: LessonPlan, student: StudentProfile, model: LearningModel) {
  const level = overallCefr(model.skillEstimates)
  return plan.phases.flatMap((phase) => {
    const steps = buildPhaseMicroSteps(phase.activities, { student, model, level, lang: 'en' })
    return steps.map((step) => {
      const activity = phase.activities.find((a) => a.id === step.activityId) as LessonActivity
      return {
        phase: phase.kind,
        step,
        activity,
        board: buildStudentBoard(step, activity, { student, model, level, lang: 'en', now: T0 }),
      }
    })
  })
}

describe('the learner’s screen carries the lesson, not just a caption', () => {
  it('gives every talking step a real prompt, follow-ups and language to use', () => {
    const { student, model } = b1Learner()
    const plan = generateLesson(student, model, { label: 'Lesson 2' })
    const talking = boardsFor(plan, student, model).filter((x) =>
      ['communication', 'warmup', 'speakingListening'].includes(x.activity.kind),
    )
    expect(talking.length).toBeGreaterThan(0)
    for (const { board, step } of talking) {
      // A prompt the learner can answer, in English, on screen.
      expect(board.prompt, step.studentKey).toBeTruthy()
      // Sentence frames they can actually put in their mouth.
      expect(board.phrases.length, step.studentKey).toBeGreaterThanOrEqual(3)
      // Every frame is a frame, not a finished sentence to read out.
      expect(board.phrases.every((p) => p.includes('___'))).toBe(true)
    }
  })

  it('opens the lesson with a real topic rather than “let’s talk”', () => {
    /* The eight minutes after the warm-up used to hold an activity with no
       content at all, so both the tutor and the learner started every lesson
       with nothing on screen. */
    const { student, model } = b1Learner()
    const plan = generateLesson(student, model, { label: 'Lesson 2' })
    const opener = plan.phases.find((p) => p.kind === 'speakingListening')!.activities[0]
    expect(opener.ref).toBeTruthy()
    expect(opener.studentPrompt).not.toMatch(/Let’s talk/)
    // And it is not the same question the lesson closes with.
    const closer = plan.phases.find((p) => p.kind === 'communication')!.activities[0]
    expect(opener.ref).not.toBe(closer.ref)
  })

  it('never leaves a step with nothing but the instruction line', () => {
    const { student, model } = b1Learner()
    const plan = generateLesson(student, model, { label: 'Lesson 2' })
    const bare = boardsFor(plan, student, model).filter(
      ({ board, step }) => !boardHasMaterial(board) && !step.speak,
    )
    /* Exactly two steps are allowed to be quiet, and only because they are
       ABOUT the session: the closing word capture and the closing feedback
       show what was actually captured today, and on a plan nothing has been
       taught from yet there is genuinely nothing honest to put there. The
       next test shows both filling once there is evidence. */
    expect(bare.map((x) => `${x.activity.kind}/${x.step.move}`)).toEqual([
      'vocabulary/retrieval',
      'feedback/feedback',
    ])
  })

  it('closes on the learner’s own words and their own corrected sentences', () => {
    const { student, model } = b1Learner()
    const plan = generateLesson(student, model, { label: 'Lesson 2' })
    const level = overallCefr(model.skillEstimates)
    const evidence = {
      student,
      model,
      level,
      lang: 'en' as const,
      now: T0,
      todayVocabulary: ['deadline', 'workload'],
      todayCorrections: [{ said: 'I am agree', better: 'I agree' }],
    }
    const closing = plan.phases.flatMap((phase) =>
      buildPhaseMicroSteps(phase.activities, { student, model, level, lang: 'en' })
        .map((step) => ({
          activity: phase.activities.find((a) => a.id === step.activityId) as LessonActivity,
          step,
        }))
        .filter(({ activity }) => activity.kind === 'vocabulary' || activity.kind === 'feedback'),
    )
    const boards = closing.map(({ step, activity }) => buildStudentBoard(step, activity, evidence))
    expect(boards.some((b) => b.words.includes('deadline'))).toBe(true)
    expect(
      boards.some((b) => b.corrections.some((c) => c.better === 'I agree')),
    ).toBe(true)
  })

  it('shows the corrected form, never the learner’s error, when teaching grammar', () => {
    const { student, model } = b1Learner()
    const plan = generateLesson(student, model, { label: 'Lesson 2' })
    const grammar = boardsFor(plan, student, model).filter((x) => x.phase === 'microLesson')
    const shown = grammar.flatMap((x) => [...x.board.examples, ...x.board.phrases])
    expect(shown.length).toBeGreaterThan(0)
    // Nothing on a grammar board is one of the library's WRONG examples.
    expect(shown.some((line) => /\b(she are|i is|he don’t)\b/i.test(line))).toBe(false)
  })
})

describe('spaced recall asks the learner to produce, not to read', () => {
  it('cues from meaning and holds the English back', () => {
    const { student, model } = b1Learner()
    const withWords: LearningModel = {
      ...model,
      vocabulary: [
        {
          id: 'v1',
          term: 'deadline',
          meaning: 'the day something must be finished by',
          addedAt: T0 - 30 * DAY,
          strength: 'emerging',
          reviewDue: T0 - DAY,
        },
      ],
    }
    const ctx = { student, model: withWords, level: 'B1' as const, lang: 'en' as const, activityIndex: 0 }
    const step = buildRetrievalStep(ctx, 'act1', T0)!
    expect(step).toBeTruthy()
    const board = buildStudentBoard(step, { id: 'act1', kind: 'warmup', title: '', studentPrompt: '' }, {
      student,
      model: withWords,
      level: 'B1',
      lang: 'en',
      now: T0,
    })
    expect(board.recallCues).toEqual([
      { cue: 'the day something must be finished by', answer: 'deadline' },
    ])
    // The word itself is nowhere on the board — that is the whole point.
    expect(board.words).not.toContain('deadline')
    expect(board.prompt ?? '').not.toContain('deadline')
  })
})

describe('a recurring slip becomes practice, not just a note to the tutor', () => {
  const withError = (occurrences: number): LearningModel => {
    const { model } = b1Learner()
    return {
      ...model,
      recurringErrors: [
        {
          id: 'e1',
          category: 'grammar',
          description: 'I am agree',
          example: 'I agree',
          occurrences,
          firstSeen: T0 - 20 * DAY,
          lastSeen: T0 - DAY,
          resolved: false,
        },
      ],
    }
  }

  it('drills “I am agree” → “I agree” once it has actually recurred', () => {
    const { student } = b1Learner()
    const model = withError(3)
    const step = buildFixStep({ student, model, level: 'B1', lang: 'en', activityIndex: 0 }, 'act1')!
    expect(step).toBeTruthy()
    expect(step.say.join(' ')).toContain('I agree')
    expect(step.lookFor).toContain('I am agree → I agree')
    expect(step.studentKey).toBe('student.fixThese')

    const board = buildStudentBoard(
      step,
      { id: 'act1', kind: 'guidedPractice', title: '', studentPrompt: '' },
      { student, model, level: 'B1', lang: 'en', now: T0 },
    )
    expect(board.corrections).toEqual([{ said: 'I am agree', better: 'I agree' }])
  })

  it('does not drill a slip heard once — that is an overreaction, not teaching', () => {
    const { student } = b1Learner()
    const step = buildFixStep(
      { student, model: withError(1), level: 'B1', lang: 'en', activityIndex: 0 },
      'act1',
    )
    expect(step).toBeNull()
  })

  it('stops drilling once the error is marked resolved', () => {
    const { student } = b1Learner()
    const model = withError(4)
    const resolved = {
      ...model,
      recurringErrors: model.recurringErrors.map((e) => ({ ...e, resolved: true })),
    }
    expect(
      buildFixStep({ student, model: resolved, level: 'B1', lang: 'en', activityIndex: 0 }, 'act1'),
    ).toBeNull()
  })
})
