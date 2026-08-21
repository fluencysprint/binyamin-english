/* ==========================================================================
   Seeds fictional demo students spanning very different ages, levels, native
   languages, and literacy situations, so the tutor can explore how the app
   behaves in each case. The names are deliberately neutral placeholders that
   read as nobody in particular — a demo record must never be mistaken for a
   real student's. Fully local and deterministic — every call creates a
   brand-new student record (its own uid), so seeding never overwrites or
   touches any existing student's data.
   ========================================================================== */

import { CEFR, Correction, LessonRecord } from '../types'
import { uid } from '../utils/id'
import { createStudent, NewStudentInput } from '../students/studentService'
import { getLearningModel, putCorrection, putLearningModel, putLesson } from './db'
import { generateFirstLesson } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'

type DemoCorrection = Omit<Correction, 'id' | 'studentId' | 'lessonId' | 'at'>

export interface DemoProfile {
  id: string
  /** Fictional display name shown on the "add demo student" buttons. */
  name: string
  ageBand: NewStudentInput['ageBand']
  /** Approximate level shown on the button (also drives the seeded lesson). */
  level: CEFR
  input: Omit<NewStudentInput, 'name' | 'ageBand'>
  /** Vocabulary + corrections + a completed first lesson, when set. Profiles
   *  without this are left freshly onboarded (no lesson history yet), which
   *  is its own useful state to inspect. */
  lesson?: {
    vocabulary: string[]
    corrections: DemoCorrection[]
  }
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'alex',
    name: 'Alex',
    ageBand: '6-8',
    level: 'preA1',
    input: {
      age: 5,
      nativeLanguage: 'Hebrew',
      otherLanguages: [],
      interfaceLanguage: 'he',
      goals: ['confidence', 'conversation'],
      interests: ['animals', 'songs', 'drawing'],
      speakingConfidence: 1,
      pronunciationImportance: 2,
      parentName: 'Robin',
      respondedByParent: true,
      englishListening: 'none',
      englishSpeaking: 'none',
      englishReading: 'cannot',
      nativeLanguageLiteracy: 'no',
      startLevelOverride: 'preA1',
    },
    // No lesson yet — shows the freshly-onboarded, true non-reader state.
  },
  {
    id: 'sam',
    name: 'Sam',
    ageBand: '6-8',
    level: 'A1',
    input: {
      age: 8,
      grade: '2nd',
      nativeLanguage: 'Russian',
      otherLanguages: [],
      interfaceLanguage: 'ru',
      englishExperience: 'A year of English at school',
      selfEstimatedLevel: 'A1',
      goals: ['school', 'conversation'],
      interests: ['dinosaurs', 'minecraft', 'soccer'],
      speakingConfidence: 2,
      pronunciationImportance: 3,
      parentName: 'Jamie',
      englishListening: 'fewWords',
      englishSpeaking: 'fewWords',
      englishReading: 'fewWords',
    },
    lesson: {
      vocabulary: ['dinosaur', 'friendly', 'roar'],
      corrections: [
        {
          category: 'grammar',
          said: 'I have six years',
          better: 'I am six years old',
          explanation: 'Age uses “be”, not “have”, in English.',
          priority: 'high',
        },
        {
          category: 'pronunciation',
          said: 'sree dinosaurs',
          better: 'three dinosaurs',
          explanation: 'TH sound — tongue between the teeth.',
          priority: 'medium',
        },
        {
          category: 'greatExpression',
          said: 'My favorite dinosaur is friendly',
          better: 'My favorite dinosaur is friendly',
          priority: 'low',
        },
      ],
    },
  },
  {
    id: 'jordan',
    name: 'Jordan',
    ageBand: '13-17',
    level: 'B1',
    input: {
      age: 15,
      grade: '9th',
      nativeLanguage: 'Spanish',
      otherLanguages: [],
      interfaceLanguage: 'es',
      englishExperience: 'Several years at school, watches shows in English',
      selfEstimatedLevel: 'B1',
      goals: ['school', 'confidence', 'exam'],
      interests: ['music', 'social media', 'reading'],
      speakingConfidence: 3,
      pronunciationImportance: 4,
      englishListening: 'conversational',
      englishSpeaking: 'simplePhrases',
      englishReading: 'comfortable',
    },
    lesson: {
      vocabulary: ['awkward', 'roommate', 'deadline'],
      corrections: [
        {
          category: 'grammar',
          said: 'I am agree with you',
          better: 'I agree with you',
          explanation: '“Agree” is a verb, not an adjective — no “am” needed.',
          priority: 'high',
        },
        {
          category: 'wordChoice',
          said: 'I have 15 years',
          better: 'I am 15 years old',
          explanation: 'A direct translation from Spanish — English uses “be”.',
          priority: 'medium',
        },
        {
          category: 'greatExpression',
          said: 'That show is so overrated, honestly',
          better: 'That show is so overrated, honestly',
          priority: 'low',
        },
      ],
    },
  },
  {
    id: 'taylor',
    name: 'Taylor',
    ageBand: 'adult',
    level: 'B2',
    input: {
      age: 34,
      nativeLanguage: 'Portuguese',
      otherLanguages: ['Spanish'],
      interfaceLanguage: 'en',
      englishExperience: 'Uses English at work occasionally',
      selfEstimatedLevel: 'B2',
      goals: ['work', 'interview', 'confidence'],
      interests: ['business', 'travel', 'football'],
      speakingConfidence: 4,
      pronunciationImportance: 3,
      englishListening: 'confident',
      englishSpeaking: 'confident',
      englishReading: 'fluent',
    },
    lesson: {
      vocabulary: ['negotiate', 'deadline', 'stakeholder'],
      corrections: [
        {
          category: 'grammar',
          said: 'I am working here since 2019',
          better: 'I have been working here since 2019',
          explanation: 'An ongoing action starting in the past needs the present perfect continuous.',
          priority: 'high',
        },
        {
          category: 'pronunciation',
          said: 'I focus on ð stakeholders',
          better: 'I focus on the stakeholders',
          explanation: 'TH sound in “the” — light tongue tap, not a hard D.',
          priority: 'medium',
        },
        {
          category: 'fluency',
          said: 'We need to... how to say... find middle point',
          better: 'We need to find a middle ground',
          priority: 'medium',
        },
      ],
    },
  },
  {
    id: 'morgan',
    name: 'Morgan',
    ageBand: 'adult',
    level: 'C1',
    input: {
      age: 41,
      nativeLanguage: 'French',
      otherLanguages: ['Italian'],
      interfaceLanguage: 'fr',
      englishExperience: 'Fluent from years of international work',
      goals: ['work', 'confidence', 'writing'],
      interests: ['literature', 'architecture', 'wine'],
      speakingConfidence: 5,
      pronunciationImportance: 5,
      englishListening: 'fluent',
      englishSpeaking: 'fluent',
      englishReading: 'fluent',
      startLevelOverride: 'C1',
    },
    lesson: {
      vocabulary: ['nuance', 'candid', 'the elephant in the room'],
      corrections: [
        {
          category: 'wordOrder',
          said: 'I explained him the situation carefully',
          better: 'I explained the situation to him carefully',
          explanation: '“Explain” takes “to [someone]” — it does not front the indirect object.',
          priority: 'low',
        },
        {
          category: 'pronunciation',
          said: 'comfortable (four syllables)',
          better: 'comfortable (“COMFT-er-bul”, three syllables)',
          explanation: 'Reduced vowels — natural American English often drops the middle syllable.',
          priority: 'medium',
        },
        {
          category: 'greatExpression',
          said: 'Let’s not tiptoe around it — the budget is the elephant in the room',
          better: 'Let’s not tiptoe around it — the budget is the elephant in the room',
          priority: 'low',
        },
      ],
    },
  },
  {
    id: 'casey',
    name: 'Casey',
    ageBand: 'adult',
    level: 'preA1',
    input: {
      age: 68,
      nativeLanguage: 'Arabic',
      otherLanguages: ['Hebrew'],
      interfaceLanguage: 'he',
      englishExperience: 'Never studied English before',
      goals: ['travel', 'confidence', 'conversation'],
      interests: ['grandchildren', 'gardening', 'news'],
      speakingConfidence: 2,
      pronunciationImportance: 3,
      englishListening: 'none',
      englishSpeaking: 'fewWords',
      englishReading: 'cannot',
      nativeLanguageLiteracy: 'yes',
      startLevelOverride: 'preA1',
    },
    // No lesson yet — an older complete-beginner adult, contrasted with Alex's
    // young non-reader onboarding.
  },
]

/** Seed one demo student by profile id. Returns the new student's id. */
export async function seedDemoStudent(profileId: string): Promise<string> {
  const profile = DEMO_PROFILES.find((p) => p.id === profileId)
  if (!profile) throw new Error(`Unknown demo profile: ${profileId}`)

  const now = Date.now()
  const student = await createStudent({
    ...profile.input,
    name: profile.name,
    ageBand: profile.ageBand,
  })

  if (!profile.lesson) return student.id

  const model = (await getLearningModel(student.id))!
  const plan = generateFirstLesson(student, model)

  const corrections: Correction[] = profile.lesson.corrections.map((c) => ({
    ...c,
    id: uid('corr'),
    studentId: student.id,
    lessonId: plan.id,
    at: now,
  }))
  for (const c of corrections) await putCorrection(c)

  const lesson: LessonRecord = {
    id: plan.id,
    studentId: student.id,
    plan,
    status: 'completed',
    startedAt: now - 50 * 60 * 1000,
    completedAt: now,
    currentPhaseIndex: plan.phases.length - 1,
    elapsedSeconds: 2980,
    responses: [
      { itemId: 'ex1', skill: 'speaking', cefr: profile.level, difficulty: 5, outcome: 'partial', at: now },
      { itemId: 'ex2', skill: 'grammar', cefr: profile.level, difficulty: 5, outcome: 'correct', at: now },
      { itemId: 'ex3', skill: 'listening', cefr: profile.level, difficulty: 5, outcome: 'correct', at: now },
      { itemId: 'ex4', skill: 'pronunciation', cefr: profile.level, difficulty: 5, outcome: 'needsWork', at: now },
    ],
    correctionIds: corrections.map((c) => c.id),
    audioIds: [],
    vocabularyAdded: profile.lesson.vocabulary,
    objectiveOutcome: 'partial',
  }

  const { model: updated, report } = applyCompletedLesson(model, lesson, student, corrections, now)
  await putLearningModel(updated)
  await putLesson({ ...lesson, report })

  return student.id
}
