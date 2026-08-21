/* ==========================================================================
   Lesson pacing — guidance, never punishment.
   --------------------------------------------------------------------------
   A 50-minute lesson used to be described only by its large phases ("Reading,
   15–22 min"), which left the tutor to invent the shape of seven minutes on
   their own. Pacing here works at the micro-step level instead: roughly two to
   five minutes of one clear thing, sized by the learner's age.

   The rule that matters most: a productive conversation is NEVER interrupted
   because a clock reached a number. `pacingAdvice` returns "keep going" when
   the learner is talking and it is going well, no matter what the timer says.
   Timing exists to stop a lesson stalling, not to stop it flowing.
   ========================================================================== */

import { AgeBand } from '../types'

/**
 * Age stage. The brief's audit matrix separates "adult" from "older adult",
 * and pedagogically they differ (pacing, stamina, prior study habits, the
 * insult of being talked to like a child) even though they share every content
 * bank. So this is a derived pacing/presentation concept layered on top of
 * AgeBand rather than a fifth content dimension — the content banks stay keyed
 * by AgeBand, and nothing in the curriculum has to be duplicated.
 */
export type AgeStage = 'youngChild' | 'child' | 'teen' | 'adult' | 'olderAdult'

export const OLDER_ADULT_FROM = 65

export function ageStageFor(age: number): AgeStage {
  if (age <= 7) return 'youngChild'
  if (age <= 12) return 'child'
  if (age <= 17) return 'teen'
  if (age < OLDER_ADULT_FROM) return 'adult'
  return 'olderAdult'
}

/** Fallback when only the band is known (e.g. an imported profile). */
export function ageStageFromBand(band: AgeBand): AgeStage {
  switch (band) {
    case '6-8':
      return 'youngChild'
    case '9-12':
      return 'child'
    case '13-17':
      return 'teen'
    default:
      return 'adult'
  }
}

export interface PacingProfile {
  stage: AgeStage
  /** Suggested minutes for one micro-step. */
  stepMinutes: number
  /** Never stretch a single micro-step past this without changing something. */
  maxStepMinutes: number
  /** Longest sensible stretch on one activity before a change of shape. */
  maxActivityMinutes: number
  /** Weave in movement / reset breaks. */
  needsMovementBreaks: boolean
  /** Sustained conversation blocks are appropriate (and not exhausting). */
  allowsSustainedConversation: boolean
  /** i18n key: a one-line pacing note for the tutor. */
  noteKey: string
}

export const PACING: Record<AgeStage, PacingProfile> = {
  youngChild: {
    stage: 'youngChild',
    stepMinutes: 2,
    maxStepMinutes: 4,
    maxActivityMinutes: 5,
    needsMovementBreaks: true,
    allowsSustainedConversation: false,
    noteKey: 'pacing.noteYoungChild',
  },
  child: {
    stage: 'child',
    stepMinutes: 3,
    maxStepMinutes: 5,
    maxActivityMinutes: 8,
    needsMovementBreaks: true,
    allowsSustainedConversation: false,
    noteKey: 'pacing.noteChild',
  },
  teen: {
    stage: 'teen',
    stepMinutes: 4,
    maxStepMinutes: 6,
    maxActivityMinutes: 12,
    needsMovementBreaks: false,
    allowsSustainedConversation: true,
    noteKey: 'pacing.noteTeen',
  },
  adult: {
    stage: 'adult',
    stepMinutes: 5,
    maxStepMinutes: 8,
    maxActivityMinutes: 20,
    needsMovementBreaks: false,
    allowsSustainedConversation: true,
    noteKey: 'pacing.noteAdult',
  },
  olderAdult: {
    stage: 'olderAdult',
    stepMinutes: 4,
    maxStepMinutes: 7,
    maxActivityMinutes: 15,
    needsMovementBreaks: false,
    allowsSustainedConversation: true,
    noteKey: 'pacing.noteOlderAdult',
  },
}

export function pacingFor(age: number): PacingProfile {
  return PACING[ageStageFor(age)]
}

/* -------------------------------------------------------------------------- */
/* In-lesson advice                                                           */
/* -------------------------------------------------------------------------- */

export type PacingAdvice = 'continue' | 'simplify' | 'advance' | 'changeActivity' | 'wrapUp'

export interface PacingInput {
  /** Seconds elapsed in the whole lesson. */
  elapsedSeconds: number
  /** Planned total for the lesson, in minutes. */
  plannedMinutes: number
  /** Seconds spent on the CURRENT micro-step. */
  stepElapsedSeconds: number
  /** Suggested minutes for the current micro-step. */
  stepMinutes: number
  profile: PacingProfile
  /** Whether this step is meaningful communication the learner is driving. */
  isConversation: boolean
  /** The tutor's most recent judgement of how it is going, if given. */
  lastOutcome?: 'correct' | 'partial' | 'needsWork'
  /** Steps remaining after this one. */
  stepsRemaining: number
}

export interface PacingVerdict {
  advice: PacingAdvice
  /** i18n key explaining the advice in one line. */
  reasonKey: string
  /** True when the step has run past its suggestion — surfaced as information,
   *  never as an error state. */
  overStep: boolean
  /** True when the whole lesson has run past its planned length. */
  overLesson: boolean
}

/**
 * What should the tutor do right now: continue, simplify, advance, change
 * activity, or start wrapping up?
 *
 * Order matters. A struggling learner is simplified before anything else; a
 * flowing conversation is protected from the clock before anything else; only
 * then does time get a say.
 */
export function pacingAdvice(input: PacingInput): PacingVerdict {
  const lessonSeconds = input.plannedMinutes * 60
  const overLesson = input.elapsedSeconds > lessonSeconds
  const overStep = input.stepElapsedSeconds > input.stepMinutes * 60

  // 1. Struggling beats everything. Simplify before the clock is consulted.
  if (input.lastOutcome === 'needsWork') {
    return { advice: 'simplify', reasonKey: 'pacing.reasonStruggling', overStep, overLesson }
  }

  // 2. A productive conversation is never cut off by a timer. This is the
  //    whole point: real communication is the goal, and the plan serves it.
  //    (A struggling learner already returned above, so by here it is going
  //    at least acceptably.)
  if (input.isConversation && input.profile.allowsSustainedConversation) {
    return { advice: 'continue', reasonKey: 'pacing.reasonFlowing', overStep, overLesson }
  }

  // 3. Nearly out of time with steps left → protect the ending. A lesson that
  //    finishes on a genuine success matters more than one that covers the plan.
  if (input.elapsedSeconds > lessonSeconds - 5 * 60 && input.stepsRemaining > 0) {
    return { advice: 'wrapUp', reasonKey: 'pacing.reasonNearEnd', overStep, overLesson }
  }

  // 4. It landed easily and there is time → raise the level.
  if (input.lastOutcome === 'correct' && !overStep) {
    return { advice: 'advance', reasonKey: 'pacing.reasonEasy', overStep, overLesson }
  }

  // 5. Well past the suggestion on a non-conversation step, or past this age's
  //    attention span → change the shape of the activity.
  if (input.stepElapsedSeconds > input.profile.maxStepMinutes * 60) {
    return { advice: 'changeActivity', reasonKey: 'pacing.reasonTooLong', overStep, overLesson }
  }

  if (overStep) {
    return { advice: 'advance', reasonKey: 'pacing.reasonStepDone', overStep, overLesson }
  }

  return { advice: 'continue', reasonKey: 'pacing.reasonOnTrack', overStep, overLesson }
}

/** Where we are in the lesson, as a fraction — used for the position bar. */
export function lessonPosition(elapsedSeconds: number, plannedMinutes: number): number {
  if (plannedMinutes <= 0) return 0
  return Math.min(1, elapsedSeconds / (plannedMinutes * 60))
}
