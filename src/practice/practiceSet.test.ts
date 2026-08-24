/* ==========================================================================
   Homework, expanded into something a learner can do alone on a phone.
   --------------------------------------------------------------------------
   The standard these assert against: the answer is never on screen with the
   cue, a word with a meaning is asked FOR from that meaning, and a set is as
   long as the lesson made it rather than padded to a round number.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { buildHomeworkSet, buildReviewSet, wordCount } from './practiceSet'
import { choosePracticeSet, recordResult, startSession } from './practiceService'
import { addVocabulary, initLearningModel } from '../students/learningModel'
import { DAY, T0, testLesson, testStudent } from '../tests/fixtures'
import { HomeworkTask, LearningModel, LessonRecord, LessonReport } from '../types'

function lessonWithHomework(homework: HomeworkTask[]): LessonRecord {
  const lesson = testLesson(1)
  const report = { homework } as unknown as LessonReport
  return { ...lesson, report }
}

const student = testStudent()

describe('a homework task becomes one screen per thing to retrieve', () => {
  it('splits the learner’s own corrections into one item each', () => {
    const set = buildHomeworkSet(
      lessonWithHomework([
        {
          kind: 'sayCorrected',
          items: [
            { said: 'I am agree', better: 'I agree' },
            { said: 'I go yesterday', better: 'I went yesterday' },
          ],
        },
      ]),
      student,
      initLearningModel('stu1'),
    )!
    expect(set.items).toHaveLength(2)
    // The cue is what they SAID. The fix is held back.
    expect(set.items[0].cue).toBe('I am agree')
    expect(set.items[0].answer).toBe('I agree')
    expect(set.items[0].check).toBe('recall')
  })

  it('cues a word from its meaning, so the learner produces the English', () => {
    const model = addVocabulary(initLearningModel('stu1'), [
      { term: 'deadline', meaning: 'the day something must be finished' },
    ])
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['deadline'] }]),
      student,
      model,
    )!
    expect(set.items[0].cueText).toBe('the day something must be finished')
    expect(set.items[0].cue).toBeUndefined()
    expect(set.items[0].answer).toBe('deadline')
  })

  it('falls back to production — never to showing the word and calling it recall', () => {
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['stakeholder'] }]),
      student,
      initLearningModel('stu1'),
    )!
    expect(set.items[0].cueText).toBeUndefined()
    expect(set.items[0].instructionKey).toBe('practice.item.useWord')
    // The word IS shown here, because there is no meaning to cue from — and
    // the instruction says "use it", not "remember it".
    expect(set.items[0].cue).toBe('stakeholder')
  })

  it('offers other real words as multiple-choice options for a meaning-cued word', () => {
    const model = addVocabulary(initLearningModel('stu1'), [
      { term: 'deadline', meaning: 'the day something must be finished' },
      { term: 'stakeholder', meaning: 'a person affected by a project' },
      { term: 'workload', meaning: 'how much work you have' },
      { term: 'follow up', meaning: 'to check again after a first message' },
    ])
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['deadline'] }]),
      student,
      model,
      () => 0.5,
    )!
    const item = set.items[0]
    expect(item.distractors).toBeDefined()
    expect(item.distractors!.length).toBeGreaterThanOrEqual(2)
    // The target itself is never offered as one of its own distractors.
    expect(item.distractors).not.toContain('deadline')
    for (const d of item.distractors!) {
      expect(model.vocabulary.some((v) => v.term.trim() === d)).toBe(true)
    }
  })

  it('offers no multiple-choice step when there are not enough other words for a fair set', () => {
    const model = addVocabulary(initLearningModel('stu1'), [
      { term: 'deadline', meaning: 'the day something must be finished' },
    ])
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['deadline'] }]),
      student,
      model,
    )!
    expect(set.items[0].distractors).toBeUndefined()
  })

  it('gives an activity with no single right answer a done/skip check, not a self-grade', () => {
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'repeatFluency', topic: 'Your last holiday', seconds: 45 }]),
      student,
      initLearningModel('stu1'),
    )!
    expect(set.items[0].check).toBe('doIt')
    expect(set.items[0].seconds).toBe(45)
  })

  it('offers a place to type only where the task is a writing task', () => {
    const write = buildHomeworkSet(
      lessonWithHomework([{ kind: 'writeSentences', count: 3, target: 'Past simple' }]),
      student,
      initLearningModel('stu1'),
    )!
    expect(write.items[0].writing).toBe(true)

    const speak = buildHomeworkSet(
      lessonWithHomework([{ kind: 'sayWordsAloud', terms: ['cat'] }]),
      student,
      initLearningModel('stu1'),
    )!
    expect(speak.items[0].writing).toBeFalsy()
  })

  it('never asks a learner who cannot write English to type', () => {
    const set = buildHomeworkSet(
      lessonWithHomework([{ kind: 'writeSentences', count: 3, target: 'Past simple' }]),
      testStudent({ englishWriting: 'cannot' }),
      initLearningModel('stu1'),
    )!
    expect(set.items[0].writing).toBe(false)
  })

  it('is honest about how long it takes, and never claims under three minutes', () => {
    const short = buildHomeworkSet(
      lessonWithHomework([{ kind: 'sayWordsAloud', terms: ['cat'] }]),
      student,
      initLearningModel('stu1'),
    )!
    expect(short.minutes).toBe(3)

    const long = buildHomeworkSet(
      lessonWithHomework([
        { kind: 'sayCorrected', items: [{ said: 'a', better: 'b' }, { said: 'c', better: 'd' }] },
        { kind: 'useWordsInSentences', terms: ['one', 'two', 'three'] },
        { kind: 'repeatFluency', topic: 'Work', seconds: 60 },
      ]),
      student,
      initLearningModel('stu1'),
    )!
    expect(long.items).toHaveLength(6)
    expect(long.minutes).toBeGreaterThanOrEqual(5)
    expect(long.minutes).toBeLessThanOrEqual(15)
  })

  it('produces nothing at all for a lesson that set no homework', () => {
    expect(buildHomeworkSet(testLesson(1), student, initLearningModel('stu1'))).toBeNull()
  })

  it('gives the same lesson the same item ids every time, so a half-done set resumes', () => {
    const lesson = lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['a', 'b'] }])
    const first = buildHomeworkSet(lesson, student, initLearningModel('stu1'))!
    const again = buildHomeworkSet(lesson, student, initLearningModel('stu1'))!
    expect(first.items.map((i) => i.id)).toEqual(again.items.map((i) => i.id))
  })
})

describe('a review set is only what is genuinely due', () => {
  function modelWithDueWords(now: number): LearningModel {
    const m = addVocabulary(initLearningModel('stu1', 'B1', now - 30 * DAY), [
      { term: 'deadline', meaning: 'when it must be finished' },
      { term: 'stakeholder' },
    ], now - 30 * DAY)
    return m
  }

  it('returns null rather than inventing something to practise', () => {
    expect(buildReviewSet(initLearningModel('stu1'), T0)).toBeNull()
  })

  it('picks up words whose review date has arrived', () => {
    const now = T0 + 40 * DAY
    const set = buildReviewSet(modelWithDueWords(now), now)!
    expect(wordCount(set)).toBe(2)
    expect(set.items.find((i) => i.label === 'deadline')!.cueText).toBe('when it must be finished')
  })

  it('leaves out a word the learner has already made secure', () => {
    const now = T0 + 40 * DAY
    const m = modelWithDueWords(now)
    const secured = {
      ...m,
      vocabulary: m.vocabulary.map((v) =>
        v.term === 'deadline' ? { ...v, strength: 'secure' as const } : v,
      ),
    }
    const set = buildReviewSet(secured, now)!
    expect(set.items.map((i) => i.label)).toEqual(['stakeholder'])
  })
})

describe('choosing what to do next', () => {
  it('puts the lesson’s own homework in front of the review queue', () => {
    const now = T0 + 40 * DAY
    const model = addVocabulary(
      initLearningModel('stu1', 'B1', now - 30 * DAY),
      [{ term: 'deadline', meaning: 'when it must be finished' }],
      now - 30 * DAY,
    )
    const lesson = lessonWithHomework([{ kind: 'sayCorrected', items: [{ said: 'x', better: 'y' }] }])
    const plan = choosePracticeSet(student, model, [lesson], now)!
    expect(plan.set.source).toBe('homework')
  })

  it('falls through to the review queue once the homework set is finished', () => {
    const now = T0 + 40 * DAY
    let model = addVocabulary(
      initLearningModel('stu1', 'B1', now - 30 * DAY),
      [{ term: 'deadline', meaning: 'when it must be finished' }],
      now - 30 * DAY,
    )
    const lesson = lessonWithHomework([{ kind: 'sayCorrected', items: [{ said: 'x', better: 'y' }] }])

    const set = buildHomeworkSet(lesson, student, model)!
    const started = startSession(model, set, undefined, now)
    model = started.model
    for (const item of set.items) {
      model = recordResult(
        model,
        started.session.id,
        {
          itemId: item.id,
          targetKind: item.targetKind,
          targetKey: item.targetKey,
          label: item.label,
          outcome: 'independent',
          at: now,
        },
        set.items.length,
        now,
      ).model
    }

    const plan = choosePracticeSet(student, model, [lesson], now)!
    expect(plan.set.source).toBe('review')
  })

  it('resumes a half-done set on the item the learner stopped at', () => {
    const now = T0 + 40 * DAY
    const lesson = lessonWithHomework([{ kind: 'useWordsInSentences', terms: ['a', 'b', 'c'] }])
    let model = initLearningModel('stu1', 'B1', now)
    const set = buildHomeworkSet(lesson, student, model)!
    const started = startSession(model, set, undefined, now)
    model = recordResult(
      started.model,
      started.session.id,
      {
        itemId: set.items[0].id,
        targetKind: 'vocabulary',
        targetKey: set.items[0].targetKey,
        label: 'a',
        outcome: 'independent',
        at: now,
      },
      set.items.length,
      now,
    ).model

    const plan = choosePracticeSet(student, model, [lesson], now)!
    expect(plan.doneItemIds.has(set.items[0].id)).toBe(true)
    expect(plan.doneItemIds.has(set.items[1].id)).toBe(false)
  })
})

describe('recording a result', () => {
  const now = T0 + 40 * DAY

  it('re-answering an item replaces the result rather than counting twice', () => {
    let model = initLearningModel('stu1', 'B1', now)
    const started = startSession(model, { source: 'review', items: [], minutes: 3 }, undefined, now)
    model = started.model
    const result = {
      itemId: 'i1',
      targetKind: 'vocabulary' as const,
      targetKey: 'v:x',
      label: 'x',
      outcome: 'incorrect' as const,
      at: now,
    }
    model = recordResult(model, started.session.id, result, 1, now).model
    model = recordResult(model, started.session.id, { ...result, outcome: 'independent' }, 1, now).model
    const session = model.practiceSessions![0]
    expect(session.results).toHaveLength(1)
    expect(session.results[0].outcome).toBe('independent')
  })

  it('moves the spaced schedule for a word recalled alone', () => {
    let model = addVocabulary(initLearningModel('stu1', 'B1', now), [{ term: 'deadline' }], now)
    const before = model.vocabulary[0]
    expect(before.strength).toBe('emerging')

    const started = startSession(model, { source: 'review', items: [], minutes: 3 }, undefined, now)
    model = recordResult(
      started.model,
      started.session.id,
      {
        itemId: 'i1',
        targetKind: 'vocabulary',
        targetKey: 'v:deadline',
        label: 'deadline',
        outcome: 'independent',
        at: now,
      },
      1,
      now,
    ).model
    const after = model.vocabulary[0]
    expect(after.strength).toBe('developing')
    expect(after.reviewDue).toBeGreaterThan(before.reviewDue)
  })
})
