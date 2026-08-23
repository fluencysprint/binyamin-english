/* ==========================================================================
   Persisting what the learner did on their own.
   --------------------------------------------------------------------------
   Practice sessions live on the LEARNING MODEL, not in a store of their own.
   That is deliberate: the model is already the accumulated record of one
   learner, it is already exported in every backup, already imported, and
   already deleted with the student. A seventh object store would have had to
   be added to all four of those code paths to hold data that belongs here.

   Every write is small and immediate. A learner who answers three items on
   the bus and closes the tab has three items recorded, and the set they come
   back to opens on the fourth — there is no "submit" step to lose.
   ========================================================================== */

import {
  LearningModel,
  LessonRecord,
  PracticeItemResult,
  PracticeSessionRecord,
  PRACTICE_SESSION_WINDOW,
  StudentProfile,
} from '../types'
import { getLearningModel, putLearningModel } from '../data/db'
import { reviewVocabulary } from '../students/learningModel'
import { homeworkSessionFor, practiceSessions, vocabOutcomesFrom } from '../students/evidence'
import { PracticeSet, buildHomeworkSet, buildReviewSet } from './practiceSet'
import { uid } from '../utils/id'

/** The lesson whose homework is the one still outstanding: the most recent
 *  completed lesson that actually produced tasks. */
export function lessonWithOpenHomework(lessons: LessonRecord[]): LessonRecord | undefined {
  return lessons
    .filter((l) => l.status === 'completed' && (l.report?.homework?.length ?? 0) > 0)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    .pop()
}

export interface PracticePlan {
  set: PracticeSet
  /** An existing run, when the learner has already started this set. */
  session?: PracticeSessionRecord
  /** Items already answered, so the runner can open where they stopped. */
  doneItemIds: Set<string>
}

/**
 * What this learner should practise right now, if anything.
 *
 * Homework first, always: it is the set built from their own last lesson, and
 * a review queue that jumps in front of it would break the one promise the
 * lesson made. A finished homework set falls through to what is genuinely due.
 */
export function choosePracticeSet(
  student: StudentProfile,
  model: LearningModel,
  lessons: LessonRecord[],
  now = Date.now(),
): PracticePlan | null {
  const lesson = lessonWithOpenHomework(lessons)
  if (lesson) {
    const set = buildHomeworkSet(lesson, student, model)
    if (set) {
      const session = homeworkSessionFor(model, lesson.id)
      const doneItemIds = new Set((session?.results ?? []).map((r) => r.itemId))
      const finished = set.items.every((i) => doneItemIds.has(i.id))
      if (!finished) return { set, session, doneItemIds }
    }
  }

  const review = buildReviewSet(model, now, lessons)
  if (!review) return null
  /* A review set is rebuilt from what is due, so an unfinished one from
     earlier today is resumed rather than restarted — otherwise a learner who
     answered two of five words is asked for those two again. */
  const open = practiceSessions(model)
    .filter((s) => s.source === 'review' && !s.completedAt)
    .pop()
  const doneItemIds = new Set(
    (open?.results ?? []).filter((r) => review.items.some((i) => i.id === r.itemId)).map((r) => r.itemId),
  )
  if (review.items.every((i) => doneItemIds.has(i.id))) return null
  return { set: review, session: open, doneItemIds }
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

function withSessions(
  model: LearningModel,
  sessions: PracticeSessionRecord[],
  now: number,
): LearningModel {
  return {
    ...model,
    practiceSessions: sessions.slice(-PRACTICE_SESSION_WINDOW),
    updatedAt: now,
  }
}

/** Start a run of `set`, or return the one already in progress. */
export function startSession(
  model: LearningModel,
  set: PracticeSet,
  existing: PracticeSessionRecord | undefined,
  now = Date.now(),
): { model: LearningModel; session: PracticeSessionRecord } {
  if (existing) {
    /* The set can legitimately grow between runs — a review set rebuilt after
       another word came due. Keep the count honest rather than leaving a
       denominator from a set that no longer exists. */
    const session = { ...existing, itemCount: Math.max(existing.itemCount, set.items.length) }
    const sessions = practiceSessions(model).map((s) => (s.id === session.id ? session : s))
    return { model: withSessions(model, sessions, now), session }
  }
  const session: PracticeSessionRecord = {
    id: uid('prac'),
    studentId: model.studentId,
    source: set.source,
    lessonId: set.lessonId,
    startedAt: now,
    updatedAt: now,
    itemCount: set.items.length,
    results: [],
  }
  return {
    model: withSessions(model, [...practiceSessions(model), session], now),
    session,
  }
}

/**
 * Record one item's outcome.
 *
 * Re-answering the same item replaces the previous result rather than adding
 * a second one — a learner who taps "not yet" and immediately retries has
 * practised once, and the vocabulary schedule must not be moved twice for it.
 */
export function recordResult(
  model: LearningModel,
  sessionId: string,
  result: PracticeItemResult,
  totalItems: number,
  now = Date.now(),
): { model: LearningModel; session: PracticeSessionRecord | undefined } {
  const sessions = practiceSessions(model)
  const target = sessions.find((s) => s.id === sessionId)
  if (!target) return { model, session: undefined }

  const first = !target.results.some((r) => r.itemId === result.itemId)
  const results = [...target.results.filter((r) => r.itemId !== result.itemId), result]
  const updated: PracticeSessionRecord = {
    ...target,
    results,
    updatedAt: now,
    itemCount: Math.max(target.itemCount, totalItems),
    completedAt: results.length >= Math.max(target.itemCount, totalItems) ? now : undefined,
  }

  let next = withSessions(
    model,
    sessions.map((s) => (s.id === sessionId ? updated : s)),
    now,
  )

  /* Retrieval done alone is exactly the evidence the spaced schedule wants,
     so it moves the word the same way the in-lesson recall step does. Only on
     the FIRST answer: a retry inside the same session is the same retrieval. */
  if (first) {
    next = reviewVocabulary(next, vocabOutcomesFrom([result]), now)
  }
  return { model: next, session: updated }
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

/** Read-modify-write the model in storage. Practice writes are small, one at
 *  a time, and always from the one device the learner is holding, so a plain
 *  read-then-write is safe and keeps the runner free of storage concerns. */
export async function persistModel(model: LearningModel): Promise<void> {
  await putLearningModel(model)
}

export async function reloadModel(studentId: string): Promise<LearningModel | undefined> {
  return getLearningModel(studentId)
}
