/* ==========================================================================
   The evidence timeline — and, above all, what it refuses to claim.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import {
  buildAttempts,
  evidenceByTarget,
  homeworkOutcome,
  homeworkVerdict,
  learnerEvidence,
  vocabKey,
  vocabOutcomesFrom,
} from './evidence'
import { buildProgress } from './progress'
import { initLearningModel } from './learningModel'
import { DAY, T0, testCorrection, testLesson, testStudent } from '../tests/fixtures'
import { LearningModel, PracticeSessionRecord } from '../types'

function session(over: Partial<PracticeSessionRecord> = {}): PracticeSessionRecord {
  return {
    id: 'prac1',
    studentId: 'stu1',
    source: 'homework',
    lessonId: 'lesson1',
    startedAt: T0 + 3 * DAY,
    updatedAt: T0 + 3 * DAY,
    itemCount: 2,
    results: [],
    ...over,
  }
}

function modelWith(sessions: PracticeSessionRecord[]): LearningModel {
  return { ...initLearningModel('stu1', 'B1', T0), practiceSessions: sessions }
}

describe('a correction is an attempt that FAILED', () => {
  it('records the wrong version as evidence against the target, not silence', () => {
    const attempts = buildAttempts(
      [testLesson(1)],
      [testCorrection(1, 'I am agree', 'I agree')],
      initLearningModel('stu1'),
    )
    const correction = attempts.find((a) => a.targetKind === 'correction')!
    expect(correction.outcome).toBe('incorrect')
    expect(correction.where).toBe('lesson')
  })

  it('a retried correction is support, not independence', () => {
    const attempts = buildAttempts(
      [testLesson(1)],
      [testCorrection(1, 'I am agree', 'I agree', { retried: true })],
      initLearningModel('stu1'),
    )
    expect(attempts.find((a) => a.targetKind === 'correction')!.outcome).toBe('afterSupport')
  })
})

describe('one verdict per occasion, and it is the best thing that happened', () => {
  it('does not punish a learner for practising the same target twice in a session', () => {
    const key = 'grammar:i am agree'
    const model = modelWith([
      session({
        results: [
          { itemId: 'a', targetKind: 'correction', targetKey: key, label: 'I agree', outcome: 'incorrect', at: T0 },
          { itemId: 'b', targetKind: 'correction', targetKey: key, label: 'I agree', outcome: 'independent', at: T0 + 60 },
        ],
      }),
    ])
    const e = evidenceByTarget(buildAttempts([], [], model)).get(key)!
    expect(e.sessions).toBe(1)
    expect(e.independentSessions).toBe(1)
  })
})

describe('“you fixed it yourself this time” needs a before AND an after', () => {
  const corrections = [
    testCorrection(1, 'I am agree', 'I agree'),
    testCorrection(2, 'I am agree', 'I agree'),
  ]
  const key = buildAttempts([testLesson(1)], [corrections[0]], initLearningModel('stu1')).find(
    (a) => a.targetKind === 'correction',
  )!.targetKey

  it('is false while the only evidence is failure', () => {
    const model = initLearningModel('stu1')
    const e = evidenceByTarget(
      buildAttempts([testLesson(1), testLesson(2)], corrections, model),
    ).get(key)!
    expect(e.improvedUnaided).toBe(false)
  })

  it('becomes true once the learner produces it unaided on a later occasion', () => {
    const model = modelWith([
      session({
        startedAt: T0 + 15 * DAY,
        results: [
          {
            itemId: 'a',
            targetKind: 'correction',
            targetKey: key,
            label: 'I agree',
            outcome: 'independent',
            at: T0 + 15 * DAY,
          },
        ],
      }),
    ])
    const e = evidenceByTarget(
      buildAttempts([testLesson(1), testLesson(2)], corrections, model),
    ).get(key)!
    expect(e.improvedUnaided).toBe(true)
    expect(e.previousOutcome).toBe('incorrect')
  })
})

describe('a word is not "known" on one success', () => {
  const term = 'deadline'
  const results = (at: number, id: string) => [
    {
      itemId: id,
      targetKind: 'vocabulary' as const,
      targetKey: vocabKey(term),
      label: term,
      outcome: 'independent' as const,
      at,
    },
  ]

  it('needs three separate sessions before it is claimed', () => {
    for (const n of [1, 2]) {
      const model = modelWith(
        Array.from({ length: n }, (_, i) =>
          session({ id: `s${i}`, source: 'review', lessonId: undefined, results: results(T0 + i * DAY, `r${i}`) }),
        ),
      )
      const ev = learnerEvidence({
        student: testStudent(),
        model,
        lessons: [],
        corrections: [],
        progress: buildProgress({ student: testStudent(), model, lessons: [], corrections: [] }),
      })
      expect(ev.knownWords, `after ${n} sessions`).toEqual([])
    }

    const model = modelWith(
      [0, 1, 2].map((i) =>
        session({ id: `s${i}`, source: 'review', lessonId: undefined, results: results(T0 + i * DAY, `r${i}`) }),
      ),
    )
    const ev = learnerEvidence({
      student: testStudent(),
      model,
      lessons: [],
      corrections: [],
      progress: buildProgress({ student: testStudent(), model, lessons: [], corrections: [] }),
    })
    expect(ev.knownWords).toEqual([term])
  })

  it('never counts a word the learner had to look at as recalled', () => {
    expect(
      vocabOutcomesFrom([
        { itemId: 'a', targetKind: 'vocabulary', targetKey: vocabKey('x'), label: 'x', outcome: 'afterSupport', at: 0 },
      ]),
    ).toEqual({ x: 'missed' })
  })
})

describe('homework verdicts come from what was actually answered', () => {
  it('a partial run is "partly", never a failure', () => {
    expect(homeworkVerdict(session({ itemCount: 5, results: [
      { itemId: 'a', targetKind: 'vocabulary', targetKey: 'v:x', label: 'x', outcome: 'incorrect', at: T0 },
    ] }))).toBe('partly')
  })

  it('an untouched set claims nothing', () => {
    expect(homeworkVerdict(session({ itemCount: 5, results: [] }))).toBe('notDone')
  })

  it('the tutor’s own recorded verdict outranks the inferred one', () => {
    const lesson = testLesson(1, { homeworkReview: 'done' })
    const model = modelWith([session({ itemCount: 4, results: [] })])
    const out = homeworkOutcome(lesson, model)
    expect(out.review).toBe('done')
    expect(out.fromPractice).toBe(false)
  })

  it('with no tutor verdict, a run on the learner’s device answers the question', () => {
    const lesson = testLesson(1)
    const model = modelWith([
      session({
        itemCount: 2,
        results: [
          { itemId: 'a', targetKind: 'vocabulary', targetKey: 'v:x', label: 'x', outcome: 'independent', at: T0 },
          { itemId: 'b', targetKind: 'vocabulary', targetKey: 'v:y', label: 'y', outcome: 'incorrect', at: T0 },
        ],
      }),
    ])
    const out = homeworkOutcome(lesson, model)
    expect(out).toMatchObject({ review: 'done', fromPractice: true, answered: 2, independent: 1 })
  })
})

describe('the learner is never told something the records do not support', () => {
  it('says nothing at all for a learner with no history', () => {
    const model = initLearningModel('stu1')
    const ev = learnerEvidence({
      student: testStudent(),
      model,
      lessons: [],
      corrections: [],
      progress: buildProgress({ student: testStudent(), model, lessons: [], corrections: [] }),
    })
    expect(ev.wins).toEqual([])
    expect(ev.keepWorking).toEqual([])
    expect(ev.practice).toEqual({ sessions: 0, itemsAttempted: 0, independent: 0 })
  })

  it('every statement it does make is an i18n key, not English prose', () => {
    const model = modelWith([
      session({
        results: [
          { itemId: 'a', targetKind: 'vocabulary', targetKey: 'v:x', label: 'x', outcome: 'independent', at: T0 },
          { itemId: 'b', targetKind: 'vocabulary', targetKey: 'v:y', label: 'y', outcome: 'incorrect', at: T0 },
        ],
      }),
    ])
    const ev = learnerEvidence({
      student: testStudent(),
      model,
      lessons: [],
      corrections: [],
      progress: buildProgress({ student: testStudent(), model, lessons: [], corrections: [] }),
    })
    expect(ev.wins.length + ev.keepWorking.length).toBeGreaterThan(0)
    for (const s of [...ev.wins, ...ev.keepWorking]) {
      expect(s.key).toMatch(/^studentHome\.evidence\./)
    }
  })
})
