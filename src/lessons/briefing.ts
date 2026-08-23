/* ==========================================================================
   Lesson continuity — "where we left off", in one screen.
   --------------------------------------------------------------------------
   A tutor about to teach should not have to open three old reports to find
   out what happened last time. This assembles the six things that actually
   change what they do in the first ten minutes:

     1. what the last lesson was, and how long ago
     2. the corrections worth re-hearing
     3. the words due to be recalled
     4. the weaknesses that keep coming back
     5. whether homework was set, and what it was
     6. what to focus on today

   Nothing here is new evidence: it is a view over the progress snapshot and
   the lesson records, so it can never disagree with the dashboard. Every list
   is capped, because a briefing that runs to two screens is a briefing that
   gets skipped.
   ========================================================================== */

import {
  Correction,
  HomeworkReview,
  HomeworkTask,
  LessonPlan,
  LessonRecord,
  ScoreOutcome,
  StudentProfile,
} from '../types'
import { LearningModel } from '../types'
import { Explanation, ProgressIssue, ProgressSnapshot, VocabRecallItem } from '../students/progress'
import { homeworkOutcome } from '../students/evidence'
import { phraseEvidence, phrasesDue } from '../curriculum/phraseProgress'
import { getPhrase } from '../curriculum/phrases'

/** Hard caps. A tutor reads this standing up, holding a coffee. */
const MAX_CORRECTIONS = 3
const MAX_VOCABULARY = 5
const MAX_WEAKNESSES = 3

const DAY = 24 * 60 * 60 * 1000

export interface BriefingFocus {
  ref: string
  title: string
  why: Explanation
}

export interface BriefingLastLesson {
  id: string
  label: string
  completedAt: number
  daysAgo: number
  objectiveTitle: string
  /** The content id behind that title, so it reads in the tutor's language. */
  objectiveRef: string
  objectiveOutcome?: ScoreOutcome
}

export interface LessonBriefing {
  studentName: string
  /** The lesson about to be taught: 1 for a brand-new student. */
  lessonNumber: number
  /** Absent for a student with no completed lessons — the briefing then says
   *  "first lesson" rather than inventing a history. */
  lastLesson?: BriefingLastLesson
  /** Corrections from the last lesson, highest priority first. */
  keyCorrections: { said: string; better: string }[]
  /** Words whose spaced-review date has arrived. */
  vocabularyToRecall: VocabRecallItem[]
  /** Weaknesses seen across several lessons. */
  recurringWeaknesses: ProgressIssue[]
  /** Progress worth mentioning out loud at the start of the lesson. */
  improving: ProgressIssue[]
  /** What was set last time, and whether the tutor can check it. */
  homework: HomeworkTask[]
  /** Whether that homework came back — undefined until the tutor has asked
   *  AND the learner has not run the set on their own device. Distinct from
   *  'notDone': "never asked" is not a verdict about a learner. */
  homeworkReview?: HomeworkReview
  /** What the learner actually did with it, when they used the app for it.
   *  This is the difference between "they say they did it" and evidence: how
   *  many items came back unaided, out of how many were set. */
  homeworkPractice?: {
    answered: number
    total: number
    independent: number
    /** Set when the verdict above was inferred from this run rather than
     *  recorded by the tutor — so the card can say which it is. */
    inferred: boolean
    responses: { label: string; response: string }[]
  }
  /** Completed lessons whose homework was checked, and how many came back at
   *  least partly. Evidence, not a streak — it is a count with a denominator,
   *  which is the only form of it a tutor can act on. */
  homeworkHistory: { checked: number; done: number }
  /** What today's lesson is actually going to teach, and why.
   *  Taken from the plan the app will build, never from a separate ranking —
   *  a briefing that recommends one thing while the lesson teaches another is
   *  worse than no recommendation at all. */
  recommendedFocus?: BriefingFocus
  /** Where this learner stands on the phrase curriculum. Absent for a learner
   *  who is past it — there is nothing to say, and an empty card is noise.
   *
   *  Three lists, and the tutor uses them in this order: open the lesson on a
   *  win they can hear, know which ones have stopped arriving before the
   *  recall block reaches them, and see how much is coming back today. */
  phrases?: {
    /** Produced unaided on two separate days, one after the teaching day. */
    canSay: string[]
    /** Used to come back and now doesn't. */
    shaky: string[]
    /** How many the recall block will ask for. */
    dueCount: number
  }
  /** True when there is genuinely nothing to brief — a first lesson. */
  isFirstLesson: boolean
}

const MAX_PHRASES = 5

export function buildBriefing(
  input: {
    student: StudentProfile
    model: LearningModel
    lessons: LessonRecord[]
    corrections: Correction[]
    progress: ProgressSnapshot
  },
  now = Date.now(),
  /** The plan that will actually run. When omitted the briefing falls back to
   *  the top-ranked evidence, which is the same answer in every case where a
   *  plan exists to compare against. */
  nextPlan?: LessonPlan,
): LessonBriefing {
  const { student, model, lessons, corrections, progress } = input

  const completed = lessons
    .filter((l) => l.status === 'completed')
    .sort((a, b) => (a.completedAt ?? a.plan.createdAt) - (b.completedAt ?? b.plan.createdAt))
  const last = completed[completed.length - 1]

  const lastLesson: BriefingLastLesson | undefined = last
    ? {
        id: last.id,
        label: last.plan.label,
        completedAt: last.completedAt ?? last.plan.createdAt,
        daysAgo: Math.max(0, Math.floor((now - (last.completedAt ?? last.plan.createdAt)) / DAY)),
        objectiveTitle: last.plan.objective.title,
        objectiveRef: last.plan.objective.ref,
        objectiveOutcome: last.objectiveOutcome,
      }
    : undefined

  /* Corrections from the LAST lesson specifically. A tutor re-hearing what a
     learner got wrong two months ago is not continuity, it is a grudge. */
  const lastHomework = last ? homeworkOutcome(last, model) : undefined

  const priority = { high: 0, medium: 1, low: 2 }
  const keyCorrections = last
    ? corrections
        .filter((c) => c.lessonId === last.id && c.category !== 'greatExpression' && c.better.trim())
        .sort((a, b) => priority[a.priority] - priority[b.priority] || b.at - a.at)
        .slice(0, MAX_CORRECTIONS)
        .map((c) => ({ said: c.said, better: c.better }))
    : []

  /* Prefer the plan's own objective, explained with the evidence that chose
     it. When the plan reached past the evidence — a new student, or a learner
     whose weaknesses were all taught recently — say so plainly rather than
     attaching a reason that is not the real one. */
  const planned = nextPlan?.objective
  const matched = planned
    ? progress.focus.find((f) => f.ref === planned.ref)
    : progress.focus[0]
  const recommendedFocus: BriefingFocus | undefined = matched
    ? { ref: matched.ref, title: matched.title, why: matched.why }
    : planned
      ? { ref: planned.ref, title: planned.title, why: { key: 'progress.focusNewMaterial' } }
      : undefined

  return {
    studentName: student.name,
    lessonNumber: completed.length + 1,
    lastLesson,
    keyCorrections,
    vocabularyToRecall: progress.dueVocabulary.slice(0, MAX_VOCABULARY),
    recurringWeaknesses: progress.needsWork.slice(0, MAX_WEAKNESSES),
    improving: progress.improving.slice(0, MAX_WEAKNESSES),
    homework: last?.report?.homework ?? [],
    homeworkReview: lastHomework?.review,
    homeworkPractice:
      lastHomework && lastHomework.total > 0
        ? {
            answered: lastHomework.answered,
            total: lastHomework.total,
            independent: lastHomework.independent,
            inferred: lastHomework.fromPractice,
            responses: lastHomework.responses,
          }
        : undefined,
    /* Counted over every lesson that produced a verdict from either source —
       the tutor asking, or the learner running the set. A denominator that
       silently dropped the app's own evidence would understate the rate the
       moment homework started coming back through the app. */
    homeworkHistory: (() => {
      const verdicts = completed.map((l) => homeworkOutcome(l, model).review).filter(Boolean)
      return {
        checked: verdicts.length,
        done: verdicts.filter((r) => r === 'done' || r === 'partly').length,
      }
    })(),
    recommendedFocus,
    /* Only where there is something to say. A learner who has never met a
       phrase target, or who is long past Pre-A1, gets no card rather than an
       empty one. */
    phrases: (() => {
      const evidence = phraseEvidence(completed, model)
      if (evidence.size === 0) return undefined
      const chunk = (id: string) => getPhrase(id)?.chunk
      const named = (state: string) =>
        [...evidence.values()]
          .filter((e) => e.state === state)
          .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
          .map((e) => chunk(e.id))
          .filter((c): c is string => Boolean(c))
          .slice(0, MAX_PHRASES)
      return {
        canSay: named('secure'),
        shaky: named('shaky'),
        dueCount: phrasesDue(evidence, now, 100).length,
      }
    })(),
    isFirstLesson: completed.length === 0,
  }
}
