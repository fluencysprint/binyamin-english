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
import { getPhrase, isFrame } from '../curriculum/phrases'
import { PhraseVerdict, lessonPhraseIds } from '../curriculum/phraseProgress'
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
 * Today's phrase targets, ordered by how much a night's delay would be worth.
 *
 * `guided` first: they said it with the model in front of them, so retrieving
 * it cold tomorrow is exactly the gap that turns support into memory. Then
 * `unaided` — the delayed half of the mastery rule lives here, and it is the
 * only way a phrase ever becomes secure. Then `recognised`.
 *
 * A phrase the learner could not produce at all is deliberately LAST, and
 * only included when nothing else is: sending someone home to retrieve
 * something they never once said is not homework, it is a reminder that they
 * failed. It comes back in the next lesson's recall block instead, where a
 * tutor can re-teach it.
 */
const VERDICT_PRIORITY: Record<PhraseVerdict, number> = {
  guided: 0,
  unaided: 1,
  recognised: 2,
  notYet: 3,
}

function phraseHomeworkIds(lesson: LessonRecord, cap: number): string[] {
  const verdicts = lesson.phraseVerdicts ?? {}
  const ids = lessonPhraseIds(lesson).filter((id) => getPhrase(id))
  if (ids.length === 0) return []
  const ranked = [...ids].sort(
    (a, b) =>
      VERDICT_PRIORITY[verdicts[a] ?? 'notYet'] - VERDICT_PRIORITY[verdicts[b] ?? 'notYet'] ||
      (getPhrase(a)!.order - getPhrase(b)!.order),
  )
  const worthRetrieving = ranked.filter((id) => (verdicts[id] ?? 'notYet') !== 'notYet')
  return (worthRetrieving.length ? worthRetrieving : ranked).slice(0, cap)
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

  /* 0. Today's phrases, retrieved from meaning.
        This leads the set for a phrase lesson and is the whole reason the
        curriculum exists: the homework asks for exactly what the lesson
        taught, a day later, with the English off the screen. Nothing new is
        introduced here — a beginner who is handed a second lesson's worth of
        material at home does neither. */
  const phraseIds = phraseHomeworkIds(lesson, student.age <= 8 ? 4 : 6)
  if (phraseIds.length) {
    candidates.push({ kind: 'sayPhrases', ids: phraseIds })

    /* And one frame to actually USE. A frame the learner can only recite is
       a sentence; a frame they can fill with their own words is language. */
    const frame = phraseIds
      .map(getPhrase)
      .find((p) => p && isFrame(p) && p.slots.length >= 2)
    if (frame) {
      candidates.push({ kind: 'usePhraseFrame', id: frame.id, slots: frame.slots.slice(0, 4) })
    }
  }

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
        also the fallback when a lesson produced nothing else to work on.
        NOT offered after a phrase lesson: its speaking blocks carry an
        instruction ("Now we talk. Use today's phrases."), not a question, so
        handing it back as homework asks the learner to prepare an answer to
        something that was never asked — and the phrase tasks above are already
        the retrieval this lesson is supposed to send home. */
  const prompt = phraseIds.length ? undefined : speakingPrompt(lesson)
  if (prompt) candidates.push({ kind: 'prepareAnswer', question: prompt })

  const chosen = candidates.slice(0, cap)
  if (chosen.length === 0 && prompt) return [{ kind: 'prepareAnswer', question: prompt }]
  return chosen
}
