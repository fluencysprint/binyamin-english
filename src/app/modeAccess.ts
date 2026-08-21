/* ==========================================================================
   Who is looking at this screen — the one source of truth.
   --------------------------------------------------------------------------
   The app runs on one device in three situations:

     tutor     — the tutor's own device, nobody else can see it
     together  — one screen shared with the learner sitting beside the tutor
     student   — the device is in the learner's hands

   Every "should this be on screen?" question in the app resolves to a named
   capability here, never to a raw `mode === 'tutor'` comparison scattered
   through a component. That matters because the failure mode is silent: a new
   panel added to a page that has no mode logic of its own is visible to the
   learner by default, and nothing complains. Naming the capabilities makes the
   default explicit and makes the whole boundary reviewable in one table.

   The rule for what belongs where: anything that is a JUDGEMENT ABOUT the
   learner, a PLAN FOR the learner, or a CONTROL OVER their record is the
   tutor's. What the learner did, learned, and has to practise is theirs.
   ========================================================================== */

import { AppMode } from '../types'

export interface ModeAccess {
  /** The nine-section teaching script: SAY / DO / LOOK FOR / IF THEY CAN.
   *  Also the tutor-worded objective title, phase bar and step outline. */
  tutorGuidance: boolean
  /** Free-text notes the tutor writes about a learner. Never shared. */
  privateNotes: boolean
  /** Diagnostic reasoning: recurring weaknesses, "why this focus", CEFR
   *  verdicts, per-skill estimates, corrections worth re-hearing. */
  diagnostics: boolean
  /** Grading controls — the learner does not grade themselves. */
  scoring: boolean
  /** Pacing advice: a tutor decision aid, not a deadline for the learner. */
  pacing: boolean
  /** Capturing evidence mid-lesson: corrections, recordings, new words. */
  captureTools: boolean
  /** The lesson countdown. */
  timer: boolean
  /** Generating, regenerating and starting lessons from the dashboard. */
  lessonPlanning: boolean
  /** The list of every student on this device — other learners' names are
   *  private to them, not just to the tutor. */
  roster: boolean
  /** Backup, import, seeding and deletion. */
  dataAdmin: boolean
}

/** Every capability, in one table. Read a column to audit a mode. */
const ACCESS: Record<AppMode, ModeAccess> = {
  tutor: {
    tutorGuidance: true,
    privateNotes: true,
    diagnostics: true,
    scoring: true,
    pacing: true,
    captureTools: true,
    timer: true,
    lessonPlanning: true,
    roster: true,
    dataAdmin: true,
  },
  together: {
    // The tutor is driving a screen the learner can read. Lesson content and
    // the tutor's own capture tools stay; everything that says something ABOUT
    // the learner goes.
    tutorGuidance: false,
    privateNotes: false,
    diagnostics: false,
    scoring: false,
    pacing: false,
    captureTools: true,
    timer: true,
    lessonPlanning: true,
    roster: false,
    dataAdmin: false,
  },
  student: {
    // The device is the learner's. Nothing here is written for anyone else.
    tutorGuidance: false,
    privateNotes: false,
    diagnostics: false,
    scoring: false,
    pacing: false,
    captureTools: false,
    timer: false,
    lessonPlanning: false,
    roster: false,
    dataAdmin: false,
  },
}

export type Capability = keyof ModeAccess

/** A mode read from storage can be anything a previous build (or a hand edit)
 *  left behind. An unknown mode resolves to the most restrictive column, so a
 *  corrupt setting can never open the tutor's side. */
export function accessFor(mode: AppMode | string | undefined | null): ModeAccess {
  return ACCESS[mode as AppMode] ?? ACCESS.student
}

/** Modes that may use a capability — for tests and for documentation. */
export function modesWith(capability: Capability): AppMode[] {
  return (Object.keys(ACCESS) as AppMode[]).filter((m) => ACCESS[m][capability])
}
