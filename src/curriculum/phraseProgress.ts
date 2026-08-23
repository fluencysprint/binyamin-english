/* ==========================================================================
   What this learner can actually SAY — and what has to come back.
   --------------------------------------------------------------------------
   Everything here is DERIVED from records, never stored. Lessons carry the
   tutor's per-phrase verdicts; practice sessions carry what the learner did
   alone; this module is the single view over both. That is the same rule
   students/evidence.ts follows, and it is what stops a progress screen from
   ever disagreeing with the history behind it.

   The whole point of the module is one guarantee:

       A phrase can never look mastered because it was shown, repeated,
       or produced with the answer still on the screen.

   Three things enforce it.

     1. A LADDER, not a checkbox. Recognition (they showed they understood),
        guided production (they said it with the model in front of them) and
        unaided production (they said it from meaning alone) are different
        rungs and are counted separately. Only the third is production.

     2. SEPARATE DAYS. "Secure" needs unaided production on two different
        days. Saying it four times in one lesson is one occasion, because
        that is all it is evidence of.

     3. DELAY. At least one of those unaided occasions has to happen AFTER
        the day the phrase was introduced. Retrieval on the same day as the
        teaching is recognition wearing a costume; a week later it is memory.

   And the mirror of that guarantee: anything that falls short comes back.
   `reviewDue` puts a shaky phrase in the next lesson and an unaided one three
   weeks out, so recurrence is a consequence of the evidence rather than a
   schedule someone has to maintain.
   ========================================================================== */

import { LearningModel, LessonRecord, PracticeOutcome } from '../types'
import { PhraseTarget, getPhrase, phraseCurriculum } from './phrases'
import { PreA1Stage } from '../types'
import { stageIndex } from '../students/beginnerModel'

/* -------------------------------------------------------------------------- */
/* The verdict                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the tutor saw at the moment of asking. Four rungs rather than the
 * three-way score used elsewhere, because "they understood it but could not
 * say it" is real evidence at this level and calling it a failure would tell
 * a beginner they had achieved nothing on the day they first understood
 * English.
 */
export const PHRASE_VERDICTS = ['notYet', 'recognised', 'guided', 'unaided'] as const
export type PhraseVerdict = (typeof PHRASE_VERDICTS)[number]

const RANK: Record<PhraseVerdict, number> = {
  notYet: 0,
  recognised: 1,
  guided: 2,
  unaided: 3,
}

/** Practice happens with no tutor, so its three outcomes map exactly. */
export function verdictFromPracticeOutcome(o: PracticeOutcome): PhraseVerdict {
  return o === 'independent' ? 'unaided' : o === 'afterSupport' ? 'guided' : 'notYet'
}

/** …and back, for the evidence timeline students/evidence.ts already keeps. */
export function outcomeFromVerdict(v: PhraseVerdict): PracticeOutcome {
  return v === 'unaided' ? 'independent' : v === 'guided' ? 'afterSupport' : 'incorrect'
}

/** Stable evidence key for a phrase, shared by practice items and attempts. */
export function phraseKey(id: string): string {
  return `ph:${id}`
}

/** Recover the phrase id from an evidence key. */
export function phraseIdFromKey(key: string): string | undefined {
  return key.startsWith('ph:') ? key.slice(3) : undefined
}

/* -------------------------------------------------------------------------- */
/* State                                                                       */
/* -------------------------------------------------------------------------- */

export type PhraseState =
  /** Never taught. */
  | 'new'
  /** Taught, but nothing has come back yet. */
  | 'introduced'
  /** They showed they understood it. */
  | 'recognised'
  /** They said it with the model or the frame in front of them. */
  | 'guided'
  /** They said it from meaning alone, at least once. */
  | 'unaided'
  /** Unaided on two separate days, one of them after the teaching day. */
  | 'secure'
  /** It used to come back and now it doesn't. Outranks everything for review. */
  | 'shaky'

export interface PhraseEvidence {
  id: string
  state: PhraseState
  /** When it was first taught. Absent for a phrase never introduced. */
  introducedAt?: number
  lastSeenAt: number
  /** Distinct occasions — one lesson or one practice session, however many
   *  times the phrase came up inside it. */
  occasions: number
  recognisedOccasions: number
  guidedOccasions: number
  unaidedOccasions: number
  /** Unaided occasions on a LATER day than the teaching. The delayed half of
   *  the mastery rule. */
  delayedUnaidedOccasions: number
  /** Distinct days carrying an unaided occasion. */
  unaidedDays: number
  lastVerdict: PhraseVerdict
  /** Consecutive recent occasions that fell short of guided production. */
  lapses: number
  /** When it should come round again. */
  reviewDue: number
}

const DAY = 24 * 60 * 60 * 1000
const dayOf = (at: number) => Math.floor(at / DAY)

/**
 * How long until a phrase should come back, by how well it is holding.
 *
 * Deliberately short at the bottom and long at the top: a phrase that has not
 * been produced yet belongs in the very next lesson, and one produced unaided
 * on two separate days does not need a fourth week of the learner's attention
 * when there are ninety-nine others.
 */
const REVIEW_DAYS: Record<PhraseState, number> = {
  new: 0,
  shaky: 0,
  introduced: 0,
  recognised: 1,
  guided: 3,
  unaided: 8,
  secure: 21,
}

/* -------------------------------------------------------------------------- */
/* Building the evidence                                                       */
/* -------------------------------------------------------------------------- */

interface Occasion {
  at: number
  day: number
  verdict: PhraseVerdict
}

/**
 * One verdict per phrase per occasion, and it is the BEST thing that happened
 * in that occasion. A learner who missed a phrase, was shown it, and then
 * produced it did produce it — recording the occasion as a failure would make
 * the evidence read worse the more the learner practised.
 */
function occasionsByPhrase(
  lessons: LessonRecord[],
  model: LearningModel,
): Map<string, { occasions: Occasion[]; introducedAt?: number }> {
  const out = new Map<string, { occasions: Occasion[]; introducedAt?: number }>()
  const entry = (id: string) => {
    let e = out.get(id)
    if (!e) out.set(id, (e = { occasions: [] }))
    return e
  }

  for (const lesson of lessons) {
    if (lesson.status !== 'completed') continue
    const at = lesson.completedAt ?? lesson.plan.createdAt

    /* Being TAUGHT is what starts the clock, and it is recorded from the plan
       rather than from a verdict — a phrase the tutor never got round to
       scoring was still introduced, and the delay rule below depends on
       knowing when. */
    for (const id of lessonPhraseIds(lesson)) {
      const e = entry(id)
      e.introducedAt = e.introducedAt === undefined ? at : Math.min(e.introducedAt, at)
    }

    for (const [id, verdict] of Object.entries(lesson.phraseVerdicts ?? {})) {
      const e = entry(id)
      e.occasions.push({ at, day: dayOf(at), verdict })
    }
  }

  for (const session of model.practiceSessions ?? []) {
    /* A practice session is one occasion, so the results inside it collapse
       to one verdict per phrase — the best of them. */
    const best = new Map<string, { at: number; verdict: PhraseVerdict }>()
    for (const r of session.results) {
      if (r.targetKind !== 'phrase') continue
      const id = phraseIdFromKey(r.targetKey)
      if (!id) continue
      const verdict = verdictFromPracticeOutcome(r.outcome)
      const cur = best.get(id)
      if (!cur || RANK[verdict] > RANK[cur.verdict]) best.set(id, { at: r.at, verdict })
    }
    for (const [id, { at, verdict }] of best) {
      entry(id).occasions.push({ at, day: dayOf(at), verdict })
    }
  }

  return out
}

/** Every phrase a lesson plan set out to teach or review. */
export function lessonPhraseIds(lesson: LessonRecord): string[] {
  const ids = lesson.plan.phases
    .flatMap((p) => p.activities)
    .flatMap((a) => a.phraseIds ?? [])
  return [...new Set(ids)]
}

/** Only the phrases a lesson introduced as NEW (its `newPhraseIds` marker). */
export function newPhraseIdsOf(lesson: LessonRecord): string[] {
  const marked = lesson.plan.newPhraseIds
  return marked?.length ? marked : lessonPhraseIds(lesson)
}

function stateOf(e: Omit<PhraseEvidence, 'state' | 'reviewDue'>): PhraseState {
  if (e.occasions === 0) return e.introducedAt === undefined ? 'new' : 'introduced'
  /* Regression, or a phrase that keeps not arriving. Either way it is the
     thing most worth the next lesson's first five minutes. */
  if (e.lastVerdict === 'notYet' && e.occasions >= 2) return 'shaky'
  if (
    e.lastVerdict === 'unaided' &&
    e.unaidedDays >= 2 &&
    e.delayedUnaidedOccasions >= 1
  ) {
    return 'secure'
  }
  if (e.unaidedOccasions >= 1) return 'unaided'
  if (e.guidedOccasions >= 1) return 'guided'
  if (e.recognisedOccasions >= 1) return 'recognised'
  return 'introduced'
}

/** The full picture for one learner, keyed by phrase id. */
export function phraseEvidence(
  lessons: LessonRecord[],
  model: LearningModel,
): Map<string, PhraseEvidence> {
  const raw = occasionsByPhrase(lessons, model)
  const out = new Map<string, PhraseEvidence>()

  for (const [id, { occasions, introducedAt }] of raw) {
    const sorted = [...occasions].sort((a, b) => a.at - b.at)
    /* Two attempts on the same target on the same day are one occasion — a
       lesson followed by the homework set an hour later is not two separate
       pieces of evidence about memory. */
    const byDay = new Map<number, Occasion>()
    for (const o of sorted) {
      const cur = byDay.get(o.day)
      if (!cur || RANK[o.verdict] >= RANK[cur.verdict]) byDay.set(o.day, o)
    }
    const merged = [...byDay.values()].sort((a, b) => a.at - b.at)
    const last = merged[merged.length - 1]

    const introDay = introducedAt === undefined ? undefined : dayOf(introducedAt)
    const unaided = merged.filter((o) => o.verdict === 'unaided')

    let lapses = 0
    for (let i = merged.length - 1; i >= 0; i--) {
      if (RANK[merged[i].verdict] >= RANK.guided) break
      lapses += 1
    }

    const base = {
      id,
      introducedAt,
      lastSeenAt: last?.at ?? introducedAt ?? 0,
      occasions: merged.length,
      recognisedOccasions: merged.filter((o) => o.verdict === 'recognised').length,
      guidedOccasions: merged.filter((o) => o.verdict === 'guided').length,
      unaidedOccasions: unaided.length,
      delayedUnaidedOccasions:
        introDay === undefined ? unaided.length : unaided.filter((o) => o.day > introDay).length,
      unaidedDays: new Set(unaided.map((o) => o.day)).size,
      lastVerdict: last?.verdict ?? 'notYet',
      lapses,
    }
    const state = stateOf(base)
    out.set(id, {
      ...base,
      state,
      reviewDue: base.lastSeenAt + REVIEW_DAYS[state] * DAY,
    })
  }

  return out
}

/** The evidence for one phrase, including the "never met it" answer. */
export function evidenceFor(
  evidence: Map<string, PhraseEvidence>,
  id: string,
): PhraseEvidence {
  return (
    evidence.get(id) ?? {
      id,
      state: 'new',
      lastSeenAt: 0,
      occasions: 0,
      recognisedOccasions: 0,
      guidedOccasions: 0,
      unaidedOccasions: 0,
      delayedUnaidedOccasions: 0,
      unaidedDays: 0,
      lastVerdict: 'notYet',
      lapses: 0,
      reviewDue: 0,
    }
  )
}

/* -------------------------------------------------------------------------- */
/* Choosing what a lesson teaches                                              */
/* -------------------------------------------------------------------------- */

/** Phrases the learner has met and can now hold up in conversation. */
export function producedUnaided(evidence: Map<string, PhraseEvidence>): PhraseTarget[] {
  return [...evidence.values()]
    .filter((e) => e.state === 'unaided' || e.state === 'secure')
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map((e) => getPhrase(e.id))
    .filter((p): p is PhraseTarget => Boolean(p))
}

/** Phrases that are due to come back, most urgent first. */
export function phrasesDue(
  evidence: Map<string, PhraseEvidence>,
  now: number,
  limit = 5,
): PhraseTarget[] {
  return [...evidence.values()]
    .filter((e) => e.state !== 'new' && e.reviewDue <= now)
    .sort((a, b) => {
      // Shaky first — a phrase that has stopped coming back is the reason the
      // review block exists.
      const shaky = Number(b.state === 'shaky') - Number(a.state === 'shaky')
      if (shaky) return shaky
      // Then whatever has been waiting longest.
      const overdue = a.reviewDue - b.reviewDue
      if (overdue) return overdue
      return (getPhrase(a.id)?.order ?? 0) - (getPhrase(b.id)?.order ?? 0)
    })
    .slice(0, limit)
    .map((e) => getPhrase(e.id))
    .filter((p): p is PhraseTarget => Boolean(p))
}

/** How many NEW targets a lesson should carry, and why. */
export type PhrasePace = 'steady' | 'slower' | 'consolidate'

export interface PhraseSelection {
  /** Due phrases, for the lesson's retrieval block and its homework. */
  review: PhraseTarget[]
  /** New targets, in teaching order. */
  fresh: PhraseTarget[]
  pace: PhrasePace
  /** The unit most of the new targets come from — the lesson's headline. */
  unit: number
}

/** Base new-target count by how much a learner of this age can absorb. */
function baseNewCount(ageBand: string): number {
  if (ageBand === '6-8') return 6
  if (ageBand === '9-12') return 8
  return 9
}

const MAX_NEW = 10
const MIN_NEW = 4

/**
 * What this lesson teaches.
 *
 * The new-target count is the one number the brief asks not to be blind:
 * eight to ten is the shape of a healthy lesson, but a learner carrying a
 * backlog of phrases they cannot yet produce does not need a tenth one. So
 * the count comes DOWN when the evidence says the last few lessons have not
 * landed, and the freed minutes go to the phrases already on the books.
 */
export function selectLessonPhrases(input: {
  evidence: Map<string, PhraseEvidence>
  stage: PreA1Stage
  ageBand: string
  now: number
}): PhraseSelection {
  const { evidence, stage, ageBand, now } = input

  const shaky = [...evidence.values()].filter((e) => e.state === 'shaky').length
  /* Taught, but not yet produced even with support. This is the backlog that
     makes another nine new phrases the wrong thing to do. */
  const open = [...evidence.values()].filter(
    (e) => e.state === 'introduced' || e.state === 'recognised',
  ).length

  let pace: PhrasePace = 'steady'
  let count = baseNewCount(ageBand)
  if (shaky >= 3 || open >= 12) {
    pace = 'consolidate'
    count = MIN_NEW
  } else if (shaky >= 1 || open >= 7) {
    pace = 'slower'
    count = Math.max(MIN_NEW, count - 3)
  }
  count = Math.min(MAX_NEW, count)

  const review = phrasesDue(evidence, now, pace === 'steady' ? 4 : 6)

  /* Stage gates how far ahead the learner may reach: one stage above where
     they are is a stretch, two is a lesson they cannot follow. */
  const ceiling = stageIndex(stage) + 1
  const met = new Set([...evidence.keys()].filter((id) => evidence.get(id)!.state !== 'new'))

  const ready = (p: PhraseTarget, picked: string[], strict: boolean): boolean => {
    if (met.has(p.id)) return false
    if (stageIndex(p.stage) > ceiling) return false
    return p.requires.every((r) => {
      if (picked.includes(r)) return true
      const e = evidence.get(r)
      if (!e) return false
      return strict ? RANK[e.lastVerdict] >= RANK.guided || e.guidedOccasions > 0 : true
    })
  }

  const pick = (strict: boolean, into: PhraseTarget[]) => {
    for (const p of phraseCurriculum) {
      if (into.length >= count) break
      if (into.some((x) => x.id === p.id)) continue
      if (ready(p, into.map((x) => x.id), strict)) into.push(p)
    }
  }

  const fresh: PhraseTarget[] = []
  pick(true, fresh)
  /* A prerequisite stuck at "introduced" must not stall the curriculum for
     ever — after the strict pass, met-at-all is enough. */
  if (fresh.length < count) pick(false, fresh)

  const units = fresh.map((p) => p.unit)
  const unit = units.length
    ? units.sort((a, b) => units.filter((u) => u === a).length - units.filter((u) => u === b).length).pop()!
    : (review[0]?.unit ?? 1)

  return { review, fresh, pace, unit }
}
