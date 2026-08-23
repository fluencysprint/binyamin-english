/* ==========================================================================
   Evidence — the difference between "we covered this" and "you can do this".
   --------------------------------------------------------------------------
   progress.ts already answers the tutor's question: which weaknesses keep
   coming back, counted in lessons. It cannot answer the learner's question,
   because it only ever sees the moments things went WRONG. A correction is
   captured when a learner makes a mistake; nothing was ever captured at the
   moment they got the same thing right a week later.

   So this module reads one thing progress.ts does not: ATTEMPTS. Every place
   the app puts a target in front of the learner and finds out what happened —

     • the spaced-recall step in a lesson  (recalled / missed)
     • the lesson objective                (correct / partial / needs work)
     • a correction captured in a lesson   (they got it wrong; retried or not)
     • a homework or review set done alone (independent / after support / not)

   — becomes one `PracticeAttempt` on a single timeline, keyed so the same
   target lines up across weeks and across surfaces.

   Two rules the whole module is built to keep:

     1. Nothing is invented. Every statement it produces names a count with a
        real denominator, or it is not produced at all. There is no score, no
        percentage without a numerator the learner performed, no "level up".

     2. The strongest claim is INDEPENDENT. Producing something with the
        answer already on screen is real evidence and is recorded as such, but
        it is never reported as "you know this" — that word is reserved for
        retrieval without support, repeated in separate sessions.
   ========================================================================== */

import {
  Correction,
  HomeworkReview,
  LearningModel,
  LessonRecord,
  PracticeItemResult,
  PracticeOutcome,
  PracticeSessionRecord,
  PracticeTargetKind,
  StudentProfile,
} from '../types'
import { issueKeyFor } from './issueKey'
import type { Explanation, ProgressSnapshot } from './progress'

/* -------------------------------------------------------------------------- */
/* The unified timeline                                                        */
/* -------------------------------------------------------------------------- */

export interface PracticeAttempt {
  at: number
  /** The occasion. Two attempts on the same target in one session are one
   *  occasion of practice, not two — sessions are what get counted. */
  sessionId: string
  /** Where it happened. A lesson attempt had a tutor in the room; a practice
   *  attempt did not, which is why the second is the stronger evidence. */
  where: 'lesson' | 'practice'
  targetKind: PracticeTargetKind
  targetKey: string
  label: string
  outcome: PracticeOutcome
}

function outcomeOfRecall(v: 'recalled' | 'missed'): PracticeOutcome {
  return v === 'recalled' ? 'independent' : 'incorrect'
}

/** Normalized vocabulary key, so "Deadline" and "deadline " are one word. */
export function vocabKey(term: string): string {
  return `v:${term.trim().toLocaleLowerCase()}`
}

/** The practice sessions on a model, oldest first. */
export function practiceSessions(model: LearningModel): PracticeSessionRecord[] {
  return [...(model.practiceSessions ?? [])].sort((a, b) => a.startedAt - b.startedAt)
}

/** The session for one lesson's homework, if the learner has opened it. */
export function homeworkSessionFor(
  model: LearningModel,
  lessonId: string,
): PracticeSessionRecord | undefined {
  return practiceSessions(model)
    .filter((s) => s.source === 'homework' && s.lessonId === lessonId)
    .pop()
}

/**
 * Every attempt this learner has made, oldest first.
 *
 * Derived, never stored: lesson records and practice sessions are the only
 * things written down, and this is a view over both. That is what stops the
 * evidence on screen from ever disagreeing with the records behind it.
 */
export function buildAttempts(
  lessons: LessonRecord[],
  corrections: Correction[],
  model: LearningModel,
): PracticeAttempt[] {
  const out: PracticeAttempt[] = []
  const completed = lessons.filter((l) => l.status === 'completed')

  for (const lesson of completed) {
    const at = lesson.completedAt ?? lesson.plan.createdAt

    // The spaced-recall step: the one place a lesson asks for production from
    // memory and writes down what came back.
    for (const [term, verdict] of Object.entries(lesson.vocabularyReview ?? {})) {
      out.push({
        at,
        sessionId: lesson.id,
        where: 'lesson',
        targetKind: 'vocabulary',
        targetKey: vocabKey(term),
        label: term.trim(),
        outcome: outcomeOfRecall(verdict),
      })
    }

    // The objective, scored by the tutor at the end of the activity.
    if (lesson.objectiveOutcome) {
      out.push({
        at,
        sessionId: lesson.id,
        where: 'lesson',
        targetKind: lesson.plan.objective.ref.startsWith('pattern:') ? 'correction' : 'grammar',
        targetKey: lesson.plan.objective.ref,
        label: lesson.plan.objective.title,
        outcome:
          lesson.objectiveOutcome === 'correct'
            ? 'independent'
            : lesson.objectiveOutcome === 'partial'
              ? 'afterSupport'
              : 'incorrect',
      })
    }
  }

  /* A correction IS an attempt, and it is the one that failed: the learner
     said the wrong thing out loud. `retried` means they produced the right
     version after being shown it, which is support — real, and not the same
     as getting there alone. Without this the timeline would only ever contain
     successes, and "you fixed it yourself this time" would have nothing to be
     an improvement ON. */
  const lessonAt = new Map(
    completed.map((l) => [l.id, l.completedAt ?? l.plan.createdAt] as const),
  )
  for (const c of corrections) {
    if (c.category === 'greatExpression') continue
    if (!c.better.trim()) continue
    const { key } = issueKeyFor(c)
    out.push({
      at: c.lessonId ? (lessonAt.get(c.lessonId) ?? c.at) : c.at,
      sessionId: c.lessonId ?? `c:${c.id}`,
      where: 'lesson',
      targetKind: c.category === 'pronunciation' ? 'pronunciation' : 'correction',
      targetKey: key,
      label: c.better.trim(),
      outcome: c.retried ? 'afterSupport' : 'incorrect',
    })
  }

  // Everything the learner did alone.
  for (const session of practiceSessions(model)) {
    for (const r of session.results) {
      out.push({
        at: r.at,
        sessionId: session.id,
        where: 'practice',
        targetKind: r.targetKind,
        targetKey: r.targetKey,
        label: r.label,
        outcome: r.outcome,
      })
    }
  }

  return out.sort((a, b) => a.at - b.at)
}

/* -------------------------------------------------------------------------- */
/* Per-target evidence                                                         */
/* -------------------------------------------------------------------------- */

export interface TargetEvidence {
  key: string
  kind: PracticeTargetKind
  label: string
  /** Distinct occasions this target was attempted at all. */
  sessions: number
  /** Distinct occasions it was produced with no support. The only count that
   *  earns the word "know". */
  independentSessions: number
  /** Occasions it was produced only after seeing the answer. */
  supportedSessions: number
  firstAt: number
  lastAt: number
  lastOutcome: PracticeOutcome
  /** The outcome before the most recent one, on a DIFFERENT occasion — what
   *  "you used to need help with this" is measured against. */
  previousOutcome?: PracticeOutcome
  /** Attempted without support on the most recent occasion, having needed
   *  support or failed before it. This is the improvement the learner feels. */
  improvedUnaided: boolean
}

export function evidenceByTarget(attempts: PracticeAttempt[]): Map<string, TargetEvidence> {
  const bySession = new Map<string, Map<string, PracticeAttempt[]>>()
  for (const a of attempts) {
    let target = bySession.get(a.targetKey)
    if (!target) bySession.set(a.targetKey, (target = new Map()))
    const list = target.get(a.sessionId)
    if (list) list.push(a)
    else target.set(a.sessionId, [a])
  }

  const out = new Map<string, TargetEvidence>()
  for (const [key, sessions] of bySession) {
    /* One verdict per occasion, and it is the BEST thing that happened in it.
       A learner who missed a word, was shown it, and then produced it did
       produce it — recording that occasion as a failure would make the
       evidence read worse the more the learner practised. */
    const perSession = [...sessions.entries()]
      .map(([sessionId, list]) => ({
        sessionId,
        at: Math.max(...list.map((a) => a.at)),
        outcome: bestOutcome(list.map((a) => a.outcome)),
        label: list[list.length - 1].label,
        kind: list[list.length - 1].targetKind,
      }))
      .sort((a, b) => a.at - b.at)

    const last = perSession[perSession.length - 1]
    const previous = perSession[perSession.length - 2]
    out.set(key, {
      key,
      kind: last.kind,
      label: last.label,
      sessions: perSession.length,
      independentSessions: perSession.filter((s) => s.outcome === 'independent').length,
      supportedSessions: perSession.filter((s) => s.outcome === 'afterSupport').length,
      firstAt: perSession[0].at,
      lastAt: last.at,
      lastOutcome: last.outcome,
      previousOutcome: previous?.outcome,
      improvedUnaided:
        last.outcome === 'independent' &&
        previous !== undefined &&
        previous.outcome !== 'independent',
    })
  }
  return out
}

const OUTCOME_RANK: Record<PracticeOutcome, number> = {
  independent: 2,
  afterSupport: 1,
  incorrect: 0,
}

function bestOutcome(outcomes: PracticeOutcome[]): PracticeOutcome {
  return outcomes.reduce((best, o) => (OUTCOME_RANK[o] > OUTCOME_RANK[best] ? o : best), 'incorrect')
}

/* -------------------------------------------------------------------------- */
/* What the learner is told                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One thing the learner can be told, with the evidence already behind it.
 *
 * Written FOR the learner, which is why it is not gated behind the tutor's
 * `diagnostics` capability: there is no CEFR band here, no ranked weakness
 * list, no "why this focus" reasoning and no lesson-count arithmetic about
 * how long they have been getting something wrong. Every statement is either
 * something they did, or the one thing to do next.
 */
export interface EvidenceStatement extends Explanation {
  /** Stable id, so a list of statements can be keyed and deduplicated. */
  id: string
  tone: 'win' | 'work'
}

export interface LearnerEvidence {
  /** Things that genuinely got better, most recent first. */
  wins: EvidenceStatement[]
  /** The one or two things worth the next ten minutes. */
  keepWorking: EvidenceStatement[]
  /** Words produced from memory, unaided, on three separate occasions. */
  knownWords: string[]
  /** Total occasions of practice done alone, with its denominator. */
  practice: { sessions: number; itemsAttempted: number; independent: number }
}

const MAX_WINS = 3
const MAX_WORK = 2
/** Items a practice run must contain before its score is worth stating.
 *  "You got 1 of 1 on your own" is arithmetically true and says nothing. */
const MIN_SCORE_DENOMINATOR = 3
/** Separate occasions of unaided recall before a word is called "known". */
export const KNOWN_AFTER_SESSIONS = 3

export function learnerEvidence(
  input: {
    student: StudentProfile
    model: LearningModel
    lessons: LessonRecord[]
    corrections: Correction[]
    progress: ProgressSnapshot
  },
): LearnerEvidence {
  const attempts = buildAttempts(input.lessons, input.corrections, input.model)
  const byTarget = evidenceByTarget(attempts)
  const sessions = practiceSessions(input.model)

  const wins: EvidenceStatement[] = []
  const keepWorking: EvidenceStatement[] = []

  /* 1. The single best thing this app can say: a mistake they made, made
        right, without help, on a later occasion. Their own words, quoted. */
  const fixed = [...byTarget.values()]
    .filter((e) => e.improvedUnaided && (e.kind === 'correction' || e.kind === 'pronunciation'))
    .sort((a, b) => b.lastAt - a.lastAt)
  for (const e of fixed.slice(0, 2)) {
    wins.push({
      id: `fixed:${e.key}`,
      tone: 'win',
      key: e.previousOutcome === 'incorrect'
        ? 'studentHome.evidence.fixedUnaided'
        : 'studentHome.evidence.fixedWithoutLooking',
      params: { phrase: e.label },
    })
  }

  /* 2. Words that have survived unaided recall in separate sessions. Three,
        because two could be the same afternoon twice. */
  const knownWords = [...byTarget.values()]
    .filter((e) => e.kind === 'vocabulary' && e.independentSessions >= KNOWN_AFTER_SESSIONS)
    .sort((a, b) => b.lastAt - a.lastAt)
    .map((e) => e.label)
  if (knownWords.length) {
    wins.push({
      id: 'knownWords',
      tone: 'win',
      key: 'studentHome.evidence.knownWords',
      params: { count: knownWords.length, words: knownWords.slice(0, 3).join(', ') },
    })
  }

  /* 3. The last set they actually did, scored against its own denominator.
        "6 of 8" is a fact; "75%" of an invented total is not. */
  const lastSession = sessions[sessions.length - 1]
  if (lastSession && lastSession.results.length >= MIN_SCORE_DENOMINATOR) {
    const independent = lastSession.results.filter((r) => r.outcome === 'independent').length
    if (independent > 0) {
      wins.push({
        id: `session:${lastSession.id}`,
        tone: 'win',
        key: 'studentHome.evidence.lastSet',
        params: { correct: independent, total: lastSession.results.length },
      })
    }
  }

  /* 4. Something that has gone quiet. progress.ts already decided this, in
        lessons, with a reason — restated here in the learner's own terms
        rather than as the tutor's "improving (absent for 2 lessons)". */
  for (const issue of input.progress.improving.slice(0, 2)) {
    if (!issue.better) continue
    wins.push({
      id: `quiet:${issue.key}`,
      tone: 'win',
      key: 'studentHome.evidence.notComingBack',
      params: { phrase: issue.better },
    })
  }

  /* --- and the honest other half. ---------------------------------------- */

  /* 5. A target that is still failing after support — the thing most worth
        the learner's next ten minutes. Their own sentence, not a category. */
  const stillHard = [...byTarget.values()]
    .filter(
      (e) =>
        (e.kind === 'correction' || e.kind === 'pronunciation') &&
        e.lastOutcome !== 'independent' &&
        e.sessions >= 2,
    )
    .sort((a, b) => b.lastAt - a.lastAt)
  for (const e of stillHard.slice(0, MAX_WORK)) {
    keepWorking.push({
      id: `hard:${e.key}`,
      tone: 'work',
      key: 'studentHome.evidence.stillWorkingOn',
      params: { phrase: e.label },
    })
  }

  /* 6. Words that came back wrong the last time they were asked for. */
  const shaky = [...byTarget.values()]
    .filter((e) => e.kind === 'vocabulary' && e.lastOutcome === 'incorrect')
    .sort((a, b) => b.lastAt - a.lastAt)
  if (shaky.length && keepWorking.length < MAX_WORK) {
    keepWorking.push({
      id: 'shakyWords',
      tone: 'work',
      key: 'studentHome.evidence.wordsToRevisit',
      params: { count: shaky.length, words: shaky.slice(0, 3).map((e) => e.label).join(', ') },
    })
  }

  /* 7. Fallbacks, for the learner who has had one lesson and has not opened a
        practice set yet. Without them the screen tells a paying student
        "nothing to report" the day after their first lesson, which is both
        discouraging and untrue: they learned words, and something was
        corrected. Both come from their own report, so nothing new is being
        exposed — this is the same material, said to them rather than about
        them. */
  const completed = input.lessons
    .filter((l) => l.status === 'completed')
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
  const last = completed[completed.length - 1]
  if (wins.length === 0 && last) {
    const words = last.vocabularyAdded.map((t) => t.trim()).filter(Boolean)
    if (words.length) {
      wins.push({
        id: `lessonWords:${last.id}`,
        tone: 'win',
        key: 'studentHome.evidence.lessonWords',
        params: { count: words.length, words: words.slice(0, 3).join(', ') },
      })
    }
  }
  if (keepWorking.length === 0) {
    const phrase =
      input.progress.needsWork.find((i) => i.better?.trim())?.better ??
      last?.report?.corrections[0]?.better
    if (phrase) {
      keepWorking.push({
        id: `toPractise:${phrase}`,
        tone: 'work',
        key: 'studentHome.evidence.stillWorkingOn',
        params: { phrase },
      })
    }
  }

  const results = sessions.flatMap((s) => s.results)
  return {
    wins: dedupe(wins).slice(0, MAX_WINS),
    keepWorking: dedupe(keepWorking).slice(0, MAX_WORK),
    knownWords,
    practice: {
      sessions: sessions.filter((s) => s.results.length > 0).length,
      itemsAttempted: results.length,
      independent: results.filter((r) => r.outcome === 'independent').length,
    },
  }
}

function dedupe(items: EvidenceStatement[]): EvidenceStatement[] {
  const seen = new Set<string>()
  return items.filter((s) => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })
}

/* -------------------------------------------------------------------------- */
/* Folding a finished set back into the model                                  */
/* -------------------------------------------------------------------------- */

/**
 * What actually happened to the homework one lesson set.
 *
 * The tutor's own recorded verdict wins where there is one: a deliberate human
 * answer to "did you do it?" outranks anything inferred, and a learner may
 * genuinely have done the work on paper without opening the app. Where the
 * tutor has not asked, a run recorded on the learner's own device is a far
 * better answer than "never asked" — and it comes with the detail no verdict
 * ever carried: which items came back unaided, and what they wrote.
 */
export function homeworkOutcome(
  lesson: LessonRecord,
  model: LearningModel,
): {
  review?: HomeworkReview
  /** True when `review` came from the learner's own run, not from the tutor. */
  fromPractice: boolean
  answered: number
  total: number
  independent: number
  /** What the learner typed on the writing tasks, if anything. */
  responses: { label: string; response: string }[]
} {
  const session = homeworkSessionFor(model, lesson.id)
  const answered = session?.results.length ?? 0
  return {
    review: lesson.homeworkReview ?? (session ? homeworkVerdict(session) : undefined),
    fromPractice: !lesson.homeworkReview && Boolean(session),
    answered,
    total: session?.itemCount ?? 0,
    independent: session?.results.filter((r) => r.outcome === 'independent').length ?? 0,
    responses:
      session?.results
        .filter((r): r is typeof r & { response: string } => Boolean(r.response?.trim()))
        .map((r) => ({ label: r.label, response: r.response })) ?? [],
  }
}

/** Did this session get far enough to count as homework coming back? */
export function homeworkVerdict(session: PracticeSessionRecord): 'done' | 'partly' | 'notDone' {
  const answered = session.results.length
  if (answered === 0) return 'notDone'
  return answered >= session.itemCount ? 'done' : 'partly'
}

/** A practice result reduced to the vocabulary verdict the learning model
 *  already understands. `afterSupport` is deliberately NOT a recall: the
 *  learner read the word off the screen, which is exactly what the spaced
 *  schedule exists to stop counting. */
export function vocabOutcomesFrom(
  results: PracticeItemResult[],
): Record<string, 'recalled' | 'missed'> {
  const out: Record<string, 'recalled' | 'missed'> = {}
  for (const r of results) {
    if (r.targetKind !== 'vocabulary') continue
    out[r.label] = r.outcome === 'independent' ? 'recalled' : 'missed'
  }
  return out
}
