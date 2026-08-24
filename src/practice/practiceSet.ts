/* ==========================================================================
   Turning homework into something a learner can actually DO on a phone.
   --------------------------------------------------------------------------
   Homework already came out of what happened in the lesson (see
   lessons/homework.ts). But it existed only as a paragraph at the bottom of a
   report: "Say these the better way: “I agree” · “I went yesterday”." A
   learner reading that has been handed the answers. Nothing was retrieved,
   nothing was recorded, and the tutor found out how it went by asking.

   This module expands the same tasks into ITEMS, one screen each, in the
   shape retrieval practice actually takes:

       CUE  →  the learner attempts it  →  reveal  →  how did that go?  →  next

   Three rules:

     1. The answer is never on screen with the cue. A `sayCorrected` item
        shows the sentence the learner said and asks for the better version;
        the better version appears only after they have tried.

     2. A word captured WITH a meaning is cued from the meaning, so the
        learner produces the English. A word captured without one falls back
        to "use it in a sentence", which is still production, and is honest
        about being a weaker test.

     3. Nothing is asked twice and nothing is padded. A set is as long as the
        lesson made it — typically five to nine items, five to twelve minutes
        — and the estimate on the button is a sum of real per-item seconds,
        not a round number chosen because it sounds encouraging.
   ========================================================================== */

import {
  HomeworkTask,
  LearningModel,
  LessonRecord,
  PracticeTargetKind,
  StudentProfile,
  VocabularyItem,
} from '../types'
import { issueKeyFor } from '../students/issueKey'
import { recurringFixes } from '../lessons/microSteps'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { vocabKey } from '../students/evidence'
import { getPhrase } from '../curriculum/phrases'
import { phraseEvidence, phraseKey, phrasesDue } from '../curriculum/phraseProgress'
import { phraseTextKey } from '../data/contentStrings'

/**
 * How the learner tells the app what happened.
 *
 *   recall — they had to produce something from memory, so all three outcomes
 *            are meaningful and the middle one ("I had to look") is the most
 *            honest answer a learner can give about their own recall.
 *   doIt   — an activity with no single right answer: a timed retell, three
 *            sentences of their own, noticing a structure in the wild. There
 *            is nothing to be wrong about, so it records only whether it was
 *            done, and never claims recall evidence it did not gather.
 */
export type PracticeCheck = 'recall' | 'doIt'

export interface PracticeItem {
  /** Stable across rebuilds of the same set — this is what lets a half-done
   *  set be resumed on the exact item the learner stopped at. */
  id: string
  targetKind: PracticeTargetKind
  targetKey: string
  /** The English target, kept for the evidence timeline. */
  label: string
  check: PracticeCheck
  /** The instruction, in the learner's own language. */
  instructionKey: string
  instructionParams?: Record<string, string | number>
  /** Which `instructionParams` names are dynamic English/LTR learning content
   *  (a phrase, a frame) rather than a number or a translated label — set
   *  here because this module is the one place that knows which value is
   *  which. The renderer isolates exactly these params by VALUE instead of
   *  re-deriving the boundary by scanning the finished translated string. */
  instructionLtrParams?: string[]
  /** Instruction params whose VALUE is itself an i18n key, resolved by the
   *  renderer. Keeps this module pure — it has no dictionary and must not
   *  bake one locale's wording into a stored-looking structure. */
  instructionParamKeys?: Record<string, string>
  /** English shown WITH the instruction, before any attempt: their own
   *  sentence, a topic, a question to answer. */
  cue?: string
  /** A cue in the learner's own language (a word's meaning). */
  cueText?: string
  /** A content key for `cueText`, so a phrase's meaning is read in the
   *  learner's language rather than the English kept here as a fallback.
   *  Resolved by the renderer, which keeps this module free of a dictionary. */
  cueTextKey?: string
  /** Held back until the learner has attempted it. */
  answer?: string
  /** Extra English revealed alongside the answer — a sound's practice words. */
  answerWords?: string[]
  /** Seconds on the clock, for a timed speaking item. */
  seconds?: number
  /** Whether this item offers a place to type. Writing tasks only: everything
   *  else is spoken, and a text box on a speaking task teaches the wrong
   *  thing about what the practice is for. */
  writing?: boolean
  /** Realistic seconds, used only to say how long the set is. */
  estimatedSeconds: number
}

export interface PracticeSet {
  source: 'homework' | 'review'
  /** The lesson that set this homework. Absent for a review set. */
  lessonId?: string
  items: PracticeItem[]
  /** Rounded up, never below 3 — "1-minute homework" reads as busywork even
   *  when it is true. */
  minutes: number
}

/* -------------------------------------------------------------------------- */

function slug(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
}

function minutesOf(items: PracticeItem[]): number {
  const total = items.reduce((n, i) => n + i.estimatedSeconds, 0)
  return Math.max(3, Math.round(total / 60))
}

function meaningIndex(model: LearningModel): Map<string, VocabularyItem> {
  return new Map(model.vocabulary.map((v) => [v.term.trim().toLocaleLowerCase(), v]))
}

/* -------------------------------------------------------------------------- */
/* Homework                                                                    */
/* -------------------------------------------------------------------------- */

/** Can this learner be asked to type English? Mirrors the same question
 *  homework generation already asks before setting a writing task. */
function canType(student: StudentProfile): boolean {
  return student.age > 8 && student.englishWriting !== 'cannot'
}

function itemsForTask(
  task: HomeworkTask,
  index: number,
  student: StudentProfile,
  model: LearningModel,
): PracticeItem[] {
  const at = (n: number | string) => `hw${index}-${n}`
  const meanings = meaningIndex(model)

  switch (task.kind) {
    /* Their own sentence, cued wrong-side-up. This is the one item type that
       is unambiguously about THIS learner, so it always leads the set. */
    case 'sayCorrected':
      return task.items.map((pair, i) => ({
        id: `${at(i)}-${slug(pair.better)}`,
        targetKind: 'correction' as const,
        targetKey: issueKeyFor({ category: 'grammar', said: pair.said, better: pair.better }).key,
        label: pair.better,
        check: 'recall' as const,
        instructionKey: 'practice.item.sayCorrected',
        cue: pair.said,
        answer: pair.better,
        estimatedSeconds: 45,
      }))

    /* Cue from meaning where there is one. Showing the word and asking the
       learner to read it aloud is not recall, so a word with no meaning is
       given the production task instead and never claims to have tested one. */
    case 'useWordsInSentences':
      return task.terms.map((term, i) => {
        const meaning = meanings.get(term.trim().toLocaleLowerCase())?.meaning?.trim()
        return {
          id: `${at(i)}-${slug(term)}`,
          targetKind: 'vocabulary' as const,
          targetKey: vocabKey(term),
          label: term.trim(),
          check: 'recall' as const,
          instructionKey: meaning ? 'practice.item.recallWord' : 'practice.item.useWord',
          cueText: meaning,
          cue: meaning ? undefined : term.trim(),
          answer: term.trim(),
          estimatedSeconds: 40,
        }
      })

    case 'sayWordsAloud':
      return task.terms.map((term, i) => ({
        id: `${at(i)}-${slug(term)}`,
        targetKind: 'vocabulary' as const,
        targetKey: vocabKey(term),
        label: term.trim(),
        check: 'doIt' as const,
        instructionKey: 'practice.item.sayWord',
        cue: term.trim(),
        estimatedSeconds: 20,
      }))

    /* The sprint works because it repeats against a shrinking clock, and it
       is the one lesson activity that loses nothing without a tutor. */
    case 'repeatFluency':
      return [
        {
          id: `${at(0)}-fluency`,
          targetKind: 'speaking' as const,
          targetKey: `f:${slug(task.topic)}`,
          label: task.topic,
          check: 'doIt' as const,
          instructionKey: 'practice.item.fluency',
          instructionParams: { seconds: task.seconds },
          cue: task.topic,
          seconds: task.seconds,
          estimatedSeconds: task.seconds + 30,
        },
      ]

    case 'practiceSound': {
      const p = getPronunciationByArea(task.area)
      return [
        {
          id: `${at(0)}-${task.area}`,
          targetKind: 'pronunciation' as const,
          targetKey: `p:${task.area}`,
          label: p?.title ?? task.area,
          check: 'recall' as const,
          instructionKey: 'practice.item.sound',
          instructionParamKeys: { area: `pron.${task.area}` },
          cue: task.words.join(' · '),
          answer: p?.sentences[0],
          answerWords: task.words,
          estimatedSeconds: 90,
        },
      ]
    }

    case 'writeSentences':
      return [
        {
          id: `${at(0)}-write`,
          targetKind: 'grammar' as const,
          targetKey: `w:${slug(task.target)}`,
          label: task.target,
          check: 'doIt' as const,
          instructionKey: 'practice.item.write',
          instructionParams: { count: task.count, target: task.target },
          instructionLtrParams: ['target'],
          writing: canType(student),
          estimatedSeconds: 150,
        },
      ]

    case 'noticeLanguage':
      return [
        {
          id: `${at(0)}-notice`,
          targetKind: 'grammar' as const,
          targetKey: `n:${slug(task.target)}`,
          label: task.target,
          check: 'doIt' as const,
          instructionKey: 'practice.item.notice',
          instructionParams: { target: task.target },
          instructionLtrParams: ['target'],
          estimatedSeconds: 60,
        },
      ]

    /* The phrase, asked for from its MEANING, with the English held back.
       This is the item type the whole curriculum turns on: it is the only
       place outside a lesson where a learner can produce a target with
       nothing on the screen, which is the only evidence that counts as
       knowing it. `answer` is revealed after the attempt, never with it. */
    case 'sayPhrases':
      return task.ids
        .map((id) => getPhrase(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p, i) => ({
          id: `${at(i)}-${slug(p.id)}`,
          targetKind: 'phrase' as const,
          targetKey: phraseKey(p.id),
          label: p.chunk,
          check: 'recall' as const,
          instructionKey: 'practice.item.sayPhrase',
          cueText: p.meaning,
          cueTextKey: phraseTextKey(p.id, 'meaning'),
          /* A frame's answer is a whole utterance, not the frame. "Good ___."
             is how the curriculum stores the target; it is not something a
             learner can say, and showing it as the answer to "say this in
             English" teaches them to read a gap out loud. */
          answer: p.say,
          answerWords: p.examples.slice(0, 3),
          estimatedSeconds: 35,
        }))

    case 'usePhraseFrame': {
      const p = getPhrase(task.id)
      if (!p) return []
      return [
        {
          id: `${at(0)}-frame-${slug(p.id)}`,
          targetKind: 'phrase' as const,
          targetKey: phraseKey(p.id),
          label: p.chunk,
          /* Three sentences of their own have no single right answer, so this
             records only that it was done. Claiming recall evidence from it
             would be inventing the one thing the set is careful about. */
          check: 'doIt' as const,
          instructionKey: 'practice.item.usePhraseFrame',
          instructionParams: { count: 3, frame: p.chunk },
          instructionLtrParams: ['frame'],
          cue: task.slots.join(' · '),
          answerWords: p.examples.slice(0, 3),
          writing: canType(student) && p.slots.length > 0,
          estimatedSeconds: 90,
        },
      ]
    }

    case 'prepareAnswer':
      return [
        {
          id: `${at(0)}-prepare`,
          targetKind: 'speaking' as const,
          targetKey: `q:${slug(task.question)}`,
          label: task.question,
          check: 'doIt' as const,
          instructionKey: 'practice.item.prepare',
          cue: task.question,
          writing: canType(student),
          estimatedSeconds: 90,
        },
      ]
  }
}

/**
 * The set for one lesson's homework. Pure and deterministic: the same lesson
 * always produces the same items with the same ids, which is what makes a
 * half-finished set resumable rather than reshuffled.
 */
export function buildHomeworkSet(
  lesson: LessonRecord,
  student: StudentProfile,
  model: LearningModel,
): PracticeSet | null {
  const tasks = lesson.report?.homework ?? []
  if (tasks.length === 0) return null
  const items = tasks.flatMap((task, i) => itemsForTask(task, i, student, model))
  if (items.length === 0) return null
  return { source: 'homework', lessonId: lesson.id, items, minutes: minutesOf(items) }
}

/* -------------------------------------------------------------------------- */
/* Review                                                                      */
/* -------------------------------------------------------------------------- */

/** How many items a review set may hold. Short on purpose: this is the thing
 *  a learner opens on a Tuesday evening, not a study session. */
const REVIEW_CAP = 6

/**
 * What is genuinely due, when there is no homework outstanding.
 *
 * Built only from things the schedule already says are due — words past their
 * review date, slips seen in more than one lesson, an open pronunciation
 * target. Returns null rather than inventing a set: "nothing due, see you at
 * the lesson" is a real and useful answer, and a review set with nothing in
 * it teaches the learner that this button is never worth pressing.
 */
export function buildReviewSet(
  model: LearningModel,
  now = Date.now(),
  /** Completed lessons, for the phrase curriculum's own review schedule.
   *  Optional: callers holding only a model still get words and slips. */
  lessons: LessonRecord[] = [],
): PracticeSet | null {
  const items: PracticeItem[] = []

  /* 0. Phrases the curriculum says are due. These come first because they are
        the spine of a beginner's English and because their schedule is the
        one thing that makes "weak phrases recur until produced unaided" true
        between lessons rather than only inside them. */
  for (const p of phrasesDue(phraseEvidence(lessons, model), now, 4)) {
    items.push({
      id: `rv-ph-${slug(p.id)}`,
      targetKind: 'phrase',
      targetKey: phraseKey(p.id),
      label: p.chunk,
      check: 'recall',
      instructionKey: 'practice.item.sayPhrase',
      cueText: p.meaning,
      cueTextKey: phraseTextKey(p.id, 'meaning'),
      answer: p.say,
      answerWords: p.examples.slice(0, 3),
      estimatedSeconds: 35,
    })
  }

  // 1. Their own recurring slips first — the highest-value thing to retrieve.
  for (const fix of recurringFixes(model, Math.max(0, Math.min(2, REVIEW_CAP - items.length)))) {
    items.push({
      id: `rv-fix-${slug(fix.better)}`,
      targetKind: 'correction',
      targetKey: issueKeyFor({ category: 'grammar', said: fix.said, better: fix.better }).key,
      label: fix.better,
      check: 'recall',
      instructionKey: 'practice.item.sayCorrected',
      cue: fix.said,
      answer: fix.better,
      estimatedSeconds: 45,
    })
  }

  // 2. Words the spaced schedule says are due, cued from meaning where we
  //    have one. Secure words are excluded — recall time spent on words
  //    already produced three times is the review queue eating itself.
  const due = model.vocabulary
    .filter((v) => v.reviewDue <= now && v.strength !== 'secure')
    .sort((a, b) => a.reviewDue - b.reviewDue)
    .slice(0, REVIEW_CAP - items.length)
  for (const v of due) {
    const meaning = v.meaning?.trim()
    items.push({
      id: `rv-w-${slug(v.term)}`,
      targetKind: 'vocabulary',
      targetKey: vocabKey(v.term),
      label: v.term.trim(),
      check: 'recall',
      instructionKey: meaning ? 'practice.item.recallWord' : 'practice.item.useWord',
      cueText: meaning,
      cue: meaning ? undefined : v.term.trim(),
      answer: v.term.trim(),
      estimatedSeconds: 40,
    })
  }

  // 3. One open sound, if there is room left.
  if (items.length < REVIEW_CAP) {
    const focus = model.pronunciationFoci
      .filter((f) => f.rating === 'needsPractice' || f.rating === 'communicationProblem')
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    const p = focus ? getPronunciationByArea(focus.area) : undefined
    if (p) {
      items.push({
        id: `rv-p-${p.area}`,
        targetKind: 'pronunciation',
        targetKey: `p:${p.area}`,
        label: p.title,
        check: 'recall',
        instructionKey: 'practice.item.sound',
        instructionParamKeys: { area: `pron.${p.area}` },
        cue: p.words.slice(0, 5).join(' · '),
        answer: p.sentences[0],
        answerWords: p.words.slice(0, 5),
        estimatedSeconds: 90,
      })
    }
  }

  if (items.length === 0) return null
  return { source: 'review', items: items.slice(0, REVIEW_CAP), minutes: minutesOf(items) }
}

/** How many words in a set are being asked for from memory — the number the
 *  Student Home headline uses ("Review 3 words"). */
export function wordCount(set: PracticeSet): number {
  return set.items.filter((i) => i.targetKind === 'vocabulary').length
}
