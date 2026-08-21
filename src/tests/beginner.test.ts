import { describe, it, expect } from 'vitest'
import { StudentProfile, LessonRecord, ItemResponse, CEFR, LearningModel } from '../types'
import { initLearningModel, applyResponses } from '../students/learningModel'
import { generateFirstLesson, generateLesson, beginnerAudience } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import {
  beginnerActivities,
  beginnerActivitiesFor,
  selectBeginnerActivities,
} from '../lessons/beginnerContent'
import { buildFoundationalPlan } from '../assessment/placement'
import { foundationalAssessmentItems } from '../data/beginnerAssessment'
import { overallCefr } from '../utils/cefr'
import { activityGuidance } from '../lessons/guidance'

const now = 1_700_000_000_000

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu', createdAt: now, updatedAt: now, name: 'Sam', age: 30, ageBand: 'adult',
    nativeLanguage: 'Russian', otherLanguages: [], interfaceLanguage: 'en',
    goals: ['conversation'], interests: [], speakingConfidence: 2, pronunciationImportance: 3,
    ...over,
  }
}

describe('age-appropriate content selection', () => {
  it('never gives adult-only content to a child, or child-only to an adult', () => {
    for (const stage of ['P0', 'P1', 'P2', 'P3'] as const) {
      const kid = beginnerActivitiesFor(stage, 'child')
      const adult = beginnerActivitiesFor(stage, 'adult')
      expect(kid.every((a) => a.audience !== 'adult')).toBe(true)
      expect(adult.every((a) => a.audience !== 'child')).toBe(true)
    }
  })

  it('maps ages 5–12 to child presentation and teens/adults to adult', () => {
    expect(beginnerAudience('6-8')).toBe('child')
    expect(beginnerAudience('9-12')).toBe('child')
    expect(beginnerAudience('13-17')).toBe('adult')
    expect(beginnerAudience('adult')).toBe('adult')
  })

  it('selects varied, non-repeating activities and excludes movement fillers', () => {
    const a = selectBeginnerActivities({ stage: 'P1', audience: 'adult', seed: 1, count: 4 })
    const b = selectBeginnerActivities({ stage: 'P1', audience: 'adult', seed: 2, count: 4 })
    expect(a.length).toBe(4)
    expect(new Set(a.map((x) => x.id)).size).toBe(4) // no repeats within a lesson
    expect(a.every((x) => !x.movement)).toBe(true)
    // Different seeds rotate the pool → different lessons.
    expect(a.map((x) => x.id).join()).not.toBe(b.map((x) => x.id).join())
  })
})

describe('beginner lesson generation by age', () => {
  it('gives a young child short cycles with a movement break; no writing/grammar lecture', () => {
    const kid = student({ age: 6, ageBand: '6-8' })
    const model = { ...initLearningModel(kid.id, 'preA1', now), preA1Stage: 'P1' as const }
    const plan = generateFirstLesson(kid, model)
    const kinds = plan.phases.map((p) => p.kind)
    expect(kinds).not.toContain('writing')
    expect(kinds).not.toContain('microLesson')
    // At least one movement/reset activity is woven in for a young child.
    // Which one is deliberately not pinned: there is more than one break in
    // the bank now and the generator rotates them so a child does not get the
    // identical reset twice in a lesson.
    const movementIds = new Set(
      beginnerActivities.filter((a) => a.movement).map((a) => a.id),
    )
    const hasMovement = plan.phases.some((p) =>
      p.activities.some((a) => a.ref != null && movementIds.has(a.ref)),
    )
    expect(hasMovement).toBe(true)
  })

  it('gives an adult beginner a dignified oral-first lesson without movement games', () => {
    const adult = student({ age: 65, ageBand: 'adult' })
    const model = { ...initLearningModel(adult.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateLesson(adult, model, { label: 'Lesson 2', source: 'generated' })
    const movementIds = new Set(beginnerActivities.filter((a) => a.movement).map((a) => a.id))
    const hasMovement = plan.phases.some((p) =>
      p.activities.some((a) => a.ref != null && movementIds.has(a.ref)),
    )
    expect(hasMovement).toBe(false)
    // Every activity has autopilot; none require reading a paragraph or writing.
    const acts = plan.phases.flatMap((p) => p.activities)
    expect(acts.every((a) => activityGuidance(a, { lang: 'en' }).autopilot != null)).toBe(true)
  })
})

describe('non-reader (foundational) assessment', () => {
  it('serves picture/listening items with native instructions + spoken targets (no English to read)', () => {
    const plan = buildFoundationalPlan({ pool: foundationalAssessmentItems, ageBand: 'adult' })
    expect(plan.length).toBeGreaterThan(0)
    for (const it of plan) {
      expect(it.presentation === 'listen' || it.presentation === 'picture').toBe(true)
      expect(it.instructionKey).toBeDefined() // instruction shown in interface language
      expect(it.speak).toBeDefined() // English target is spoken, not read
      expect(it.options).toBeDefined()
      expect(it.answerIndex).toBeDefined()
    }
    // Easy → hard.
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].difficulty).toBeGreaterThanOrEqual(plan[i - 1].difficulty)
    }
  })

  it('works for a young child age band too', () => {
    const plan = buildFoundationalPlan({ pool: foundationalAssessmentItems, ageBand: '6-8' })
    expect(plan.length).toBeGreaterThan(0)
  })
})

describe('Pre-A1 stage progression through lessons', () => {
  function beginnerLesson(stu: StudentProfile, outcome: 'correct' | 'partial' | 'needsWork'): LessonRecord {
    const model = { ...initLearningModel(stu.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateFirstLesson(stu, model)
    return {
      id: 'l', studentId: stu.id, plan, status: 'completed', currentPhaseIndex: 0,
      elapsedSeconds: 1000, responses: [], correctionIds: [], audioIds: [], vocabularyAdded: [],
      objectiveOutcome: outcome,
    }
  }

  it('advances P0 → P1 → P2 on repeated successful beginner lessons', () => {
    const stu = student({ age: 30 })
    let model: LearningModel = { ...initLearningModel(stu.id, 'preA1', now), preA1Stage: 'P0' }
    expect(model.preA1Stage).toBe('P0')
    ;({ model } = applyCompletedLesson(model, beginnerLesson(stu, 'correct'), stu, [], now))
    expect(model.preA1Stage).toBe('P1')
    ;({ model } = applyCompletedLesson(model, beginnerLesson(stu, 'correct'), stu, [], now))
    expect(model.preA1Stage).toBe('P2')
  })

  it('holds the stage on a partial and steps back on a struggle', () => {
    const stu = student({ age: 30 })
    let model: LearningModel = { ...initLearningModel(stu.id, 'preA1', now), preA1Stage: 'P2' }
    ;({ model } = applyCompletedLesson(model, beginnerLesson(stu, 'partial'), stu, [], now))
    expect(model.preA1Stage).toBe('P2')
    ;({ model } = applyCompletedLesson(model, beginnerLesson(stu, 'needsWork'), stu, [], now))
    expect(model.preA1Stage).toBe('P1')
  })
})

describe('Pre-A1 → A1 graduation is governed by skill evidence', () => {
  it('starts a true beginner at Pre-A1 and graduates to A1 once A1 evidence accrues', () => {
    const stu = student()
    let model = initLearningModel(stu.id, 'preA1', now)
    expect(overallCefr(model.skillEstimates)).toBe('preA1')
    const a1Correct: ItemResponse[] = (['listening', 'speaking', 'vocabulary', 'grammar', 'reading', 'writing', 'pronunciation'] as const).map(
      (skill) => ({ itemId: skill, skill, cefr: 'A1' as CEFR, difficulty: 4, outcome: 'correct' as const, at: now }),
    )
    for (let i = 0; i < 3; i++) model = applyResponses(model, a1Correct, now)
    expect(overallCefr(model.skillEstimates)).toBe('A1')
    // Confidence still climbs with evidence (never asserted "secure" from one hit).
    expect(model.skillEstimates.speaking.confidence).toBeLessThan(0.95)
  })

  it('leaves a learner with no correct evidence at the Pre-A1 floor', () => {
    const stu = student()
    let model = initLearningModel(stu.id, 'preA1', now)
    const fails: ItemResponse[] = (['listening', 'speaking', 'grammar'] as const).map(
      (skill) => ({ itemId: skill, skill, cefr: 'A1' as CEFR, difficulty: 4, outcome: 'needsWork' as const, at: now }),
    )
    for (let i = 0; i < 3; i++) model = applyResponses(model, fails, now)
    expect(overallCefr(model.skillEstimates)).toBe('preA1')
  })
})
