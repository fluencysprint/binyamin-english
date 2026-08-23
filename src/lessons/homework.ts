/* ==========================================================================
   Homework — built from what actually happened, not from the plan.
   --------------------------------------------------------------------------
   The plan's `homework` string was decided before the lesson started, so it
   could not know that the learner spent twenty minutes on "he don't" or that
   four new words came up. It also never reached the student: nothing rendered
   it. This module replaces it for the report.

   Three rules, and they are the whole design:

     1. Small. One to three tasks, ten minutes total. A learner who is given
        forty minutes of homework does none of it.
     2. Real. Every task points at something that happened in THIS lesson —
        a correction they made, a word they captured, a sound they practised.
     3. Doable alone. No task requires a partner, an app, or a tutor. A
        learner who cannot write yet is never asked to write.

   Tasks are structured, not pre-rendered English: the student reads them in
   their own language (see report.homeworkItem.* in the locales), while the
   English being practised stays English.
   ========================================================================== */

import {
  Correction,
  HomeworkReview,
  HomeworkTask,
  LearningModel,
  LessonRecord,
  StudentProfile,
} from '../types'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { getGrammarById } from '../data/grammarLibrary'
import { overallCefr } from '../utils/cefr'
import { roundsForStudent } from './fluency'

/** Can this learner be asked to write English at home at all? */
function canWriteEnglish(student: StudentProfile, model: LearningModel): boolean {
  if (student.englishWriting === 'cannot' || student.englishWriting === 'fewWords') return false
  if (student.nativeLanguageLiteracy === 'no') return false
  if (student.age <= 8) return false
  return model.skillEstimates.writing.level !== 'preA1'
}

/** How many tasks this learner should actually receive.
 *
 *  A learner who did not do last week's homework does not need more of it.
 *  Cutting the set to its single highest-value task is the only lever this
 *  module has that actually raises the chance of it being done — and one task
 *  that comes back is worth three that do not. */
function taskCap(student: StudentProfile, lastReview?: HomeworkReview): number {
  const base = student.age <= 8 ? 1 : student.age <= 12 ? 2 : 3
  if (lastReview === 'notDone') return 1
  if (lastReview === 'partly') return Math.max(1, base - 1)
  return base
}

/** The prompt worth rehearsing before next time.
 *
 *  The free-conversation topic comes first on purpose: the fluency topic has
 *  already been drilled three times today and is separately handed back as a
 *  `repeatFluency` task, so leading with it produced homework that asked for
 *  the same story twice. */
function speakingPrompt(lesson: LessonRecord): string | undefined {
  const kinds = ['communication', 'fluency'] as const
  for (const kind of kinds) {
    const activity = lesson.plan.phases
      .filter((p) => p.kind === kind)
      .flatMap((p) => p.activities)
      .find((a) => a.studentPrompt)
    if (activity) return activity.studentPrompt
  }
  return undefined
}

function fluencyTopicOf(lesson: LessonRecord): string | undefined {
  return lesson.plan.phases
    .filter((p) => p.kind === 'fluency')
    .flatMap((p) => p.activities)[0]?.studentPrompt
}

/**
 * Build 1–3 homework tasks from what the lesson actually produced.
 * Pure and deterministic — the same lesson always yields the same homework.
 */
export function generateHomework(
  lesson: LessonRecord,
  student: StudentProfile,
  model: LearningModel,
  corrections: Correction[],
  /** How the PREVIOUS homework came back. Absent when it was never checked. */
  lastReview?: HomeworkReview,
): HomeworkTask[] {
  const cap = taskCap(student, lastReview)
  const writes = canWriteEnglish(student, model)
  const level = overallCefr(model.skillEstimates)
  const isBeginner = level === 'preA1'
  const candidates: HomeworkTask[] = []

  /* 1. Their own sentences, said the better way. The single highest-value
        thing a learner can do alone: it is their language, their error, and
        they already heard the fix once today. */
  const realCorrections = corrections
    .filter((c) => c.category !== 'greatExpression' && c.better.trim())
    .sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0))
    .slice(0, 3)
    .map((c) => ({ said: c.said, better: c.better }))
  if (realCorrections.length) {
    candidates.push({ kind: 'sayCorrected', items: realCorrections })
  }

  /* 2. Today's words. A beginner or a small child says them; everyone else
        has to produce a sentence, because recognition is not knowing. */
  const terms = [...new Set(lesson.vocabularyAdded.map((t) => t.trim()).filter(Boolean))].slice(0, 5)
  if (terms.length) {
    candidates.push(
      isBeginner || student.age <= 8
        ? { kind: 'sayWordsAloud', terms }
        : { kind: 'useWordsInSentences', terms },
    )
  }

  /* 3. Repeat today's fluency sprint. The exercise works BECAUSE it repeats,
        and it is the one activity that loses nothing without a tutor present. */
  const fluencyTopic = fluencyTopicOf(lesson)
  if (fluencyTopic) {
    const rounds = roundsForStudent(student, level)
    candidates.push({
      kind: 'repeatFluency',
      topic: fluencyTopic,
      seconds: rounds.seconds[rounds.seconds.length - 1],
    })
  }

  /* 4. A sound worth five minutes, with actual words to say. */
  const pron =
    getPronunciationByArea(lesson.plan.objective.ref) ??
    (() => {
      const focus = model.pronunciationFoci
        .filter((f) => f.rating === 'needsPractice' || f.rating === 'communicationProblem')
        .sort((a, b) => b.updatedAt - a.updatedAt)[0]
      return focus ? getPronunciationByArea(focus.area) : undefined
    })()
  if (pron) {
    candidates.push({ kind: 'practiceSound', area: pron.area, words: pron.words.slice(0, 5) })
  }

  /* 5. The target language: written if they can write, noticed if they cannot.
        "Notice three examples this week" is real homework — it is the only
        task on this list a pre-literate learner can genuinely do. */
  const grammar = getGrammarById(lesson.plan.objective.ref)
  if (grammar) {
    candidates.push(
      writes
        ? { kind: 'writeSentences', count: 3, target: grammar.title }
        : { kind: 'noticeLanguage', target: grammar.title },
    )
  }

  /* 6. Come back with something ready to say. Always available, so this is
        also the fallback when a lesson produced nothing else to work on. */
  const prompt = speakingPrompt(lesson)
  if (prompt) candidates.push({ kind: 'prepareAnswer', question: prompt })

  const chosen = candidates.slice(0, cap)
  if (chosen.length === 0 && prompt) return [{ kind: 'prepareAnswer', question: prompt }]
  return chosen
}
