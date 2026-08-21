import { LessonReport } from '../types'

/**
 * A fixed, fictional lesson report for the public site's "see a sample
 * report" page. Same shape real reports use (see reportGenerator.ts) so it
 * renders through the same <ReportView>, but it is hand-written data, not
 * generated from a lesson — nothing here reads or writes student storage.
 * IDs are prefixed `sample-` so they can never collide with a real record.
 */
export const SAMPLE_LESSON_REPORT: LessonReport = {
  lessonId: 'sample-lesson',
  studentId: 'sample-student',
  generatedAt: Date.UTC(2026, 7, 14, 15, 0),
  workedOn: [
    'Talking about last weekend (past simple)',
    'Free conversation: weekend plans',
    'Reading a short dialogue aloud',
  ],
  wentWell: [
    { kind: 'objectiveOutcome', outcome: 'correct', title: 'Talking about last weekend (past simple)' },
    { kind: 'greatExpression', said: 'It was actually really fun' },
    { kind: 'selfCorrected', count: 1 },
  ],
  corrections: [
    { said: 'I go to my cousin house', better: "I went to my cousin's house" },
    { said: "She don't like it", better: "She doesn't like it" },
  ],
  vocabulary: ['actually', 'cousin', 'amazing', 'exhausted'],
  pronunciation: [
    { area: 'th', rating: 'needsPractice', note: '"think" came out as "sink" — tongue between the teeth' },
    { area: 'wordStress', rating: 'understandable' },
  ],
  reviewed: {
    recalled: ['already', 'favorite'],
    missed: ['comfortable'],
  },
  nextFocusTitle: 'Irregular past tense verbs (go → went, have → had)',
  homework: [
    {
      kind: 'sayCorrected',
      items: [
        { said: 'I go to my cousin house', better: "I went to my cousin's house" },
        { said: "She don't like it", better: "She doesn't like it" },
      ],
    },
    { kind: 'practiceSound', area: 'th', words: ['think', 'three', 'birthday'] },
  ],
}
