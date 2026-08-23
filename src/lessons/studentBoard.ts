/* ==========================================================================
   The learner's half of a micro-step.
   --------------------------------------------------------------------------
   Everything a lesson knows used to reach the tutor and stop there. The
   content banks carry model sentences, minimal pairs, controlled practice,
   conversation prompts and follow-up questions; the learner's screen showed
   one localized line — "Now talk about you." — and nothing else. On a shared
   Zoom screen that is not a lesson, it is a caption.

   This module derives what the LEARNER sees from the same banks, under the
   same rules the tutor guidance follows:

     • DERIVED, never stored. A plan saved last month renders today's board,
       in whatever language is on screen right now.
     • Instructions localize; the English being learned stays English.
     • Nothing tutor-facing crosses over. LOOK FOR, HELP, DONE WHEN and the
       branching decisions are not in this tree at all.

   The shape follows how a good activity actually runs:

     PROMPT → the learner tries → USEFUL LANGUAGE → they try again
       → EXAMPLES / EXPLANATION → the next question

   so support is available in the order a stuck learner needs it, and answers
   are never on screen before the attempt.
   ========================================================================== */

import type { MicroStep } from './microSteps'
import {
  patternPair,
  patternQuestions,
  phraseBlockOf,
  phrasePhrases,
  recurringFixes,
  retrievalMaterial,
} from './microSteps'
import { PhraseTarget, fillSlot, isFrame } from '../curriculum/phrases'
import { phraseTextKey } from '../data/contentStrings'
import {
  CEFR,
  LearningModel,
  LessonActivity,
  StudentProfile,
  UILanguage,
} from '../types'
import { getGrammarById } from '../data/grammarLibrary'
import { getPronunciationByArea } from '../data/pronunciationLibrary'
import { grammarKey, pronKey } from '../data/contentStrings'
import { ct } from '../i18n/contentText'
import { cefrIndex } from '../utils/cefr'
import {
  followUpDepthFor,
  speakingFramesFor,
  taskCategoryById,
  warmupFollowUps,
} from './activityContent'
import { followUpQuestions } from './guidance'

export interface StudentBoard {
  /** The one big English thing on screen: the task, question or target. */
  prompt?: string
  /** Further prompts, revealed one at a time so a five-minute activity has
   *  five minutes of material without showing a wall of questions at once. */
  questions: string[]
  /** Sentence frames the learner is meant to USE — their target language. */
  phrases: string[]
  /** Whether the frames start visible. A learner who cannot begin without
   *  them is not being helped by a closed disclosure. */
  phrasesOpen: boolean
  /** Model sentences to hear and copy. */
  examples: string[]
  /** Single words — a word bank, or a sound's practice words. */
  words: string[]
  /** Sound contrasts, shown as pairs so the difference is visible. */
  pairs: { a: string; b: string }[]
  /** Meaning cues for words the learner has to RECALL. The word itself is
   *  deliberately absent: showing it turns recall into reading. */
  recallCues: { cue: string; answer: string }[]
  /** A short explanation, in the learner's language, behind a reveal. */
  help?: string
  /** What that reveal is called. A sound's `help` is how to MAKE the sound,
   *  which is the instruction rather than a rescue — labelling it "I need
   *  help" told a learner that wanting to know how to move their tongue was
   *  a failure. */
  helpKey: string
  /** Text to read, when the activity is a reading one. */
  passage?: string
  /** Seconds on the clock for a timed speaking round. */
  seconds?: number
  /** The learner's OWN sentences, said the better way. Only ever what was
   *  captured in this lesson, and only at the closing feedback step — this is
   *  the moment the whole lesson is supposed to pay off in. */
  corrections: { said: string; better: string }[]
}

export interface StudentBoardContext {
  lang: UILanguage
  student: StudentProfile
  model: LearningModel
  level: CEFR
  now?: number
  /** Words captured so far in THIS lesson. The closing vocabulary step asks
   *  the learner to use them, which is impossible if they cannot see them. */
  todayVocabulary?: string[]
  /** Corrections captured so far in THIS lesson. */
  todayCorrections?: { said: string; better: string }[]
}

const EMPTY: StudentBoard = {
  questions: [],
  phrases: [],
  phrasesOpen: false,
  examples: [],
  words: [],
  pairs: [],
  recallCues: [],
  corrections: [],
  helpKey: 'board.help',
}

/** Frames and follow-ups both climb with the learner, not with the topic. */
function depthOf(ctx: StudentBoardContext) {
  return followUpDepthFor(ctx.student.ageBand, cefrIndex(ctx.level))
}

/* -------------------------------------------------------------------------- */
/* Grammar                                                                    */
/* -------------------------------------------------------------------------- */

function grammarBoard(
  conceptId: string,
  step: MicroStep,
  ctx: StudentBoardContext,
): StudentBoard | null {
  const g = getGrammarById(conceptId)
  if (!g) return null
  const explain = ct(ctx.lang, grammarKey(g.id, 'studentExplanation'), g.studentExplanation)

  switch (step.move) {
    case 'meaning':
      // First contact. One sentence, in a situation — no rule, no practice
      // list, and nothing to read ahead to.
      return { ...EMPTY, examples: g.correctExamples.slice(0, 1) }
    case 'model':
      return { ...EMPTY, examples: g.correctExamples.slice(0, 3) }
    case 'notice':
      /* The noticing question is the task. The explanation stays behind a
         reveal: handing it over before they have looked is what turns
         noticing into copying. */
      return { ...EMPTY, prompt: g.noticePrompt, examples: g.correctExamples.slice(0, 3), help: explain }
    case 'guided':
      return {
        ...EMPTY,
        prompt: g.controlledPractice[0],
        questions: g.controlledPractice.slice(1),
        phrases: g.correctExamples.slice(0, 2),
        phrasesOpen: true,
        help: explain,
      }
    case 'realUse':
      return {
        ...EMPTY,
        prompt: g.conversationPractice[0],
        questions: g.conversationPractice.slice(1),
        phrases: g.correctExamples.slice(0, 3),
        phrasesOpen: depthOf(ctx) === 'simple',
        help: explain,
      }
    case 'feedback':
      /* The right-hand side of the learner's own likely slips. The wrong
         version is never shown: a learner reading "She are happy" on a big
         screen is being taught the error. */
      return { ...EMPTY, examples: g.commonErrors.slice(0, 3).map((e) => e.right), help: explain }
    default:
      return { ...EMPTY, examples: g.correctExamples.slice(0, 2) }
  }
}

/* -------------------------------------------------------------------------- */
/* Pronunciation                                                              */
/* -------------------------------------------------------------------------- */

function pronunciationBoard(
  area: string,
  step: MicroStep,
  ctx: StudentBoardContext,
): StudentBoard | null {
  const p = getPronunciationByArea(area)
  if (!p) return null
  const howTo = ct(ctx.lang, pronKey(p.area, 'howTo'), p.howTo)
  const base = { ...EMPTY, helpKey: 'board.howToSay' }

  switch (step.move) {
    case 'meaning':
      // Hearing the contrast comes before any instruction about the mouth.
      return { ...base, pairs: p.minimalPairs.slice(0, 3) }
    case 'model':
      return { ...base, words: p.words.slice(0, 6), help: howTo }
    case 'guided':
      return {
        ...base,
        pairs: p.minimalPairs.slice(0, 3),
        examples: p.sentences.slice(0, 2),
        help: howTo,
      }
    case 'record':
      return { ...base, prompt: p.sentences[0] ?? p.words.slice(0, 4).join(', '), help: howTo }
    case 'realUse':
      return { ...base, prompt: p.conversationPrompt, words: p.words.slice(0, 6) }
    default:
      return { ...base, words: p.words.slice(0, 6) }
  }
}

/* -------------------------------------------------------------------------- */
/* Talking activities                                                         */
/* -------------------------------------------------------------------------- */

function talkBoard(activity: LessonActivity, ctx: StudentBoardContext): StudentBoard {
  const depth = depthOf(ctx)
  /* The category is recovered from the task id rather than read off the plan,
     so lessons generated before categories were carried in params still get
     language about the topic on the table instead of the generic set. */
  const category =
    (typeof activity.guide?.params?.category === 'string'
      ? activity.guide.params.category
      : undefined) ??
    taskCategoryById(activity.ref) ??
    (activity.kind === 'warmup' ? 'personal' : undefined)

  return {
    ...EMPTY,
    prompt: activity.studentPrompt,
    /* The follow-ups were chosen for THIS task when the plan was built. They
       are the difference between a six-minute activity and one question.
       A warm-up carries none — its follow-ups are chosen from the age band at
       render time, exactly as the tutor's are — so they are looked up here
       rather than leaving the opening five minutes on a single question. */
    questions: followUpQuestions(activity).length
      ? followUpQuestions(activity)
      : activity.kind === 'warmup'
        ? [...(warmupFollowUps[ctx.student.ageBand] ?? warmupFollowUps.adult)]
        : [],
    phrases: speakingFramesFor(category ?? '', depth),
    phrasesOpen: depth === 'simple',
  }
}


/* -------------------------------------------------------------------------- */
/* The phrase curriculum                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What the learner sees during a phrase block.
 *
 * The whole design is one decision repeated: WHEN is the English on screen?
 *
 *   meaning   — nothing. The tutor is making the situation; a caption of the
 *               answer would let the learner read instead of work out.
 *   model     — the English, because they are supposed to be hearing it.
 *   repeat    — the English, open, because saying it is the task.
 *   swap      — the frame with the slot filled different ways.
 *   retrieval — the MEANING only, in their own language. This is the screen
 *               that makes unaided evidence possible, and putting the chunk
 *               anywhere on it would quietly turn the whole system into a
 *               reading test.
 *   real use  — the questions. The phrases are one tap away and closed, so
 *               reaching for them is the default and looking is the fallback.
 */
function phraseBoard(
  step: MicroStep,
  phrases: PhraseTarget[],
  block: string,
  ctx: StudentBoardContext,
): StudentBoard {
  const meaning = (p: PhraseTarget) => ct(ctx.lang, phraseTextKey(p.id, 'meaning'), p.meaning)
  const cues = phrases.map((p) => ({ cue: meaning(p), answer: p.chunk }))
  const chunks = phrases.map((p) => p.chunk)

  if (step.move === 'retrieval') return { ...EMPTY, recallCues: cues }

  switch (`${block}.${step.move}`) {
    case 'meet.meaning':
      /* Deliberately empty. The tutor is holding up a cup, waving, or acting
         out a moment; the learner's job is to watch a person, not a screen. */
      return { ...EMPTY }
    case 'meet.model':
      return {
        ...EMPTY,
        examples: phrases.flatMap((p) => (p.reply ? [p.say, p.reply] : [p.say])).slice(0, 8),
      }
    case 'meet.guided':
      return { ...EMPTY, phrases: chunks, phrasesOpen: true, examples: phrases.map((p) => p.say) }
    case 'use.guided':
      return {
        ...EMPTY,
        phrases: chunks,
        phrasesOpen: true,
        /* The slot fillers on their own. Seeing the words that go in the gap
           is what turns a memorised sentence into a frame the learner owns. */
        words: phrases.flatMap((p) => (isFrame(p) ? p.slots.slice(0, 5) : [])),
        examples: phrases
          .flatMap((p) => (isFrame(p) ? p.slots.slice(0, 2).map((x) => fillSlot(p, x)) : p.examples.slice(0, 1)))
          .slice(0, 6),
      }
    case 'exchange.guided':
      return {
        ...EMPTY,
        examples: phrases.flatMap((p) => (p.reply ? [p.say, p.reply] : [p.say])).slice(0, 8),
        phrases: chunks,
        phrasesOpen: true,
      }
    case 'realUse.realUse': {
      const openers = phrases.filter((p) => p.chunk.trim().endsWith('?')).map((p) => p.say)
      const questions = (openers.length ? openers : phrases.map((p) => p.say)).slice(0, 6)
      return {
        ...EMPTY,
        prompt: questions[0],
        questions: questions.slice(1),
        phrases: chunks,
        /* Closed on purpose: the minute is for reaching, and a full list of
           today's phrases on screen turns it into reading aloud. */
        phrasesOpen: false,
      }
    }
    case 'close.recap':
      return { ...EMPTY, examples: chunks.slice(0, 8) }
    default:
      return { ...EMPTY, examples: phrases.map((p) => p.say).slice(0, 6) }
  }
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What this learner sees for this step. Pure and deterministic: the same step
 * and learner always produce the same board, so it is testable and so a tutor
 * who navigates away and back does not get a different screen.
 */
export function buildStudentBoard(
  step: MicroStep,
  activity: LessonActivity,
  ctx: StudentBoardContext,
): StudentBoard {
  /* The phrase curriculum, first: its blocks reuse the ordinary activity
     kinds (a `meet` block is a microLesson, a `use` block is guided practice),
     so anything below would claim them. */
  const block = phraseBlockOf(activity)
  if (block) {
    const phrases = phrasePhrases(activity)
    if (phrases.length) return phraseBoard(step, phrases, block, ctx)
  }

  /* Spaced recall. Cued from MEANING, with the English answer held back for
     the tutor to reveal after the attempt — the whole value of the step is
     that the learner has to produce the word, not recognise it. */
  if (step.studentKey === 'student.rememberThese') {
    const material = retrievalMaterial(ctx.model, ctx.now ?? Date.now())
    const recallCues = material.fromMeaning.slice(0, 4).map((v) => ({ cue: v.meaning, answer: v.term }))
    const withoutMeaning = material.vocabulary.filter(
      (term) => !material.fromMeaning.some((v) => v.term === term),
    )
    return {
      ...EMPTY,
      recallCues,
      /* Words captured without a meaning cannot be cued from one. They are
         still production practice — "use it in a sentence" — so the word is
         shown, which is honest about what that step can test. */
      words: recallCues.length >= 4 ? [] : withoutMeaning.slice(0, 4 - recallCues.length),
    }
  }

  /* The fix drill. The right version is the point, so it is the bold half of
     each pair; their own version is struck through beside it, because the
     learner has to see WHICH habit is being replaced. */
  if (step.studentKey === 'student.fixThese') {
    return { ...EMPTY, corrections: recurringFixes(ctx.model) }
  }

  /* The closing feedback step. Their own sentences, said the better way — the
     one screen in the lesson that answers "what did I actually improve?".
     Nothing generic is invented for it: with no corrections captured, the
     tutor's spoken recap is the whole step, and the screen stays quiet. */
  if (activity.kind === 'feedback') {
    return { ...EMPTY, corrections: (ctx.todayCorrections ?? []).slice(0, 4) }
  }

  /* The end-of-lesson word capture. "Use each one in a sentence of your own"
     is not a task a learner can do while looking at a blank screen. */
  if (activity.kind === 'vocabulary' && !activity.speak) {
    return { ...EMPTY, words: (ctx.todayVocabulary ?? []).slice(0, 8) }
  }

  if (activity.kind === 'fluency') {
    const seconds = Number(step.studentParams?.seconds)
    return {
      ...EMPTY,
      prompt: activity.studentPrompt,
      seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : undefined,
    }
  }

  if (activity.kind === 'reading') {
    return { ...EMPTY, passage: activity.passage, prompt: activity.passage ? undefined : activity.studentPrompt }
  }

  if (activity.kind === 'writing') {
    return { ...EMPTY, prompt: activity.studentPrompt }
  }

  /* A pattern objective. The learner's own wrong version IS shown here, unlike
     everywhere else in this file — a habit lesson is about replacing one
     specific thing they say, and a learner who cannot see which sentence is
     being replaced is watching a lesson about somebody else. It is shown the
     way the fix drill shows it: struck through, beside the bold right one. */
  const pair = patternPair(activity)
  if (pair) {
    switch (step.move) {
      case 'notice':
      case 'retrieval':
      case 'feedback':
        return { ...EMPTY, corrections: [pair] }
      case 'guided':
        // The frame is open here: the point of the turn is to produce the
        // right version many times, not to remember what it was.
        return { ...EMPTY, phrases: [pair.better], phrasesOpen: true }
      default: {
        /* Real use — an actual conversation, paged one question at a time.
           The questions are the same ones the tutor's step is built from
           (see microSteps.patternQuestions), so the two screens never drift.
           The activity's own studentPrompt is deliberately NOT used: it is an
           instruction about the activity ("use the new pattern in a few
           sentences"), and putting an English instruction where the learner
           expects a question to answer is how a shared screen goes quiet. */
        const questions = patternQuestions(pair.said, pair.better, {
          ageBand: ctx.student.ageBand,
          level: ctx.level,
        })
        return {
          ...EMPTY,
          prompt: questions[0],
          questions: questions.slice(1),
          phrases: [pair.better],
          phrasesOpen: depthOf(ctx) === 'simple',
        }
      }
    }
  }

  if (activity.ref && (activity.kind === 'microLesson' || activity.kind === 'guidedPractice')) {
    const board = grammarBoard(activity.ref, step, ctx)
    if (board) return board
  }

  if (activity.ref && activity.kind === 'pronunciation') {
    const board = pronunciationBoard(activity.ref, step, ctx)
    if (board) return board
  }

  if (
    activity.kind === 'communication' ||
    activity.kind === 'warmup' ||
    (activity.kind === 'speakingListening' && activity.ref)
  ) {
    return talkBoard(activity, ctx)
  }

  /* Everything else — a beginner activity, a vocabulary capture, the closing
     feedback. The English target, where the step carries one, is the whole
     board; there is nothing else honest to put on screen. */
  const target = step.speak ?? activity.speak
  return { ...EMPTY, words: target ? [target] : [], passage: activity.passage }
}

/** Does this board have anything beyond the instruction line? Used to decide
 *  whether the learner's screen needs the material area at all. */
export function boardHasMaterial(board: StudentBoard): boolean {
  return Boolean(
    board.prompt ||
      board.questions.length ||
      board.phrases.length ||
      board.examples.length ||
      board.words.length ||
      board.pairs.length ||
      board.recallCues.length ||
      board.corrections.length ||
      board.passage ||
      board.help,
  )
}
