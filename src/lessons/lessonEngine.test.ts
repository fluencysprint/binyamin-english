import { describe, it, expect } from 'vitest'
import { StudentProfile, LessonRecord, Correction, ItemResponse, LessonActivity } from '../types'
import { initLearningModel, applyResponses } from '../students/learningModel'
import { generateFirstLesson, generateLesson, chooseObjective, ageToBand } from './lessonGenerator'
import { applyCompletedLesson } from './lessonCompletion'
import { buildSnapshot } from '../assessment/snapshot'
import { cefrIndex } from '../utils/cefr'
import { activityGuidance } from './guidance'

const guidanceOf = (a: LessonActivity) => activityGuidance(a, { lang: 'en' })

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
    otherLanguages: ['Hebrew'],
    interfaceLanguage: 'en',
    goals: ['conversation', 'pronunciation'],
    interests: ['cooking', 'travel'],
    speakingConfidence: 3,
    pronunciationImportance: 5,
    ...over,
  }
}

function makeLesson(student: StudentProfile, plan = generateFirstLesson(student, initLearningModel(student.id, 'A2', now))): LessonRecord {
  return {
    id: 'les1',
    studentId: student.id,
    plan,
    status: 'completed',
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: ['delighted', 'meticulous'],
    objectiveOutcome: 'correct',
  }
}

describe('ageToBand', () => {
  it('maps ages to the right bands', () => {
    expect(ageToBand(6)).toBe('6-8')
    expect(ageToBand(8)).toBe('6-8')
    expect(ageToBand(10)).toBe('9-12')
    expect(ageToBand(15)).toBe('13-17')
    expect(ageToBand(40)).toBe('adult')
  })
})

describe('first lesson generation', () => {
  it('produces a 50-minute lesson with all key phases', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'A2', now)
    const plan = generateFirstLesson(student, model)
    expect(plan.totalMinutes).toBe(50)
    expect(plan.source).toBe('firstLesson')
    const kinds = plan.phases.map((p) => p.kind)
    for (const k of ['warmup', 'speakingListening', 'reading', 'writing', 'microLesson', 'communication', 'feedback']) {
      expect(kinds).toContain(k)
    }
    // Phases cover a contiguous 0..50 timeline.
    expect(plan.phases[0].startMin).toBe(0)
    expect(plan.phases[plan.phases.length - 1].endMin).toBe(50)
  })

  it('gives a young Pre-A1 learner a listening/speaking-first beginner lesson (no forced reading/writing)', () => {
    const kid = makeStudent({ age: 7, ageBand: '6-8' })
    const model = { ...initLearningModel(kid.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateFirstLesson(kid, model)
    expect(plan.source).toBe('firstLesson')
    const kinds = plan.phases.map((p) => p.kind)
    // Beginner lessons are oral/visual — never free writing or paragraph reading.
    expect(kinds).not.toContain('writing')
    expect(kinds).not.toContain('microLesson')
    // Every activity carries at-a-glance SAY/DO/LOOK FOR/NEXT autopilot guidance,
    // and the first activity models real spoken English.
    const acts = plan.phases.flatMap((p) => p.activities)
    expect(acts.every((a) => guidanceOf(a).autopilot != null)).toBe(true)
    expect(acts.some((a) => (a.speak ?? '').length > 0)).toBe(true)
    // Young children get short activity cycles (no single 10+ minute block).
    for (const p of plan.phases) expect(p.endMin - p.startMin).toBeLessThanOrEqual(6)
  })

  it('places an adult beginner in a dignified oral-first lesson with autopilot', () => {
    const adult = makeStudent({ age: 65, ageBand: 'adult', nativeLanguage: 'Russian' })
    const model = { ...initLearningModel(adult.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateFirstLesson(adult, model)
    const kinds = plan.phases.map((p) => p.kind)
    expect(kinds).not.toContain('writing')
    expect(
      plan.phases.flatMap((p) => p.activities).every((a) => guidanceOf(a).autopilot != null),
    ).toBe(true)
    // No movement/child-only phases for an adult.
    expect(plan.phases.every((p) => (p.endMin - p.startMin) <= 6)).toBe(true)
  })
})

describe('objective selection', () => {
  it('prioritizes a recurring grammar error', () => {
    let model = initLearningModel('s', 'A2', now)
    model = {
      ...model,
      recurringErrors: [
        { id: 'e1', category: 'grammar', description: 'She go to school', occurrences: 3, firstSeen: now, lastSeen: now, resolved: false },
      ],
    }
    const obj = chooseObjective(model, 'A2', [])
    expect(obj.kind).toBe('grammar')
    expect(obj.rationale.toLowerCase()).toContain('recurring')
  })

  it('prioritizes a pronunciation communication problem', () => {
    let model = initLearningModel('s', 'B1', now)
    model = {
      ...model,
      pronunciationFoci: [{ area: 'th', rating: 'communicationProblem', updatedAt: now }],
    }
    const obj = chooseObjective(model, 'B1', [])
    expect(obj.kind).toBe('pronunciation')
    expect(obj.ref).toBe('th')
  })
})

describe('C1 pathway', () => {
  it('switches to advanced communication coaching for strong C1', () => {
    const student = makeStudent()
    let model = initLearningModel(student.id, 'C1', now)
    model = applyResponses(model, [])
    const plan = generateLesson(student, model, { label: 'Lesson 5' })
    // Objective should be the C1 coaching objective, with a long deep-conversation phase.
    const deep = plan.phases.find((p) => p.title.toLowerCase().includes('deep') || p.kind === 'communication')
    expect(deep).toBeTruthy()
    expect((deep!.endMin - deep!.startMin)).toBeGreaterThanOrEqual(20)
  })

  it('picks a genuinely varied task across repeated generations (no fixed rotation)', () => {
    // Regression test: content selection used to be fully deterministic
    // (seeded only by name length + age), so a student could eventually learn
    // the exact order lessons would repeat in. With no rng override, the
    // default is Math.random — repeated calls for the SAME student/model
    // should not all land on the same task.
    const student = makeStudent()
    const model = initLearningModel(student.id, 'C1', now)
    const tasks = new Set<string>()
    for (let i = 0; i < 25; i++) {
      const plan = generateLesson(student, model, { label: `Lesson ${i}` })
      const conversation = plan.phases
        .filter((p) => p.kind === 'communication')
        .flatMap((p) => p.activities)[0]
      tasks.add(conversation?.studentPrompt ?? '')
    }
    expect(tasks.size).toBeGreaterThan(1)
  })
})

describe('at-a-glance tutor guidance (autopilot)', () => {
  // The SAY/DO/LOOK FOR/NEXT panel used to exist only for Pre-A1 beginner
  // lessons — every standard and C1 activity had nothing but a deeper,
  // opt-in tutor card (or nothing at all). Every activity in a generated
  // lesson should now carry autopilot guidance.
  it('every activity in a standard-pathway lesson has autopilot', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'B1', now)
    const plan = generateLesson(student, model, { label: 'Lesson 3' })
    const activities = plan.phases.flatMap((p) => p.activities)
    expect(activities.length).toBeGreaterThan(0)
    for (const a of activities) {
      expect(guidanceOf(a).autopilot, `${a.kind} (${a.title}) is missing autopilot`).toBeDefined()
    }
  })

  it('every activity in a C1-pathway lesson has autopilot', () => {
    const student = makeStudent()
    const model = initLearningModel(student.id, 'C1', now)
    const plan = generateLesson(student, model, { label: 'Lesson 3' })
    const activities = plan.phases.flatMap((p) => p.activities)
    expect(activities.length).toBeGreaterThan(0)
    for (const a of activities) {
      expect(guidanceOf(a).autopilot, `${a.kind} (${a.title}) is missing autopilot`).toBeDefined()
    }
  })
})

describe('completion updates the model and builds a report', () => {
  it('advances estimates and generates a report; skill not secure after one success', () => {
    const student = makeStudent({ age: 10, ageBand: '9-12' })
    const model = initLearningModel(student.id, 'A2', now)
    const lesson = makeLesson(student)
    const corrections: Correction[] = [
      { id: 'c1', studentId: student.id, category: 'grammar', said: 'She go', better: 'She goes', priority: 'high', at: now, retried: true },
      { id: 'c2', studentId: student.id, category: 'greatExpression', said: 'over the moon', better: 'over the moon', priority: 'low', at: now },
    ]
    const { model: updated, report } = applyCompletedLesson(model, lesson, student, corrections, now)

    expect(report.vocabulary).toContain('delighted')
    expect(report.corrections.some((c) => c.better === 'She goes')).toBe(true)
    expect(report.parent).toBeTruthy() // minor
    // Objective reinforced but only emerging/developing, never secure from one lesson.
    const tracked = updated.emerging.find((s) => s.ref === lesson.plan.objective.ref)
    expect(tracked).toBeTruthy()
    expect(tracked!.strength).not.toBe('secure')
  })

  it('does not include a parent report for adults', () => {
    const student = makeStudent({ age: 30 })
    const model = initLearningModel(student.id, 'B1', now)
    const lesson = makeLesson(student)
    const { report } = applyCompletedLesson(model, lesson, student, [], now)
    expect(report.parent).toBeUndefined()
  })

  it('never uses forbidden words in reports', () => {
    const student = makeStudent({ age: 9, ageBand: '9-12' })
    const model = initLearningModel(student.id, 'preA1', now)
    const lesson = { ...makeLesson(student), objectiveOutcome: 'needsWork' as const }
    const { report } = applyCompletedLesson(model, lesson, student, [], now)
    const text = JSON.stringify(report).toLowerCase()
    for (const w of ['stupid', 'bad', 'weak', 'behind']) expect(text).not.toContain(w)
  })
})

describe('snapshot from responses', () => {
  it('estimates a higher level when harder items are correct', () => {
    const responses: ItemResponse[] = [
      { itemId: 'a', skill: 'grammar', cefr: 'A2', difficulty: 5, outcome: 'correct', at: now },
      { itemId: 'b', skill: 'grammar', cefr: 'B1', difficulty: 5, outcome: 'correct', at: now },
      { itemId: 'c', skill: 'grammar', cefr: 'B2', difficulty: 5, outcome: 'needsWork', at: now },
    ]
    const snap = buildSnapshot(responses)
    expect(cefrIndex(snap.perSkill.grammar!)).toBe(cefrIndex('B1'))
    expect(snap.priorities.length).toBeGreaterThan(0)
    expect(snap.sampleCorrection).toBeTruthy()
  })
})
