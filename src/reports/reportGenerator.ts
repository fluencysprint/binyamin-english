/* ==========================================================================
   Lesson report generator — student + parent (for minors) sections.
   Supportive but truthful. Never labels a learner bad/stupid/weak/behind.
   Produces structured data, not pre-rendered English sentences — ReportView
   resolves the final localized text via i18n at render time (see
   src/assessment/snapshot.ts for the same pattern used elsewhere).
   ========================================================================== */

import {
  Correction,
  HomeworkReview,
  ImprovementItem,
  LearningModel,
  LessonPhaseKind,
  LessonRecord,
  LessonReport,
  ReportTopic,
  StudentProfile,
  WentWellItem,
} from '../types'
import { overallCefr } from '../utils/cefr'
import { generateHomework } from '../lessons/homework'
import { ProgressSnapshot } from '../students/progress'

/** Phase kinds whose activity `studentPrompt` is real, session-specific
 *  content worth putting in front of a student/parent later — as opposed to
 *  e.g. `microLesson`/`guidedPractice` (already represented by the objective
 *  title) or `feedback` (meta-commentary, not a task). */
const CONTENT_PHASE_KINDS: LessonPhaseKind[] = [
  'warmup',
  'speakingListening',
  'reading',
  'writing',
  'communication',
  'fluency',
  'pronunciation',
  'vocabulary',
]

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter((s) => s && s.trim()))]
}

function dedupeBy<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function wentWellKey(item: WentWellItem): string {
  switch (item.kind) {
    case 'objectiveOutcome':
      return `objectiveOutcome:${item.outcome}:${item.title}`
    case 'greatExpression':
      return `greatExpression:${item.said}`
    case 'selfCorrected':
      return `selfCorrected:${item.count}`
    case 'engaged':
      return 'engaged'
    case 'strongestArea':
      return `strongestArea:${item.goal}`
  }
}

function improvementKey(item: ImprovementItem): string {
  switch (item.kind) {
    case 'appliedCorrectly':
      return `appliedCorrectly:${item.title}`
    case 'practicedIndependently':
      return 'practicedIndependently'
    case 'fixedAfterModeling':
      return `fixedAfterModeling:${item.said}:${item.better}`
  }
}

export function generateReport(
  lesson: LessonRecord,
  student: StudentProfile,
  model: LearningModel,
  corrections: Correction[],
  now = Date.now(),
  /** The longitudinal picture after this lesson, when the caller has it. */
  progress?: ProgressSnapshot,
  /** How the PREVIOUS lesson's homework came back. A learner who did not do
   *  last week's set gets a shorter one this week, not a longer one. */
  lastHomeworkReview?: HomeworkReview,
): LessonReport {
  const objectiveTitle = lesson.plan.objective.title

  /* "Today we worked on" is read by a student and, for a minor, by a parent.
     Listing every activity's `studentPrompt` verbatim put the tutor's own
     instructions on the student's summary — "Let's talk. Your tutor will ask
     questions and gently probe different tenses." is a note to the teacher,
     not a record of the lesson. So: short activity titles, with the actual
     topic attached only where the topic IS the content worth remembering. */
  const TOPIC_PHASE_KINDS: LessonPhaseKind[] = ['communication', 'fluency', 'reading', 'writing']
  const workedOnItems: ReportTopic[] = dedupeBy<ReportTopic>(
    [
      {
        title: objectiveTitle,
        titleKey: lesson.plan.objective.titleKey,
        titleParams: lesson.plan.objective.titleParams,
      },
      ...lesson.plan.phases
        .filter((p) => CONTENT_PHASE_KINDS.includes(p.kind))
        .flatMap((p) =>
          p.activities.map((a) => ({
            title: a.title,
            titleKey: a.titleKey,
            titleParams: a.titleParams,
            prompt: TOPIC_PHASE_KINDS.includes(a.kind) ? a.studentPrompt : undefined,
          })),
        ),
    ].filter((item) => item.title?.trim()),
    (item) => `${item.titleKey ?? item.title}:${JSON.stringify(item.titleParams ?? {})}:${item.prompt ?? ''}`,
  )
  /* The flat English list stays alongside it: a report exported or printed
     before this release is still read from `workedOn`, and so is one shared
     as plain text. */
  const workedOn = uniq(
    workedOnItems.map((item) => (item.prompt ? `${item.title}: ${item.prompt}` : item.title)),
  )

  // "What went well" — objective outcome + positive corrections + effort.
  const wentWellRaw: WentWellItem[] = []
  const objectiveRef = {
    titleKey: lesson.plan.objective.titleKey,
    titleParams: lesson.plan.objective.titleParams,
  }
  if (lesson.objectiveOutcome === 'correct') {
    wentWellRaw.push({ kind: 'objectiveOutcome', outcome: 'correct', title: objectiveTitle, ...objectiveRef })
  } else if (lesson.objectiveOutcome === 'partial') {
    wentWellRaw.push({ kind: 'objectiveOutcome', outcome: 'partial', title: objectiveTitle, ...objectiveRef })
  }
  const praise = corrections.filter((c) => c.category === 'greatExpression')
  praise.forEach((c) => wentWellRaw.push({ kind: 'greatExpression', said: c.said }))
  const retried = corrections.filter((c) => c.retried)
  if (retried.length) wentWellRaw.push({ kind: 'selfCorrected', count: retried.length })
  if (wentWellRaw.length === 0) wentWellRaw.push({ kind: 'engaged' })
  const wentWell = dedupeBy(wentWellRaw, wentWellKey)

  const realCorrections = corrections
    .filter((c) => c.category !== 'greatExpression')
    .map((c) => ({ said: c.said, better: c.better }))

  const vocabulary = uniq(lesson.vocabularyAdded)

  const pronunciation = model.pronunciationFoci
    .filter((f) => f.rating !== 'clear')
    .map((f) => ({ area: f.area, rating: f.rating, note: f.note }))

  const level = overallCefr(model.skillEstimates)
  /* A recurring error stores the learner's own wrong sentence as its
     description and the corrected version as its example. "Next focus: I am
     working here since 2019" hands a student their mistake as their goal, so
     the corrected form is used whenever there is one. */
  const topError = model.recurringErrors
    .filter((e) => !e.resolved)
    .sort((a, b) => b.occurrences - a.occurrences)[0]
  /* Prefer the longitudinal answer when we have it: what the learner keeps
     getting wrong ACROSS lessons, not the error logged most often today. One
     bad five minutes should not set the focus for the next month. */
  const nextFocusRef = progress?.focus[0]?.ref
  const nextFocusTitle =
    progress?.focus[0]?.title ||
    progress?.needsWork[0]?.label ||
    topError?.example?.trim() ||
    topError?.description ||
    objectiveTitle

  /* Which old words were asked for, and how it went. This is the only record
     of retrieval actually happening, and it is what the next lesson's review
     queue is built from. */
  const verdicts = Object.entries(lesson.vocabularyReview ?? {})
  const reviewed = verdicts.length
    ? {
        recalled: verdicts.filter(([, v]) => v === 'recalled').map(([term]) => term),
        missed: verdicts.filter(([, v]) => v === 'missed').map(([term]) => term),
      }
    : undefined

  const report: LessonReport = {
    lessonId: lesson.id,
    studentId: student.id,
    generatedAt: now,
    workedOn,
    workedOnItems,
    wentWell,
    corrections: realCorrections,
    vocabulary,
    pronunciation,
    nextFocusTitle,
    nextFocusRef,
    reviewed,
    homework: generateHomework(lesson, student, model, corrections, lastHomeworkReview),
  }

  // Parent section for minors.
  if (student.age < 18) {
    const goal = student.goals[0] ?? 'conversation'
    const strengths = dedupeBy(
      [...wentWell, { kind: 'strongestArea', goal } as WentWellItem],
      wentWellKey,
    ).slice(0, 4)

    /* A parent should read what their child is WORKING ON, not a transcript
       of the child's mistakes. The longitudinal labels are the teachable
       concept ("Third person -s"); the raw recurring-error descriptions are
       the wrong sentences themselves, and are only the fallback. */
    const priorities = uniq(
      progress?.needsWork.length
        ? progress.needsWork.slice(0, 3).map((i) => i.label)
        : model.recurringErrors
            .filter((e) => !e.resolved)
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 3)
            .map((e) => e.example?.trim() || e.description),
    ).slice(0, 3)

    const improvement = dedupeBy(
      [
        lesson.objectiveOutcome === 'correct'
          ? ({ kind: 'appliedCorrectly', title: objectiveTitle, ...objectiveRef } satisfies ImprovementItem)
          : ({ kind: 'practicedIndependently' } satisfies ImprovementItem),
        ...retried.map((c): ImprovementItem => ({ kind: 'fixedAfterModeling', said: c.said, better: c.better })),
      ],
      improvementKey,
    ).slice(0, 3)

    report.parent = {
      approxLevel: level,
      strengths,
      priorities: priorities.length ? priorities : [objectiveTitle],
      practiced: workedOn,
      practicedItems: workedOnItems,
      improvement,
      nextFocusTitle,
      nextFocusRef,
    }
  }

  return report
}
