import { EnglishLiteracyLevel, EnglishOralLevel } from '../types'

/** Spoken-English self-report rungs, weakest → strongest, with "not sure" last.
 *  The scale runs all the way to fluent so an advanced learner has an honest
 *  answer to give. */
export const ORAL_OPTIONS: { value: EnglishOralLevel; key: string }[] = [
  { value: 'none', key: 'beginner.oral.none' },
  { value: 'fewWords', key: 'beginner.oral.fewWords' },
  { value: 'simplePhrases', key: 'beginner.oral.simplePhrases' },
  { value: 'conversational', key: 'beginner.oral.conversational' },
  { value: 'confident', key: 'beginner.oral.confident' },
  { value: 'fluent', key: 'beginner.oral.fluent' },
  { value: 'unsure', key: 'beginner.oral.unsure' },
]

/** English reading/literacy self-report rungs, weakest → strongest. */
export const READING_OPTIONS: { value: EnglishLiteracyLevel; key: string }[] = [
  { value: 'cannot', key: 'assessment.reading.cannot' },
  { value: 'fewWords', key: 'assessment.reading.fewWords' },
  { value: 'simpleSentences', key: 'assessment.reading.simpleSentences' },
  { value: 'comfortable', key: 'assessment.reading.comfortable' },
  { value: 'fluent', key: 'assessment.reading.fluent' },
  { value: 'unsure', key: 'assessment.reading.unsure' },
]
