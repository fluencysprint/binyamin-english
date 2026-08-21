import { describe, it, expect } from 'vitest'
import { StudentProfile, LessonRecord } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson } from '../lessons/lessonGenerator'
import { generateReport } from './reportGenerator'

const now = 1_700_000_000_000

function makeStudent(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu1',
    createdAt: now,
    updatedAt: now,
    name: 'Alex',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'en',
    goals: ['conversation'],
    interests: ['cooking'],
    speakingConfidence: 3,
    pronunciationImportance: 3,
    ...over,
  }
}

function makeLesson(plan: ReturnType<typeof generateFirstLesson>): LessonRecord {
  return {
    id: 'les1',
    studentId: plan.studentId,
    plan,
    status: 'completed',
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
  }
}

describe('generateReport — worked-on content', () => {
  it('reads like a student summary: named activities, with the real topic where it matters', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'B1', now)
    const lesson = makeLesson(generateFirstLesson(student, model))

    const report = generateReport(lesson, student, model, [], now)

    expect(report.workedOn[0]).toBe(lesson.plan.objective.title)
    expect(report.workedOn.length).toBeGreaterThan(3)

    // The conversation and fluency topics ARE the content worth remembering,
    // so they appear in full alongside the activity name.
    const topics = lesson.plan.phases
      .filter((p) => p.kind === 'communication' || p.kind === 'fluency')
      .flatMap((p) => p.activities)
      .filter((a) => a.kind === 'communication' || a.kind === 'fluency')
    expect(topics.length).toBeGreaterThan(0)
    for (const a of topics) {
      expect(report.workedOn).toContain(`${a.title}: ${a.studentPrompt}`)
    }

    // The tutor's own stage directions must never reach the student's summary.
    expect(report.workedOn.join(' ')).not.toMatch(/your tutor will|gently probe/i)
  })

  it('does not claim progress on an objective that was never scored', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'B1', now)
    const lesson = makeLesson(generateFirstLesson(student, model))
    // objectiveOutcome left unset — the tutor never tapped a score chip.
    expect(lesson.objectiveOutcome).toBeUndefined()

    const report = generateReport(lesson, student, model, [], now)

    expect(report.wentWell.some((w) => w.kind === 'objectiveOutcome')).toBe(false)
    expect(report.wentWell.some((w) => w.kind === 'engaged')).toBe(true)
  })
})
