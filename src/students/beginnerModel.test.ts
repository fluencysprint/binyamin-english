import { describe, it, expect } from 'vitest'
import {
  deriveInitialStage,
  detectZeroEnglish,
  literacyStrength,
  needsNativeScaffolding,
  nextStageFromLesson,
  oralStrength,
  preferNonTextInstructions,
  shouldStopEarly,
  stageFromResponses,
} from './beginnerModel'
import { CEFR, ItemResponse } from '../types'

function resp(cefr: CEFR, outcome: ItemResponse['outcome']): ItemResponse {
  return { itemId: `${cefr}-${outcome}-${Math.random()}`, skill: 'listening', cefr, difficulty: 3, outcome, at: 0 }
}

describe('oral vs. literacy are independent', () => {
  it('scales oral and literacy separately', () => {
    expect(oralStrength('none')).toBe(0)
    expect(oralStrength('conversational')).toBe(3)
    expect(literacyStrength('cannot')).toBe(0)
    expect(literacyStrength('comfortable')).toBe(3)
  })

  it('a learner can be orally ahead of their English literacy (age 10 case)', () => {
    // Understands spoken English from media, reads English poorly.
    const stage = deriveInitialStage({
      englishListening: 'simplePhrases',
      englishSpeaking: 'simplePhrases',
      englishReading: 'cannot',
    })
    // Oral leads placement; weak reading keeps it below A1-readiness.
    expect(stage).toBe('P2')
  })

  it('the same oral level with solid reading reaches A1-readiness', () => {
    const stage = deriveInitialStage({
      englishListening: 'simplePhrases',
      englishSpeaking: 'simplePhrases',
      englishReading: 'simpleSentences',
    })
    expect(stage).toBe('P3')
  })
})

describe('native-language scaffolding', () => {
  it('is needed when English reading is not established', () => {
    expect(needsNativeScaffolding('cannot')).toBe(true)
    expect(needsNativeScaffolding('fewWords')).toBe(true)
    expect(needsNativeScaffolding('unsure')).toBe(true)
    expect(needsNativeScaffolding('comfortable')).toBe(false)
  })

  it('young children and parent-answered profiles prefer non-text instructions', () => {
    expect(preferNonTextInstructions({ englishReading: 'comfortable', ageBand: '6-8' })).toBe(true)
    expect(preferNonTextInstructions({ englishReading: 'comfortable', respondedByParent: true })).toBe(true)
    expect(preferNonTextInstructions({ englishReading: 'comfortable', ageBand: 'adult' })).toBe(false)
  })
})

describe('Pre-A1 stage placement', () => {
  it('places a true zero-English learner at P0', () => {
    expect(deriveInitialStage({ englishListening: 'none', englishSpeaking: 'none' })).toBe('P0')
  })

  it('places first-words learners at P1', () => {
    expect(deriveInitialStage({ englishListening: 'fewWords', englishSpeaking: 'fewWords' })).toBe('P1')
  })
})

describe('stage progression from lessons', () => {
  it('advances one stage on a clearly successful objective', () => {
    expect(nextStageFromLesson('P0', 'correct')).toBe('P1')
    expect(nextStageFromLesson('P1', 'correct')).toBe('P2')
    expect(nextStageFromLesson('P2', 'correct')).toBe('P3')
  })

  it('holds on a partial and never exceeds P3', () => {
    expect(nextStageFromLesson('P2', 'partial')).toBe('P2')
    expect(nextStageFromLesson('P3', 'correct')).toBe('P3')
  })

  it('steps back on a struggle but never below P0', () => {
    expect(nextStageFromLesson('P2', 'needsWork')).toBe('P1')
    expect(nextStageFromLesson('P0', 'needsWork')).toBe('P0')
  })
})

describe('zero-English detection', () => {
  it('detects zero English after several failed easy items', () => {
    const responses = [resp('preA1', 'needsWork'), resp('preA1', 'needsWork'), resp('A1', 'needsWork')]
    expect(detectZeroEnglish(responses)).toBe(true)
    expect(shouldStopEarly(responses)).toBe(true)
    expect(stageFromResponses(responses)).toBe('P0')
  })

  it('does not fire on too little evidence', () => {
    expect(detectZeroEnglish([resp('preA1', 'needsWork')])).toBe(false)
  })

  it('does not fire when the learner got an easy item right', () => {
    const responses = [resp('preA1', 'correct'), resp('preA1', 'needsWork'), resp('A1', 'needsWork')]
    expect(detectZeroEnglish(responses)).toBe(false)
    expect(stageFromResponses(responses).startsWith('P')).toBe(true)
  })
})
