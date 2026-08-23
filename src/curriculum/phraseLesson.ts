/* ==========================================================================
   Composing a fifty-minute beginner lesson out of phrase targets.
   --------------------------------------------------------------------------
   The old beginner lesson picked twelve themed activities and wrapped the
   list when it ran out of minutes. That filled the hour, and it could not
   answer "what is this lesson FOR?" with anything more specific than the
   learner's stage — so every P1 lesson had the same objective for ever, and
   nothing the learner said was attached to anything that could be reviewed.

   A phrase lesson has a spine instead, and it is the sequence that actually
   works for chunks:

       COME BACK   retrieve what is due, from meaning, before anything new
       MEET IT     the situation, then the model — no rule, no writing
       SWAP IT     the same frame with different words in the slot
       ASK FOR IT  the tutor cues the meaning; the learner produces it alone
       PUT IT TOGETHER  a short exchange that needs today's phrases
       REAL USE    an unscripted minute where nothing is on screen
       CLOSE       the tutor marks what they actually saw

   Two properties of that shape matter more than the shape itself:

     • Production is asked for with the model OFF the screen, at least twice
       per lesson, and those are the only moments that can produce unaided
       evidence. A phrase can be shown ten times and still be `introduced`.

     • The retrieval block comes FIRST, cold. Doing it at the end — while the
       phrase is still ringing in the learner's ears — is the single easiest
       way to manufacture evidence that isn't there.
   ========================================================================== */

import {
  AgeBand,
  LessonActivity,
  LessonPhase,
  LessonPhaseKind,
  PreA1Stage,
} from '../types'
import { uid } from '../utils/id'
import { PhraseTarget } from './phrases'
import { PhraseSelection } from './phraseProgress'
import { BeginnerActivityTemplate, movementActivity } from '../lessons/beginnerContent'

/** Which part of the spine an activity is. Drives its micro-steps and board. */
export type PhraseBlock = 'recall' | 'meet' | 'use' | 'exchange' | 'realUse' | 'close'

const BLOCK_KIND: Record<PhraseBlock, LessonPhaseKind> = {
  recall: 'warmup',
  /* `speakingListening`, not `microLesson`: a beginner meets a chunk by
     hearing it in a situation and saying it back. `microLesson` is this app's
     word for a taught language point, and a phrase block is deliberately not
     one — there is no rule here to present. */
  meet: 'speakingListening',
  use: 'guidedPractice',
  exchange: 'communication',
  realUse: 'communication',
  close: 'feedback',
}

/** English list separator used in titles and guidance params. */
export function phraseList(phrases: PhraseTarget[]): string {
  return phrases.map((p) => p.chunk).join(' · ')
}

/* -------------------------------------------------------------------------- */

interface Block {
  block: PhraseBlock
  phrases: PhraseTarget[]
  minutes: number
  /** A movement/reset break for a young child, from the existing bank. */
  movement?: BeginnerActivityTemplate
}

/** Minutes per block, by age. A five-year-old cannot hold a six-minute
 *  substitution drill; a sixty-eight-year-old is insulted by a two-minute one. */
function blockMinutes(band: AgeBand): Record<PhraseBlock, number> {
  if (band === '6-8') {
    return { recall: 5, meet: 4, use: 3, exchange: 4, realUse: 4, close: 4 }
  }
  if (band === '9-12') {
    return { recall: 5, meet: 5, use: 4, exchange: 5, realUse: 5, close: 5 }
  }
  return { recall: 6, meet: 5, use: 4, exchange: 5, realUse: 6, close: 5 }
}

/** How many new phrases are met at once before they are practised. Three is
 *  the most a beginner can hold in working memory long enough to use one. */
function groupSize(band: AgeBand): number {
  return band === '6-8' ? 2 : 3
}

function chunkInto<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/* -------------------------------------------------------------------------- */

function activityFor(
  block: PhraseBlock,
  phrases: PhraseTarget[],
  index: number,
): LessonActivity {
  const list = phraseList(phrases)
  const first = phrases[0]
  return {
    id: uid('act'),
    kind: BLOCK_KIND[block],
    title: TITLE_EN[block](list),
    titleKey: `guide.title.phrase.${block}`,
    titleParams: { phrases: list },
    studentPrompt: STUDENT_EN[block](list),
    studentPromptKey: STUDENT_KEY[block],
    /* The English to model aloud. On the blocks where the learner is supposed
       to be producing from memory there is deliberately nothing to speak —
       a tap that plays the answer turns retrieval back into repetition. */
    speak: block === 'meet' || block === 'exchange' ? first?.say : undefined,
    guide: {
      src: 'phrase',
      /* `ids` carries the targets themselves so the tutor card can be rebuilt
         from the bank at render time, in the tutor's language, exactly like
         every other guidance source here. */
      params: { block, index, phrases: list, ids: phrases.map((p) => p.id).join(',') },
    },
    ref: `phrase:${block}:${phrases.map((p) => p.id).join(',')}`,
    phraseIds: phrases.map((p) => p.id),
  }
}

/** The learner-facing instruction key for each block, in THEIR language. */
const STUDENT_KEY: Record<PhraseBlock, string> = {
  recall: 'student.phraseRecall',
  meet: 'student.phraseListen',
  use: 'student.phraseSwap',
  exchange: 'student.phraseExchange',
  realUse: 'student.phraseRealUse',
  close: 'student.phraseClose',
}

/* English fallbacks. Every one of these has a localized key above it; these
   are what an English-reading tutor sees, and the source the audit checks. */
const TITLE_EN: Record<PhraseBlock, (list: string) => string> = {
  recall: () => 'Come back to it',
  meet: (l) => `New: ${l}`,
  use: (l) => `Swap the words: ${l}`,
  exchange: () => 'Put it together',
  realUse: () => 'Real use',
  close: () => 'What you can say now',
}

const STUDENT_EN: Record<PhraseBlock, (list: string) => string> = {
  recall: () => 'Say these in English. Try before you look.',
  meet: (l) => `Listen, then say it: ${l}`,
  use: (l) => `Say it again with different words: ${l}`,
  exchange: () => 'Now we talk. Use today’s phrases.',
  realUse: () => 'Just talk with me. Reach for the English you have.',
  close: () => 'Here is the English you used today.',
}

/* -------------------------------------------------------------------------- */

export interface PhraseLessonShape {
  phases: LessonPhase[]
  totalMinutes: number
  /** Every phrase the lesson touches, review and new. */
  phraseIds: string[]
  /** The ones it introduces. */
  newPhraseIds: string[]
}

/**
 * Lay the blocks out across the fifty minutes.
 *
 * The close is reserved first and the rest fills what is left, so a lesson
 * never runs out of plan at minute thirty-two — the failure the beginner
 * pathway was built to remove — and never overruns the hour it was booked for.
 */
export function buildPhraseLesson(input: {
  selection: PhraseSelection
  ageBand: AgeBand
  stage: PreA1Stage
  seed: number
  totalMinutes?: number
}): PhraseLessonShape {
  const { selection, ageBand, stage, seed } = input
  const total = input.totalMinutes ?? 50
  const mins = blockMinutes(ageBand)
  const groups = chunkInto(selection.fresh, groupSize(ageBand))

  const blocks: Block[] = []
  if (selection.review.length) {
    blocks.push({ block: 'recall', phrases: selection.review, minutes: mins.recall })
  }
  groups.forEach((group, i) => {
    blocks.push({ block: 'meet', phrases: group, minutes: mins.meet })
    blocks.push({ block: 'use', phrases: group, minutes: mins.use })
    /* A movement break after each pair of blocks for a young child — the same
       bank the themed beginner lessons use, so nothing is duplicated. */
    if (ageBand === '6-8') {
      const m = movementActivity(stage, seed + i)
      if (m) blocks.push({ block: 'use', phrases: [], minutes: m.minutes, movement: m })
    }
  })
  const all = selection.fresh.length ? selection.fresh : selection.review
  blocks.push({ block: 'exchange', phrases: all.slice(0, 6), minutes: mins.exchange })
  blocks.push({ block: 'realUse', phrases: all.slice(0, 6), minutes: mins.realUse })

  /* Fit. The close is not negotiable, so it comes out of the budget before
     anything else is placed; blocks that no longer fit are dropped from the
     END of the teaching sequence, which drops a whole meet/use pair rather
     than leaving a group met and never practised. */
  const budget = total - mins.close
  const placed: Block[] = []
  let t = 0
  for (const b of blocks) {
    if (t + b.minutes > budget) break
    placed.push(b)
    t += b.minutes
  }
  /* A `meet` with no `use` after it is the one shape this lesson must never
     produce: phrases shown and never asked for. */
  while (placed.length && placed[placed.length - 1].block === 'meet') {
    t -= placed.pop()!.minutes
  }

  /* Fill what is left.
     A lesson is booked for fifty minutes and has to use them — but the leftover
     minutes must never become more new material, because how much new material
     this lesson carries was already decided from the evidence. They go to the
     two things that are always worth more time at this level: coming back to
     the first group after a gap (spaced retrieval inside one lesson, which is
     the cheapest real memory work there is) and talking. */
  const fillers: Block[] = [
    ...groups.slice(0, 2).map((g) => ({ block: 'use' as const, phrases: g, minutes: mins.use })),
    { block: 'realUse', phrases: all.slice(0, 6), minutes: mins.realUse },
    ...groups.slice(2).map((g) => ({ block: 'use' as const, phrases: g, minutes: mins.use })),
    { block: 'exchange', phrases: all.slice(0, 6), minutes: mins.exchange },
  ]
  for (const f of fillers) {
    if (t + f.minutes > budget) continue
    if (f.phrases.length === 0) continue
    placed.push(f)
    t += f.minutes
  }

  const phases: LessonPhase[] = []
  let start = 0
  let index = 0
  for (const b of placed) {
    if (b.movement) {
      phases.push({
        kind: b.movement.kind,
        title: b.movement.title,
        titleKey: 'guide.title.plain',
        titleParams: { ref: b.movement.id },
        startMin: start,
        endMin: start + b.minutes,
        activities: [
          {
            id: uid('act'),
            kind: b.movement.kind,
            title: b.movement.title,
            titleKey: 'guide.title.plain',
            titleParams: { ref: b.movement.id },
            studentPrompt: b.movement.studentPrompt,
            studentPromptKey: b.movement.studentPromptKey,
            speak: b.movement.speak,
            guide: { src: 'beginner', id: b.movement.id },
            ref: b.movement.id,
            optional: true,
          },
        ],
      })
      start += b.minutes
      continue
    }
    const activity = activityFor(b.block, b.phrases, index)
    index += 1
    phases.push({
      kind: activity.kind,
      title: activity.title,
      titleKey: activity.titleKey,
      titleParams: activity.titleParams,
      startMin: start,
      endMin: start + b.minutes,
      activities: [activity],
    })
    start += b.minutes
  }

  /* The close. It carries every phrase the lesson touched, because it is the
     screen where the tutor records what they actually saw — and a phrase that
     came up but was never marked is a phrase with no evidence either way. */
  const touched = [
    ...selection.review,
    ...placed.flatMap((b) => b.phrases),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
  const close = activityFor('close', touched, index)
  phases.push({
    kind: 'feedback',
    title: close.title,
    titleKey: close.titleKey,
    titleParams: close.titleParams,
    startMin: start,
    endMin: start + mins.close,
    activities: [close],
  })

  const newIds = placed
    .filter((b) => b.block === 'meet')
    .flatMap((b) => b.phrases.map((p) => p.id))

  return {
    phases,
    totalMinutes: start + mins.close,
    phraseIds: touched.map((p) => p.id),
    newPhraseIds: [...new Set(newIds)],
  }
}
