/* ==========================================================================
   Shared fixtures for the longitudinal tests.
   --------------------------------------------------------------------------
   Kept out of any *.test.ts file on purpose: importing a test module to reuse
   a helper also re-registers every suite inside it, so the same assertions run
   twice under two different names.
   ========================================================================== */

import { Correction, CorrectionCategory, LessonRecord, StudentProfile } from '../types'

export const DAY = 24 * 60 * 60 * 1000
export const T0 = 1_700_000_000_000

export function testStudent(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu1',
    createdAt: T0,
    updatedAt: T0,
    name: 'Dana',
    age: 30,
    ageBand: 'adult',
    nativeLanguage: 'Russian',
    otherLanguages: [],
    interfaceLanguage: 'ru',
    goals: ['conversation'],
    interests: ['music'],
    speakingConfidence: 3,
    pronunciationImportance: 3,
    ...over,
  }
}

/** A completed lesson record, stripped to what progress actually reads. */
export function testLesson(n: number, over: Partial<LessonRecord> = {}): LessonRecord {
  const at = T0 + n * 7 * DAY
  return {
    id: `lesson${n}`,
    studentId: 'stu1',
    status: 'completed',
    completedAt: at,
    currentPhaseIndex: 0,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
    plan: {
      id: `lesson${n}`,
      studentId: 'stu1',
      createdAt: at,
      label: `Lesson ${n}`,
      objective: { ref: 'g_present_be', title: 'The verb “to be”', rationale: 'x' },
      phases: [],
      totalMinutes: 50,
      source: 'generated',
    },
    ...over,
  }
}

export function testCorrection(
  lessonN: number,
  said: string,
  better: string,
  over: Partial<Correction> = {},
): Correction {
  return {
    id: `c${lessonN}-${said.slice(0, 8)}-${Math.random()}`,
    studentId: 'stu1',
    lessonId: `lesson${lessonN}`,
    category: 'grammar' as CorrectionCategory,
    said,
    better,
    priority: 'medium',
    at: T0 + lessonN * 7 * DAY - 1000,
    ...over,
  }
}
