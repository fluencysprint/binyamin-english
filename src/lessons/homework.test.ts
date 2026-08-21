/* ==========================================================================
   Homework and the fluency sprint — the two things a learner takes away.
   --------------------------------------------------------------------------
   The brief's success criterion ends with "the student should leave with a
   clear summary and small useful homework". These tests are that sentence,
   made executable: homework always exists, is always small, is always about
   something that actually happened, and never asks a learner to do something
   they cannot do.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { Correction, HomeworkTask, LessonRecord, StudentProfile } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from './lessonGenerator'
import { generateHomework } from './homework'
import { fluencySprintSuits, roundsFor } from './fluency'
import { buildMicroSteps } from './microSteps'
import { generateReport } from '../reports/reportGenerator'
import { followUpsFor, followUpDepthFor } from './activityContent'
import { cefrIndex } from '../utils/cefr'
import { activityGuidance } from './guidance'

const now = 1_700_000_000_000

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu1',
    createdAt: now,
    updatedAt: now,
    name: 'Alex',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'ru',
    goals: ['conversation'],
    interests: ['cooking'],
    speakingConfidence: 3,
    pronunciationImportance: 4,
    ...over,
  }
}

function lessonFor(s: StudentProfile, level: Parameters<typeof initLearningModel>[1], over: Partial<LessonRecord> = {}) {
  const model = initLearningModel(s.id, level, now)
  const plan = generateFirstLesson(s, model)
  const record: LessonRecord = {
    id: 'les1',
    studentId: s.id,
    plan,
    status: 'completed',
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
    objectiveOutcome: 'correct',
    ...over,
  }
  return { model, plan, record }
}

function correction(over: Partial<Correction> = {}): Correction {
  return {
    id: 'c1',
    studentId: 'stu1',
    category: 'grammar',
    said: 'He don’t like it',
    better: 'He doesn’t like it',
    priority: 'high',
    at: now,
    ...over,
  }
}

const kinds = (tasks: HomeworkTask[]) => tasks.map((t) => t.kind)

describe('homework is always produced, and always small', () => {
  it('a lesson where nothing was captured still sends the student home with something', () => {
    const s = student()
    const { model, record } = lessonFor(s, 'B1')
    const tasks = generateHomework(record, s, model, [])
    expect(tasks.length).toBeGreaterThanOrEqual(1)
  })

  it('never gives an adult more than three tasks, or a small child more than one', () => {
    const adult = student()
    const a = lessonFor(adult, 'B1', { vocabularyAdded: ['reluctant', 'blunt', 'ease off'] })
    expect(
      generateHomework(a.record, adult, a.model, [correction(), correction({ id: 'c2' })]).length,
    ).toBeLessThanOrEqual(3)

    const kid = student({ id: 'k', age: 7, ageBand: '6-8', name: 'Mika' })
    const k = lessonFor(kid, 'A1', { vocabularyAdded: ['cat', 'dog'] })
    expect(generateHomework(k.record, kid, k.model, [correction({ studentId: 'k' })]).length).toBe(1)
  })

  it('puts the learner’s own corrected sentences first — the highest-value thing they can do alone', () => {
    const s = student()
    const { model, record } = lessonFor(s, 'B1', { vocabularyAdded: ['blunt'] })
    const tasks = generateHomework(record, s, model, [correction()])
    expect(tasks[0].kind).toBe('sayCorrected')
    expect(tasks[0]).toMatchObject({ items: [{ better: 'He doesn’t like it' }] })
  })

  it('uses the words the tutor actually captured, not invented ones', () => {
    const s = student()
    const { model, record } = lessonFor(s, 'B1', { vocabularyAdded: ['reluctant', 'blunt'] })
    const task = generateHomework(record, s, model, []).find((t) => t.kind === 'useWordsInSentences')
    expect(task).toMatchObject({ terms: ['reluctant', 'blunt'] })
  })

  it('never asks a learner who cannot write English to write anything', () => {
    const s = student({ age: 68, englishWriting: 'cannot', nativeLanguageLiteracy: 'yes' })
    const { model, record } = lessonFor(s, 'A1', { vocabularyAdded: ['thank you'] })
    const tasks = generateHomework(record, s, model, [correction()])
    expect(kinds(tasks)).not.toContain('writeSentences')
  })

  it('asks a beginner to SAY the new words, and an intermediate to USE them', () => {
    const beginner = student({ age: 60 })
    const b = lessonFor(beginner, 'preA1', { vocabularyAdded: ['hello', 'thank you'] })
    expect(kinds(generateHomework(b.record, beginner, b.model, []))).toContain('sayWordsAloud')

    const mid = student()
    const m = lessonFor(mid, 'B1', { vocabularyAdded: ['reluctant'] })
    expect(kinds(generateHomework(m.record, mid, m.model, []))).toContain('useWordsInSentences')
  })

  it('is deterministic — the same lesson always yields the same homework', () => {
    const s = student()
    const { model, record } = lessonFor(s, 'B1', { vocabularyAdded: ['blunt'] })
    const a = generateHomework(record, s, model, [correction()])
    const b = generateHomework(record, s, model, [correction()])
    expect(a).toEqual(b)
  })

  it('reaches the report, which is the only place the student ever sees it', () => {
    const s = student()
    const { model, record } = lessonFor(s, 'B1', { vocabularyAdded: ['blunt'] })
    const report = generateReport(record, s, model, [correction()], now)
    expect(report.homework?.length).toBeGreaterThanOrEqual(1)
  })
})

describe('fluency sprint', () => {
  it('is not given to a six-year-old, or to a learner with no language to speed up', () => {
    expect(fluencySprintSuits('B1', '6-8')).toBe(false)
    expect(fluencySprintSuits('preA1', 'adult')).toBe(false)
    expect(fluencySprintSuits('A1', 'adult')).toBe(true)
  })

  it('always shrinks the clock — that is the entire mechanism', () => {
    for (const band of ['9-12', '13-17', 'adult'] as const) {
      for (const level of ['A1', 'A2', 'B1', 'B2', 'C1'] as const) {
        const { seconds } = roundsFor(cefrIndex(level), band)
        expect(seconds.length).toBeGreaterThanOrEqual(2)
        for (let i = 1; i < seconds.length; i++) {
          expect(seconds[i]).toBeLessThan(seconds[i - 1])
        }
      }
    }
  })

  it('appears in an adult B1 lesson and produces one step per round plus the payoff', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B1', now)
    const plan = generateLesson(s, model, { label: 'Lesson 2' })
    const phase = plan.phases.find((p) => p.kind === 'fluency')
    expect(phase, 'a B1 adult lesson should include a fluency sprint').toBeTruthy()

    const steps = buildMicroSteps(phase!.activities[0], { student: s, model, level: 'B1', lang: 'en', activityIndex: 0 })
    const rounds = roundsFor(cefrIndex('B1'), 'adult')
    expect(steps).toHaveLength(rounds.seconds.length + 1)
    expect(steps[steps.length - 1].move).toBe('feedback')
    // Every round tells the tutor the clock, and tells them to shut up.
    for (let i = 0; i < rounds.seconds.length; i++) {
      expect(steps[i].now).toContain(String(rounds.seconds[i]))
      expect(steps[i].do.join(' ')).toMatch(/say nothing|do not/i)
    }
  })

  it('never appears for a six-year-old, whose minutes go to conversation instead', () => {
    const kid = student({ age: 7, ageBand: '6-8' })
    const model = initLearningModel(kid.id, 'A1', now)
    const plan = generateLesson(kid, model, { label: 'Lesson 2' })
    expect(plan.phases.some((p) => p.kind === 'fluency')).toBe(false)
    expect(plan.phases[plan.phases.length - 1].endMin).toBe(50)
  })

  it('carries into homework, because repetition is what makes it work', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B1', now)
    const plan = generateLesson(s, model, { label: 'Lesson 2' })
    const record: LessonRecord = {
      id: 'l', studentId: s.id, plan, status: 'completed',
      currentPhaseIndex: 0, elapsedSeconds: 3000, responses: [],
      correctionIds: [], audioIds: [], vocabularyAdded: [],
    }
    const task = generateHomework(record, s, model, []).find((t) => t.kind === 'repeatFluency')
    expect(task).toBeTruthy()
    expect((task as Extract<HomeworkTask, { kind: 'repeatFluency' }>).seconds).toBe(
      roundsFor(cefrIndex('B1'), 'adult').seconds.slice(-1)[0],
    )
  })
})

describe('follow-up questions are about the topic, not about conversation in general', () => {
  it('gives a storytelling task story questions and an opinion task argument questions', () => {
    const story = followUpsFor('storytelling', 'standard', 0, 4).join(' ')
    const opinion = followUpsFor('opinions', 'standard', 0, 4).join(' ')
    expect(story).toMatch(/happened next|end|feel/i)
    expect(opinion).toMatch(/disagree|why do you think|example/i)
    expect(story).not.toEqual(opinion)
  })

  it('scales with the learner — a small child never gets an abstract probe', () => {
    expect(followUpDepthFor('6-8', cefrIndex('B1'))).toBe('simple')
    expect(followUpDepthFor('adult', cefrIndex('preA1'))).toBe('simple')
    expect(followUpDepthFor('adult', cefrIndex('C1'))).toBe('advanced')
    const simple = followUpsFor('opinions', 'simple', 0, 3)
    for (const q of simple) expect(q.split(' ').length).toBeLessThanOrEqual(6)
  })

  it('reaches the tutor’s screen — the conversation step names the actual follow-ups', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B1', now)
    const plan = generateLesson(s, model, { label: 'Lesson 2' })
    const conversation = plan.phases
      .filter((p) => p.kind === 'communication')
      .flatMap((p) => p.activities)
      .find((a) => a.kind === 'communication')!
    const guidance = activityGuidance(conversation, { lang: 'en' }).autopilot
    expect(guidance?.do?.join(' ')).toMatch(/follow-ups/i)
    expect(guidance?.next?.join(' ').match(/\?/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})
