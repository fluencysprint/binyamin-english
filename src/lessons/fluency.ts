/* ==========================================================================
   Fluency sprint — repeated timed speaking.
   --------------------------------------------------------------------------
   The one thing a 1:1 lesson can do that no app can: make a learner say the
   SAME thing several times, each round shorter, until the words stop being
   assembled and start being retrieved. (Maurice's 4/3/2 technique; the
   evidence for it on speech rate, hesitation and self-repair is old, boring
   and solid.)

   The shape is always the same, which is exactly why it works for a tutor with
   no experience: pick a topic they can already talk about, run it three times
   with a shrinking clock, and say almost nothing yourself.

     Round 1 — long, exploratory. Content first, hesitation allowed.
     Round 2 — shorter clock. Same content, fewer stumbles, one new detail.
     Round 3 — shortest clock. Fluent delivery, no false starts.

   Nothing new is taught here. That is the point: the language is already
   theirs, and the sprint is where it gets fast enough to use.

   This is the Fluency Sprint concept, folded into the lesson the tutor is
   already running rather than parked in a separate area of the app.
   ========================================================================== */

import { AgeBand, CEFR, LessonActivity, StudentProfile } from '../types'
import { cefrIndex } from '../utils/cefr'
import { uid } from '../utils/id'
import { pickVaried } from './selection'

/** A topic a learner can already speak about — never something new. */
export interface FluencyTopic {
  id: string
  /** Lowest band this topic suits. Topics are listed per band below. */
  prompt: string
}

/** Round clocks, in seconds. Shrinking is the whole mechanism. The plain
 *  framing that goes with them is written per language in guidance.ts — it is
 *  an instruction to the tutor, not part of the exercise. */
export interface FluencyRounds {
  seconds: number[]
}

/**
 * Round lengths by how much language the learner actually has. A learner who
 * can produce four sentences cannot fill two minutes, and being asked to is
 * not a fluency exercise — it is a silence.
 */
export function roundsFor(levelIndex: number, band: AgeBand): FluencyRounds {
  if (band === '9-12' || levelIndex <= cefrIndex('A1')) {
    return { seconds: [45, 30] }
  }
  if (levelIndex <= cefrIndex('A2')) {
    return { seconds: [60, 45, 30] }
  }
  if (levelIndex <= cefrIndex('B1')) {
    return { seconds: [90, 60, 45] }
  }
  return { seconds: [120, 90, 60] }
}

/**
 * Is a fluency sprint worth the minutes for this learner?
 *
 * Not below A1: a learner with twenty words has nothing to speed up, and being
 * timed while they hunt for a word is discouraging rather than fluency-building.
 * Not for 6–8s: the format needs sustained monologue and a sense of the clock,
 * and neither is reasonable at that age.
 */
export function fluencySprintSuits(level: CEFR, band: AgeBand): boolean {
  return band !== '6-8' && cefrIndex(level) >= cefrIndex('A1')
}

/** Topics deliberately chosen to be tellable from memory, at any level. */
const fluencyTopics: Record<AgeBand, FluencyTopic[]> = {
  '6-8': [],
  '9-12': [
    { id: 'fs-c-01', prompt: 'Tell me everything you did yesterday, from waking up to going to bed.' },
    { id: 'fs-c-02', prompt: 'Tell me about your favourite game — what happens in it and why you like it.' },
    { id: 'fs-c-03', prompt: 'Describe your home to me, room by room.' },
    { id: 'fs-c-04', prompt: 'Tell me about a person in your family and what they are like.' },
    { id: 'fs-c-05', prompt: 'Tell me the story of a film or book you know well.' },
    { id: 'fs-c-06', prompt: 'Describe your school day from the first lesson to the last.' },
    { id: 'fs-c-07', prompt: 'Tell me about the best day you can remember.' },
    { id: 'fs-c-08', prompt: 'Explain how to play a game you know, so I could play it too.' },
  ],
  '13-17': [
    { id: 'fs-t-01', prompt: 'Tell me about your week — everything worth mentioning.' },
    { id: 'fs-t-02', prompt: 'Describe something you are genuinely into, and why it got you.' },
    { id: 'fs-t-03', prompt: 'Tell me the plot of something you watched recently.' },
    { id: 'fs-t-04', prompt: 'Describe a person you know well enough to imitate.' },
    { id: 'fs-t-05', prompt: 'Tell me about a time something went wrong and what you did.' },
    { id: 'fs-t-06', prompt: 'Explain how something you use every day actually works.' },
    { id: 'fs-t-07', prompt: 'Describe the place you would move to tomorrow if you could.' },
    { id: 'fs-t-08', prompt: 'Tell me about a decision you had to make recently.' },
  ],
  adult: [
    { id: 'fs-a-01', prompt: 'Tell me about your week — the whole of it, not the summary.' },
    { id: 'fs-a-02', prompt: 'Walk me through what you actually do at work on a normal day.' },
    { id: 'fs-a-03', prompt: 'Tell me about the last trip you took, start to finish.' },
    { id: 'fs-a-04', prompt: 'Describe someone who has had a real influence on you.' },
    { id: 'fs-a-05', prompt: 'Tell me about a decision you are glad you made.' },
    { id: 'fs-a-06', prompt: 'Explain something from your field to me as if I know nothing.' },
    { id: 'fs-a-07', prompt: 'Tell me the story of how you ended up where you live now.' },
    { id: 'fs-a-08', prompt: 'Describe a problem you solved recently and how you got there.' },
    { id: 'fs-a-09', prompt: 'Tell me about something you changed your mind about.' },
    { id: 'fs-a-10', prompt: 'Describe your ideal day, hour by hour.' },
  ],
}

/**
 * Build the fluency-sprint activity, or null if it does not suit this learner.
 * `recentIds` keeps the topic from repeating week to week.
 */
export function fluencySprintActivity(
  student: StudentProfile,
  level: CEFR,
  recentIds: readonly string[] = [],
  rng: () => number = Math.random,
): LessonActivity | null {
  if (!fluencySprintSuits(level, student.ageBand)) return null
  const pool = fluencyTopics[student.ageBand]
  if (!pool.length) return null
  const topic = pickVaried(pool, (x) => x.id, recentIds, rng)
  return {
    id: uid('act'),
    kind: 'fluency',
    title: 'Fluency sprint',
    titleKey: 'phases.fluency',
    studentPrompt: topic.prompt,
    studentPromptKey: 'student.fluencySprint',
    ref: topic.id,
    /* The round clocks are recomputed from the learner at render time, so a
       plan made a month ago uses today's level — and today's language. */
    guide: { src: 'fluency', id: topic.id },
  }
}

/** The round clocks for an activity, recovered from the learner rather than
 *  stored on the plan — so a plan made last month uses today's level. */
export function roundsForStudent(student: StudentProfile, level: CEFR): FluencyRounds {
  return roundsFor(cefrIndex(level), student.ageBand)
}

export const fluencyTopicBank = fluencyTopics
