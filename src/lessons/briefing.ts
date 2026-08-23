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
  /** Whether that homework came back — undefined until the tutor has asked.
   *  Distinct from 'notDone': "never asked" is not a verdict about a learner. */
  homeworkReview?: HomeworkReview
  /** Completed lessons whose homework was checked, and how many came back at
   *  least partly. Evidence, not a streak — it is a count with a denominator,
   *  which is the only form of it a tutor can act on. */
  homeworkHistory: { checked: number; done: number }
  /** What today's lesson is actually going to teach, and why.
   *  Taken from the plan the app will build, never from a separate ranking —
   *  a briefing that recommends one thing while the lesson teaches another is
   *  worse than no recommendation at all. */
  recommendedFocus?: BriefingFocus
  /** True when there is genuinely nothing to brief — a first lesson. */
  isFirstLesson: boolean
}

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
  const { student, lessons, corrections, progress } = input

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
    homeworkReview: last?.homeworkReview,
    homeworkHistory: {
      checked: completed.filter((l) => l.homeworkReview).length,
      done: completed.filter((l) => l.homeworkReview === 'done' || l.homeworkReview === 'partly')
        .length,
    },
    recommendedFocus,
    isFirstLesson: completed.length === 0,
  }
}
