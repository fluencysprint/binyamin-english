/* ==========================================================================
   Longitudinal progress — the behaviour a tutor would notice if it broke.
   --------------------------------------------------------------------------
   These are not unit tests of the arithmetic. Each one is a claim about the
   teaching: a weakness has to survive several lessons before it costs a lesson
   of the learner's time, it has to disappear for several lessons before we say
   it is gone, and a single bad five minutes must never become either.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  buildProgress,
  issueKeyFor,
  statusFor,
  MASTERED_AFTER_LESSONS,
  RECURRING_MIN_LESSONS,
} from './progress'
import { initLearningModel, addVocabulary } from './learningModel'
import { Correction, CorrectionCategory, LearningModel, LessonRecord } from '../types'
import { DAY, T0, testCorrection, testLesson, testStudent } from '../tests/fixtures'

function progressOf(lessons: LessonRecord[], corrections: Correction[], model?: LearningModel) {
  const m = model ?? initLearningModel('stu1', 'A2', T0)
  return buildProgress({
    student: testStudent(),
    model: m,
    lessons,
    corrections,
    now: T0 + (lessons.length + 1) * 7 * DAY,
  })
}

/* The same underlying error, said differently each week — which is how real
   learners actually make it. */
const THIRD_PERSON = [
  ['She go to school every day.', 'She goes to school every day.'],
  ['He go to work by bus.', 'He goes to work by bus.'],
  ['My sister go to the gym.', 'My sister goes to the gym.'],
  ['It go very fast.', 'It goes very fast.'],
] as const

describe('the status ladder', () => {
  it('needs evidence from more than one lesson before calling anything recurring', () => {
    expect(statusFor(1, 0)).toBe('new')
    expect(statusFor(RECURRING_MIN_LESSONS, 0)).toBe('recurring')
  })

  it('calls a quiet weakness improving, then settled, and never skips a rung', () => {
    expect(statusFor(3, 1)).toBe('recurring')
    expect(statusFor(3, 2)).toBe('improving')
    expect(statusFor(3, MASTERED_AFTER_LESSONS)).toBe('mastered')
  })
})

describe('grouping', () => {
  it('files two different sentences with the same broken structure as one issue', () => {
    const a = issueKeyFor({ category: 'grammar', said: THIRD_PERSON[0][0], better: THIRD_PERSON[0][1] })
    const b = issueKeyFor({ category: 'grammar', said: THIRD_PERSON[1][0], better: THIRD_PERSON[1][1] })
    expect(a.grammarRef).toBeDefined()
    expect(a.key).toBe(b.key)
  })

  it('keeps two different vocabulary slips separate — the word IS the issue', () => {
    const a = issueKeyFor({ category: 'vocabulary', said: 'I make a photo', better: 'I take a photo' })
    const b = issueKeyFor({ category: 'vocabulary', said: 'I make homework', better: 'I do my homework' })
    expect(a.key).not.toBe(b.key)
  })
})

describe('a recurring mistake across several lessons', () => {
  const lessons = [1, 2, 3].map((n) => testLesson(n))
  const corrections = [
    testCorrection(1, ...THIRD_PERSON[0]),
    testCorrection(2, ...THIRD_PERSON[1]),
    testCorrection(3, ...THIRD_PERSON[2]),
  ]

  it('is reported as recurring, with the number of lessons it was heard in', () => {
    const p = progressOf(lessons, corrections)
    expect(p.needsWork).toHaveLength(1)
    const issue = p.needsWork[0]
    expect(issue.status).toBe('recurring')
    expect(issue.lessonsSeen).toBe(3)
    expect(issue.why).toEqual({ key: 'progress.whyRecurring', params: { lessons: 3 } })
  })

  it('becomes the top thing to teach next, naming what it is rather than the mistake', () => {
    const p = progressOf(lessons, corrections)
    expect(p.focus[0].source).toBe('recurringIssue')
    expect(p.focus[0].ref).toBe('g_present_simple')
    // The label is the teachable concept, not the learner's wrong sentence.
    expect(p.needsWork[0].label).not.toContain('She go')
  })
})

describe('one isolated error', () => {
  it('stays "new" no matter how many times it was said in that single lesson', () => {
    const lessons = [1, 2, 3].map((n) => testLesson(n))
    const corrections = [
      testCorrection(2, ...THIRD_PERSON[0]),
      testCorrection(2, ...THIRD_PERSON[1]),
      testCorrection(2, ...THIRD_PERSON[2]),
      testCorrection(2, ...THIRD_PERSON[3]),
    ]
    const p = progressOf(lessons, corrections)
    const issue = p.issues.find((i) => i.grammarRef === 'g_present_simple')!
    expect(issue.occurrences).toBe(4)
    expect(issue.lessonsSeen).toBe(1)
    expect(issue.status).toBe('new')
    expect(p.needsWork).toEqual([])
  })

  it('never buys itself a whole lesson', () => {
    const lessons = [1, 2].map((n) => testLesson(n))
    const p = progressOf(lessons, [testCorrection(2, ...THIRD_PERSON[0])])
    expect(p.focus.some((f) => f.ref === 'g_present_simple')).toBe(false)
  })
})

describe('an issue improving over time', () => {
  it('moves from recurring to improving once it goes quiet for two lessons', () => {
    const early = [testCorrection(1, ...THIRD_PERSON[0]), testCorrection(2, ...THIRD_PERSON[1])]

    const whileLive = progressOf([1, 2].map((n) => testLesson(n)), early)
    expect(whileLive.needsWork[0].status).toBe('recurring')

    const afterSilence = progressOf([1, 2, 3, 4].map((n) => testLesson(n)), early)
    const issue = afterSilence.issues.find((i) => i.grammarRef === 'g_present_simple')!
    expect(issue.status).toBe('improving')
    expect(afterSilence.improving).toContainEqual(issue)
    expect(afterSilence.needsWork).toEqual([])
    expect(issue.why).toEqual({ key: 'progress.whyImproving', params: { lessons: 2 } })
  })
})

describe('a mastered item', () => {
  const early = [testCorrection(1, ...THIRD_PERSON[0]), testCorrection(2, ...THIRD_PERSON[1])]
  const lessons = [1, 2, 3, 4, 5].map((n) => testLesson(n))

  it('stops being called a weakness after three quiet lessons', () => {
    const p = progressOf(lessons, early)
    const issue = p.issues.find((i) => i.grammarRef === 'g_present_simple')!
    expect(issue.status).toBe('mastered')
    expect(p.mastered).toContainEqual(issue)
  })

  it('stops influencing what to teach next', () => {
    const p = progressOf(lessons, early)
    expect(p.focus.some((f) => f.ref === 'g_present_simple')).toBe(false)
  })

  it('does not crowd out a weakness that is still live', () => {
    const live = [
      ...early,
      testCorrection(4, 'Yesterday I go to the shop.', 'Yesterday I went to the shop.'),
      testCorrection(5, 'Last week I go to Tel Aviv.', 'Last week I went to Tel Aviv.'),
    ]
    const p = progressOf(lessons, live)
    expect(p.focus[0].source).toBe('recurringIssue')
    expect(p.focus[0].ref).not.toBe('g_present_simple')
  })
})

describe('a brand new student with no history', () => {
  const p = buildProgress({
    student: testStudent(),
    model: initLearningModel('stu1', 'A1', T0),
    lessons: [],
    corrections: [],
    now: T0,
  })

  it('reports nothing rather than inventing a starting point', () => {
    expect(p.lessonCount).toBe(0)
    expect(p.issues).toEqual([])
    expect(p.needsWork).toEqual([])
    expect(p.history).toEqual([])
    expect(p.dueVocabulary).toEqual([])
    expect(p.lastLessonAt).toBeUndefined()
  })

  it('offers no evidence-based focus, so lesson generation falls back to its own rules', () => {
    expect(p.focus).toEqual([])
  })
})

describe('legacy student data', () => {
  /* A record written before per-lesson correction ids, before spaced vocabulary
     review, and before recentContentIds existed. It must load, and must not
     silently lose the weaknesses the old model did record. */
  const legacyModel = {
    ...initLearningModel('stu1', 'B1', T0),
    recurringErrors: [
      {
        id: 'err1',
        category: 'grammar' as CorrectionCategory,
        description: 'She go to school every day.',
        example: 'She goes to school every day.',
        occurrences: 4,
        firstSeen: T0,
        lastSeen: T0 + 14 * DAY,
        resolved: false,
      },
    ],
    vocabulary: [
      { id: 'v1', term: 'stubborn', addedAt: T0, strength: 'emerging' as const, reviewDue: T0 + DAY },
    ],
    recentContentIds: undefined,
  } as unknown as LearningModel

  const legacyCorrections: Correction[] = [
    {
      id: 'old1',
      studentId: 'stu1',
      category: 'vocabulary',
      said: 'I make a photo',
      better: 'I take a photo',
      priority: 'medium',
      at: T0 + 7 * DAY + 60_000,
    },
  ]

  it('loads without throwing and keeps the old recurring error visible', () => {
    const p = progressOf([1, 2].map((n) => testLesson(n)), legacyCorrections, legacyModel)
    const issue = p.issues.find((i) => i.grammarRef === 'g_present_simple')
    expect(issue).toBeDefined()
    expect(issue!.occurrences).toBe(4)
    expect(issue!.status).toBe('recurring')
  })

  it('places a correction with no lesson id on the timeline instead of dropping it', () => {
    const p = progressOf([1, 2].map((n) => testLesson(n)), legacyCorrections, legacyModel)
    const vocab = p.issues.find((i) => i.category === 'vocabulary')
    expect(vocab).toBeDefined()
    expect(vocab!.lessonsSeen).toBe(1)
  })

  it('still schedules old vocabulary for recall', () => {
    const p = progressOf([1, 2].map((n) => testLesson(n)), legacyCorrections, legacyModel)
    expect(p.dueVocabulary.map((v) => v.term)).toContain('stubborn')
  })
})

describe('vocabulary in the progress view', () => {
  it('lists what is due for recall and what was captured most recently', () => {
    let model = initLearningModel('stu1', 'A2', T0)
    model = addVocabulary(model, [{ term: 'stubborn', meaning: 'will not change their mind' }], T0)
    model = addVocabulary(model, [{ term: 'commute' }], T0 + 21 * DAY)
    const lessons = [1, 2, 3].map((n) =>
      testLesson(n, n === 3 ? { vocabularyAdded: ['commute'] } : {}),
    )
    const p = buildProgress({
      student: testStudent(),
      model,
      lessons,
      corrections: [],
      now: T0 + 22 * DAY,
    })
    expect(p.dueVocabulary.map((v) => v.term)).toContain('stubborn')
    expect(p.dueVocabulary[0].meaning).toBe('will not change their mind')
    expect(p.recentVocabulary).toContain('commute')
  })
})

describe('the history strip', () => {
  it('shows the most recent lessons newest first, with what each was about', () => {
    const lessons = [1, 2, 3].map((n) =>
      testLesson(n, { objectiveOutcome: n === 3 ? 'correct' : 'partial', vocabularyAdded: ['a'] }),
    )
    const p = progressOf(lessons, [])
    expect(p.history.map((h) => h.label)).toEqual(['Lesson 3', 'Lesson 2', 'Lesson 1'])
    expect(p.history[0].objectiveOutcome).toBe('correct')
    expect(p.history[0].newWords).toBe(1)
  })
})
