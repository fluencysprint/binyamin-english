/* ==========================================================================
   The promises the phrase curriculum makes, held to by tests.
   --------------------------------------------------------------------------
   One of these matters more than all the others: a phrase must never be able
   to look mastered because it was shown, repeated, or produced with the
   answer already on the screen. Several tests below attack that claim from
   different directions, because it is the claim the learner's whole screen
   rests on.
   ========================================================================== */

import { describe, it, expect } from 'vitest'
import { LearningModel, LessonRecord, StudentProfile } from '../types'
import { initLearningModel } from '../students/learningModel'
import { generateFirstLesson, generateLesson, isBeginnerPathway } from '../lessons/lessonGenerator'
import { applyCompletedLesson } from '../lessons/lessonCompletion'
import { buildMicroSteps } from '../lessons/microSteps'
import { buildStudentBoard } from '../lessons/studentBoard'
import { generateHomework } from '../lessons/homework'
import { buildHomeworkSet } from '../practice/practiceSet'
import { overallCefr } from '../utils/cefr'
import { phraseContentStrings, phraseTextKey } from '../data/contentStrings'
import {
  PhraseVerdict,
  evidenceFor,
  lessonPhraseIds,
  phraseEvidence,
  phraseKey,
  phrasesDue,
  selectLessonPhrases,
} from './phraseProgress'
import { fillSlot, getPhrase, isFrame, phraseCurriculum, PHRASE_UNITS } from './phrases'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 0, 5, 10, 0, 0)

function student(over: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'stu',
    createdAt: T0,
    updatedAt: T0,
    name: 'Casey',
    age: 68,
    ageBand: 'adult',
    nativeLanguage: 'Arabic',
    otherLanguages: [],
    interfaceLanguage: 'he',
    goals: ['travel'],
    interests: [],
    speakingConfidence: 2,
    pronunciationImportance: 3,
    englishListening: 'none',
    englishSpeaking: 'none',
    englishReading: 'cannot',
    ...over,
  }
}

function beginnerModel(): LearningModel {
  return { ...initLearningModel('stu', 'preA1', T0), preA1Stage: 'P0' }
}

/** A completed lesson from a plan, with the tutor's verdicts filled in. */
function completed(
  plan: LessonRecord['plan'],
  verdicts: Record<string, PhraseVerdict>,
  at: number,
): LessonRecord {
  return {
    id: plan.id,
    studentId: 'stu',
    plan,
    status: 'completed',
    startedAt: at,
    completedAt: at,
    currentPhaseIndex: 0,
    elapsedSeconds: 3000,
    responses: [],
    correctionIds: [],
    audioIds: [],
    vocabularyAdded: [],
    phraseVerdicts: verdicts,
  }
}

/* -------------------------------------------------------------------------- */
/* The inventory                                                              */
/* -------------------------------------------------------------------------- */

describe('the phrase inventory', () => {
  it('is roughly a hundred targets with unique, stable ids', () => {
    expect(phraseCurriculum.length).toBe(100)
    expect(new Set(phraseCurriculum.map((p) => p.id)).size).toBe(100)
  })

  it('never asks a learner to build on something they have not met yet', () => {
    const order = new Map(phraseCurriculum.map((p, i) => [p.id, i]))
    const forward = phraseCurriculum.flatMap((p) =>
      p.requires.filter((r) => !order.has(r) || order.get(r)! >= order.get(p.id)!).map((r) => `${p.id}←${r}`),
    )
    expect(forward).toEqual([])
  })

  it('is mostly FRAMES, not memorized sentences', () => {
    /* The whole reason to teach chunks rather than a phrasebook: a learner
       leaves with a machine they can fill, not a sentence they can recite. */
    const frames = phraseCurriculum.filter(isFrame)
    expect(frames.length).toBeGreaterThan(phraseCurriculum.length / 3)
    for (const f of frames) {
      expect(f.slots.length, f.id).toBeGreaterThan(0)
      expect(fillSlot(f, f.slots[0]), f.id).not.toContain('___')
    }
  })

  it('never glues a suffix directly onto the slot', () => {
    /* `imDoing` used to be 'I'm ___ing.' with slots already carrying '-ing'
       ('working', 'eating', …), so every substitution drill and tutor card
       said "I'm workinging." — shown live on the swap block, the tutor card's
       practice line, and the student board. `___` must always sit at a word
       boundary (end of the chunk, or followed by whitespace/punctuation), so
       a slot filler is never asked to carry a suffix the template also adds. */
    for (const f of phraseCurriculum.filter(isFrame)) {
      expect(f.chunk, f.id).toMatch(/___(?:[\s.,?!’']|$)/)
    }
  })

  it('fills every slot of “I’m ___.” (imDoing) into one of its own examples', () => {
    const p = getPhrase('imDoing')!
    expect(fillSlot(p, 'working')).toBe('I’m working.')
    expect(fillSlot(p, 'eating')).toBe('I’m eating.')
    for (const example of p.examples) {
      expect(p.slots.some((s) => fillSlot(p, s) === example), example).toBe(true)
    }
  })

  it('teaches repair language before anything beyond first greetings', () => {
    /* The single most important ordering decision in the file: without "I
       don't understand" a beginner's only strategy is to nod. */
    const repair = phraseCurriculum.filter((p) => p.fn === 'repair')
    expect(repair.length).toBeGreaterThanOrEqual(8)
    expect(Math.max(...repair.map((p) => p.order))).toBeLessThan(
      Math.min(...phraseCurriculum.filter((p) => p.unit >= 4).map((p) => p.order)),
    )
  })

  it('gives every target a meaning a zero-English learner can be shown', () => {
    const keys = new Set(phraseContentStrings().map((s) => s.key))
    for (const p of phraseCurriculum) {
      expect(keys.has(phraseTextKey(p.id, 'meaning')), p.id).toBe(true)
      expect(p.meaning.trim().length, p.id).toBeGreaterThan(5)
    }
  })

  it('never teaches “Good night” as a greeting', () => {
    /* "goodMorning"'s meaning is "A greeting that says which part of the day
       it is" — but "Good night" is a farewell/bedtime phrase in natural
       English, never something said on arrival. A learner filling this
       frame's slot at random would be taught to greet someone with it. */
    const p = getPhrase('goodMorning')!
    expect(p.slots).not.toContain('night')
    expect(p.examples.join(' ')).not.toContain('Good night')
  })

  it('covers ten units and names each one', () => {
    expect(PHRASE_UNITS).toHaveLength(10)
    for (const u of PHRASE_UNITS) {
      expect(phraseCurriculum.filter((p) => p.unit === u.unit).length).toBe(10)
    }
  })
})

/* -------------------------------------------------------------------------- */
/* Mastery                                                                    */
/* -------------------------------------------------------------------------- */

describe('a phrase cannot look mastered because it was shown', () => {
  const plan = generateFirstLesson(student(), beginnerModel(), () => 0.4, T0)
  const ids = lessonPhraseIds({ plan } as LessonRecord)
  const target = ids[0]

  it('stays “introduced” when the tutor never marked it', () => {
    const ev = phraseEvidence([completed(plan, {}, T0)], beginnerModel())
    expect(evidenceFor(ev, target).state).toBe('introduced')
  })

  it('is only “recognised” when all the learner did was understand it', () => {
    const ev = phraseEvidence([completed(plan, { [target]: 'recognised' }, T0)], beginnerModel())
    expect(evidenceFor(ev, target).state).toBe('recognised')
  })

  it('is only “guided” when it was produced with the model in front of them', () => {
    const ev = phraseEvidence([completed(plan, { [target]: 'guided' }, T0)], beginnerModel())
    expect(evidenceFor(ev, target).state).toBe('guided')
  })

  it('never reaches “secure” from one lesson, however well it went', () => {
    const ev = phraseEvidence([completed(plan, { [target]: 'unaided' }, T0)], beginnerModel())
    expect(evidenceFor(ev, target).state).toBe('unaided')
  })

  it('never reaches “secure” from unaided work done the SAME day it was taught', () => {
    /* Homework done an hour after the lesson is not delayed retrieval. It is
       the same afternoon, and the phrase is still ringing in their ears. */
    const model: LearningModel = {
      ...beginnerModel(),
      practiceSessions: [
        {
          id: 'p1',
          studentId: 'stu',
          source: 'homework',
          startedAt: T0 + 3600_000,
          updatedAt: T0 + 3600_000,
          completedAt: T0 + 3600_000,
          itemCount: 1,
          results: [
            {
              itemId: 'i1',
              targetKind: 'phrase',
              targetKey: phraseKey(target),
              label: 'x',
              outcome: 'independent',
              at: T0 + 3600_000,
            },
          ],
        },
      ],
    }
    const ev = phraseEvidence([completed(plan, { [target]: 'unaided' }, T0)], model)
    expect(evidenceFor(ev, target).unaidedDays).toBe(1)
    expect(evidenceFor(ev, target).state).toBe('unaided')
  })

  it('reaches “secure” on unaided production a day later, and not before', () => {
    const later = T0 + DAY
    const model: LearningModel = {
      ...beginnerModel(),
      practiceSessions: [
        {
          id: 'p1',
          studentId: 'stu',
          source: 'homework',
          startedAt: later,
          updatedAt: later,
          completedAt: later,
          itemCount: 1,
          results: [
            {
              itemId: 'i1',
              targetKind: 'phrase',
              targetKey: phraseKey(target),
              label: 'x',
              outcome: 'independent',
              at: later,
            },
          ],
        },
      ],
    }
    const ev = phraseEvidence([completed(plan, { [target]: 'unaided' }, T0)], model)
    const e = evidenceFor(ev, target)
    expect(e.unaidedDays).toBe(2)
    expect(e.delayedUnaidedOccasions).toBe(1)
    expect(e.state).toBe('secure')
  })

  it('does not count “I had to look” as production', () => {
    const later = T0 + DAY
    const model: LearningModel = {
      ...beginnerModel(),
      practiceSessions: [
        {
          id: 'p1',
          studentId: 'stu',
          source: 'homework',
          startedAt: later,
          updatedAt: later,
          completedAt: later,
          itemCount: 1,
          results: [
            {
              itemId: 'i1',
              targetKind: 'phrase',
              targetKey: phraseKey(target),
              label: 'x',
              outcome: 'afterSupport',
              at: later,
            },
          ],
        },
      ],
    }
    const ev = phraseEvidence([completed(plan, { [target]: 'unaided' }, T0)], model)
    expect(evidenceFor(ev, target).state).toBe('unaided')
  })
})

describe('a phrase that stops coming back', () => {
  const plan = generateFirstLesson(student(), beginnerModel(), () => 0.4, T0)
  const target = lessonPhraseIds({ plan } as LessonRecord)[0]

  it('goes “shaky” after a second occasion produced nothing', () => {
    const lessons = [
      completed(plan, { [target]: 'unaided' }, T0),
      { ...completed(plan, { [target]: 'notYet' }, T0 + 7 * DAY), id: 'l2' },
    ]
    expect(evidenceFor(phraseEvidence(lessons, beginnerModel()), target).state).toBe('shaky')
  })

  it('is due immediately once shaky, and comes back before anything else', () => {
    const lessons = [
      completed(plan, { [target]: 'unaided' }, T0),
      { ...completed(plan, { [target]: 'notYet' }, T0 + 7 * DAY), id: 'l2' },
    ]
    const ev = phraseEvidence(lessons, beginnerModel())
    const due = phrasesDue(ev, T0 + 8 * DAY, 5)
    expect(due[0]?.id).toBe(target)
  })

  it('is left alone for three weeks once it is secure', () => {
    const later = T0 + DAY
    const model: LearningModel = {
      ...beginnerModel(),
      practiceSessions: [
        {
          id: 'p1',
          studentId: 'stu',
          source: 'homework',
          startedAt: later,
          updatedAt: later,
          completedAt: later,
          itemCount: 1,
          results: [
            { itemId: 'i1', targetKind: 'phrase', targetKey: phraseKey(target), label: 'x', outcome: 'independent', at: later },
          ],
        },
      ],
    }
    const ev = phraseEvidence([completed(plan, { [target]: 'unaided' }, T0)], model)
    expect(phrasesDue(ev, later + 7 * DAY).map((p) => p.id)).not.toContain(target)
    expect(phrasesDue(ev, later + 22 * DAY, 100).map((p) => p.id)).toContain(target)
  })
})

/* -------------------------------------------------------------------------- */
/* Choosing what to teach                                                     */
/* -------------------------------------------------------------------------- */

describe('how much a lesson teaches', () => {
  it('gives an adult beginner eight to ten new targets when nothing is outstanding', () => {
    const sel = selectLessonPhrases({
      evidence: new Map(),
      stage: 'P0',
      ageBand: 'adult',
      now: T0,
    })
    expect(sel.fresh.length).toBeGreaterThanOrEqual(8)
    expect(sel.fresh.length).toBeLessThanOrEqual(10)
    expect(sel.pace).toBe('steady')
  })

  it('gives a five-year-old fewer, because that is what they can hold', () => {
    const sel = selectLessonPhrases({ evidence: new Map(), stage: 'P0', ageBand: '6-8', now: T0 })
    expect(sel.fresh.length).toBeLessThan(8)
  })

  it('slows down when the learner is carrying phrases they cannot yet produce', () => {
    /* The count is evidence-based, not numerical: a learner with a backlog does
       not need a tenth new phrase, they need the nine they already have. */
    const plan = generateFirstLesson(student(), beginnerModel(), () => 0.4, T0)
    const ids = lessonPhraseIds({ plan } as LessonRecord)
    const verdicts = Object.fromEntries(ids.map((id) => [id, 'notYet' as PhraseVerdict]))
    const lessons = [
      completed(plan, verdicts, T0),
      { ...completed(plan, verdicts, T0 + 7 * DAY), id: 'l2' },
    ]
    const sel = selectLessonPhrases({
      evidence: phraseEvidence(lessons, beginnerModel()),
      stage: 'P1',
      ageBand: 'adult',
      now: T0 + 8 * DAY,
    })
    expect(sel.pace).toBe('consolidate')
    expect(sel.fresh.length).toBeLessThanOrEqual(4)
    expect(sel.review.length).toBeGreaterThan(0)
  })

  it('never introduces a target whose prerequisite is not already in hand', () => {
    const sel = selectLessonPhrases({ evidence: new Map(), stage: 'P0', ageBand: 'adult', now: T0 })
    const picked = sel.fresh.map((p) => p.id)
    for (const p of sel.fresh) {
      for (const r of p.requires) {
        expect(picked.indexOf(r), `${p.id} needs ${r}`).toBeGreaterThanOrEqual(0)
        expect(picked.indexOf(r)).toBeLessThan(picked.indexOf(p.id))
      }
    }
  })

  it('reaches past the stage ceiling rather than going permanently silent', () => {
    /* The stage ceiling (one stage above the learner's own) exists to slow a
       learner down, not to stop them. Advancing a stage needs a lesson the
       tutor judged clearly successful — a learner who reliably needs support
       but is never quite marked "correct" can stay at P0 indefinitely. Before
       this, once every P0/P1 target was met, `fresh` came back empty FOREVER:
       the ceiling only ever lifts on the evidence this exact situation
       withholds. Met everything reachable at the ceiling, still at P0. */
    const evidence = new Map(
      phraseCurriculum
        .filter((p) => p.stage === 'P0' || p.stage === 'P1')
        .map((p) => [
          p.id,
          {
            id: p.id,
            state: 'guided' as const,
            lastSeenAt: T0,
            occasions: 1,
            recognisedOccasions: 0,
            guidedOccasions: 1,
            unaidedOccasions: 0,
            delayedUnaidedOccasions: 0,
            unaidedDays: 0,
            lastVerdict: 'guided' as const,
            lapses: 0,
            reviewDue: T0,
          },
        ]),
    )
    const sel = selectLessonPhrases({ evidence, stage: 'P0', ageBand: 'adult', now: T0 })
    expect(sel.fresh.length).toBeGreaterThan(0)
    expect(sel.fresh.every((p) => p.stage === 'P2' || p.stage === 'P3')).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/* The lesson                                                                 */
/* -------------------------------------------------------------------------- */

describe('a generated beginner lesson', () => {
  const s = student()
  const plan = generateFirstLesson(s, beginnerModel(), () => 0.4, T0)
  const activities = plan.phases.flatMap((p) => p.activities)

  it('is built from phrase targets and says which ones are new', () => {
    expect(plan.objective.ref).toMatch(/^phrase:u\d+$/)
    expect(plan.newPhraseIds?.length).toBeGreaterThanOrEqual(6)
    expect(lessonPhraseIds({ plan } as LessonRecord).length).toBeGreaterThan(0)
  })

  it('fills the fifty minutes it was booked for', () => {
    expect(plan.totalMinutes).toBeGreaterThanOrEqual(45)
    expect(plan.totalMinutes).toBeLessThanOrEqual(50)
  })

  it('never shows a phrase without asking for it later', () => {
    /* The one lesson shape this must never produce. */
    const met = new Set(
      activities.filter((a) => a.guide?.params?.block === 'meet').flatMap((a) => a.phraseIds ?? []),
    )
    const asked = new Set(
      activities.filter((a) => a.guide?.params?.block === 'use').flatMap((a) => a.phraseIds ?? []),
    )
    expect([...met].filter((id) => !asked.has(id))).toEqual([])
  })

  it('asks for production with nothing modelled first, at least twice', () => {
    const steps = activities.flatMap((a, activityIndex) =>
      buildMicroSteps(a, {
        student: s,
        model: beginnerModel(),
        level: 'preA1',
        lang: 'en',
        activityIndex,
      }),
    )
    const cold = steps.filter((step) => step.move === 'retrieval')
    expect(cold.length).toBeGreaterThanOrEqual(2)
    // Nothing to press that would play the answer.
    expect(cold.every((step) => step.speak === undefined)).toBe(true)
  })

  it('closes on a step carrying every phrase the lesson touched', () => {
    const close = activities.find((a) => a.guide?.params?.block === 'close')
    expect(close?.phraseIds?.length).toBe(lessonPhraseIds({ plan } as LessonRecord).length)
  })

  it('gives the tutor a card and nine sections on every step', () => {
    for (const [activityIndex, a] of activities.entries()) {
      for (const step of buildMicroSteps(a, {
        student: s,
        model: beginnerModel(),
        level: 'preA1',
        lang: 'en',
        activityIndex,
      })) {
        for (const field of ['now', 'doneWhen', 'next'] as const) {
          expect(step[field].trim(), `${a.title} ${step.move} ${field}`).not.toBe('')
        }
        for (const field of ['say', 'do', 'studentDoes', 'lookFor', 'help', 'challenge'] as const) {
          expect(step[field].length, `${a.title} ${step.move} ${field}`).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('what the learner sees', () => {
  const s = student()
  const model = beginnerModel()
  const plan = generateFirstLesson(s, model, () => 0.4, T0)

  it('never shows the English on a retrieval step — only the meaning', () => {
    for (const [activityIndex, a] of plan.phases.flatMap((p) => p.activities).entries()) {
      const steps = buildMicroSteps(a, { student: s, model, level: 'preA1', lang: 'he', activityIndex })
      for (const step of steps.filter((x) => x.move === 'retrieval')) {
        const board = buildStudentBoard(step, a, { lang: 'he', student: s, model, level: 'preA1', now: T0 })
        expect(board.examples).toEqual([])
        expect(board.phrases).toEqual([])
        expect(board.words).toEqual([])
        expect(board.prompt).toBeUndefined()
        expect(board.recallCues.length).toBeGreaterThan(0)
        // The cue is the learner's own language; the answer stays off-screen.
        for (const cue of board.recallCues) expect(cue.cue).not.toContain(cue.answer)
      }
    }
  })

  it('shows nothing at all while the tutor is making the meaning', () => {
    const meet = plan.phases.flatMap((p) => p.activities).find((a) => a.guide?.params?.block === 'meet')!
    const step = buildMicroSteps(meet, { student: s, model, level: 'preA1', lang: 'he', activityIndex: 0 })[0]
    const board = buildStudentBoard(step, meet, { lang: 'he', student: s, model, level: 'preA1', now: T0 })
    expect(step.move).toBe('meaning')
    expect(board.examples).toEqual([])
    expect(board.recallCues).toEqual([])
  })

  it('keeps today’s phrases closed during the real-use minute', () => {
    const real = plan.phases.flatMap((p) => p.activities).find((a) => a.guide?.params?.block === 'realUse')!
    const step = buildMicroSteps(real, { student: s, model, level: 'preA1', lang: 'he', activityIndex: 0 })[0]
    const board = buildStudentBoard(step, real, { lang: 'he', student: s, model, level: 'preA1', now: T0 })
    expect(board.phrases.length).toBeGreaterThan(0)
    expect(board.phrasesOpen).toBe(false)
  })
})

/* -------------------------------------------------------------------------- */
/* Homework                                                                   */
/* -------------------------------------------------------------------------- */

describe('the homework a phrase lesson sets', () => {
  const s = student()
  const model = beginnerModel()
  const plan = generateFirstLesson(s, model, () => 0.4, T0)
  const ids = lessonPhraseIds({ plan } as LessonRecord)
  const verdicts = Object.fromEntries(
    ids.map((id, i) => [id, (i % 2 ? 'guided' : 'unaided') as PhraseVerdict]),
  )
  const lesson = completed(plan, verdicts, T0)
  const tasks = generateHomework(lesson, s, model, [])

  it('retrieves what this lesson taught, and introduces nothing new', () => {
    const phraseTask = tasks.find((t) => t.kind === 'sayPhrases')
    expect(phraseTask).toBeDefined()
    if (phraseTask?.kind !== 'sayPhrases') throw new Error('unreachable')
    expect(phraseTask.ids.every((id) => ids.includes(id))).toBe(true)
  })

  it('sends home a frame to reuse, not only phrases to repeat', () => {
    const frame = tasks.find((t) => t.kind === 'usePhraseFrame')
    expect(frame).toBeDefined()
    if (frame?.kind !== 'usePhraseFrame') throw new Error('unreachable')
    expect(isFrame(getPhrase(frame.id)!)).toBe(true)
    expect(frame.slots.length).toBeGreaterThan(1)
  })

  it('leaves out what the learner could not say at all', () => {
    const missed = Object.fromEntries(ids.map((id) => [id, 'notYet' as PhraseVerdict]))
    const one = { ...ids.reduce((acc, id) => ({ ...acc, [id]: 'notYet' as PhraseVerdict }), {}), [ids[0]]: 'guided' as PhraseVerdict }
    const tasksAllMissed = generateHomework(completed(plan, missed, T0), s, model, [])
    const tasksOneOk = generateHomework(completed(plan, one, T0), s, model, [])
    const got = tasksOneOk.find((t) => t.kind === 'sayPhrases')
    if (got?.kind !== 'sayPhrases') throw new Error('unreachable')
    expect(got.ids).toEqual([ids[0]])
    // …but never sends the learner home with nothing.
    expect(tasksAllMissed.length).toBeGreaterThan(0)
  })

  it('cues each phrase from its meaning, with the English held back', () => {
    const set = buildHomeworkSet({ ...lesson, report: { homework: tasks } as never }, s, model)!
    const phraseItems = set.items.filter((i) => i.targetKind === 'phrase' && i.check === 'recall')
    expect(phraseItems.length).toBeGreaterThan(0)
    for (const item of phraseItems) {
      expect(item.cueTextKey).toMatch(/^phrase\./)
      expect(item.cue).toBeUndefined()
      // A frame's answer is a whole utterance, never the gapped form.
      expect(item.answer).toBeDefined()
      expect(item.answer).not.toContain('___')
    }
  })
})

/* -------------------------------------------------------------------------- */
/* Across lessons                                                             */
/* -------------------------------------------------------------------------- */

describe('week on week', () => {
  it('opens the next lesson by asking for what is due, before teaching anything', () => {
    const s = student()
    const model = beginnerModel()
    const first = generateFirstLesson(s, model, () => 0.4, T0)
    const ids = lessonPhraseIds({ plan: first } as LessonRecord)
    const lesson = completed(
      first,
      Object.fromEntries(ids.map((id) => [id, 'guided' as PhraseVerdict])),
      T0,
    )
    const next = generateLesson(s, model, {
      label: 'Lesson 2',
      lessons: [lesson],
      now: T0 + 7 * DAY,
    })
    expect(next.phases[0].activities[0].guide?.params?.block).toBe('recall')
    const recalled = next.phases[0].activities[0].phraseIds ?? []
    expect(recalled.length).toBeGreaterThan(0)
    expect(recalled.every((id) => ids.includes(id))).toBe(true)
  })

  it('moves on to a new unit once the first one has landed', () => {
    const s = student()
    const model = beginnerModel()
    const first = generateFirstLesson(s, model, () => 0.4, T0)
    const ids = lessonPhraseIds({ plan: first } as LessonRecord)
    const lesson = completed(
      first,
      Object.fromEntries(ids.map((id) => [id, 'unaided' as PhraseVerdict])),
      T0,
    )
    const next = generateLesson(s, model, {
      label: 'Lesson 2',
      lessons: [lesson],
      now: T0 + 7 * DAY,
    })
    expect(next.objective.ref).not.toBe(first.objective.ref)
    const fresh = next.newPhraseIds ?? []
    expect(fresh.some((id) => ids.includes(id))).toBe(false)
  })

  it('graduates a learner who produces every phrase unaided out of the beginner pathway', () => {
    /* Before this fix, nothing ever moved `skillEstimates` for a phrase-only
       learner — `applyResponses` only reads `lesson.responses`, which a phrase
       lesson never sets. A learner who mastered all one hundred targets stayed
       "Pre-A1" forever and the generator could only recycle review, contradicting
       `buildBeginnerLesson`'s own comment that finishing the curriculum moves
       the estimates. This performs an actual multi-lesson run — acing every
       phrase, two days apart so "secure" is reachable — and checks the learner
       is eventually released into the ordinary A1 pathway. */
    const s = student()
    let model = beginnerModel()
    let lessons: LessonRecord[] = []
    let plan = generateFirstLesson(s, model, () => 0.4, T0)

    for (let i = 0; i < 20 && isBeginnerPathway(overallCefr(model.skillEstimates)); i++) {
      const at = T0 + i * 2 * DAY
      const ids = lessonPhraseIds({ plan } as LessonRecord)
      const rec = {
        ...completed(plan, Object.fromEntries(ids.map((id) => [id, 'unaided' as PhraseVerdict])), at),
        id: `l${i}`,
      }
      const result = applyCompletedLesson(model, rec, s, [], at, lessons)
      model = result.model
      lessons = [...lessons, { ...rec, status: 'completed', completedAt: at }]
      plan = generateLesson(s, model, { label: `Lesson ${i + 2}`, lessons, now: at + 2 * DAY })
    }

    expect(overallCefr(model.skillEstimates)).toBe('A1')
    expect(isBeginnerPathway(overallCefr(model.skillEstimates))).toBe(false)
    // The curriculum never taught or tested reading/writing — those must stay
    // exactly where the learner's own literacy (not their speaking) placed them.
    expect(model.skillEstimates.reading.level).toBe('preA1')
    expect(model.skillEstimates.writing.level).toBe('preA1')
    // And the next lesson this learner gets is an ordinary A1 lesson, not
    // another lap of phrase review.
    expect(plan.objective.ref).not.toMatch(/^phrase:/)
  })
})

/* -------------------------------------------------------------------------- */
/* What the tutor reads before the lesson                                     */
/* -------------------------------------------------------------------------- */

describe('the pre-lesson briefing', () => {
  it('names a win to open on, and what has gone quiet', async () => {
    const { buildBriefing } = await import('../lessons/briefing')
    const { buildProgress } = await import('../students/progress')
    const s = student()
    const model = beginnerModel()
    const first = generateFirstLesson(s, model, () => 0.4, T0)
    const ids = lessonPhraseIds({ plan: first } as LessonRecord)
    const [held, dropped] = ids

    const later = T0 + DAY
    const withPractice: LearningModel = {
      ...model,
      practiceSessions: [
        {
          id: 'p1',
          studentId: 'stu',
          source: 'homework',
          startedAt: later,
          updatedAt: later,
          completedAt: later,
          itemCount: 1,
          results: [
            { itemId: 'i1', targetKind: 'phrase', targetKey: phraseKey(held), label: 'x', outcome: 'independent', at: later },
          ],
        },
      ],
    }
    const lessons = [
      completed(first, { [held]: 'unaided', [dropped]: 'unaided' }, T0),
      { ...completed(first, { [dropped]: 'notYet' }, T0 + 7 * DAY), id: 'l2' },
    ]
    const now = T0 + 8 * DAY
    const briefing = buildBriefing(
      {
        student: s,
        model: withPractice,
        lessons,
        corrections: [],
        progress: buildProgress({ student: s, model: withPractice, lessons, corrections: [], now }),
      },
      now,
    )
    expect(briefing.phrases?.canSay).toContain(getPhrase(held)!.chunk)
    expect(briefing.phrases?.shaky).toContain(getPhrase(dropped)!.chunk)
    expect(briefing.phrases?.dueCount).toBeGreaterThan(0)
  })

  it('says nothing about phrases for a learner who has never met one', async () => {
    const { buildBriefing } = await import('../lessons/briefing')
    const { buildProgress } = await import('../students/progress')
    const s = student()
    const model = beginnerModel()
    const briefing = buildBriefing(
      {
        student: s,
        model,
        lessons: [],
        corrections: [],
        progress: buildProgress({ student: s, model, lessons: [], corrections: [], now: T0 }),
      },
      T0,
    )
    expect(briefing.phrases).toBeUndefined()
  })
})
