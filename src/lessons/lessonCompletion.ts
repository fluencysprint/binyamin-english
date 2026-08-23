/* ==========================================================================
   Fold a completed lesson into the learning model and produce a report.
   Pure and deterministic; persistence is handled by the service layer.
   ========================================================================== */

import {
  Correction,
  LearningModel,
  LessonRecord,
  LessonReport,
  ScoreOutcome,
  StudentProfile,
} from '../types'
import {
  addTopics,
  addVocabulary,
  applyCorrections,
  applyResponses,
  deferVocabularyReview,
  reinforceSkill,
  reviewVocabulary,
  setPronunciationFocus,
} from '../students/learningModel'
import { buildProgress, ProgressSnapshot } from '../students/progress'
import { issueKeyFor } from '../students/issueKey'
import { homeworkOutcome } from '../students/evidence'
import { getGrammarById } from '../data/grammarLibrary'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { generateReport } from '../reports/reportGenerator'
import { overallCefr } from '../utils/cefr'
import { nextStageFromLesson } from '../students/beginnerModel'
import { pushRecentContentIds } from './selection'
import { newPhraseIdsOf } from '../curriculum/phraseProgress'

export interface CompletionResult {
  model: LearningModel
  report: LessonReport
  /** The longitudinal picture as it stands AFTER this lesson. */
  progress: ProgressSnapshot
}

/**
 * How a PHRASE lesson went, read off the evidence rather than off a tap.
 *
 * A grammar lesson has one objective and one score for it. A phrase lesson has
 * eight to ten targets, each separately marked, and the tutor may never touch
 * the objective chips at all — so inferring the lesson's outcome from what was
 * actually produced is both more honest and more likely to exist.
 *
 * The bar is production WITH support, not unaided: advancing a stage is a
 * statement about what the learner can now be taught, and a learner who said
 * two thirds of today's phrases with a model in front of them is ready for the
 * next set. Unaided production is a claim about memory, and it is what the
 * mastery rule in curriculum/phraseProgress.ts is for.
 */
function phraseLessonOutcome(lesson: LessonRecord): ScoreOutcome | undefined {
  const ids = newPhraseIdsOf(lesson)
  if (ids.length === 0) return undefined
  const verdicts = lesson.phraseVerdicts ?? {}
  const marked = ids.filter((id) => verdicts[id] !== undefined)
  if (marked.length === 0) return undefined
  const produced = marked.filter(
    (id) => verdicts[id] === 'guided' || verdicts[id] === 'unaided',
  ).length
  const ratio = produced / ids.length
  if (ratio >= 2 / 3) return 'correct'
  if (ratio >= 1 / 3) return 'partial'
  return 'needsWork'
}

export function applyCompletedLesson(
  modelIn: LearningModel,
  lesson: LessonRecord,
  student: StudentProfile,
  corrections: Correction[],
  now = Date.now(),
  /** Every OTHER lesson on record. Supplied so the report's "next focus" is
   *  the same longitudinal answer the dashboard and the next lesson plan give,
   *  instead of whichever error happened to be logged most often today.
   *  Optional: callers that only have this lesson still get a valid report. */
  priorLessons: LessonRecord[] = [],
): CompletionResult {
  let model = modelIn

  // 0. If this was a Pre-A1 lesson, advance the internal P0…P3 stage on the
  //    evidence (repeated success graduates skills to A1 via the estimates).
  const wasBeginner = overallCefr(modelIn.skillEstimates) === 'preA1'

  // 1. Fold scored responses into skill estimates.
  model = applyResponses(model, lesson.responses, now)

  if (wasBeginner) {
    model = {
      ...model,
      preA1Stage: nextStageFromLesson(
        model.preA1Stage,
        /* The tutor's own verdict wins where there is one; otherwise the
           phrase evidence answers the same question from what was produced. */
        lesson.objectiveOutcome ?? phraseLessonOutcome(lesson),
      ),
    }
  }

  // 2. Corrections → recurring-error tracking.
  model = applyCorrections(model, corrections, now)

  /* 3. Spaced recall of OLD words, before today's new ones are added.
        Order matters: a word captured five minutes ago was never offered at
        the recall step, and must not be treated as reviewed. `offered` is
        recomputed from the review dates as they stood when the lesson began,
        which is exactly the set buildRetrievalStep put in front of the tutor. */
  const startedAt = lesson.startedAt ?? lesson.plan.createdAt
  const offered = modelIn.vocabulary
    .filter((v) => v.reviewDue <= startedAt)
    .map((v) => v.term)
  const verdicts = lesson.vocabularyReview ?? {}
  const judged = new Set(Object.keys(verdicts).map((t) => t.trim().toLowerCase()))
  model = reviewVocabulary(model, verdicts, now)
  model = deferVocabularyReview(
    model,
    offered.filter((term) => !judged.has(term.trim().toLowerCase())),
    now,
  )

  // 4. Vocabulary captured during the lesson.
  model = addVocabulary(
    model,
    lesson.vocabularyAdded.map((term) => ({ term, meaning: lesson.vocabularyMeanings?.[term] })),
    now,
  )

  // 5. Reinforce the objective skill (needs repeated evidence to become secure).
  const success = lesson.objectiveOutcome === 'correct'
  const ref = lesson.plan.objective.ref
  const grammar = getGrammarById(ref)
  const pron = getPronunciationByArea(ref)
  if (grammar) {
    model = reinforceSkill(model, grammar.id, grammar.title, success, now)
  } else if (pron) {
    model = reinforceSkill(model, pron.area, pron.title, success, now)
    model = setPronunciationFocus(
      model,
      pron.area,
      success ? 'understandable' : 'needsPractice',
      undefined,
      now,
    )
  }

  // 6. Mark a recurring error resolved when THIS lesson taught exactly it.
  if (success) {
    /* Match on the concept the error maps to, not on whether the objective's
       title happens to contain the word "grammar". The old string test fired
       on unrelated lessons and never fired on the lesson that actually fixed
       the problem. `resolved` is now only a hint — progress.ts decides status
       from how many lessons an issue has actually been absent — so a wrong
       guess here is cosmetic rather than a false claim of mastery. */
    model = {
      ...model,
      recurringErrors: model.recurringErrors.map((e) => {
        const { grammarRef, pronunciationRef } = issueKeyFor({
          category: e.category,
          said: e.description,
          better: e.example ?? '',
        })
        const taught = grammarRef === ref || pronunciationRef === ref
        return taught ? { ...e, resolved: true } : e
      }),
    }
  }

  // 7. Record topics discussed (from communication phases) for future variety.
  const topics = lesson.plan.phases
    .filter((p) => p.kind === 'communication')
    .flatMap((p) => p.activities.map((a) => a.title))
  model = addTopics(model, topics, now)

  // 8. Note completed activities (per-instance ids)…
  const completed = lesson.plan.phases.flatMap((p) => p.activities.map((a) => a.id))
  model = { ...model, completedActivityIds: [...new Set([...model.completedActivityIds, ...completed])] }

  // …and roll the stable content-bank ids into the recency window, so the next
  // lesson reaches for a warm-up and a conversation task they haven't just had.
  const usedContent = lesson.plan.phases
    .flatMap((p) => p.activities)
    .map((a) => a.ref)
    .filter((ref): ref is string => Boolean(ref))
    /* Phrase blocks are chosen by evidence and review dates, not by recency —
       letting them into the window would fill forty slots with `phrase:…` refs
       and starve the warm-up and conversation banks the window exists for. */
    .filter((ref) => !ref.startsWith('phrase:'))
  model = {
    ...model,
    recentContentIds: pushRecentContentIds(model.recentContentIds ?? [], usedContent),
  }

  /* The completed lesson has to be IN the history the progress is built from —
     otherwise "recurring across 3 lessons" silently means "across the 2 before
     today", and the report contradicts the dashboard the tutor opens next. */
  const completedRecord: LessonRecord = { ...lesson, status: 'completed', completedAt: now }
  const progress = buildProgress({
    student,
    model,
    lessons: [...priorLessons.filter((l) => l.id !== lesson.id), completedRecord],
    corrections,
    now,
  })

  /* The homework verdict lives on the lesson that SET the homework, so the
     one that matters here is the previous completed lesson's — that is the
     set the learner has just been through a week with. */
  const previous = priorLessons
    .filter((l) => l.status === 'completed' && l.id !== lesson.id)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
  /* Not `homeworkReview` directly: a learner who ran the set on their phone
     has answered the question more precisely than the tutor's tap ever could,
     and the next set's length is decided from it (see lessons/homework.ts). */
  const lastCompleted = previous[previous.length - 1]
  const lastReview = lastCompleted ? homeworkOutcome(lastCompleted, model).review : undefined
  const report = generateReport(lesson, student, model, corrections, now, progress, lastReview)
  return { model, report, progress }
}
