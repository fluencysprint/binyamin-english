/* ==========================================================================
   Micro-step generation — the tutor autopilot's contract.
   --------------------------------------------------------------------------
   The promise this module makes is narrow and testable: at every point in a
   lesson, the tutor can see NOW / SAY / DO / STUDENT DOES / LOOK FOR / HELP /
   CHALLENGE / DONE WHEN / NEXT, none of them empty, in a step short enough to
   act on. These tests hold that promise to every activity the generator can
   produce, for every learner profile in the brief's audit matrix.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { CEFR, LearningModel, LessonActivity, StudentProfile, UILanguage } from '../types'
import { initLearningModel, addVocabulary, reinforceSkill } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from './lessonGenerator'
import {
  MicroStep,
  buildMicroSteps,
  buildRetrievalStep,
  isConversationStep,
  resolveGuidance,
  retrievalMaterial,
} from './microSteps'
import { ageStageFor, pacingFor } from './pacing'
import { grammarLibrary } from '../data/grammarLibrary'
import { pronunciationLibrary } from '../data/pronunciationLibrary'
import { translate } from '../i18n/translate'

const now = 1_700_000_000_000

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu',
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
    pronunciationImportance: 4,
    ...over,
  }
}

function ctxFor(
  s: StudentProfile,
  model?: LearningModel,
  level: CEFR = 'B1',
  lang: UILanguage = 'en',
) {
  return { student: s, model: model ?? initLearningModel(s.id, level, now), level, lang, activityIndex: 0 }
}

/** Every step must answer all nine questions. Empty is failure, not "optional". */
function expectComplete(step: MicroStep, label: string) {
  expect(step.now, `${label}: NOW`).toBeTruthy()
  expect(step.do.length, `${label}: DO`).toBeGreaterThan(0)
  expect(step.studentDoes.length, `${label}: STUDENT DOES`).toBeGreaterThan(0)
  expect(step.lookFor.length, `${label}: LOOK FOR`).toBeGreaterThan(0)
  expect(step.help.length, `${label}: HELP`).toBeGreaterThan(0)
  expect(step.challenge.length, `${label}: CHALLENGE`).toBeGreaterThan(0)
  expect(step.doneWhen, `${label}: DONE WHEN`).toBeTruthy()
  expect(step.next, `${label}: NEXT`).toBeTruthy()
  expect(step.studentKey, `${label}: student instruction key`).toBeTruthy()
  expect(step.activityId, `${label}: activityId`).toBeTruthy()
}

describe('every activity in every pathway yields complete micro-steps', () => {
  const profiles: [string, Partial<StudentProfile>, CEFR][] = [
    ['5-year-old zero-English', { age: 5, ageBand: '6-8', interfaceLanguage: 'es' }, 'preA1'],
    ['10-year-old', { age: 10, ageBand: '9-12', interfaceLanguage: 'he' }, 'A1'],
    ['15-year-old', { age: 15, ageBand: '13-17' }, 'A2'],
    ['nervous adult beginner', { age: 34, ageBand: 'adult', interfaceLanguage: 'ru' }, 'preA1'],
    ['B1 adult', { age: 40, ageBand: 'adult' }, 'B1'],
    ['B2 adult', { age: 45, ageBand: 'adult' }, 'B2'],
    ['C1 professional', { age: 38, ageBand: 'adult' }, 'C1'],
    ['older adult beginner', { age: 72, ageBand: 'adult', interfaceLanguage: 'ru' }, 'preA1'],
  ]

  for (const [label, over, level] of profiles) {
    it(`${label}: no activity leaves the tutor without instructions`, () => {
      const s = student(over)
      const model = { ...initLearningModel(s.id, level, now), preA1Stage: 'P1' as const }
      for (const plan of [generateFirstLesson(s, model), generateLesson(s, model, { label: 'Lesson 4' })]) {
        const activities = plan.phases.flatMap((p) => p.activities)
        expect(activities.length).toBeGreaterThan(0)
        for (const [i, activity] of activities.entries()) {
          const steps = buildMicroSteps(activity, ctxFor(s, model, level))
          expect(steps.length, `${activity.kind} produced no steps`).toBeGreaterThan(0)
          for (const step of steps) expectComplete(step, `${label} · ${activity.kind} #${i}`)
        }
      }
    })
  }
})

describe('step length is age-appropriate (2–5 minutes where it should be)', () => {
  const cases: [number, number][] = [
    [5, 4],
    [10, 5],
    [15, 6],
    [30, 8],
    [72, 7],
  ]
  for (const [age, maxMinutes] of cases) {
    it(`age ${age}: no micro-step is longer than ${maxMinutes} minutes`, () => {
      const s = student({ age, ageBand: age <= 8 ? '6-8' : age <= 12 ? '9-12' : age <= 17 ? '13-17' : 'adult' })
      const model = initLearningModel(s.id, 'A2', now)
      const plan = generateLesson(s, model, { label: 'Lesson 2' })
      for (const activity of plan.phases.flatMap((p) => p.activities)) {
        for (const step of buildMicroSteps(activity, ctxFor(s, model, 'A2'))) {
          expect(step.minutes, `age ${age} ${activity.kind}`).toBeGreaterThanOrEqual(2)
          expect(step.minutes, `age ${age} ${activity.kind}`).toBeLessThanOrEqual(maxMinutes)
        }
      }
    })
  }

  it('a young child gets shorter steps than an adult for the same activity', () => {
    const activity: LessonActivity = {
      id: 'a1',
      kind: 'communication',
      title: 'Real conversation',
      studentPrompt: 'Talk to me.',
    }
    const child = student({ age: 6, ageBand: '6-8' })
    const adult = student({ age: 35 })
    const childStep = buildMicroSteps(activity, ctxFor(child))[0]
    const adultStep = buildMicroSteps(activity, ctxFor(adult))[0]
    expect(childStep.minutes).toBeLessThan(adultStep.minutes)
  })
})

describe('new language follows Meaning → Model → Notice → Guided → Real use → Feedback', () => {
  const grammarActivity = (ref: string, kind: 'microLesson' | 'guidedPractice'): LessonActivity => ({
    id: `a-${kind}`,
    kind,
    title: 'Focus',
    studentPrompt: 'Try it.',
    ref,
  })

  it('the focus phase opens with MEANING, never with a rule', () => {
    const steps = buildMicroSteps(grammarActivity('g_past_simple', 'microLesson'), ctxFor(student()))
    expect(steps.map((s) => s.move)).toEqual(['meaning', 'model', 'notice'])
    // The very first thing is a concrete situation, not terminology.
    expect(steps[0].do.join(' ')).toMatch(/timeline|story|point|show|mime|draw|hold|situation|calendar/i)
  })

  it('guided practice continues the same sequence into real use and feedback', () => {
    const steps = buildMicroSteps(grammarActivity('g_past_simple', 'guidedPractice'), ctxFor(student()))
    expect(steps.map((s) => s.move)).toEqual(['guided', 'realUse', 'feedback'])
  })

  it('the two phases together form ONE unbroken teaching sequence', () => {
    const s = student()
    const moves = [
      ...buildMicroSteps(grammarActivity('g_present_perfect', 'microLesson'), ctxFor(s)),
      ...buildMicroSteps(grammarActivity('g_present_perfect', 'guidedPractice'), ctxFor(s)),
    ].map((x) => x.move)
    expect(moves).toEqual(['meaning', 'model', 'notice', 'guided', 'realUse', 'feedback'])
  })

  it('the feedback step gives exact correcting words, not "correct the error"', () => {
    const steps = buildMicroSteps(grammarActivity('g_present_simple', 'guidedPractice'), ctxFor(student()))
    const feedback = steps.find((s) => s.move === 'feedback')!
    expect(feedback.say.length).toBeGreaterThan(0)
    // Exact wording, not an instruction ABOUT wording.
    expect(feedback.say.some((line) => /“|"|’|'/.test(line))).toBe(true)
    expect(feedback.do.join(' ')).toMatch(/ONE|one error|ignore/i)
  })
})

describe('easier and harder branches always exist', () => {
  for (const concept of grammarLibrary) {
    it(`${concept.id}: HELP and CHALLENGE are concrete`, () => {
      const steps = buildMicroSteps(
        { id: 'a', kind: 'guidedPractice', title: 'x', studentPrompt: 'x', ref: concept.id },
        ctxFor(student()),
      )
      const guided = steps.find((s) => s.move === 'guided')!
      expect(guided.help[0]).toBe(concept.fallback)
      expect(guided.challenge[0]).toBe(concept.extension)
      // Neither is a placeholder or a restatement of the task.
      expect(guided.help[0].length).toBeGreaterThan(15)
      expect(guided.challenge[0].length).toBeGreaterThan(15)
    })
  }
})

describe('pronunciation steps use the recorder for real before/after evidence', () => {
  for (const concept of pronunciationLibrary) {
    it(`${concept.area}: has a recording step and claims no automatic score`, () => {
      const steps = buildMicroSteps(
        { id: 'a', kind: 'pronunciation', title: 'x', studentPrompt: 'x', ref: concept.area },
        ctxFor(student()),
      )
      const record = steps.find((s) => s.move === 'record')
      expect(record, `${concept.area} has no recording step`).toBeTruthy()
      expect(record!.do.join(' ')).toMatch(/baseline|back to back|listen/i)
      // Human judgement stays authoritative; nothing here pretends to score.
      const text = JSON.stringify(steps).toLowerCase()
      expect(text).not.toMatch(/\bscore\b|\bscored\b|\d+%|accuracy rating/)
    })
  }

  it('uses the learner’s first-language interference note when we have one', () => {
    const ru = buildMicroSteps(
      { id: 'a', kind: 'pronunciation', title: 'x', studentPrompt: 'x', ref: 'th' },
      ctxFor(student({ interfaceLanguage: 'ru' })),
    )
    expect(ru[0].do.join(' ')).toContain('Russian')

    const fr = buildMicroSteps(
      { id: 'a', kind: 'pronunciation', title: 'x', studentPrompt: 'x', ref: 'th' },
      ctxFor(student({ interfaceLanguage: 'fr' })),
    )
    expect(fr[0].do.join(' ')).toContain('French')
  })
})

describe('native-language instruction for the learner', () => {
  const languages: UILanguage[] = ['en', 'he', 'ru', 'es', 'fr']

  it('every step names a student instruction that resolves in all five locales', () => {
    const s = student({ age: 6, ageBand: '6-8' })
    const model = { ...initLearningModel(s.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateFirstLesson(s, model)
    for (const activity of plan.phases.flatMap((p) => p.activities)) {
      for (const step of buildMicroSteps(activity, ctxFor(s, model, 'preA1'))) {
        for (const lang of languages) {
          const text = translate(lang, step.studentKey, step.studentParams)
          // A missing key would resolve to the key itself.
          expect(text, `${lang}:${step.studentKey}`).not.toBe(step.studentKey)
          expect(text.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('a zero-English Russian learner reads the instruction in Russian', () => {
    const s = student({ interfaceLanguage: 'ru', age: 68, needsNativeLanguageScaffolding: true })
    const model = { ...initLearningModel(s.id, 'preA1', now), preA1Stage: 'P0' as const }
    const plan = generateFirstLesson(s, model)
    const step = buildMicroSteps(plan.phases[0].activities[0], ctxFor(s, model, 'preA1'))[0]
    expect(translate('ru', step.studentKey, step.studentParams)).toMatch(/[Ѐ-ӿ]/)
  })

  it('a Hebrew learner reads the instruction in Hebrew', () => {
    const s = student({ interfaceLanguage: 'he', age: 10, ageBand: '9-12' })
    const model = initLearningModel(s.id, 'A1', now)
    const plan = generateLesson(s, model, { label: 'Lesson 2' })
    const step = buildMicroSteps(plan.phases[0].activities[0], ctxFor(s, model, 'A1'))[0]
    expect(translate('he', step.studentKey, step.studentParams)).toMatch(/[֐-׿]/)
  })
})

describe('retrieval practice uses the learner’s real history', () => {
  it('returns nothing when nothing is genuinely due — no invented review', () => {
    const s = student()
    const model = initLearningModel(s.id, 'B1', now)
    expect(buildRetrievalStep(ctxFor(s, model), 'act1', now)).toBeNull()
  })

  it('names the actual vocabulary and skills that are due', () => {
    const s = student()
    let model = initLearningModel(s.id, 'B1', now)
    model = addVocabulary(model, [{ term: 'meticulous' }, { term: 'delighted' }], now)
    model = reinforceSkill(model, 'g_past_simple', 'Past simple', true, now)

    // Three days later, the emerging items have come due.
    const later = now + 3 * 24 * 60 * 60 * 1000
    const material = retrievalMaterial(model, later)
    expect(material.vocabulary).toContain('meticulous')
    expect(material.skills).toContain('Past simple')

    const step = buildRetrievalStep(ctxFor(s, model), 'act1', later)!
    expect(step.move).toBe('retrieval')
    expect(step.say.join(' ')).toContain('meticulous')
    expect(step.lookFor.join(' ')).toMatch(/without a prompt/i)
  })

  it('surfaces unresolved recurring errors to watch for during the recall', () => {
    const s = student()
    let model = initLearningModel(s.id, 'B1', now)
    model = addVocabulary(model, [{ term: 'reluctant' }], now)
    model = {
      ...model,
      recurringErrors: [
        {
          id: 'e1',
          category: 'grammar',
          description: 'She go to school',
          occurrences: 4,
          firstSeen: now,
          lastSeen: now,
          resolved: false,
        },
      ],
    }
    const later = now + 3 * 24 * 60 * 60 * 1000
    const step = buildRetrievalStep(ctxFor(s, model), 'act1', later)!
    expect(step.lookFor.join(' ')).toContain('She go to school')
  })
})

describe('conversation is protected from the clock', () => {
  it('marks real-use steps as conversation', () => {
    const s = student()
    const steps = buildMicroSteps(
      { id: 'a', kind: 'communication', title: 'Talk', studentPrompt: 'Tell me about your week.' },
      ctxFor(s),
    )
    expect(steps.some(isConversationStep)).toBe(true)
  })

  it('gives an adult a second conversation move for when the first runs dry', () => {
    const steps = buildMicroSteps(
      { id: 'a', kind: 'communication', title: 'Talk', studentPrompt: 'Tell me about your week.' },
      ctxFor(student({ age: 40 })),
    )
    expect(steps).toHaveLength(2)
    expect(steps[1].doneWhen).toMatch(/not when the clock/i)
  })

  it('does not give a young child a long second conversation block', () => {
    const steps = buildMicroSteps(
      { id: 'a', kind: 'communication', title: 'Talk', studentPrompt: 'Tell me about your day.' },
      ctxFor(student({ age: 6, ageBand: '6-8' })),
    )
    expect(steps).toHaveLength(1)
    expect(pacingFor(6).allowsSustainedConversation).toBe(false)
  })
})

describe('guidance resolution fills gaps rather than showing nothing', () => {
  it('derives HELP and CHALLENGE from the tutor card when the autopilot omits them', () => {
    const resolved = resolveGuidance(
      { id: 'a', kind: 'reading', title: 'Reading', studentPrompt: 'Read this.' },
      { say: [], do: [], lookFor: [], next: [] },
      {
        goal: 'g',
        listenFor: [],
        ifStruggle: 'Read one sentence together first.',
        ifSucceed: 'Ask for an inference.',
        howToExplain: '',
        model: [],
        practice: [],
        avoid: [],
      },
    )
    expect(resolved.help).toEqual(['Read one sentence together first.'])
    expect(resolved.challenge).toEqual(['Ask for an inference.'])
    expect(resolved.doneWhen).toBeTruthy()
    expect(resolved.studentDoes.length).toBeGreaterThan(0)
  })

  it('still fills every section when there is no tutor card at all', () => {
    const resolved = resolveGuidance(
      { id: 'a', kind: 'writing', title: 'Writing', studentPrompt: 'Write.' },
      undefined,
      undefined,
    )
    for (const value of [resolved.now, resolved.doneWhen]) expect(value).toBeTruthy()
    for (const list of [resolved.studentDoes, resolved.help, resolved.challenge]) {
      expect(list.length).toBeGreaterThan(0)
    }
  })
})

describe('age stage covers the whole audit matrix', () => {
  it('separates young child, child, teen, adult and older adult', () => {
    expect(ageStageFor(5)).toBe('youngChild')
    expect(ageStageFor(7)).toBe('youngChild')
    expect(ageStageFor(8)).toBe('child')
    expect(ageStageFor(12)).toBe('child')
    expect(ageStageFor(13)).toBe('teen')
    expect(ageStageFor(17)).toBe('teen')
    expect(ageStageFor(18)).toBe('adult')
    expect(ageStageFor(64)).toBe('adult')
    expect(ageStageFor(65)).toBe('olderAdult')
    expect(ageStageFor(90)).toBe('olderAdult')
  })

  it('never infantilizes an older adult: no movement games, unhurried pace', () => {
    const older = pacingFor(72)
    expect(older.needsMovementBreaks).toBe(false)
    expect(older.allowsSustainedConversation).toBe(true)
    // Slower than a 30-year-old, but not treated like a child.
    expect(older.stepMinutes).toBeLessThan(pacingFor(30).stepMinutes)
    expect(older.stepMinutes).toBeGreaterThan(pacingFor(6).stepMinutes)
  })
})
