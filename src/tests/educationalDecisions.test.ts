/* ==========================================================================
   The educational decisions, learner by learner.
   --------------------------------------------------------------------------
   Every scenario the brief names, checked end to end through the real
   placement → generation → completion path. These are the decisions that
   actually determine whether a lesson is right for the person in the room:

     • a P0 non-reader child and a P0 literate older adult get different
       lessons, not the same lesson with different words
     • oral ability above reading ability is modeled, and never produces a
       paragraph for someone who cannot read English
     • the A1 → A2 → B1 → B2 → C1 progression moves, and C1 stops teaching
       grammar and starts coaching communication
     • a repeated error chooses the next objective
     • spaced review brings things back
     • mastery requires repeated evidence, never one good answer
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  CEFR,
  Correction,
  ItemResponse,
  LearningModel,
  LessonRecord,
  StudentProfile,
} from '../types'
import { initLearningModel, applyResponses, reinforceSkill, dueForReview } from '../students/learningModel'
import { chooseObjective, generateFirstLesson, generateLesson, isBeginnerPathway } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { buildMicroSteps } from '../lessons/microSteps'
import { deriveInitialStage, needsNativeScaffolding, nextStageFromLesson } from '../students/beginnerModel'
import { cefrIndex, overallCefr } from '../utils/cefr'

const now = 1_700_000_000_000
const DAY = 24 * 60 * 60 * 1000

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu',
    createdAt: now,
    updatedAt: now,
    name: 'Sam',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'en',
    goals: ['conversation'],
    interests: ['music'],
    speakingConfidence: 3,
    pronunciationImportance: 3,
    ...over,
  }
}

function lessonFor(s: StudentProfile, model: LearningModel, outcome: LessonRecord['objectiveOutcome']): LessonRecord {
  const plan = generateLesson(s, model, { label: 'L', seed: 1 })
  return {
    id: 'l1',
    studentId: s.id,
    plan,
    status: 'completed',
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
    objectiveOutcome: outcome,
  }
}

/* -------------------------------------------------------------------------- */

describe('P0 non-reader child vs. P0 literate older adult', () => {
  const child = student({ age: 6, ageBand: '6-8', interfaceLanguage: 'es', needsNativeLanguageScaffolding: true })
  const older = student({ age: 72, ageBand: 'adult', interfaceLanguage: 'ru', needsNativeLanguageScaffolding: true })
  const model = (id: string) => ({ ...initLearningModel(id, 'preA1', now), preA1Stage: 'P0' as const })

  it('both are on the beginner pathway, and neither is asked to read or write English', () => {
    for (const s of [child, older]) {
      const plan = generateFirstLesson(s, model(s.id))
      expect(isBeginnerPathway(overallCefr(model(s.id).skillEstimates))).toBe(true)
      expect(plan.phases.map((p) => p.kind)).not.toContain('writing')
      for (const a of plan.phases.flatMap((p) => p.activities)) {
        expect(a.passage, `${s.name}: ${a.title}`).toBeUndefined()
      }
    }
  })

  it('they do NOT get the same lesson', () => {
    const childPlan = generateFirstLesson(child, model(child.id))
    const olderPlan = generateFirstLesson(older, model(older.id))
    const childRefs = childPlan.phases.flatMap((p) => p.activities.map((a) => a.ref))
    const olderRefs = olderPlan.phases.flatMap((p) => p.activities.map((a) => a.ref))
    expect(childRefs).not.toEqual(olderRefs)
  })

  it('the child gets movement resets; the older adult never does', () => {
    const childPlan = generateFirstLesson(child, model(child.id))
    const olderPlan = generateFirstLesson(older, model(older.id))
    const movementish = /movement|shake|jump|wiggle/i
    expect(childPlan.phases.some((p) => movementish.test(p.title))).toBe(true)
    expect(olderPlan.phases.some((p) => movementish.test(p.title))).toBe(false)
  })

  it('the older adult gets dignified adult content, never nursery material', () => {
    const plan = generateFirstLesson(older, model(older.id))
    const text = JSON.stringify(plan).toLowerCase()
    for (const word of ['puppet', 'peekaboo', 'toy']) expect(text).not.toContain(word)
  })

  it('the child gets shorter steps than the older adult', () => {
    const childStep = buildMicroSteps(generateFirstLesson(child, model(child.id)).phases[0].activities[0], {
      student: child,
      model: model(child.id),
      level: 'preA1', lang: 'en',
      activityIndex: 0,
    })[0]
    const olderStep = buildMicroSteps(generateFirstLesson(older, model(older.id)).phases[0].activities[0], {
      student: older,
      model: model(older.id),
      level: 'preA1', lang: 'en',
      activityIndex: 0,
    })[0]
    expect(childStep.minutes).toBeLessThanOrEqual(olderStep.minutes)
  })

  it('a zero-English learner is flagged for native-language scaffolding', () => {
    expect(needsNativeScaffolding('cannot')).toBe(true)
    expect(needsNativeScaffolding('fewWords')).toBe(true)
    expect(needsNativeScaffolding('comfortable')).toBe(false)
  })
})

describe('oral ability above reading ability', () => {
  it('places the learner by what they can say, and still protects their reading', () => {
    expect(deriveInitialStage({ englishSpeaking: 'simplePhrases', englishReading: 'cannot' })).toBe('P2')
    expect(deriveInitialStage({ englishSpeaking: 'simplePhrases', englishReading: 'simpleSentences' })).toBe('P3')
    expect(deriveInitialStage({ englishSpeaking: 'none', englishReading: 'cannot' })).toBe('P0')
  })

  it('never hands a paragraph to a learner whose reading is far below their speaking', () => {
    const s = student({ age: 10, ageBand: '9-12' })
    const model = initLearningModel(s.id, 'A2', now)
    // Speaking A2, reading still Pre-A1 — a real and common split.
    model.skillEstimates.reading = { level: 'preA1', confidence: 0.4, evidenceCount: 2, updatedAt: now }
    model.skillEstimates.writing = { level: 'preA1', confidence: 0.4, evidenceCount: 2, updatedAt: now }
    const plan = generateLesson(s, model, { label: 'L2' })
    const reading = plan.phases.find((p) => p.kind === 'reading')!
    // The reading activity is letters/sounds, not a paragraph to decode.
    expect(reading.activities[0].passage).toBeUndefined()
    expect(reading.activities[0].studentPrompt).toMatch(/letter|sound/i)
  })

  it('gives a strong reader an actual passage at the same overall level', () => {
    const s = student({ age: 30 })
    const model = initLearningModel(s.id, 'B1', now)
    const plan = generateLesson(s, model, { label: 'L2' })
    const reading = plan.phases.find((p) => p.kind === 'reading')!
    expect(reading.activities[0].passage).toBeTruthy()
  })
})

describe('level progression A1 → A2 → B1 → B2 → C1', () => {
  const levels: CEFR[] = ['A1', 'A2', 'B1', 'B2']

  for (const level of levels) {
    it(`${level}: gets a taught objective with a full teaching sequence`, () => {
      const s = student()
      const model = initLearningModel(s.id, level, now)
      const plan = generateLesson(s, model, { label: 'L' })
      expect(plan.totalMinutes).toBe(50)
      expect(plan.objective.ref).not.toBe('c1-communication')
      const micro = plan.phases.find((p) => p.kind === 'microLesson')
      expect(micro, `${level} has no focus phase`).toBeTruthy()
    })
  }

  it('A1 → A2 transition: repeated success raises the estimate without leaping', () => {
    const s = student()
    let model = initLearningModel(s.id, 'A1', now)
    const correct: ItemResponse[] = Array.from({ length: 4 }, (_, i) => ({
      itemId: `i${i}`,
      skill: 'grammar',
      cefr: 'A2',
      difficulty: 5,
      outcome: 'correct',
      at: now,
    }))
    model = applyResponses(model, correct, now)
    const grammar = model.skillEstimates.grammar
    expect(cefrIndex(grammar.level)).toBeGreaterThanOrEqual(cefrIndex('A2'))
    // Confidence grows with evidence but never becomes certainty.
    expect(grammar.evidenceCount).toBe(4)
    expect(grammar.confidence).toBeLessThanOrEqual(0.95)
  })

  it('failure at a level pulls the estimate back down', () => {
    const s = student()
    let model = initLearningModel(s.id, 'B1', now)
    const failures: ItemResponse[] = Array.from({ length: 4 }, (_, i) => ({
      itemId: `i${i}`,
      skill: 'grammar',
      cefr: 'B1',
      difficulty: 5,
      outcome: 'needsWork',
      at: now,
    }))
    model = applyResponses(model, failures, now)
    expect(cefrIndex(model.skillEstimates.grammar.level)).toBeLessThan(cefrIndex('B1'))
  })

  it('strong C1 stops teaching grammar and starts coaching communication', () => {
    const s = student()
    const model = initLearningModel(s.id, 'C1', now)
    const plan = generateLesson(s, model, { label: 'L' })
    expect(plan.objective.ref).toBe('c1-communication')
    // A long conversation block, and no remedial grammar micro-lesson.
    const deep = plan.phases.find((p) => p.kind === 'communication')!
    expect(deep.endMin - deep.startMin).toBeGreaterThanOrEqual(20)
    expect(plan.phases.map((p) => p.kind)).not.toContain('microLesson')
  })

  it('B2 with C1 speaking is already treated as the coaching pathway', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B2', now)
    model.skillEstimates.speaking = { level: 'C1', confidence: 0.7, evidenceCount: 6, updatedAt: now }
    const plan = generateLesson(s, model, { label: 'L' })
    expect(plan.objective.ref).toBe('c1-communication')
  })
})

describe('a repeated error chooses the next objective', () => {
  it('picks the concept that actually teaches the observed error', () => {
    const model: LearningModel = {
      ...initLearningModel('s', 'A2', now),
      recurringErrors: [
        {
          id: 'e1',
          category: 'grammar',
          description: 'She go to school every day',
          example: 'She goes to school every day',
          occurrences: 4,
          firstSeen: now,
          lastSeen: now,
          resolved: false,
        },
      ],
    }
    const objective = chooseObjective(model, 'A2', [])
    expect(objective.kind).toBe('grammar')
    expect(objective.ref).toBe('g_present_simple')
    expect(objective.rationale).toContain('4')
  })

  it('prefers the more frequent of two competing errors', () => {
    const model: LearningModel = {
      ...initLearningModel('s', 'B1', now),
      recurringErrors: [
        { id: 'e1', category: 'grammar', description: 'I am teacher', occurrences: 1, firstSeen: now, lastSeen: now, resolved: false },
        { id: 'e2', category: 'grammar', description: 'I have seen him yesterday', occurrences: 5, firstSeen: now, lastSeen: now, resolved: false },
      ],
    }
    expect(chooseObjective(model, 'B1', []).ref).toBe('g_present_perfect')
  })

  it('ignores an error already marked resolved', () => {
    const model: LearningModel = {
      ...initLearningModel('s', 'A2', now),
      recurringErrors: [
        { id: 'e1', category: 'grammar', description: 'She go to school', occurrences: 9, firstSeen: now, lastSeen: now, resolved: true },
      ],
    }
    expect(chooseObjective(model, 'A2', []).rationale).not.toContain('Recurring')
  })

  it('does not repeat the same objective four lessons running', () => {
    const model = initLearningModel('s', 'A2', now)
    const chosen: string[] = []
    for (let i = 0; i < 4; i++) {
      chosen.push(chooseObjective(model, 'A2', chosen).ref)
    }
    expect(new Set(chosen).size).toBe(chosen.length)
  })

  it('a pronunciation problem that breaks communication outranks a fresh grammar point', () => {
    const model: LearningModel = {
      ...initLearningModel('s', 'B1', now),
      pronunciationFoci: [{ area: 'th', rating: 'communicationProblem', updatedAt: now }],
    }
    const objective = chooseObjective(model, 'B1', [])
    expect(objective.kind).toBe('pronunciation')
    expect(objective.ref).toBe('th')
  })
})

describe('spaced review', () => {
  it('brings an emerging item back within days, and a secure one much later', () => {
    let model = initLearningModel('s', 'B1', now)
    model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)
    const emerging = model.emerging.find((s) => s.ref === 'g_past_simple')!
    expect(emerging.strength).toBe('emerging')
    expect(emerging.reviewDue - now).toBe(2 * DAY)

    // Repeated success moves it along, and pushes the review further out.
    model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)
    expect(model.emerging[0].strength).toBe('developing')
    expect(model.emerging[0].reviewDue - now).toBe(7 * DAY)
  })

  it('surfaces due items and leaves not-yet-due items alone', () => {
    let model = initLearningModel('s', 'B1', now)
    model = reinforceSkill(model, 'g_articles', 'Articles', true, now)
    expect(dueForReview(model, now)).toHaveLength(0)
    expect(dueForReview(model, now + 3 * DAY)).toHaveLength(1)
  })

  it('a due item becomes the next lesson objective', () => {
    let model = initLearningModel('s', 'B1', now)
    model = reinforceSkill(model, 'g_articles', 'Articles', true, now)
    // Force it due.
    model = { ...model, emerging: model.emerging.map((s) => ({ ...s, reviewDue: now - DAY })) }
    const objective = chooseObjective(model, 'B1', [])
    expect(objective.ref).toBe('g_articles')
    expect(objective.rationale).toMatch(/spaced review/i)
  })
})

describe('mastery requires repeated evidence', () => {
  it('one correct answer never makes a skill secure', () => {
    let model = initLearningModel('s', 'A2', now)
    model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)
    expect(model.emerging[0].strength).toBe('emerging')
  })

  it('it takes four successes to become secure', () => {
    let model = initLearningModel('s', 'A2', now)
    const strengths: string[] = []
    for (let i = 0; i < 4; i++) {
      model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)
      strengths.push(model.emerging[0].strength)
    }
    expect(strengths).toEqual(['emerging', 'developing', 'developing', 'secure'])
  })

  it('a failure demotes a secure skill rather than leaving it secure', () => {
    let model = initLearningModel('s', 'A2', now)
    for (let i = 0; i < 4; i++) model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)
    expect(model.emerging[0].strength).toBe('secure')
    model = reinforceSkill(model, 'g_past_simple', 'Past simple', false, now)
    expect(model.emerging[0].strength).toBe('developing')
  })

  it('one completed lesson does not declare the objective mastered', () => {
    const s = student()
    const model = initLearningModel(s.id, 'A2', now)
    const lesson = lessonFor(s, model, 'correct')
    const { model: updated } = applyCompletedLesson(model, lesson, s, [], now)
    const tracked = updated.emerging.find((x) => x.ref === lesson.plan.objective.ref)
    expect(tracked?.strength).not.toBe('secure')
  })

  it('a corrected error is recorded and counted, not forgotten', () => {
    const s = student()
    const model = initLearningModel(s.id, 'A2', now)
    const lesson = lessonFor(s, model, 'partial')
    const corrections: Correction[] = [
      { id: 'c1', studentId: s.id, category: 'grammar', said: 'She go', better: 'She goes', priority: 'high', at: now },
      { id: 'c2', studentId: s.id, category: 'grammar', said: 'She go', better: 'She goes', priority: 'high', at: now },
    ]
    const { model: updated } = applyCompletedLesson(model, lesson, s, corrections, now)
    const recurring = updated.recurringErrors.find((e) => e.description === 'She go')!
    expect(recurring.occurrences).toBe(2)
    expect(recurring.resolved).toBe(false)
  })
})

describe('Pre-A1 stage movement is cautious', () => {
  it('advances on clear success, holds on partial, steps back on struggle', () => {
    expect(nextStageFromLesson('P1', 'correct')).toBe('P2')
    expect(nextStageFromLesson('P1', 'partial')).toBe('P1')
    expect(nextStageFromLesson('P1', 'needsWork')).toBe('P0')
    // Never runs off either end.
    expect(nextStageFromLesson('P0', 'needsWork')).toBe('P0')
    expect(nextStageFromLesson('P3', 'correct')).toBe('P3')
  })

  it('an unscored lesson holds the stage rather than guessing', () => {
    expect(nextStageFromLesson('P2', undefined)).toBe('P2')
  })
})
