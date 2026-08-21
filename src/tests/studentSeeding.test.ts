/* ==========================================================================
   Regression tests for how a NEW student's starting level is decided.
   --------------------------------------------------------------------------
   The bug these guard against: a fluent adult was being seeded at Pre-A1 and
   handed the absolute-beginner curriculum, because (a) a leftover public
   self-check result in localStorage outranked the tutor's answers, and
   (b) the coarse self-report chips overwrote an explicitly declared level
   with their own ≤A2 ceiling.
   ========================================================================== */

import { describe, it, expect, beforeEach } from 'vitest'
import { clearAllData, _resetDBForTests } from '../data/db'
import {
  createStudent,
  loadStudentBundle,
  createLesson,
  NewStudentInput,
} from '../students/studentService'
import { overallCefr } from '../utils/cefr'
import { AssessmentSnapshot } from '../types'

const base = {
  age: 40,
  ageBand: 'adult' as const,
  nativeLanguage: 'Russian',
  otherLanguages: [],
  interfaceLanguage: 'en' as const,
  goals: ['conversation' as const],
  interests: ['travel'],
  speakingConfidence: 4 as const,
  pronunciationImportance: 3 as const,
}

beforeEach(async () => {
  localStorage.clear()
  _resetDBForTests()
  await clearAllData()
})

describe('new-student level seeding', () => {
  it('an already-fluent adult starts at C1 and gets communication coaching, not a beginner lesson', async () => {
    const student = await createStudent({
      ...base,
      name: 'Dana',
      startLevelOverride: 'C1',
    })
    const bundle = (await loadStudentBundle(student.id))!
    expect(overallCefr(bundle.model.skillEstimates)).toBe('C1')

    const lesson = await createLesson(bundle.student, bundle.model, [])
    expect(lesson.plan.objective.ref).toBe('c1-communication')
    expect(lesson.plan.objective.ref).not.toMatch(/^beginner:/)
  })

  it('the self-report chips never drag a declared level down (the A2-ceiling bug)', async () => {
    // "Simple conversations" maps to a coarse A2. It must refine, not override,
    // an explicit C1 declaration.
    const student = await createStudent({
      ...base,
      name: 'Marco',
      startLevelOverride: 'C1',
      englishSpeaking: 'conversational',
      englishListening: 'conversational',
      englishReading: 'comfortable',
    })
    const bundle = (await loadStudentBundle(student.id))!
    expect(bundle.model.skillEstimates.speaking.level).toBe('C1')
    expect(bundle.model.skillEstimates.reading.level).toBe('C1')
    expect(overallCefr(bundle.model.skillEstimates)).toBe('C1')
  })

  it('the same protection applies to an explicit self-estimated level', async () => {
    const student = await createStudent({
      ...base,
      name: 'Ines',
      selfEstimatedLevel: 'B2',
      englishSpeaking: 'conversational',
    })
    const bundle = (await loadStudentBundle(student.id))!
    expect(bundle.model.skillEstimates.speaking.level).toBe('B2')
  })

  it('the self-report ceiling reaches beyond "simple conversation"', async () => {
    const student = await createStudent({
      ...base,
      name: 'Yuki',
      englishSpeaking: 'fluent',
      englishListening: 'fluent',
      englishReading: 'fluent',
    })
    const bundle = (await loadStudentBundle(student.id))!
    // No declared level at all — the chips alone must be able to express fluency.
    expect(bundle.model.skillEstimates.speaking.level).toBe('C1')
    expect(overallCefr(bundle.model.skillEstimates)).toBe('C1')
  })

  it('a true beginner still gets Pre-A1 and the beginner curriculum', async () => {
    const student = await createStudent({
      ...base,
      name: 'Sasha',
      startLevelOverride: 'preA1',
      englishSpeaking: 'none',
      englishListening: 'none',
      englishReading: 'cannot',
    })
    const bundle = (await loadStudentBundle(student.id))!
    expect(overallCefr(bundle.model.skillEstimates)).toBe('preA1')
    expect(bundle.model.preA1Stage).toBeDefined()

    const lesson = await createLesson(bundle.student, bundle.model, [])
    expect(lesson.plan.objective.ref).toMatch(/^beginner:/)
  })

  it('an explicit placement snapshot outranks the triage choice', async () => {
    const snapshot: AssessmentSnapshot = {
      overallCEFR: 'B1',
      perSkill: { speaking: 'B1', reading: 'B1', listening: 'B1' },
      strongestSkill: 'speaking',
      priorities: [],
    }
    const student = await createStudent({
      ...base,
      name: 'Omar',
      snapshot,
      // Contradictory low chips must not matter once we have real evidence.
      englishSpeaking: 'fewWords',
    })
    const bundle = (await loadStudentBundle(student.id))!
    expect(bundle.model.skillEstimates.speaking.level).toBe('B1')
  })

  it('a snapshot is never picked up implicitly from browser storage', async () => {
    // A leftover public self-check from some other visitor sits in localStorage.
    localStorage.setItem(
      'ewb:lastSnapshot',
      JSON.stringify({
        snapshot: {
          overallCEFR: 'preA1',
          perSkill: { speaking: 'preA1', reading: 'preA1' },
          strongestSkill: 'speaking',
          priorities: [],
        },
        savedAt: Date.now(),
      }),
    )

    const input: NewStudentInput = { ...base, name: 'Klara', startLevelOverride: 'C1' }
    const student = await createStudent(input)
    const bundle = (await loadStudentBundle(student.id))!
    // It must have had no influence whatsoever.
    expect(overallCefr(bundle.model.skillEstimates)).toBe('C1')
  })

  it('onboarding-only fields are not persisted onto the student record', async () => {
    const student = await createStudent({ ...base, name: 'Pia', startLevelOverride: 'C1' })
    expect('startLevelOverride' in student).toBe(false)
    expect('snapshot' in student).toBe(false)
  })
})
