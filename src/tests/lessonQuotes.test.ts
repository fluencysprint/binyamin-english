/* ==========================================================================
   Generated lesson content can never render a doubled quote.
   --------------------------------------------------------------------------
   The screenshot that started this showed `““Let's revisit: “I explained him
   the situation carefully.”””` in a SAY block. Two independent layers had each
   decided to add quotation marks. This sweeps everything the generator can
   produce, for every level, every Pre-A1 stage and every locale, through the
   SAME normalization the views use, and fails on any doubled mark.

   Deliberately broad rather than aimed at the one reported string: the defect
   was structural, so the coverage is too.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { CEFR_LEVELS, PRE_A1_STAGES, StudentProfile, UI_LANGUAGES, UILanguage } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson, generateLesson } from '../lessons/lessonGenerator'
import { buildMicroSteps } from '../lessons/microSteps'
import { DOUBLED_QUOTE_RE, quoted } from '../utils/quotes'
import { overallCefr } from '../utils/cefr'
import { LearningModel } from '../types'

const now = 1_700_000_000_000

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu-q',
    createdAt: now,
    updatedAt: now,
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

/** A model carrying the kind of history that makes the generator quote things:
 *  recurring errors and unclear pronunciation both get echoed back verbatim. */
function modelWithHistory(level: (typeof CEFR_LEVELS)[number]): LearningModel {
  const model = initLearningModel('stu-q', level, now)
  /* Order matters: the C1 review step echoes only the FIRST two back into a
     SAY line, so the already-quoted one has to be among them. */
  const error = (description: string, occurrences: number) => ({
    id: description,
    category: 'grammar' as const,
    description,
    occurrences,
    firstSeen: now,
    lastSeen: now,
    resolved: false,
  })
  model.recurringErrors = [
    error('she said “hello” to me', 2),
    error('I explained him the situation carefully', 3),
    error('comfortable (four syllables)', 2),
  ]
  model.pronunciationFoci = [{ area: 'th', rating: 'communicationProblem', updatedAt: now }]
  return model
}

/** Every string a tutor or learner can end up reading from one plan. */
function textsFrom(plan: ReturnType<typeof generateLesson>, model: LearningModel, s: StudentProfile) {
  const rendered: string[] = []
  const quotedLines: string[] = []

  plan.phases.forEach((phase, phaseIndex) => {
    rendered.push(phase.title)
    for (const activity of phase.activities) {
      rendered.push(activity.title, activity.studentPrompt, activity.passage ?? '')
      const card = activity.tutorCard
      if (card) {
        rendered.push(
          card.goal,
          card.ifStruggle,
          card.ifSucceed,
          card.howToExplain,
          ...card.listenFor,
          ...card.model,
          ...card.practice,
          ...card.avoid,
        )
      }
      const steps = buildMicroSteps(activity, {
        student: s,
        model,
        level: overallCefr(model.skillEstimates), lang: 'en',
        activityIndex: phaseIndex,
      })
      for (const step of steps) {
        // SAY is what the view puts in quotes — check it BOTH raw and rendered.
        quotedLines.push(...step.say)
        rendered.push(
          step.now,
          step.doneWhen,
          step.next,
          ...step.do,
          ...step.studentDoes,
          ...step.lookFor,
          ...step.help,
          ...step.challenge,
        )
      }
    }
  })
  return { rendered, quotedLines }
}

function checkPlan(label: string, plan: ReturnType<typeof generateLesson>, model: LearningModel, s: StudentProfile) {
  const { rendered, quotedLines } = textsFrom(plan, model, s)

  for (const text of rendered) {
    expect(DOUBLED_QUOTE_RE.test(text), `${label}: ${text}`).toBe(false)
  }

  for (const lang of UI_LANGUAGES as readonly UILanguage[]) {
    for (const line of quotedLines) {
      const shown = quoted(line, lang)
      expect(DOUBLED_QUOTE_RE.test(shown), `${label} [${lang}]: ${shown}`).toBe(false)
    }
  }
  return quotedLines.length
}

describe('generated lesson content', () => {
  it('renders no doubled quotes at any level, in any locale', () => {
    let sayLines = 0
    for (const level of CEFR_LEVELS) {
      const model = modelWithHistory(level)
      const s = student({ name: 'Dana' })
      sayLines += checkPlan(`${level} generated`, generateLesson(s, model, { label: 'L2' }), model, s)
      sayLines += checkPlan(`${level} first`, generateFirstLesson(s, model), model, s)
    }
    // A sweep that found nothing to look at would pass vacuously.
    expect(sayLines).toBeGreaterThan(50)
  })

  it('renders no doubled quotes for a beginner at any Pre-A1 stage', () => {
    for (const stage of PRE_A1_STAGES) {
      const s = student({ age: 7, ageBand: '6-8', interfaceLanguage: 'he' })
      const model = initLearningModel(s.id, 'preA1', now)
      model.preA1Stage = stage
      checkPlan(`preA1 ${stage}`, generateFirstLesson(s, model), model, s)
    }
  })

  it('survives a correction that itself contains quotation marks', () => {
    // The C1 review step echoes recurring errors back into a SAY line, so a
    // quoted correction is the shortest path to a nested quote.
    const s = student({ age: 41, name: 'Morgan' })
    const model = modelWithHistory('C1')
    const { quotedLines } = textsFrom(generateLesson(s, model, { label: 'L2' }), model, s)
    const echoed = quotedLines.filter((l) => l.includes('she said'))
    expect(echoed.length).toBeGreaterThan(0)
    for (const line of echoed) {
      // Proof this is not vacuous: naive wrapping — what the view used to do —
      // produces exactly the artifact from the bug report.
      expect(DOUBLED_QUOTE_RE.test(`“${line}”`), line).toBe(true)
      for (const lang of UI_LANGUAGES as readonly UILanguage[]) {
        expect(DOUBLED_QUOTE_RE.test(quoted(line, lang)), `${lang}: ${line}`).toBe(false)
      }
    }
  })
})
